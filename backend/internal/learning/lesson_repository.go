package learning

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

var (
	ErrNoActiveLesson            = errors.New("active lesson was not found")
	ErrInvalidLessonWords        = errors.New("lesson contains words not assigned to the user")
	ErrLessonItemNotFound        = errors.New("lesson item was not found")
	ErrLessonItemAlreadyReviewed = errors.New("lesson item was already reviewed")
	ErrLessonItemOutOfOrder      = errors.New("lesson item is not the current item")
	ErrLessonModeMismatch        = errors.New("lesson answer mode does not match session")
	ErrLessonVersionConflict     = errors.New("lesson version conflict")
	ErrInvalidLessonState        = errors.New("lesson state is inconsistent")
	ErrLessonQueueEmpty          = errors.New("lesson queue is empty")
)

func (r *Repository) CreateLesson(
	ctx context.Context,
	userID string,
	request LessonCreateRequest,
) (LessonSession, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return LessonSession{}, fmt.Errorf("begin lesson transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	wordIDs := request.WordIDs
	if wordIDs == nil {
		candidates, candidateErr := queryLessonCandidates(ctx, tx, userID, request.Source, request.StudyMode, request.Topic)
		if candidateErr != nil {
			return LessonSession{}, candidateErr
		}
		selected, _ := composeLessonCandidates(candidates, request.Source, lessonSizeLimit(request.LessonSize))
		if len(selected) == 0 {
			return LessonSession{}, ErrLessonQueueEmpty
		}
		wordIDs = make([]int64, 0, len(selected))
		for _, candidate := range selected {
			wordIDs = append(wordIDs, candidate.WordID)
		}
	} else {
		var assigned int
		if err := tx.QueryRow(ctx, `
			select count(*)::int
			from user_words
			where user_id = $1::uuid and word_id = any($2::bigint[])
		`, userID, wordIDs).Scan(&assigned); err != nil {
			return LessonSession{}, fmt.Errorf("validate lesson words: %w", err)
		}
		if assigned != len(wordIDs) {
			return LessonSession{}, ErrInvalidLessonWords
		}
	}

	if _, err := tx.Exec(ctx, `
		update lesson_sessions
		set status = 'discarded', version = version + 1, updated_at = now()
		where user_id = $1::uuid and status = 'active'
	`, userID); err != nil {
		return LessonSession{}, fmt.Errorf("discard previous lesson: %w", err)
	}

	var lessonID string
	if err := tx.QueryRow(ctx, `
		insert into lesson_sessions(user_id, source, study_mode, lesson_size)
		values ($1::uuid, $2, $3, $4)
		returning id::text
	`, userID, request.Source, request.StudyMode, request.LessonSize).Scan(&lessonID); err != nil {
		return LessonSession{}, fmt.Errorf("insert lesson: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into lesson_session_items(session_id, position, word_id)
		select $1::uuid, (ordinality - 1)::int, word_id
		from unnest($2::bigint[]) with ordinality as selected(word_id, ordinality)
	`, lessonID, wordIDs); err != nil {
		return LessonSession{}, fmt.Errorf("insert lesson items: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return LessonSession{}, fmt.Errorf("commit lesson transaction: %w", err)
	}
	return r.lessonByID(ctx, userID, lessonID, "active")
}

func (r *Repository) ActiveLesson(ctx context.Context, userID string) (LessonSession, error) {
	var lessonID string
	if err := r.pool.QueryRow(ctx, `
		select id::text
		from lesson_sessions
		where user_id = $1::uuid and status = 'active'
		order by updated_at desc
		limit 1
	`, userID).Scan(&lessonID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonSession{}, ErrNoActiveLesson
		}
		return LessonSession{}, fmt.Errorf("query active lesson: %w", err)
	}
	return r.lessonByID(ctx, userID, lessonID, "active")
}

func (r *Repository) DiscardLesson(ctx context.Context, userID, lessonID string, expectedVersion int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin discard lesson transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var version int64
	if err := tx.QueryRow(ctx, `
		select version
		from lesson_sessions
		where id = $1::uuid and user_id = $2::uuid and status = 'active'
		for update
	`, lessonID, userID).Scan(&version); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNoActiveLesson
		}
		return fmt.Errorf("lock lesson for discard: %w", err)
	}
	if version != expectedVersion {
		return ErrLessonVersionConflict
	}

	discardResult, err := tx.Exec(ctx, `
		update lesson_sessions
		set status = 'discarded', version = version + 1, updated_at = now()
		where id = $1::uuid and user_id = $2::uuid and status = 'active' and version = $3
	`, lessonID, userID, expectedVersion)
	if err != nil {
		return fmt.Errorf("discard lesson: %w", err)
	}
	if discardResult.RowsAffected() != 1 {
		return ErrLessonVersionConflict
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit discard lesson: %w", err)
	}
	return nil
}

func (r *Repository) ReviewLessonWord(
	ctx context.Context,
	userID string,
	lessonID string,
	wordID int64,
	request LessonReviewRequest,
) (LessonReviewResult, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return LessonReviewResult{}, fmt.Errorf("begin lesson review transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var lockedLessonID string
	var currentIndex int
	var lessonMode AnswerMode
	var rawSessionKind string
	var version int64
	if err := tx.QueryRow(ctx, `
		select id::text, current_index, study_mode, coalesce(session_kind, ''), version
		from lesson_sessions
		where id = $1::uuid and user_id = $2::uuid and status = 'active'
		for update
	`, lessonID, userID).Scan(&lockedLessonID, &currentIndex, &lessonMode, &rawSessionKind, &version); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonItemNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock lesson: %w", err)
	}
	sessionKind := LessonSessionKind(rawSessionKind)
	if !validLessonSessionKind(sessionKind) {
		return LessonReviewResult{}, ErrInvalidLessonState
	}
	if version != request.LessonVersion {
		return LessonReviewResult{}, ErrLessonVersionConflict
	}
	if lessonMode != request.AnswerMode {
		return LessonReviewResult{}, ErrLessonModeMismatch
	}

	var position int
	var existingRating *string
	var rawSelectionReason string
	if err := tx.QueryRow(ctx, `
		select position, rating, coalesce(selection_reason, '')
		from lesson_session_items
		where session_id = $1::uuid and word_id = $2
		for update
	`, lessonID, wordID).Scan(&position, &existingRating, &rawSelectionReason); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonItemNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock lesson item: %w", err)
	}
	selectionReason := LessonSelectionReason(rawSelectionReason)
	if selectionReason != "" && !validLessonSelectionReason(selectionReason) {
		return LessonReviewResult{}, ErrInvalidLessonState
	}
	if existingRating != nil {
		return LessonReviewResult{}, ErrLessonItemAlreadyReviewed
	}
	if position != currentIndex {
		return LessonReviewResult{}, ErrLessonItemOutOfOrder
	}

	var state ReviewState
	var definition AnswerDefinition
	if err := tx.QueryRow(ctx, `
		select user_word.status,
		       user_word.easiness::float8,
		       user_word.interval_days,
		       user_word.repetitions,
		       user_word.due_at,
		       word.kind,
		       word.translation,
		       word.cloze_answer,
		       coalesce(word.accepted_answers, '{}'::text[])
		from user_words user_word
		join words word on word.id = user_word.word_id
		where user_word.user_id = $1::uuid and user_word.word_id = $2
		for update of user_word
	`, userID, wordID).Scan(
		&state.Status,
		&state.Easiness,
		&state.IntervalDays,
		&state.Repetitions,
		&state.DueAt,
		&definition.Kind,
		&definition.Translation,
		&definition.ClozeAnswer,
		&definition.AcceptedAnswers,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrWordNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock user word: %w", err)
	}

	assessment := AssessReview(request.ReviewRequest, definition)
	schedule, err := ScheduleAttempt(state, assessment.EffectiveRating, request.AnswerMode)
	if err != nil {
		return LessonReviewResult{}, err
	}
	now := time.Now().UTC()
	dueAt := state.DueAt
	if !schedule.PreserveDue {
		dueAt = now.Add(schedule.DueAfter)
	}

	if _, err := tx.Exec(ctx, `
		update user_words
		set status = $3,
		    easiness = $4,
		    interval_days = $5,
		    repetitions = $6,
		    due_at = $7,
		    last_reviewed_at = $8,
		    updated_at = $8
		where user_id = $1::uuid and word_id = $2
	`, userID, wordID, schedule.Status, schedule.Easiness, schedule.IntervalDays, schedule.Repetitions, dueAt, now); err != nil {
		return LessonReviewResult{}, fmt.Errorf("update user word: %w", err)
	}

	var reviewEventID int64
	if err := tx.QueryRow(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
			answer_revealed, event_schema_version, submitted_answer, effective_rating,
			judgement_source, judgement_reason, matched_answer, session_kind, selection_reason
		) values (
			$1::uuid, $2, $3, $4, $5, $6, $7, $8,
			$9, 2, $10, $11, $12, $13, nullif($14, ''), nullif($15::text, ''), nullif($16::text, '')
		)
		returning id
	`,
		userID,
		wordID,
		schedule.Grade,
		request.ResponseMS,
		now,
		request.Rating,
		request.AnswerMode,
		assessment.Correct,
		request.AnswerRevealed,
		assessment.SubmittedAnswer,
		assessment.EffectiveRating,
		assessment.JudgementSource,
		assessment.JudgementReason,
		assessment.MatchedAnswer,
		rawSessionKind,
		rawSelectionReason,
	).Scan(&reviewEventID); err != nil {
		return LessonReviewResult{}, fmt.Errorf("insert review event: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		update lesson_session_items
		set rating = $3, reviewed_at = $4
		where session_id = $1::uuid and word_id = $2
	`, lessonID, wordID, request.Rating, now); err != nil {
		return LessonReviewResult{}, fmt.Errorf("update lesson item: %w", err)
	}

	var remaining, nextIndex, totalItems int
	if err := tx.QueryRow(ctx, `
		select count(*) filter (where rating is null)::int,
		       coalesce(min(position) filter (where rating is null), 0)::int,
		       count(*)::int
		from lesson_session_items
		where session_id = $1::uuid
	`, lessonID).Scan(&remaining, &nextIndex, &totalItems); err != nil {
		return LessonReviewResult{}, fmt.Errorf("calculate lesson progress: %w", err)
	}
	completed := remaining == 0
	reviewedItems := totalItems - remaining
	if completed {
		nextIndex = totalItems
	}

	var nextVersion int64
	if err := tx.QueryRow(ctx, `
		update lesson_sessions
		set current_index = $3,
		    version = version + 1,
		    status = case when $4 then 'completed' else 'active' end,
		    completed_at = case when $4 then $5::timestamptz else null::timestamptz end,
		    updated_at = $5::timestamptz
		where id = $1::uuid and user_id = $2::uuid and version = $6
		returning version
	`, lessonID, userID, nextIndex, completed, now, request.LessonVersion).Scan(&nextVersion); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonVersionConflict
		}
		return LessonReviewResult{}, fmt.Errorf("update lesson progress: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return LessonReviewResult{}, fmt.Errorf("commit lesson review transaction: %w", err)
	}

	return LessonReviewResult{
		ReviewResult: ReviewResult{
			WordID:              wordID,
			Status:              schedule.Status,
			Easiness:            schedule.Easiness,
			IntervalDays:        schedule.IntervalDays,
			Repetitions:         schedule.Repetitions,
			DueAt:               dueAt,
			LastReviewedAt:      now,
			RequestedRating:     assessment.RequestedRating,
			EffectiveRating:     assessment.EffectiveRating,
			Correct:             assessment.Correct,
			JudgementSource:     assessment.JudgementSource,
			JudgementReason:     assessment.JudgementReason,
			MatchedAnswer:       assessment.MatchedAnswer,
			ReviewEventID:       reviewEventID,
			SuggestionAvailable: assessment.SuggestionAvailable,
		},
		LessonID:            lockedLessonID,
		LessonCurrentIndex:  nextIndex,
		LessonVersion:       nextVersion,
		LessonCompleted:     completed,
		LessonReviewedItems: reviewedItems,
		LessonSkippedItems:  0,
		LessonTotalItems:    totalItems,
	}, nil
}
func (r *Repository) lessonByID(
	ctx context.Context,
	userID string,
	lessonID string,
	requiredStatus string,
) (LessonSession, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return LessonSession{}, fmt.Errorf("begin lesson snapshot: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var lesson LessonSession
	if err := tx.QueryRow(ctx, `
		select id::text, source, study_mode, lesson_size, current_index, version, status, created_at, updated_at
		from lesson_sessions
		where id = $1::uuid
		  and user_id = $2::uuid
		  and ($3 = '' or status = $3)
	`, lessonID, userID, requiredStatus).Scan(
		&lesson.ID,
		&lesson.Source,
		&lesson.StudyMode,
		&lesson.LessonSize,
		&lesson.CurrentIndex,
		&lesson.Version,
		&lesson.Status,
		&lesson.CreatedAt,
		&lesson.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonSession{}, ErrNoActiveLesson
		}
		return LessonSession{}, fmt.Errorf("query lesson: %w", err)
	}

	rows, err := tx.Query(ctx, `
		select item.position,
		       word.id,
		       word.kind,
		       coalesce(word.slug, ''),
		       word.lemma,
		       word.translation,
		       word.phonetic,
		       word.part_of_speech,
		       word.topic,
		       coalesce(word.aliases, '{}'::text[]),
		       coalesce(word.accepted_answers, '{}'::text[]),
		       word.examples,
		       word.note,
		       word.cloze,
		       word.cloze_answer,
		       user_word.status,
		       item.rating,
		       item.reviewed_at
		from lesson_session_items item
		join words word on word.id = item.word_id
		join user_words user_word
		  on user_word.word_id = item.word_id and user_word.user_id = $2::uuid
		where item.session_id = $1::uuid
		order by item.position
	`, lessonID, userID)
	if err != nil {
		return LessonSession{}, fmt.Errorf("query lesson items: %w", err)
	}
	defer rows.Close()

	lesson.Items = make([]LessonItem, 0)
	for rows.Next() {
		var item LessonItem
		var examples []byte
		var rating *string
		if err := rows.Scan(
			&item.Position,
			&item.WordID,
			&item.Kind,
			&item.Slug,
			&item.Lemma,
			&item.Translation,
			&item.Phonetic,
			&item.PartOfSpeech,
			&item.Topic,
			&item.Aliases,
			&item.AcceptedAnswers,
			&examples,
			&item.Note,
			&item.Cloze,
			&item.ClozeAnswer,
			&item.Status,
			&rating,
			&item.ReviewedAt,
		); err != nil {
			return LessonSession{}, fmt.Errorf("scan lesson item: %w", err)
		}
		if err := json.Unmarshal(examples, &item.Examples); err != nil {
			return LessonSession{}, fmt.Errorf("decode lesson examples: %w", err)
		}
		if rating != nil {
			parsed := Rating(*rating)
			item.Rating = &parsed
		}
		lesson.Items = append(lesson.Items, item)
	}
	if err := rows.Err(); err != nil {
		return LessonSession{}, fmt.Errorf("iterate lesson items: %w", err)
	}
	rows.Close()

	if !validLessonState(lesson.Status, lesson.CurrentIndex, lesson.Items) {
		return LessonSession{}, ErrInvalidLessonState
	}

	if err := tx.Commit(ctx); err != nil {
		return LessonSession{}, fmt.Errorf("commit lesson snapshot: %w", err)
	}
	return lesson, nil
}
