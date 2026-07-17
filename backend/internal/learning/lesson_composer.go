package learning

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"time"

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

	candidates, err := queryLessonCandidates(ctx, tx, userID, request.Source, request.StudyMode)
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
) ([]lessonCandidate, error) {
	dueOnly := studyMode == AnswerModeRecall || studyMode == AnswerModeChoice
	rows, err := tx.Query(ctx, `
		select word.id,
		       word.kind,
		       user_word.status,
		       user_word.due_at,
		       user_word.due_at <= now()
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
		  )
		order by user_word.due_at, word.id
	`, userID, source, dueOnly)
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
	return candidates, nil
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
		selected = alternateLessonKinds(wordQueue, phraseQueue, limit)
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

func alternateLessonKinds(words, phrases []lessonCandidate, limit int) []lessonCandidate {
	selected := make([]lessonCandidate, 0, limit)
	wordIndex, phraseIndex := 0, 0
	nextKind := "word"
	if dueCount(phrases) > dueCount(words) {
		nextKind = "phrase"
	}
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

func dueCount(candidates []lessonCandidate) int {
	count := 0
	for _, candidate := range candidates {
		if candidate.Due {
			count++
		}
	}
	return count
}

func lessonSizeLimit(value string) int {
	if value == "all" {
		return 1000
	}
	limit, _ := strconv.Atoi(value)
	return limit
}
