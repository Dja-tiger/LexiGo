package learning

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/jackc/pgx/v5"
)

const (
	lessonFallbackWordsOnly   = "words_only"
	lessonFallbackPhrasesOnly = "phrases_only"
	lessonFallbackEmpty       = "empty"
)

type lessonCandidate struct {
	WordID int64
	Kind   string
	Status string
	DueAt  time.Time
	Due    bool
}

func (r *Repository) PreviewLesson(ctx context.Context, userID string, request LessonPreviewRequest) (LessonPreview, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return LessonPreview{}, fmt.Errorf("begin lesson preview snapshot: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	candidates, err := queryLessonCandidates(ctx, tx, userID, request.Source, request.StudyMode, request.Topic)
	if err != nil {
		return LessonPreview{}, err
	}
	_, composition := composeLessonCandidates(candidates, request.Source, lessonSizeLimit(request.LessonSize))
	if err := tx.Commit(ctx); err != nil {
		return LessonPreview{}, fmt.Errorf("commit lesson preview snapshot: %w", err)
	}
	return LessonPreview{
		Source:      request.Source,
		StudyMode:   request.StudyMode,
		LessonSize:  request.LessonSize,
		Composition: composition,
	}, nil
}

func queryLessonCandidates(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	source string,
	studyMode AnswerMode,
	topic string,
) ([]lessonCandidate, error) {
	excludedWordIDs, err := recentCompletedLessonWordIDs(ctx, tx, userID, source, studyMode)
	if err != nil {
		return nil, err
	}
	dueOnly := studyMode == AnswerModeRecall || studyMode == AnswerModeChoice
	rows, err := tx.Query(ctx, `
		select word.id,
		       word.kind,
		       user_word.status,
		       user_word.due_at,
		       user_word.status <> 'new' and user_word.due_at <= now()
		from user_words user_word
		join words word on word.id = user_word.word_id
		where user_word.user_id = $1::uuid
		  and (not $3 or user_word.due_at <= now())
		  and (
		      $2 = 'mixed'
		      or ($2 = 'phrases' and word.kind = 'phrase')
		      or ($2 = 'noun' and word.kind = 'word' and lower(word.part_of_speech) = 'noun')
		      or ($2 = 'verb' and word.kind = 'word' and lower(word.part_of_speech) = 'verb')
		      or ($2 = 'adjective' and word.kind = 'word' and lower(word.part_of_speech) = 'adjective')
		      or ($2 = 'daily-life' and word.kind = 'word' and word.topic = 'Daily Life')
		      or ($2 = 'travel' and word.kind = 'word' and word.topic = 'Travel')
		      or ($2 = 'data-engineering' and word.kind = 'word' and word.topic = 'Data Engineering')
		      or ($2 = 'backend' and word.kind = 'word' and word.topic = 'Backend Development')
		      or ($2 = 'academic-technical-english' and word.kind = 'word' and word.source = $5)
		  )
		  and ($4 = '' or word.topic = $4)
		order by user_word.due_at, word.id
	`, userID, source, dueOnly, strings.TrimSpace(topic), catalog.Source)
	if err != nil {
		return nil, fmt.Errorf("query lesson candidates: %w", err)
	}
	defer rows.Close()

	candidates := make([]lessonCandidate, 0)
	for rows.Next() {
		var candidate lessonCandidate
		if err := rows.Scan(&candidate.WordID, &candidate.Kind, &candidate.Status, &candidate.DueAt, &candidate.Due); err != nil {
			return nil, fmt.Errorf("scan lesson candidate: %w", err)
		}
		candidates = append(candidates, candidate)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate lesson candidates: %w", err)
	}
	return excludeLessonCandidates(candidates, excludedWordIDs), nil
}

const immediateLessonContinuationWindow = 30 * time.Minute

func recentCompletedLessonWordIDs(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	source string,
	studyMode AnswerMode,
) (map[int64]struct{}, error) {
	rows, err := tx.Query(ctx, `
		with latest_completed as (
			select id
			from lesson_sessions
			where user_id = $1::uuid
			  and status = 'completed'
			  and source = $2
			  and study_mode = $3
			  and completed_at >= now() - ($4::bigint * interval '1 second')
			order by completed_at desc, id desc
			limit 1
		)
		select item.word_id
		from latest_completed completed
		join lesson_session_items item on item.session_id = completed.id
	`, userID, source, studyMode, int64(immediateLessonContinuationWindow/time.Second))
	if err != nil {
		return nil, fmt.Errorf("query recent completed lesson items: %w", err)
	}
	defer rows.Close()

	excluded := make(map[int64]struct{})
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			return nil, fmt.Errorf("scan recent completed lesson item: %w", err)
		}
		excluded[wordID] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate recent completed lesson items: %w", err)
	}
	return excluded, nil
}

