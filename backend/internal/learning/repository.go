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
			return ReviewResult{}, ErrWordNotFound
		}
		return ReviewResult{}, fmt.Errorf("lock user learning item: %w", err)
	}

	assessment := AssessReview(request, definition)
	schedule, err := ScheduleAttempt(state, assessment.EffectiveRating, request.AnswerMode)
	if err != nil {
		return ReviewResult{}, err
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
		return ReviewResult{}, fmt.Errorf("update user learning item: %w", err)
	}

	var reviewEventID int64
	if err := tx.QueryRow(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
			answer_revealed, event_schema_version, submitted_answer, effective_rating,
			judgement_source, judgement_reason, matched_answer
		) values (
			$1::uuid, $2, $3, $4, $5, $6, $7, $8,
			$9, 2, $10, $11, $12, $13, nullif($14, '')
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
	).Scan(&reviewEventID); err != nil {
		return ReviewResult{}, fmt.Errorf("insert review event: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return ReviewResult{}, fmt.Errorf("commit review transaction: %w", err)
	}

	return ReviewResult{
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
	}, nil
}
func (r *Repository) Progress(ctx context.Context, userID string, timezoneOffsetMinutes int) (ProgressSummary, error) {
	timezoneOffsetMinutes = clampOffset(timezoneOffsetMinutes)
	localNow := time.Now().UTC().Add(-time.Duration(timezoneOffsetMinutes) * time.Minute)
	weekStartLocal := startOfWeek(dateOnly(localNow))
	weekStartUTC := weekStartLocal.Add(time.Duration(timezoneOffsetMinutes) * time.Minute)
	nextWeekUTC := weekStartUTC.AddDate(0, 0, 7)
	result := ProgressSummary{
		EventSchemaVersion: 2,
		Weekly: WeeklyProgressEvidence{
			Trend:      make([]DailyRecallEvidence, 0, 7),
			WeakTopics: make([]TopicEvidence, 0, 3),
		},
		Processes: LearningProcessEvidence{
			WeekStart: weekStartLocal.Format("2006-01-02"),
			WeekEnd:   weekStartLocal.AddDate(0, 0, 6).Format("2006-01-02"),
		},
	}

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
		select count(*)::int
		from user_words
		where user_id = $1::uuid
		  and status <> 'new'
		  and due_at <= now()
	`, userID).Scan(&result.Processes.ReviewBacklog); err != nil {
		return ProgressSummary{}, fmt.Errorf("query process review backlog: %w", err)
	}

	if err := r.pool.QueryRow(ctx, `
		select count(distinct word_id) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2
		             and session_kind = 'study'
		             and selection_reason = 'new'
		             and effective_rating = 'known'
		             and (correct is true or correct is null)
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2
		             and session_kind = 'review'
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2
		             and session_kind = 'remediation'
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2
		             and session_kind = 'review'
		             and effective_rating = 'again'
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2
		             and session_kind = 'review'
		             and answer_mode in ('recall', 'listening')
		             and correct is not null
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2
		             and session_kind = 'review'
		             and answer_mode in ('recall', 'listening')
		             and correct is true
		       )::int
		from review_events
		where user_id = $1::uuid
	`, userID, weekStartUTC, nextWeekUTC).Scan(
		&result.Processes.NewLearned,
		&result.Processes.DueReviewed,
		&result.Processes.RemediationReviewed,
		&result.Processes.Lapses,
		&result.Processes.Retention.Attempts,
		&result.Processes.Retention.Successful,
	); err != nil {
		return ProgressSummary{}, fmt.Errorf("query learning process evidence: %w", err)
	}
	result.Processes.Retention.Rate = percentage(
		result.Processes.Retention.Successful,
		result.Processes.Retention.Attempts,
	)

	if err := r.pool.QueryRow(ctx, `
		with events as (
			select answer_mode, correct, grade, event_schema_version,
			       (reviewed_at - make_interval(mins => $2))::date =
			       (now() - make_interval(mins => $2))::date as is_today
			from review_events
			where user_id = $1::uuid
		)
		select count(*) filter (where is_today)::int,
		       count(*) filter (where is_today and event_schema_version = 2 and answer_mode in ('recall', 'choice'))::int,
		       count(*) filter (where is_today and event_schema_version = 2 and answer_mode in ('recall', 'choice') and correct is true)::int,
		       count(*) filter (where is_today and (
		           (event_schema_version = 2 and answer_mode in ('recall', 'choice') and correct is true)
		           or (event_schema_version = 1 and grade >= 4)
		       ))::int,
		       count(*)::int,
		       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'study')::int,
		       0::int,
		       count(*) filter (where event_schema_version = 2 and answer_mode = 'study')::int,
		       0::int,
		       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'recall')::int,
		       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'recall' and correct is true)::int,
		       count(*) filter (where event_schema_version = 2 and answer_mode = 'recall')::int,
		       count(*) filter (where event_schema_version = 2 and answer_mode = 'recall' and correct is true)::int,
		       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'choice')::int,
		       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'choice' and correct is true)::int,
		       count(*) filter (where event_schema_version = 2 and answer_mode = 'choice')::int,
		       count(*) filter (where event_schema_version = 2 and answer_mode = 'choice' and correct is true)::int,
		       count(*) filter (where is_today and event_schema_version = 1)::int,
		       count(*) filter (where is_today and event_schema_version = 1 and grade >= 4)::int,
		       count(*) filter (where event_schema_version = 1)::int,
		       count(*) filter (where event_schema_version = 1 and grade >= 4)::int
		from events
	`, userID, timezoneOffsetMinutes).Scan(
		&result.ReviewsToday,
		&result.ObjectiveReviewsToday,
		&result.ObjectiveSuccessfulToday,
		&result.SuccessfulToday,
		&result.ReviewsTotal,
		&result.Modes.Study.AttemptsToday,
		&result.Modes.Study.SuccessfulToday,
		&result.Modes.Study.AttemptsTotal,
		&result.Modes.Study.SuccessfulTotal,
		&result.Modes.Recall.AttemptsToday,
		&result.Modes.Recall.SuccessfulToday,
		&result.Modes.Recall.AttemptsTotal,
		&result.Modes.Recall.SuccessfulTotal,
		&result.Modes.Choice.AttemptsToday,
		&result.Modes.Choice.SuccessfulToday,
		&result.Modes.Choice.AttemptsTotal,
		&result.Modes.Choice.SuccessfulTotal,
		&result.Modes.Legacy.AttemptsToday,
		&result.Modes.Legacy.SuccessfulToday,
		&result.Modes.Legacy.AttemptsTotal,
		&result.Modes.Legacy.SuccessfulTotal,
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
		  and current_review.event_schema_version = 2
		  and current_review.answer_mode = 'recall'
		  and (current_review.session_kind = 'review' or current_review.session_kind is null)
		  and current_review.correct is true
		  and current_review.grade = 5
		  and current_review.reviewed_at >= bounds.week_start
		  and exists (
			select 1
			from review_events previous_review
			where previous_review.user_id = current_review.user_id
			  and previous_review.word_id = current_review.word_id
			  and previous_review.event_schema_version = 2
			  and previous_review.answer_mode = 'recall'
			  and (previous_review.session_kind = 'review' or previous_review.session_kind is null)
			  and previous_review.correct is true
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

	if err := r.populateWeeklyEvidence(
		ctx,
		userID,
		timezoneOffsetMinutes,
		weekStartLocal,
		weekStartUTC,
		nextWeekUTC,
		&result,
	); err != nil {
		return ProgressSummary{}, err
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

	result.CurrentStreak, result.LongestStreak = calculateStreaks(days, dateOnly(localNow))
	return result, nil
}

func (r *Repository) populateWeeklyEvidence(
	ctx context.Context,
	userID string,
	timezoneOffsetMinutes int,
	weekStartLocal time.Time,
	weekStartUTC time.Time,
	nextWeekUTC time.Time,
	result *ProgressSummary,
) error {
	previousWeekUTC := weekStartUTC.AddDate(0, 0, -7)
	var activeMilliseconds int64
	if err := r.pool.QueryRow(ctx, `
		select count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2 and answer_mode = 'recall'
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2 and answer_mode = 'recall' and correct is true
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $4 and reviewed_at < $2
		             and event_schema_version = 2 and answer_mode = 'recall'
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $4 and reviewed_at < $2
		             and event_schema_version = 2 and answer_mode = 'recall' and correct is true
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2 and answer_mode = 'choice'
		       )::int,
		       count(*) filter (
		           where reviewed_at >= $2 and reviewed_at < $3
		             and event_schema_version = 2 and answer_mode = 'choice' and correct is true
		       )::int,
		       count(*) filter (where reviewed_at >= $2 and reviewed_at < $3)::int,
		       coalesce(sum(least(coalesce(response_ms, 0), 300000))
		           filter (where reviewed_at >= $2 and reviewed_at < $3), 0)::bigint
		from review_events
		where user_id = $1::uuid
		  and reviewed_at >= $4
		  and reviewed_at < $3
	`, userID, weekStartUTC, nextWeekUTC, previousWeekUTC).Scan(
		&result.Weekly.RecallAttempts,
		&result.Weekly.RecallSuccessful,
		&result.Weekly.PreviousRecallAttempts,
		&result.Weekly.PreviousRecallSuccessful,
		&result.Weekly.ChoiceAttempts,
		&result.Weekly.ChoiceSuccessful,
		&result.Weekly.Reviews,
		&activeMilliseconds,
	); err != nil {
		return fmt.Errorf("query weekly review evidence: %w", err)
	}
	result.Weekly.RecallRate = percentage(result.Weekly.RecallSuccessful, result.Weekly.RecallAttempts)
	result.Weekly.PreviousRecallRate = percentage(result.Weekly.PreviousRecallSuccessful, result.Weekly.PreviousRecallAttempts)
	result.Weekly.ChoiceRate = percentage(result.Weekly.ChoiceSuccessful, result.Weekly.ChoiceAttempts)
	if activeMilliseconds > 0 {
		result.Weekly.ActiveMinutes = int((activeMilliseconds + 59999) / 60000)
	}

	if err := r.pool.QueryRow(ctx, `
		select count(*)::int
		from lesson_sessions
		where user_id = $1::uuid
		  and status = 'completed'
		  and completed_at >= $2
		  and completed_at < $3
	`, userID, weekStartUTC, nextWeekUTC).Scan(&result.Weekly.Lessons); err != nil {
		return fmt.Errorf("query weekly completed lessons: %w", err)
	}

	trendRows, err := r.pool.Query(ctx, `
		with days as (
			select generate_series(0, 6) as day_index
		)
		select $2::timestamptz + day_index * interval '1 day' as day_start,
		       count(review_event.id) filter (
		           where review_event.event_schema_version = 2
		             and review_event.answer_mode = 'recall'
		       )::int,
		       count(review_event.id) filter (
		           where review_event.event_schema_version = 2
		             and review_event.answer_mode = 'recall'
		             and review_event.correct is true
		       )::int
		from days
		left join review_events review_event
		  on review_event.user_id = $1::uuid
		 and review_event.reviewed_at >= $2::timestamptz + day_index * interval '1 day'
		 and review_event.reviewed_at < $2::timestamptz + (day_index + 1) * interval '1 day'
		group by day_index
		order by day_index
	`, userID, weekStartUTC)
	if err != nil {
		return fmt.Errorf("query weekly recall trend: %w", err)
	}
	defer trendRows.Close()

	result.Weekly.Trend = make([]DailyRecallEvidence, 0, 7)
	for trendRows.Next() {
		var dayStart time.Time
		var point DailyRecallEvidence
		if err := trendRows.Scan(&dayStart, &point.Attempts, &point.Successful); err != nil {
			return fmt.Errorf("scan weekly recall trend: %w", err)
		}
		point.Date = dayStart.Add(-time.Duration(timezoneOffsetMinutes) * time.Minute).Format("2006-01-02")
		point.Rate = percentage(point.Successful, point.Attempts)
		result.Weekly.Trend = append(result.Weekly.Trend, point)
	}
	if err := trendRows.Err(); err != nil {
		return fmt.Errorf("iterate weekly recall trend: %w", err)
	}

	weakRows, err := r.pool.Query(ctx, `
		select word.topic,
		       count(*)::int,
		       count(*) filter (where review_event.correct is true)::int,
		       count(*) filter (where review_event.correct is not true)::int
		from review_events review_event
		join words word on word.id = review_event.word_id
		where review_event.user_id = $1::uuid
		  and review_event.reviewed_at >= $2
		  and review_event.reviewed_at < $3
		  and review_event.event_schema_version = 2
		  and review_event.answer_mode = 'recall'
		group by word.topic
		having count(*) filter (where review_event.correct is not true) > 0
		order by count(*) filter (where review_event.correct is not true) desc,
		         count(*) filter (where review_event.correct is true)::float / count(*) asc,
		         count(*) desc,
		         word.topic
		limit 3
	`, userID, weekStartUTC, nextWeekUTC)
	if err != nil {
		return fmt.Errorf("query weak recall topics: %w", err)
	}
	defer weakRows.Close()

	result.Weekly.WeakTopics = make([]TopicEvidence, 0, 3)
	for weakRows.Next() {
		var topic TopicEvidence
		if err := weakRows.Scan(&topic.Topic, &topic.Attempts, &topic.Successful, &topic.Errors); err != nil {
			return fmt.Errorf("scan weak recall topic: %w", err)
		}
		topic.Rate = percentage(topic.Successful, topic.Attempts)
		result.Weekly.WeakTopics = append(result.Weekly.WeakTopics, topic)
	}
	if err := weakRows.Err(); err != nil {
		return fmt.Errorf("iterate weak recall topics: %w", err)
	}

	var strong TopicEvidence
	if err := r.pool.QueryRow(ctx, `
		select word.topic,
		       count(*)::int,
		       count(*) filter (where review_event.correct is true)::int,
		       count(*) filter (where review_event.correct is not true)::int
		from review_events review_event
		join words word on word.id = review_event.word_id
		where review_event.user_id = $1::uuid
		  and review_event.reviewed_at >= $2
		  and review_event.reviewed_at < $3
		  and review_event.event_schema_version = 2
		  and review_event.answer_mode = 'recall'
		group by word.topic
		having count(*) >= 2
		order by count(*) filter (where review_event.correct is true)::float / count(*) desc,
		         count(*) desc,
		         word.topic
		limit 1
	`, userID, weekStartUTC, nextWeekUTC).Scan(
		&strong.Topic,
		&strong.Attempts,
		&strong.Successful,
		&strong.Errors,
	); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("query strong recall topic: %w", err)
	} else if err == nil {
		strong.Rate = percentage(strong.Successful, strong.Attempts)
		result.Weekly.StrongTopic = &strong
	}

	result.Weekly.WeekStart = weekStartLocal.Format("2006-01-02")
	result.Weekly.WeekEnd = weekStartLocal.AddDate(0, 0, 6).Format("2006-01-02")
	return nil
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

func startOfWeek(day time.Time) time.Time {
	daysSinceMonday := (int(day.Weekday()) + 6) % 7
	return day.AddDate(0, 0, -daysSinceMonday)
}

func percentage(successful, attempts int) int {
	if attempts <= 0 {
		return 0
	}
	return (successful*100 + attempts/2) / attempts
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
