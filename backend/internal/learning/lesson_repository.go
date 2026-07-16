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

	var assigned int
	if err := tx.QueryRow(ctx, `
		select count(*)::int
		from user_words
		where user_id = $1::uuid and word_id = any($2::bigint[])
	`, userID, request.WordIDs).Scan(&assigned); err != nil {
		return LessonSession{}, fmt.Errorf("validate lesson words: %w", err)
	}
	if assigned != len(request.WordIDs) {
		return LessonSession{}, ErrInvalidLessonWords
	}

	if _, err := tx.Exec(ctx, `
		update lesson_sessions
		set status = 'discarded', updated_at = now()
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
	`, lessonID, request.WordIDs); err != nil {
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

func (r *Repository) DiscardLesson(ctx context.Context, userID, lessonID string) error {
	result, err := r.pool.Exec(ctx, `
		update lesson_sessions
		set status = 'discarded', updated_at = now()
		where id = $1::uuid and user_id = $2::uuid and status = 'active'
	`, lessonID, userID)
	if err != nil {
		return fmt.Errorf("discard lesson: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrNoActiveLesson
	}
	return nil
}

func (r *Repository) ReviewLessonWord(
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

	var lockedLessonID string
	if err := tx.QueryRow(ctx, `
		select id::text
		from lesson_sessions
		where id = $1::uuid and user_id = $2::uuid and status = 'active'
		for update
	`, lessonID, userID).Scan(&lockedLessonID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonItemNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock lesson: %w", err)
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

	var remaining, nextIndex int
	if err := tx.QueryRow(ctx, `
		select count(*) filter (where rating is null)::int,
		       coalesce(min(position) filter (where rating is null), 0)::int
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
		LessonID:           lockedLessonID,
		LessonCurrentIndex: nextIndex,
		LessonCompleted:    completed,
	}, nil
}

func (r *Repository) lessonByID(
	ctx context.Context,
	userID string,
	lessonID string,
	requiredStatus string,
) (LessonSession, error) {
	var lesson LessonSession
	if err := r.pool.QueryRow(ctx, `
		select id::text, source, study_mode, lesson_size, current_index, status, created_at, updated_at
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
		&lesson.Status,
		&lesson.CreatedAt,
		&lesson.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonSession{}, ErrNoActiveLesson
		}
		return LessonSession{}, fmt.Errorf("query lesson: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		select item.position,
		       word.id,
		       word.lemma,
		       word.translation,
		       word.phonetic,
		       word.part_of_speech,
		       word.topic,
		       word.examples,
		       word.note,
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
			&item.Lemma,
			&item.Translation,
			&item.Phonetic,
			&item.PartOfSpeech,
			&item.Topic,
			&examples,
			&item.Note,
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
			value := Rating(*rating)
			item.Rating = &value
		}
		lesson.Items = append(lesson.Items, item)
	}
	if err := rows.Err(); err != nil {
		return LessonSession{}, fmt.Errorf("iterate lesson items: %w", err)
	}
	return lesson, nil
}
