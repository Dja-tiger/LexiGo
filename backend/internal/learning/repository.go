package learning

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrWordNotFound = errors.New("learning item is not assigned to the user")

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

func (r *Repository) ReviewWord(
	ctx context.Context,
	userID string,
	wordID int64,
	request ReviewRequest,
) (ReviewResult, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return ReviewResult{}, fmt.Errorf("begin review transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var state ReviewState
	if err := tx.QueryRow(ctx, `
		select easiness::float8, interval_days, repetitions
		from user_words
		where user_id = $1::uuid and word_id = $2
		for update
	`, userID, wordID).Scan(&state.Easiness, &state.IntervalDays, &state.Repetitions); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReviewResult{}, ErrWordNotFound
		}
		return ReviewResult{}, fmt.Errorf("lock user learning item: %w", err)
	}

	schedule, err := ScheduleReview(state, request.Rating)
	if err != nil {
		return ReviewResult{}, err
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
		return ReviewResult{}, fmt.Errorf("update user learning item: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct
		) values ($1::uuid, $2, $3, $4, $5, $6, nullif($7, ''), $8)
	`, userID, wordID, schedule.Grade, request.ResponseMS, now, request.Rating, request.AnswerMode, request.Correct); err != nil {
		return ReviewResult{}, fmt.Errorf("insert review event: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return ReviewResult{}, fmt.Errorf("commit review transaction: %w", err)
	}

	return ReviewResult{
		WordID:         wordID,
		Status:         schedule.Status,
		Easiness:       schedule.Easiness,
		IntervalDays:   schedule.IntervalDays,
		Repetitions:    schedule.Repetitions,
		DueAt:          dueAt,
		LastReviewedAt: now,
	}, nil
}

func (r *Repository) Progress(ctx context.Context, userID string, timezoneOffsetMinutes int) (ProgressSummary, error) {
	timezoneOffsetMinutes = clampOffset(timezoneOffsetMinutes)
	var result ProgressSummary

	if err := r.pool.QueryRow(ctx, `
		select count(*) filter (where word.kind = 'word')::int,
		       count(*) filter (where word.kind = 'phrase')::int,
		       count(*) filter (where user_word.due_at <= now())::int,
		       count(*) filter (where word.kind = 'word' and user_word.due_at <= now())::int,
		       count(*) filter (where word.kind = 'phrase' and user_word.due_at <= now())::int,
		       count(*) filter (where word.kind = 'word' and user_word.status = 'new')::int,
		       count(*) filter (where word.kind = 'word' and user_word.status = 'learning')::int,
		       count(*) filter (where word.kind = 'word' and user_word.status = 'review')::int,
		       count(*) filter (where word.kind = 'word' and user_word.status = 'mastered')::int,
		       count(*) filter (where word.kind = 'phrase' and user_word.status = 'mastered')::int,
		       min(user_word.due_at) filter (where user_word.due_at > now())
		from user_words user_word
		join words word on word.id = user_word.word_id
		where user_word.user_id = $1::uuid
	`, userID).Scan(
		&result.TotalWords,
		&result.TotalPhrases,
		&result.DueNow,
		&result.DueWords,
		&result.DuePhrases,
		&result.NewWords,
		&result.LearningWords,
		&result.ReviewWords,
		&result.MasteredWords,
		&result.MasteredPhrases,
		&result.NextDueAt,
	); err != nil {
		return ProgressSummary{}, fmt.Errorf("query learning progress: %w", err)
	}

	if err := r.pool.QueryRow(ctx, `
		select count(*) filter (
		           where (reviewed_at - make_interval(mins => $2))::date =
		                 (now() - make_interval(mins => $2))::date
		       )::int,
		       count(*) filter (
		           where grade >= 4 and
		                 (reviewed_at - make_interval(mins => $2))::date =
		                 (now() - make_interval(mins => $2))::date
		       )::int,
		       count(*)::int
		from review_events
		where user_id = $1::uuid
	`, userID, timezoneOffsetMinutes).Scan(
		&result.ReviewsToday,
		&result.SuccessfulToday,
		&result.ReviewsTotal,
	); err != nil {
		return ProgressSummary{}, fmt.Errorf("query review progress: %w", err)
	}

	if err := r.pool.QueryRow(ctx, `
		with bounds as (
			select date_trunc('week', now() - make_interval(mins => $2)) +
			       make_interval(mins => $2) as week_start
		)
		select count(distinct current_review.word_id)::int,
		       count(distinct current_review.word_id) filter (where word.kind = 'word')::int,
		       count(distinct current_review.word_id) filter (where word.kind = 'phrase')::int
		from review_events current_review
		join words word on word.id = current_review.word_id
		cross join bounds
		where current_review.user_id = $1::uuid
		  and current_review.grade = 5
		  and current_review.reviewed_at >= bounds.week_start
		  and exists (
			select 1
			from review_events previous_review
			where previous_review.user_id = current_review.user_id
			  and previous_review.word_id = current_review.word_id
			  and previous_review.grade = 5
			  and previous_review.reviewed_at < bounds.week_start
		  )
	`, userID, timezoneOffsetMinutes).Scan(
		&result.RetainedItemsWeek,
		&result.RetainedWordsWeek,
		&result.RetainedPhrasesWeek,
	); err != nil {
		return ProgressSummary{}, fmt.Errorf("query retained learning progress: %w", err)
	}

	if err := r.pool.QueryRow(ctx, `
		select coalesce(
			(select daily_goal from user_learning_preferences where user_id = $1::uuid),
			30
		)
	`, userID).Scan(&result.DailyGoal); err != nil {
		return ProgressSummary{}, fmt.Errorf("query daily goal: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		select distinct (reviewed_at - make_interval(mins => $2))::date as review_day
		from review_events
		where user_id = $1::uuid
		order by review_day desc
		limit 730
	`, userID, timezoneOffsetMinutes)
	if err != nil {
		return ProgressSummary{}, fmt.Errorf("query review days: %w", err)
	}
	defer rows.Close()

	days := make([]time.Time, 0, 32)
	for rows.Next() {
		var day time.Time
		if err := rows.Scan(&day); err != nil {
			return ProgressSummary{}, fmt.Errorf("scan review day: %w", err)
		}
		days = append(days, dateOnly(day))
	}
	if err := rows.Err(); err != nil {
		return ProgressSummary{}, fmt.Errorf("iterate review days: %w", err)
	}

	localNow := time.Now().UTC().Add(-time.Duration(timezoneOffsetMinutes) * time.Minute)
	result.CurrentStreak, result.LongestStreak = calculateStreaks(days, dateOnly(localNow))
	return result, nil
}

