package learning

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) populateProgressExtensions(
	ctx context.Context,
	userID string,
	timezoneOffsetMinutes int,
	result *ProgressSummary,
) error {
	if err := r.populateWeakPartOfSpeechEvidence(ctx, userID, timezoneOffsetMinutes, result); err != nil {
		return err
	}
	return r.populateScenarioProgress(ctx, userID, timezoneOffsetMinutes, result)
}

func (r *Repository) populateScenarioProgress(
	ctx context.Context,
	userID string,
	timezoneOffsetMinutes int,
	result *ProgressSummary,
) error {
	timezoneOffsetMinutes = clampOffset(timezoneOffsetMinutes)
	localNow := time.Now().UTC().Add(-time.Duration(timezoneOffsetMinutes) * time.Minute)
	weekStartLocal := startOfWeek(dateOnly(localNow))
	weekStartUTC := weekStartLocal.Add(time.Duration(timezoneOffsetMinutes) * time.Minute)
	nextWeekUTC := weekStartUTC.AddDate(0, 0, 7)

	if err := r.pool.QueryRow(ctx, `
		select count(*) filter (where status = 'completed')::int,
		       count(*) filter (
		           where status = 'completed'
		             and completed_at >= $2
		             and completed_at < $3
		       )::int
		from scenario_attempts
		where user_id = $1::uuid
	`, userID, weekStartUTC, nextWeekUTC).Scan(
		&result.Scenarios.CompletedTotal,
		&result.Scenarios.CompletedThisWeek,
	); err != nil {
		return fmt.Errorf("query Scenario completion progress: %w", err)
	}

	var recommendation ScenarioRecommendation
	err := r.pool.QueryRow(ctx, `
		with attempt_history as (
			select attempt.scenario_slug,
			       count(*) filter (where attempt.status = 'completed')::int as completed_count,
			       max(attempt.completed_at) filter (where attempt.status = 'completed') as last_completed_at,
			       count(*) filter (where attempt.status in ('active', 'paused'))::int as open_count,
			       bool_or(attempt.status = 'active') filter (where attempt.status in ('active', 'paused')) as has_active_attempt,
			       max(attempt.updated_at) filter (where attempt.status in ('active', 'paused')) as open_updated_at
			from scenario_attempts attempt
			where attempt.user_id = $1::uuid
			group by attempt.scenario_slug
		), ranked as (
			select scenario.slug,
			       scenario.scenario_type,
			       scenario.title,
			       scenario.estimated_minutes,
			       coalesce(history.completed_count, 0) as completed_count,
			       history.last_completed_at,
			       case
			           when coalesce(history.open_count, 0) > 0 then 'resume_in_progress'
			           when coalesce(history.completed_count, 0) = 0 then 'first_uncompleted'
			           else 'least_recently_completed'
			       end as reason,
			       case
			           when coalesce(history.open_count, 0) > 0 then 'resume'
			           else 'start'
			       end as action,
			       case scenario.scenario_type
			           when 'incident' then 1
			           when 'troubleshooting' then 2
			           when 'architecture-review' then 3
			           when 'data-pipeline' then 4
			           when 'release' then 5
			           when 'status-update' then 6
			           else 99
			       end as catalog_order
			from scenarios scenario
			left join attempt_history history on history.scenario_slug = scenario.slug
			where scenario.is_active is true
			order by
				case
					when coalesce(history.open_count, 0) > 0 then 0
					when coalesce(history.completed_count, 0) = 0 then 1
					else 2
				end,
				case when coalesce(history.has_active_attempt, false) then 0 else 1 end,
				history.open_updated_at desc nulls last,
				case
					when coalesce(history.open_count, 0) = 0
					 and coalesce(history.completed_count, 0) = 0
					then case scenario.scenario_type
						when 'incident' then 1
						when 'troubleshooting' then 2
						when 'architecture-review' then 3
						when 'data-pipeline' then 4
						when 'release' then 5
						when 'status-update' then 6
						else 99
					end
				end asc nulls last,
				case
					when coalesce(history.open_count, 0) = 0
					 and coalesce(history.completed_count, 0) > 0
					then history.last_completed_at
				end asc nulls last,
				coalesce(history.completed_count, 0),
				catalog_order,
				scenario.slug
			limit 1
		)
		select slug,
		       scenario_type,
		       title,
		       estimated_minutes,
		       reason,
		       action,
		       completed_count,
		       last_completed_at
		from ranked
	`, userID).Scan(
		&recommendation.Slug,
		&recommendation.Type,
		&recommendation.Title,
		&recommendation.EstimatedMinutes,
		&recommendation.Reason,
		&recommendation.Action,
		&recommendation.CompletedCount,
		&recommendation.LastCompletedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		result.Scenarios.Recommendation = nil
		return nil
	}
	if err != nil {
		return fmt.Errorf("query Scenario progress recommendation: %w", err)
	}
	result.Scenarios.Recommendation = &recommendation
	return nil
}
