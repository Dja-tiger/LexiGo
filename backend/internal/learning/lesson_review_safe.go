package learning

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

// ReviewLessonWordSafe persists a lesson review while explicitly locking the
// lesson, its item and the user's word state in a deterministic order.
func (r *Repository) ReviewLessonWordSafe(
	ctx context.Context,
	userID string,
	lessonID string,
	wordID int64,
	request ReviewRequest,
) (LessonReviewResult, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return LessonReviewResult{}, fmt.Errorf("begin lesson review transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var currentIndex int
	if err := tx.QueryRow(ctx, `
		select current_index
		from lesson_sessions
		where id = $1::uuid and user_id = $2::uuid and status = 'active'
		for update
	`, lessonID, userID).Scan(&currentIndex); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonItemNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock active lesson: %w", err)
	}

	var position int
	var existingRating *string
	if err := tx.QueryRow(ctx, `
		select position, rating
		from lesson_session_items
		where session_id = $1::uuid and word_id = $2
		for update
	`, lessonID, wordID).Scan(&position, &existingRating); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonItemNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock lesson item: %w", err)
	}
	if existingRating != nil {
		return LessonReviewResult{}, ErrLessonItemAlreadyReviewed
	}

	var state ReviewState
	if err := tx.QueryRow(ctx, `
		select easiness::float8, interval_days, repetitions
		from user_words
		where user_id = $1::uuid and word_id = $2
		for update
	`, userID, wordID).Scan(&state.Easiness, &state.IntervalDays, &state.Repetitions); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrWordNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock user word: %w", err)
	}

	schedule, err := ScheduleReview(state, request.Rating)
	if err != nil {
		return LessonReviewResult{}, err
	}
	now := time.Now().UTC()
	dueAt := now.Add(schedule.DueAfter)

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

	if _, err := tx.Exec(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct
		) values ($1::uuid, $2, $3, $4, $5, $6, nullif($7, ''), $8)
	`, userID, wordID, schedule.Grade, request.ResponseMS, now, request.Rating, request.AnswerMode, request.Correct); err != nil {
		return LessonReviewResult{}, fmt.Errorf("insert review event: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		update lesson_session_items
		set rating = $3, reviewed_at = $4
		where session_id = $1::uuid and word_id = $2
	`, lessonID, wordID, request.Rating, now); err != nil {
		return LessonReviewResult{}, fmt.Errorf("update lesson item: %w", err)
	}

	var remaining int
	var nextIndex int
	if err := tx.QueryRow(ctx, `
		select count(*) filter (where rating is null)::int,
		       coalesce(min(position) filter (where rating is null), count(*)::int)::int
		from lesson_session_items
		where session_id = $1::uuid
	`, lessonID).Scan(&remaining, &nextIndex); err != nil {
		return LessonReviewResult{}, fmt.Errorf("calculate lesson progress: %w", err)
	}
	completed := remaining == 0

	if _, err := tx.Exec(ctx, `
		update lesson_sessions
		set current_index = $3,
		    status = case when $4 then 'completed' else 'active' end,
		    completed_at = case when $4 then $5::timestamptz else null::timestamptz end,
		    updated_at = $5::timestamptz
		where id = $1::uuid and user_id = $2::uuid
	`, lessonID, userID, nextIndex, completed, now); err != nil {
		return LessonReviewResult{}, fmt.Errorf("update lesson progress: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return LessonReviewResult{}, fmt.Errorf("commit lesson review transaction: %w", err)
	}

	return LessonReviewResult{
		ReviewResult: ReviewResult{
			WordID:         wordID,
			Status:         schedule.Status,
			Easiness:       schedule.Easiness,
			IntervalDays:   schedule.IntervalDays,
			Repetitions:    schedule.Repetitions,
			DueAt:          dueAt,
			LastReviewedAt: now,
		},
		LessonID:           lessonID,
		LessonCurrentIndex: nextIndex,
		LessonCompleted:    completed,
	}, nil
}
