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

	defaultLessonReviewRatio   = 70
	maxLessonCandidatePriority = 4
	maxLessonDimensionStreak   = 2
	recentLessonFailureWindow  = 14 * 24 * time.Hour
	weakLessonTopicMaxEasiness = 2.30
	weakLessonTopicMinReviewed = 3
)

type lessonCandidate struct {
	WordID         int64
	Kind           string
	Status         string
	DueAt          time.Time
	Due            bool
	Topic          string
	PartOfSpeech   string
	RecentFailure  bool
	WeakTopic      bool
	Easiness       float64
	RepeatedAgain  bool
	RepeatedAlmost bool
	Overdue        bool
	ReasonOverride LessonSelectionReason
}

func (r *Repository) PreviewLesson(ctx context.Context, userID string, request LessonPreviewRequest) (LessonPreview, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return LessonPreview{}, fmt.Errorf("begin lesson preview snapshot: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	candidates, err := queryLessonCandidatesForSession(
		ctx,
		tx,
		userID,
		request.Source,
		request.StudyMode,
		request.Topic,
		request.SessionKind,
	)
	if err != nil {
		return LessonPreview{}, err
	}
	reviewRatio := resolveLessonReviewRatio(request.ReviewRatio)
	_, composition := composeLessonCandidates(candidates, request.Source, lessonSizeLimit(request.LessonSize), reviewRatio)
	if err := tx.Commit(ctx); err != nil {
		return LessonPreview{}, fmt.Errorf("commit lesson preview snapshot: %w", err)
	}
	return LessonPreview{
		Source:      request.Source,
		StudyMode:   request.StudyMode,
		SessionKind: request.SessionKind,
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
	dueOnly := studyMode.Objective()
	rows, err := tx.Query(ctx, `
		with latest_review as (
			select distinct on (review_event.word_id)
			       review_event.word_id,
			       review_event.effective_rating,
			       review_event.correct,
			       review_event.reviewed_at
			from review_events review_event
			where review_event.user_id = $1::uuid
			order by review_event.word_id, review_event.reviewed_at desc, review_event.id desc
		),
		topic_signal as (
			select word.topic,
			       count(*) filter (where user_word.status <> 'new')::int as reviewed_count,
			       avg(user_word.easiness::float8) filter (where user_word.status <> 'new') as avg_easiness
			from user_words user_word
			join words word on word.id = user_word.word_id
			where user_word.user_id = $1::uuid
			group by word.topic
		)
		select word.id,
		       word.kind,
		       user_word.status,
		       user_word.due_at,
		       user_word.status <> 'new' and user_word.due_at <= now(),
		       word.topic,
		       coalesce(word.part_of_speech, ''),
		       coalesce(
		           latest_review.reviewed_at >= now() - ($6::bigint * interval '1 second')
		           and (
		               latest_review.effective_rating = 'again'
		               or latest_review.correct is false
		           ),
		           false
		       ),
		       coalesce(
		           topic_signal.reviewed_count >= $8
		           and topic_signal.avg_easiness < $7,
		           false
		       )
		from user_words user_word
		join words word on word.id = user_word.word_id
		left join latest_review on latest_review.word_id = user_word.word_id
		left join topic_signal on topic_signal.topic = word.topic
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
	`,
		userID,
		source,
		dueOnly,
		strings.TrimSpace(topic),
		catalog.Source,
		int64(recentLessonFailureWindow/time.Second),
		weakLessonTopicMaxEasiness,
		weakLessonTopicMinReviewed,
	)
	if err != nil {
		return nil, fmt.Errorf("query lesson candidates: %w", err)
	}
	defer rows.Close()

	candidates := make([]lessonCandidate, 0)
	for rows.Next() {
		var candidate lessonCandidate
		if err := rows.Scan(
			&candidate.WordID,
			&candidate.Kind,
			&candidate.Status,
			&candidate.DueAt,
			&candidate.Due,
			&candidate.Topic,
			&candidate.PartOfSpeech,
			&candidate.RecentFailure,
			&candidate.WeakTopic,
		); err != nil {
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
		return nil, fmt.Errorf("iterate recent completed lesson item: %w", err)
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

func composeLessonCandidates(candidates []lessonCandidate, source string, limit int, reviewRatio ...int) ([]lessonCandidate, LessonComposition) {
	ratio := defaultLessonReviewRatio
	if len(reviewRatio) > 0 {
		ratio = normalizeLessonReviewRatio(reviewRatio[0])
	}

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
		ReviewRatio:      ratio,
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

	ordered := make([]lessonCandidate, 0, len(candidates))
	if source == "mixed" {
		ordered = composeMixedPriorityTiers(wordQueue, phraseQueue, len(candidates))
	} else {
		queue := wordQueue
		if source == "phrases" {
			queue = phraseQueue
		}
		ordered = append(ordered, queue...)
	}

	selected := applyLessonReviewRatio(ordered, limit, ratio)
	selected = diversifyLessonDimensions(selected, maxLessonDimensionStreak)

	for _, candidate := range selected {
		composition.Total++
		if candidate.Kind == "phrase" {
			composition.Phrases++
		} else {
			composition.Words++
		}
		if candidate.Due {
			composition.Due++
		}
		if candidate.Status == "new" {
			composition.New++
		} else if lessonCandidateReason(candidate) == LessonReasonScheduled {
			composition.Scheduled++
		}
		if candidate.RecentFailure {
			composition.RecentFailures++
		}
		if candidate.WeakTopic {
			composition.WeakTopics++
		}
	}
	return selected, composition
}

func applyLessonReviewRatio(ordered []lessonCandidate, limit, reviewRatio int) []lessonCandidate {
	if limit <= 0 || limit > len(ordered) {
		limit = len(ordered)
	}
	if limit == 0 {
		return nil
	}

	reviewAvailable := 0
	for _, candidate := range ordered {
		if candidate.Status != "new" {
			reviewAvailable++
		}
	}
	newAvailable := len(ordered) - reviewAvailable
	desiredReview := (limit*normalizeLessonReviewRatio(reviewRatio) + 99) / 100
	reviewTake := min(desiredReview, reviewAvailable)
	newTake := min(limit-reviewTake, newAvailable)
	remaining := limit - reviewTake - newTake
	if remaining > 0 {
		extraReview := min(remaining, reviewAvailable-reviewTake)
		reviewTake += extraReview
		remaining -= extraReview
	}
	if remaining > 0 {
		newTake += min(remaining, newAvailable-newTake)
	}

	selected := make([]lessonCandidate, 0, limit)
	reviewSelected, newSelected := 0, 0
	for _, candidate := range ordered {
		if candidate.Status == "new" {
			if newSelected >= newTake {
				continue
			}
			newSelected++
		} else {
			if reviewSelected >= reviewTake {
				continue
			}
			reviewSelected++
		}
		selected = append(selected, candidate)
		if len(selected) == limit {
			break
		}
	}
	return selected
}

func composeMixedPriorityTiers(words, phrases []lessonCandidate, limit int) []lessonCandidate {
	selected := make([]lessonCandidate, 0, limit)
	for priority := 0; priority <= maxLessonCandidatePriority && len(selected) < limit; priority++ {
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
		if queue[left].Easiness != queue[right].Easiness {
			return queue[left].Easiness < queue[right].Easiness
		}
		return queue[left].WordID < queue[right].WordID
	})
}

func lessonCandidatePriority(candidate lessonCandidate) int {
	switch lessonCandidateReason(candidate) {
	case LessonReasonRecentFailure, LessonReasonRelearningDue, LessonReasonRepeatedAgain:
		return 0
	case LessonReasonDue, LessonReasonOverdue:
		return 1
	case LessonReasonWeakTopic, LessonReasonRepeatedAlmost:
		return 2
	case LessonReasonNew:
		return 3
	default:
		return 4
	}
}

func lessonCandidateReason(candidate lessonCandidate) LessonSelectionReason {
	if candidate.ReasonOverride != "" {
		return candidate.ReasonOverride
	}
	switch {
	case candidate.RecentFailure:
		return LessonReasonRecentFailure
	case candidate.Due:
		return LessonReasonDue
	case candidate.WeakTopic:
		return LessonReasonWeakTopic
	case candidate.Status == "new":
		return LessonReasonNew
	default:
		return LessonReasonScheduled
	}
}

func diversifyLessonDimensions(queue []lessonCandidate, maxStreak int) []lessonCandidate {
	if len(queue) < 3 || maxStreak < 1 {
		return queue
	}
	result := append([]lessonCandidate(nil), queue...)
	for index := range result {
		if !createsLessonDimensionStreak(result[:index], result[index], maxStreak) {
			continue
		}
		priority := lessonCandidatePriority(result[index])
		for alternative := index + 1; alternative < len(result); alternative++ {
			if lessonCandidatePriority(result[alternative]) != priority {
				break
			}
			if createsLessonDimensionStreak(result[:index], result[alternative], maxStreak) {
				continue
			}
			result[index], result[alternative] = result[alternative], result[index]
			break
		}
	}
	return result
}

func createsLessonDimensionStreak(prefix []lessonCandidate, candidate lessonCandidate, maxStreak int) bool {
	return createsStringStreak(prefix, candidate.Topic, maxStreak, func(item lessonCandidate) string { return item.Topic }) ||
		createsStringStreak(prefix, candidate.PartOfSpeech, maxStreak, func(item lessonCandidate) string { return item.PartOfSpeech })
}

func createsStringStreak(prefix []lessonCandidate, value string, maxStreak int, field func(lessonCandidate) string) bool {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "" || len(prefix) < maxStreak {
		return false
	}
	for offset := 1; offset <= maxStreak; offset++ {
		previous := strings.ToLower(strings.TrimSpace(field(prefix[len(prefix)-offset])))
		if previous != normalized {
			return false
		}
	}
	return true
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

func resolveLessonReviewRatio(value *int) int {
	if value == nil {
		return defaultLessonReviewRatio
	}
	return normalizeLessonReviewRatio(*value)
}

func normalizeLessonReviewRatio(value int) int {
	if value < 0 {
		return 0
	}
	if value > 100 {
		return 100
	}
	return value
}

func lessonSizeLimit(value string) int {
	if value == "all" {
		return 0
	}
	limit, _ := strconv.Atoi(value)
	return limit
}
