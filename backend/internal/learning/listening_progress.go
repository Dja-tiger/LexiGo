package learning

import (
	"context"
	"fmt"
)

// populateListeningProgress extends the existing Progress aggregate without
// changing the legacy base query. reviewsToday/reviewsTotal already count every
// persisted review event, including listening. This extension therefore adds
// only the listening-specific mode bucket and the objective/success counters
// that historically covered recall and choice.
func (r *Repository) populateListeningProgress(
	ctx context.Context,
	userID string,
	timezoneOffsetMinutes int,
	result *ProgressSummary,
) error {
	timezoneOffsetMinutes = clampOffset(timezoneOffsetMinutes)

	if err := r.pool.QueryRow(ctx, `
		with events as (
			select correct,
			       (reviewed_at - make_interval(mins => $2))::date =
			       (now() - make_interval(mins => $2))::date as is_today
			from review_events
			where user_id = $1::uuid
			  and event_schema_version = 2
			  and answer_mode = 'listening'
		)
		select count(*) filter (where is_today)::int,
		       count(*) filter (where is_today and correct is true)::int,
		       count(*)::int,
		       count(*) filter (where correct is true)::int
		from events
	`, userID, timezoneOffsetMinutes).Scan(
		&result.Modes.Listening.AttemptsToday,
		&result.Modes.Listening.SuccessfulToday,
		&result.Modes.Listening.AttemptsTotal,
		&result.Modes.Listening.SuccessfulTotal,
	); err != nil {
		return fmt.Errorf("query listening progress: %w", err)
	}

	// The base Progress query already includes listening in all-event counters
	// (reviewsToday/reviewsTotal), so only objective/successful aggregates need
	// extension here. Keeping this additive avoids double-counting.
	result.ObjectiveReviewsToday += result.Modes.Listening.AttemptsToday
	result.ObjectiveSuccessfulToday += result.Modes.Listening.SuccessfulToday
	result.SuccessfulToday += result.Modes.Listening.SuccessfulToday
	return nil
}
