package learning

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// ReviewWordTx applies the canonical scheduler transition and writes the same
// schema-v2 review event as ReviewWord, but leaves transaction ownership to the
// caller. Cross-domain workflows use it when their own persistence must commit
// atomically with the review event.
func (r *Repository) ReviewWordTx(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	wordID int64,
	request ReviewRequest,
) (ReviewResult, error) {
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
	return r.applyReviewTx(ctx, tx, userID, wordID, request, state, assessment)
}

// ReviewWordTxWithAssessment is the narrow cross-domain entrypoint for a
// deterministic server judge whose evidence cannot be represented by the
// translation/cloze AnswerDefinition used by ordinary cards. The caller owns
// the surrounding transaction and must provide a complete server assessment;
// scheduler policy and review-event persistence remain centralized here.
func (r *Repository) ReviewWordTxWithAssessment(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	wordID int64,
	request ReviewRequest,
	assessment ReviewAssessment,
) (ReviewResult, error) {
	if err := validateTrustedReviewAssessment(request, assessment); err != nil {
		return ReviewResult{}, err
	}

	var state ReviewState
	if err := tx.QueryRow(ctx, `
		select status,
		       easiness::float8,
		       interval_days,
		       repetitions,
		       due_at
		from user_words
		where user_id = $1::uuid and word_id = $2
		for update
	`, userID, wordID).Scan(
		&state.Status,
		&state.Easiness,
		&state.IntervalDays,
		&state.Repetitions,
		&state.DueAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReviewResult{}, ErrWordNotFound
		}
		return ReviewResult{}, fmt.Errorf("lock user learning item: %w", err)
	}

	return r.applyReviewTx(ctx, tx, userID, wordID, request, state, assessment)
}

func validateTrustedReviewAssessment(request ReviewRequest, assessment ReviewAssessment) error {
	if !request.AnswerMode.Objective() {
		return fmt.Errorf("trusted review assessment requires an objective answer mode")
	}
	if request.AnswerRevealed != nil && *request.AnswerRevealed {
		return fmt.Errorf("trusted review assessment cannot reveal the answer before judgement")
	}
	if assessment.JudgementSource != JudgementSourceServer {
		return fmt.Errorf("trusted review assessment requires server judgement source")
	}
	if strings.TrimSpace(assessment.JudgementReason) == "" {
		return fmt.Errorf("trusted review assessment requires a judgement reason")
	}
	if assessment.Correct == nil {
		return fmt.Errorf("trusted review assessment requires objective correctness")
	}
	if assessment.RequestedRating != request.Rating {
		return fmt.Errorf("trusted review assessment requested rating does not match review request")
	}
	if assessment.SubmittedAnswer != nil && !SubmittedAnswerWithinLimit(*assessment.SubmittedAnswer) {
		return fmt.Errorf("trusted review assessment submitted answer exceeds the supported limit")
	}
	if *assessment.Correct {
		if assessment.EffectiveRating != request.Rating {
			return fmt.Errorf("successful trusted review assessment must preserve the requested rating")
		}
		if strings.TrimSpace(assessment.MatchedAnswer) == "" {
			return fmt.Errorf("successful trusted review assessment requires matched evidence")
		}
		return nil
	}
	if assessment.EffectiveRating != RatingAgain {
		return fmt.Errorf("failed trusted review assessment must apply rating again")
	}
	if strings.TrimSpace(assessment.MatchedAnswer) != "" {
		return fmt.Errorf("failed trusted review assessment cannot contain matched evidence")
	}
	return nil
}

func (r *Repository) applyReviewTx(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	wordID int64,
	request ReviewRequest,
	state ReviewState,
	assessment ReviewAssessment,
) (ReviewResult, error) {
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