func excludeLessonCandidates(candidates []lessonCandidate, excluded map[int64]struct{}) []lessonCandidate {
	if len(excluded) == 0 {
		return candidates
	}
	filtered := make([]lessonCandidate, 0, len(candidates))
	for _, candidate := range candidates {
		if _, found := excluded[candidate.WordID]; found {
			continue
		}
		filtered = append(filtered, candidate)
	}
	return filtered
}

func composeLessonCandidates(candidates []lessonCandidate, source string, limit int) ([]lessonCandidate, LessonComposition) {
	wordQueue := make([]lessonCandidate, 0)
	phraseQueue := make([]lessonCandidate, 0)
	for _, candidate := range candidates {
		if candidate.Kind == "phrase" {
			phraseQueue = append(phraseQueue, candidate)
		} else {
			wordQueue = append(wordQueue, candidate)
		}
	}
	sortLessonQueue(wordQueue)
	sortLessonQueue(phraseQueue)

	composition := LessonComposition{
		AvailableWords:   len(wordQueue),
		AvailablePhrases: len(phraseQueue),
	}
	if len(wordQueue) == 0 && len(phraseQueue) == 0 {
		composition.Fallback = lessonFallbackEmpty
		return nil, composition
	}
	if source == "mixed" {
		if len(wordQueue) == 0 {
			composition.Fallback = lessonFallbackPhrasesOnly
		} else if len(phraseQueue) == 0 {
			composition.Fallback = lessonFallbackWordsOnly
		}
	}

	if limit <= 0 || limit > len(candidates) {
		limit = len(candidates)
	}
	selected := make([]lessonCandidate, 0, limit)
	if source == "mixed" {
		selected = composeMixedPriorityTiers(wordQueue, phraseQueue, limit)
	} else {
		queue := wordQueue
		if source == "phrases" {
			queue = phraseQueue
		}
		selected = append(selected, queue[:min(limit, len(queue))]...)
	}

	for _, candidate := range selected {
		composition.Total++
		if candidate.Kind == "phrase" {
			composition.Phrases++
		} else {
			composition.Words++
		}
		switch {
		case candidate.Due:
			composition.Due++
		case candidate.Status == "new":
			composition.New++
		default:
			composition.Scheduled++
		}
	}
	return selected, composition
}

func composeMixedPriorityTiers(words, phrases []lessonCandidate, limit int) []lessonCandidate {
	selected := make([]lessonCandidate, 0, limit)
	for priority := 0; priority <= 2 && len(selected) < limit; priority++ {
		tierWords := candidatesAtPriority(words, priority)
		tierPhrases := candidatesAtPriority(phrases, priority)
		if len(tierWords) == 0 && len(tierPhrases) == 0 {
			continue
		}

		startKind := "word"
		if len(selected) > 0 {
			if selected[len(selected)-1].Kind == "word" {
				startKind = "phrase"
			}
		} else if len(tierPhrases) > len(tierWords) {
			startKind = "phrase"
		}
		selected = append(selected, alternateLessonKinds(tierWords, tierPhrases, limit-len(selected), startKind)...)
	}
	return selected
}

func candidatesAtPriority(candidates []lessonCandidate, priority int) []lessonCandidate {
	result := make([]lessonCandidate, 0)
	for _, candidate := range candidates {
		if lessonCandidatePriority(candidate) == priority {
			result = append(result, candidate)
		}
	}
	return result
}

func sortLessonQueue(queue []lessonCandidate) {
	sort.SliceStable(queue, func(left, right int) bool {
		leftPriority := lessonCandidatePriority(queue[left])
		rightPriority := lessonCandidatePriority(queue[right])
		if leftPriority != rightPriority {
			return leftPriority < rightPriority
		}
		if !queue[left].DueAt.Equal(queue[right].DueAt) {
			return queue[left].DueAt.Before(queue[right].DueAt)
		}
		return queue[left].WordID < queue[right].WordID
	})
}

func lessonCandidatePriority(candidate lessonCandidate) int {
	if candidate.Due {
		return 0
	}
	if candidate.Status == "new" {
		return 1
	}
	return 2
}

func alternateLessonKinds(words, phrases []lessonCandidate, limit int, startKind string) []lessonCandidate {
	selected := make([]lessonCandidate, 0, limit)
	wordIndex, phraseIndex := 0, 0
	nextKind := startKind
	for len(selected) < limit && (wordIndex < len(words) || phraseIndex < len(phrases)) {
		if nextKind == "word" && wordIndex < len(words) {
			selected = append(selected, words[wordIndex])
			wordIndex++
			nextKind = "phrase"
			continue
		}
		if nextKind == "phrase" && phraseIndex < len(phrases) {
			selected = append(selected, phrases[phraseIndex])
			phraseIndex++
			nextKind = "word"
			continue
		}
		if wordIndex < len(words) {
			selected = append(selected, words[wordIndex])
			wordIndex++
			nextKind = "phrase"
		} else {
			selected = append(selected, phrases[phraseIndex])
			phraseIndex++
			nextKind = "word"
		}
	}
	return selected
}

func lessonSizeLimit(value string) int {
	limit, _ := strconv.Atoi(value)
	return limit
}
