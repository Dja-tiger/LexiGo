package scenarios

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/Dja-tiger/LexiGo/backend/internal/learning"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type queryer interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

type Repository struct {
	pool     *pgxpool.Pool
	learning *learning.Repository
}

func NewRepository(pool *pgxpool.Pool, learningRepository *learning.Repository) *Repository {
	return &Repository{pool: pool, learning: learningRepository}
}

func (r *Repository) List(ctx context.Context) ([]Scenario, error) {
	rows, err := r.pool.Query(ctx, `
		select scenario.slug,
		       scenario.scenario_type,
		       scenario.title,
		       scenario.summary,
		       scenario.user_role,
		       scenario.workplace_goal,
		       scenario.completion_criterion,
		       scenario.constraints,
		       scenario.requires_fact_hypothesis,
		       scenario.estimated_minutes,
		       scenario.version,
		       count(step.position)::int
		from scenarios scenario
		left join scenario_steps step on step.scenario_slug = scenario.slug
		where scenario.is_active is true
		group by scenario.slug
		order by case scenario.scenario_type
		             when 'incident' then 1
		             when 'troubleshooting' then 2
		             when 'architecture-review' then 3
		             when 'data-pipeline' then 4
		             when 'release' then 5
		             when 'status-update' then 6
		             else 99
		         end,
		         scenario.title
	`)
	if err != nil {
		return nil, fmt.Errorf("query scenario catalog: %w", err)
	}
	defer rows.Close()

	items := make([]Scenario, 0, 6)
	for rows.Next() {
		var item Scenario
		if err := rows.Scan(
			&item.Slug,
			&item.Type,
			&item.Title,
			&item.Summary,
			&item.UserRole,
			&item.WorkplaceGoal,
			&item.CompletionCriterion,
			&item.Constraints,
			&item.RequiresFactHypothesis,
			&item.EstimatedMinutes,
			&item.Version,
			&item.StepCount,
		); err != nil {
			return nil, fmt.Errorf("scan scenario catalog: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate scenario catalog: %w", err)
	}
	return items, nil
}

func (r *Repository) Detail(ctx context.Context, slug string) (Scenario, error) {
	return loadScenario(ctx, r.pool, slug)
}

func (r *Repository) Start(ctx context.Context, userID, slug string) (StartAttemptResponse, error) {
	scenario, err := loadScenario(ctx, r.pool, slug)
	if err != nil {
		return StartAttemptResponse{}, err
	}

	var attemptID string
	err = r.pool.QueryRow(ctx, `
		insert into scenario_attempts(user_id, scenario_slug, scenario_version)
		values ($1::uuid, $2, $3)
		on conflict (user_id, scenario_slug)
		    where status in ('active', 'paused')
		do nothing
		returning id::text
	`, userID, scenario.Slug, scenario.Version).Scan(&attemptID)
	resumed := false
	if errors.Is(err, pgx.ErrNoRows) {
		resumed = true
		err = r.pool.QueryRow(ctx, `
			select id::text
			from scenario_attempts
			where user_id = $1::uuid
			  and scenario_slug = $2
			  and status in ('active', 'paused')
			order by updated_at desc
			limit 1
		`, userID, scenario.Slug).Scan(&attemptID)
	}
	if err != nil {
		return StartAttemptResponse{}, fmt.Errorf("start scenario attempt: %w", err)
	}

	attempt, err := loadAttempt(ctx, r.pool, userID, attemptID)
	if err != nil {
		return StartAttemptResponse{}, err
	}
	return StartAttemptResponse{Attempt: attempt, Resumed: resumed}, nil
}

func (r *Repository) Attempt(ctx context.Context, userID, attemptID string) (Attempt, error) {
	return loadAttempt(ctx, r.pool, userID, attemptID)
}

func (r *Repository) Pause(ctx context.Context, userID, attemptID string, version int64) (Attempt, error) {
	return r.setStatus(ctx, userID, attemptID, version, "paused")
}

func (r *Repository) Resume(ctx context.Context, userID, attemptID string, version int64) (Attempt, error) {
	return r.setStatus(ctx, userID, attemptID, version, "active")
}

func (r *Repository) setStatus(
	ctx context.Context,
	userID string,
	attemptID string,
	version int64,
	desiredStatus string,
) (Attempt, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return Attempt{}, fmt.Errorf("begin scenario status transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var status string
	var currentVersion int64
	if err := tx.QueryRow(ctx, `
		select status, version
		from scenario_attempts
		where id = $1::uuid and user_id = $2::uuid
		for update
	`, attemptID, userID).Scan(&status, &currentVersion); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Attempt{}, ErrAttemptNotFound
		}
		return Attempt{}, fmt.Errorf("lock scenario attempt: %w", err)
	}
	if currentVersion != version {
		return Attempt{}, ErrAttemptConflict
	}
	if status == "completed" || status == "discarded" {
		return Attempt{}, ErrAttemptCompleted
	}
	if status != desiredStatus {
		if _, err := tx.Exec(ctx, `
			update scenario_attempts
			set status = $3,
			    version = version + 1,
			    updated_at = now()
			where id = $1::uuid and user_id = $2::uuid
		`, attemptID, userID, desiredStatus); err != nil {
			return Attempt{}, fmt.Errorf("update scenario attempt status: %w", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return Attempt{}, fmt.Errorf("commit scenario status transaction: %w", err)
	}
	return loadAttempt(ctx, r.pool, userID, attemptID)
}

func (r *Repository) SubmitStep(
	ctx context.Context,
	userID string,
	attemptID string,
	position int,
	request SubmitStepRequest,
	requestHash []byte,
) (SubmitStepResponse, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return SubmitStepResponse{}, fmt.Errorf("begin scenario step transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var scenarioSlug string
	var currentPosition int
	var status string
	var currentVersion int64
	var stepCount int
	if err := tx.QueryRow(ctx, `
		select attempt.scenario_slug,
		       attempt.current_position,
		       attempt.status,
		       attempt.version,
		       (select count(*)::int from scenario_steps where scenario_slug = attempt.scenario_slug)
		from scenario_attempts attempt
		where attempt.id = $1::uuid and attempt.user_id = $2::uuid
		for update
	`, attemptID, userID).Scan(
		&scenarioSlug,
		&currentPosition,
		&status,
		&currentVersion,
		&stepCount,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return SubmitStepResponse{}, ErrAttemptNotFound
		}
		return SubmitStepResponse{}, fmt.Errorf("lock scenario attempt for submission: %w", err)
	}

	var existingHash []byte
	var existingReviewJSON []byte
	err = tx.QueryRow(ctx, `
		select request_hash, review_response
		from scenario_attempt_steps
		where attempt_id = $1::uuid and submission_id = $2::uuid
	`, attemptID, request.SubmissionID).Scan(&existingHash, &existingReviewJSON)
	if err == nil {
		if !bytes.Equal(existingHash, requestHash) {
			return SubmitStepResponse{}, ErrAttemptConflict
		}
		var review learning.ReviewResult
		if err := json.Unmarshal(existingReviewJSON, &review); err != nil {
			return SubmitStepResponse{}, fmt.Errorf("decode stored scenario review response: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return SubmitStepResponse{}, fmt.Errorf("commit scenario replay transaction: %w", err)
		}
		attempt, err := loadAttempt(ctx, r.pool, userID, attemptID)
		if err != nil {
			return SubmitStepResponse{}, err
		}
		return SubmitStepResponse{
			Attempt:          attempt,
			Review:           review,
			IdempotentReplay: true,
		}, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return SubmitStepResponse{}, fmt.Errorf("query scenario submission idempotency: %w", err)
	}

	if currentVersion != request.AttemptVersion {
		return SubmitStepResponse{}, ErrAttemptConflict
	}
	switch status {
	case "paused":
		return SubmitStepResponse{}, ErrAttemptPaused
	case "completed", "discarded":
		return SubmitStepResponse{}, ErrAttemptCompleted
	case "active":
	default:
		return SubmitStepResponse{}, fmt.Errorf("unsupported scenario attempt status %q", status)
	}
	if position != currentPosition {
		return SubmitStepResponse{}, ErrStepOutOfOrder
	}

	var requiresFactHypothesis bool
	var minResponseCharacters int
	var reviewTarget ScenarioReviewTarget
	if err := tx.QueryRow(ctx, `
		select requires_fact_hypothesis,
		       min_response_characters,
		       review_word_id,
		       review_term
		from scenario_steps
		where scenario_slug = $1 and position = $2
	`, scenarioSlug, position).Scan(
		&requiresFactHypothesis,
		&minResponseCharacters,
		&reviewTarget.WordID,
		&reviewTarget.Term,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return SubmitStepResponse{}, ErrStepOutOfOrder
		}
		return SubmitStepResponse{}, fmt.Errorf("query scenario step contract: %w", err)
	}

	response := strings.TrimSpace(request.Response)
	if utf8.RuneCountInString(response) < minResponseCharacters {
		return SubmitStepResponse{}, ErrResponseTooShort
	}
	facts, hypotheses, err := normalizeEvidence(request.Facts, request.Hypotheses, requiresFactHypothesis)
	if err != nil {
		return SubmitStepResponse{}, err
	}

	if _, err := tx.Exec(ctx, `
		insert into user_words(user_id, word_id)
		values ($1::uuid, $2)
		on conflict (user_id, word_id) do nothing
	`, userID, reviewTarget.WordID); err != nil {
		return SubmitStepResponse{}, fmt.Errorf("enroll scenario review target: %w", err)
	}

	reviewRequest, assessment := buildScenarioReview(response, reviewTarget, request.Review)
	review, err := r.learning.ReviewWordTxWithAssessment(
		ctx,
		tx,
		userID,
		reviewTarget.WordID,
		reviewRequest,
		assessment,
	)
	if err != nil {
		return SubmitStepResponse{}, err
	}
	reviewJSON, err := json.Marshal(review)
	if err != nil {
		return SubmitStepResponse{}, fmt.Errorf("encode scenario review response: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into scenario_attempt_steps(
			attempt_id,
			position,
			submission_id,
			request_hash,
			response,
			facts,
			hypotheses,
			status,
			review_event_id,
			review_response,
			accepted_at
		) values (
			$1::uuid,
			$2,
			$3::uuid,
			$4,
			$5,
			$6,
			$7,
			'accepted',
			$8,
			$9::jsonb,
			now()
		)
	`,
		attemptID,
		position,
		request.SubmissionID,
		requestHash,
		response,
		facts,
		hypotheses,
		review.ReviewEventID,
		reviewJSON,
	); err != nil {
		return SubmitStepResponse{}, fmt.Errorf("insert scenario step submission: %w", err)
	}

	nextPosition := position + 1
	completed := nextPosition >= stepCount
	if _, err := tx.Exec(ctx, `
		update scenario_attempts
		set current_position = $3,
		    status = case when $4 then 'completed' else 'active' end,
		    version = version + 1,
		    updated_at = now(),
		    completed_at = case when $4 then now() else null end
		where id = $1::uuid and user_id = $2::uuid
	`, attemptID, userID, nextPosition, completed); err != nil {
		return SubmitStepResponse{}, fmt.Errorf("advance scenario attempt: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return SubmitStepResponse{}, fmt.Errorf("commit scenario step transaction: %w", err)
	}
	attempt, err := loadAttempt(ctx, r.pool, userID, attemptID)
	if err != nil {
		return SubmitStepResponse{}, err
	}
	return SubmitStepResponse{Attempt: attempt, Review: review}, nil
}

func loadScenario(ctx context.Context, database queryer, slug string) (Scenario, error) {
	var scenario Scenario
	if err := database.QueryRow(ctx, `
		select scenario.slug,
		       scenario.scenario_type,
		       scenario.title,
		       scenario.summary,
		       scenario.user_role,
		       scenario.workplace_goal,
		       scenario.completion_criterion,
		       scenario.constraints,
		       scenario.requires_fact_hypothesis,
		       scenario.estimated_minutes,
		       scenario.version,
		       (select count(*)::int from scenario_steps where scenario_slug = scenario.slug)
		from scenarios scenario
		where scenario.slug = $1 and scenario.is_active is true
	`, slug).Scan(
		&scenario.Slug,
		&scenario.Type,
		&scenario.Title,
		&scenario.Summary,
		&scenario.UserRole,
		&scenario.WorkplaceGoal,
		&scenario.CompletionCriterion,
		&scenario.Constraints,
		&scenario.RequiresFactHypothesis,
		&scenario.EstimatedMinutes,
		&scenario.Version,
		&scenario.StepCount,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Scenario{}, ErrScenarioNotFound
		}
		return Scenario{}, fmt.Errorf("query scenario detail: %w", err)
	}

	rows, err := database.Query(ctx, `
		select position,
		       step_kind,
		       title,
		       prompt,
		       production_outcome,
		       vocabulary,
		       review_word_id,
		       review_term,
		       requires_fact_hypothesis,
		       min_response_characters
		from scenario_steps
		where scenario_slug = $1
		order by position
	`, slug)
	if err != nil {
		return Scenario{}, fmt.Errorf("query scenario steps: %w", err)
	}
	defer rows.Close()

	scenario.Steps = make([]ScenarioStep, 0, scenario.StepCount)
	for rows.Next() {
		var step ScenarioStep
		if err := rows.Scan(
			&step.Position,
			&step.Kind,
			&step.Title,
			&step.Prompt,
			&step.ProductionOutcome,
			&step.Vocabulary,
			&step.ReviewTarget.WordID,
			&step.ReviewTarget.Term,
			&step.RequiresFactHypothesis,
			&step.MinResponseCharacters,
		); err != nil {
			return Scenario{}, fmt.Errorf("scan scenario step: %w", err)
		}
		scenario.Steps = append(scenario.Steps, step)
	}
	if err := rows.Err(); err != nil {
		return Scenario{}, fmt.Errorf("iterate scenario steps: %w", err)
	}
	return scenario, nil
}

func loadAttempt(ctx context.Context, database queryer, userID, attemptID string) (Attempt, error) {
	var attempt Attempt
	if err := database.QueryRow(ctx, `
		select attempt.id::text,
		       attempt.current_position,
		       attempt.status,
		       attempt.version,
		       attempt.started_at,
		       attempt.updated_at,
		       attempt.completed_at,
		       scenario.slug,
		       scenario.scenario_type,
		       scenario.title,
		       scenario.summary,
		       scenario.user_role,
		       scenario.workplace_goal,
		       scenario.completion_criterion,
		       scenario.constraints,
		       scenario.requires_fact_hypothesis,
		       scenario.estimated_minutes,
		       attempt.scenario_version,
		       (select count(*)::int from scenario_steps where scenario_slug = scenario.slug)
		from scenario_attempts attempt
		join scenarios scenario on scenario.slug = attempt.scenario_slug
		where attempt.id = $1::uuid and attempt.user_id = $2::uuid
	`, attemptID, userID).Scan(
		&attempt.ID,
		&attempt.CurrentPosition,
		&attempt.Status,
		&attempt.Version,
		&attempt.StartedAt,
		&attempt.UpdatedAt,
		&attempt.CompletedAt,
		&attempt.Scenario.Slug,
		&attempt.Scenario.Type,
		&attempt.Scenario.Title,
		&attempt.Scenario.Summary,
		&attempt.Scenario.UserRole,
		&attempt.Scenario.WorkplaceGoal,
		&attempt.Scenario.CompletionCriterion,
		&attempt.Scenario.Constraints,
		&attempt.Scenario.RequiresFactHypothesis,
		&attempt.Scenario.EstimatedMinutes,
		&attempt.Scenario.Version,
		&attempt.Scenario.StepCount,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Attempt{}, ErrAttemptNotFound
		}
		return Attempt{}, fmt.Errorf("query scenario attempt: %w", err)
	}

	rows, err := database.Query(ctx, `
		select position,
		       submission_id::text,
		       response,
		       facts,
		       hypotheses,
		       review_event_id,
		       accepted_at
		from scenario_attempt_steps
		where attempt_id = $1::uuid and status = 'accepted'
		order by position
	`, attemptID)
	if err != nil {
		return Attempt{}, fmt.Errorf("query completed scenario positions: %w", err)
	}
	defer rows.Close()

	attempt.CompletedPositions = make([]int, 0, attempt.Scenario.StepCount)
	for rows.Next() {
		var submission StepSubmission
		if err := rows.Scan(
			&submission.Position,
			&submission.SubmissionID,
			&submission.Response,
			&submission.Facts,
			&submission.Hypotheses,
			&submission.ReviewEventID,
			&submission.AcceptedAt,
		); err != nil {
			return Attempt{}, fmt.Errorf("scan completed scenario position: %w", err)
		}
		attempt.CompletedPositions = append(attempt.CompletedPositions, submission.Position)
		copy := submission
		attempt.LastSubmission = &copy
	}
	if err := rows.Err(); err != nil {
		return Attempt{}, fmt.Errorf("iterate completed scenario positions: %w", err)
	}

	if attempt.Status != "completed" && attempt.Status != "discarded" && attempt.CurrentPosition < attempt.Scenario.StepCount {
		var step ScenarioStep
		if err := database.QueryRow(ctx, `
			select position,
			       step_kind,
			       title,
			       prompt,
			       production_outcome,
			       vocabulary,
			       review_word_id,
			       review_term,
			       requires_fact_hypothesis,
			       min_response_characters
			from scenario_steps
			where scenario_slug = $1 and position = $2
		`, attempt.Scenario.Slug, attempt.CurrentPosition).Scan(
			&step.Position,
			&step.Kind,
			&step.Title,
			&step.Prompt,
			&step.ProductionOutcome,
			&step.Vocabulary,
			&step.ReviewTarget.WordID,
			&step.ReviewTarget.Term,
			&step.RequiresFactHypothesis,
			&step.MinResponseCharacters,
		); err != nil {
			return Attempt{}, fmt.Errorf("query current scenario step: %w", err)
		}
		attempt.CurrentStep = &step
	}
	return attempt, nil
}

func normalizeEvidence(facts, hypotheses []string, required bool) ([]string, []string, error) {
	normalizedFacts, factKeys := normalizeEvidenceList(facts)
	normalizedHypotheses, hypothesisKeys := normalizeEvidenceList(hypotheses)
	if required && (len(normalizedFacts) == 0 || len(normalizedHypotheses) == 0) {
		return nil, nil, ErrFactHypothesisRequired
	}
	for key := range factKeys {
		if _, exists := hypothesisKeys[key]; exists {
			return nil, nil, ErrFactHypothesisOverlap
		}
	}
	return normalizedFacts, normalizedHypotheses, nil
}

func normalizeEvidenceList(values []string) ([]string, map[string]struct{}) {
	result := make([]string, 0, len(values))
	keys := make(map[string]struct{}, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		key := strings.ToLower(trimmed)
		if _, exists := keys[key]; exists {
			continue
		}
		keys[key] = struct{}{}
		result = append(result, trimmed)
	}
	return result, keys
}
