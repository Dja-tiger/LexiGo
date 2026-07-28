package moderation

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/learning"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (repository *Repository) UserEmail(ctx context.Context, userID string) (string, error) {
	var email string
	if err := repository.pool.QueryRow(ctx,
		"select email from users where id = $1::uuid",
		userID,
	).Scan(&email); err != nil {
		return "", fmt.Errorf("resolve moderation identity: %w", err)
	}
	return strings.ToLower(strings.TrimSpace(email)), nil
}

func (repository *Repository) List(ctx context.Context, filter ListFilter) (ListResponse, error) {
	var cursorCreatedAt *time.Time
	var cursorID int64
	if filter.Cursor != nil {
		cursorCreatedAt = &filter.Cursor.CreatedAt
		cursorID = filter.Cursor.ID
	}

	rows, err := repository.pool.Query(ctx, `
		select suggestion.id,
		       suggestion.version,
		       suggestion.status,
		       suggestion.exercise_kind,
		       suggestion.submitted_answer,
		       suggestion.normalized_answer,
		       suggestion.created_at,
		       suggestion.updated_at,
		       suggestion.decided_at,
		       coalesce(suggestion.decision_reason, ''),
		       coalesce(suggestion.decision_comment, ''),
		       word.id,
		       word.kind,
		       word.lemma,
		       word.translation,
		       word.cloze_answer,
		       coalesce(word.accepted_answers, '{}'::text[]),
		       review.id,
		       review.answer_mode,
		       review.rating,
		       review.effective_rating,
		       review.correct,
		       review.judgement_reason,
		       review.reviewed_at
		from answer_suggestions suggestion
		join words word on word.id = suggestion.word_id
		join review_events review on review.id = suggestion.review_event_id
		where suggestion.status = $1
		  and ($2 = '' or suggestion.exercise_kind = $2)
		  and (
		      $3 = ''
		      or position(lower($3) in lower(word.lemma)) > 0
		      or position(lower($3) in lower(word.translation)) > 0
		  )
		  and ($4::timestamptz is null or suggestion.created_at < $4)
		  and (
		      $5::timestamptz is null
		      or (suggestion.created_at, suggestion.id) > ($5, $6)
		  )
		order by suggestion.created_at, suggestion.id
		limit $7
	`, filter.Status, filter.ExerciseKind, filter.ItemQuery, filter.CreatedBefore,
		cursorCreatedAt, cursorID, filter.Limit+1)
	if err != nil {
		return ListResponse{}, fmt.Errorf("query moderation queue: %w", err)
	}
	defer rows.Close()

	items := make([]SuggestionContext, 0, filter.Limit+1)
	for rows.Next() {
		var item SuggestionContext
		if err := rows.Scan(
			&item.ID,
			&item.Version,
			&item.Status,
			&item.ExerciseKind,
			&item.SubmittedAnswer,
			&item.NormalizedAnswer,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.DecidedAt,
			&item.DecisionReason,
			&item.DecisionComment,
			&item.Item.ID,
			&item.Item.Kind,
			&item.Item.Lemma,
			&item.Item.Translation,
			&item.Item.ClozeAnswer,
			&item.Item.AcceptedAnswers,
			&item.Review.ID,
			&item.Review.AnswerMode,
			&item.Review.Rating,
			&item.Review.EffectiveRating,
			&item.Review.Correct,
			&item.Review.JudgementReason,
			&item.Review.ReviewedAt,
		); err != nil {
			return ListResponse{}, fmt.Errorf("scan moderation queue: %w", err)
		}
		if item.Item.AcceptedAnswers == nil {
			item.Item.AcceptedAnswers = []string{}
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return ListResponse{}, fmt.Errorf("iterate moderation queue: %w", err)
	}

	response := ListResponse{Items: items}
	if len(items) > filter.Limit {
		last := items[filter.Limit-1]
		response.Items = items[:filter.Limit]
		response.NextCursor, err = EncodeCursor(Cursor{CreatedAt: last.CreatedAt, ID: last.ID})
		if err != nil {
			return ListResponse{}, fmt.Errorf("encode moderation cursor: %w", err)
		}
	}
	return response, nil
}

func (repository *Repository) Metrics(
	ctx context.Context,
	pendingCutoff time.Time,
	decidedCutoff time.Time,
) (Metrics, error) {
	var metrics Metrics
	if err := repository.pool.QueryRow(ctx, `
		select count(*) filter (where status = 'pending')::bigint,
		       min(created_at) filter (where status = 'pending'),
		       count(*) filter (where status = 'accepted')::bigint,
		       count(*) filter (where status = 'rejected')::bigint,
		       count(*) filter (
		           where status = 'pending' and created_at < $1
		       )::bigint,
		       count(*) filter (
		           where status in ('accepted', 'rejected') and decided_at < $2
		       )::bigint
		from answer_suggestions
	`, pendingCutoff, decidedCutoff).Scan(
		&metrics.PendingCount,
		&metrics.OldestPendingAt,
		&metrics.AcceptedCount,
		&metrics.RejectedCount,
		&metrics.ExpiredPendingCount,
		&metrics.ExpiredDecidedCount,
	); err != nil {
		return Metrics{}, fmt.Errorf("query moderation metrics: %w", err)
	}
	terminal := metrics.AcceptedCount + metrics.RejectedCount
	if terminal > 0 {
		metrics.AcceptanceRatePercent = float64(metrics.AcceptedCount) * 100 / float64(terminal)
	}
	if metrics.OldestPendingAt != nil {
		age := time.Since(*metrics.OldestPendingAt)
		if age > 0 {
			metrics.OldestPendingAgeSecs = int64(age.Seconds())
		}
	}
	return metrics, nil
}

func (repository *Repository) Decide(
	ctx context.Context,
	actorUserID string,
	suggestionID int64,
	request DecisionRequest,
) (DecisionResult, error) {
	tx, err := repository.pool.Begin(ctx)
	if err != nil {
		return DecisionResult{}, fmt.Errorf("begin moderation decision: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var status, submittedAnswer, wordKind, translation, clozeAnswer string
	var version int64
	var wordID int64
	var acceptedAnswers []string
	if err := tx.QueryRow(ctx, `
		select suggestion.status,
		       suggestion.version,
		       suggestion.word_id,
		       suggestion.submitted_answer,
		       word.kind,
		       word.translation,
		       word.cloze_answer,
		       coalesce(word.accepted_answers, '{}'::text[])
		from answer_suggestions suggestion
		join words word on word.id = suggestion.word_id
		where suggestion.id = $1
		for update of suggestion, word
	`, suggestionID).Scan(
		&status,
		&version,
		&wordID,
		&submittedAnswer,
		&wordKind,
		&translation,
		&clozeAnswer,
		&acceptedAnswers,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DecisionResult{}, ErrNotFound
		}
		return DecisionResult{}, fmt.Errorf("lock moderation decision: %w", err)
	}
	if status != "pending" || version != request.ExpectedVersion {
		return DecisionResult{}, ErrVersionConflict
	}

	previousAnswers := make([]string, len(acceptedAnswers))
	copy(previousAnswers, acceptedAnswers)
	answerAdded := false
	if request.Decision == "accepted" {
		alreadyAccepted, _, _ := learning.JudgeSubmittedAnswer(learning.AnswerDefinition{
			Kind:            wordKind,
			Translation:     translation,
			ClozeAnswer:     clozeAnswer,
			AcceptedAnswers: acceptedAnswers,
		}, submittedAnswer)
		if !alreadyAccepted {
			acceptedAnswers = append(acceptedAnswers, strings.TrimSpace(submittedAnswer))
			answerAdded = true
			if _, err := tx.Exec(ctx, `
				update words
				set accepted_answers = $2,
				    updated_at = now()
				where id = $1
			`, wordID, acceptedAnswers); err != nil {
				return DecisionResult{}, fmt.Errorf("update accepted answers: %w", err)
			}
		}
	}

	now := time.Now().UTC()
	var result DecisionResult
	if err := tx.QueryRow(ctx, `
		update answer_suggestions
		set status = $2,
		    version = version + 1,
		    decided_at = $3,
		    decided_by = $4::uuid,
		    decision_reason = $5,
		    decision_comment = nullif($6, ''),
		    updated_at = $3
		where id = $1 and status = 'pending' and version = $7
		returning id, status, version, decision_reason,
		          coalesce(decision_comment, ''), decided_at
	`, suggestionID, request.Decision, now, actorUserID, request.Reason,
		request.Comment, request.ExpectedVersion).Scan(
		&result.ID,
		&result.Status,
		&result.Version,
		&result.DecisionReason,
		&result.DecisionComment,
		&result.DecidedAt,
	); err != nil {
		return DecisionResult{}, fmt.Errorf("persist moderation decision: %w", err)
	}
	result.AnswerAdded = answerAdded

	if _, err := tx.Exec(ctx, `
		insert into answer_suggestion_audit(
			suggestion_id,
			actor_user_id,
			action,
			reason,
			comment,
			previous_version,
			resulting_version,
			previous_accepted_answers,
			resulting_accepted_answers,
			created_at
		) values ($1, $2::uuid, $3, $4, nullif($5, ''), $6, $7, $8, $9, $10)
	`, suggestionID, actorUserID, request.Decision, request.Reason,
		request.Comment, version, result.Version, previousAnswers, acceptedAnswers, now); err != nil {
		return DecisionResult{}, fmt.Errorf("insert moderation audit: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return DecisionResult{}, fmt.Errorf("commit moderation decision: %w", err)
	}
	return result, nil
}