func (r *Repository) SetDailyGoal(ctx context.Context, userID string, dailyGoal int) error {
	if _, err := r.pool.Exec(ctx, `
		insert into user_learning_preferences(user_id, daily_goal)
		values ($1::uuid, $2)
		on conflict (user_id) do update
		set daily_goal = excluded.daily_goal,
		    updated_at = now()
	`, userID, dailyGoal); err != nil {
		return fmt.Errorf("set daily goal: %w", err)
	}
	return nil
}

func clampOffset(offset int) int {
	if offset < -840 {
		return -840
	}
	if offset > 840 {
		return 840
	}
	return offset
}

func dateOnly(value time.Time) time.Time {
	year, month, day := value.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

func calculateStreaks(days []time.Time, today time.Time) (current, longest int) {
	if len(days) == 0 {
		return 0, 0
	}

	longest = 1
	run := 1
	for index := 1; index < len(days); index++ {
		if days[index-1].Sub(days[index]) == 24*time.Hour {
			run++
			if run > longest {
				longest = run
			}
		} else {
			run = 1
		}
	}

	start := today
	if days[0].Equal(today.AddDate(0, 0, -1)) {
		start = today.AddDate(0, 0, -1)
	} else if !days[0].Equal(today) {
		return 0, longest
	}

	for index, day := range days {
		expected := start.AddDate(0, 0, -index)
		if !day.Equal(expected) {
			break
		}
		current++
	}
	return current, longest
}
