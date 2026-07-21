package learning

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
	"github.com/jackc/pgx/v5"
)

var (
	ErrSuggestionReviewNotFound = errors.New("rejected review event was not found")
	ErrSuggestionKindMismatch   = errors.New("answer suggestion exercise kind does not match item")
)

type AnswerSuggestionRequest struct {
	ReviewEventID   int64  `json:"reviewEventId"`
	ExerciseKind    string `json:"exerciseKind"`
	SubmittedAnswer string `json:"submittedAnswer"`
}

type AnswerSuggestion struct {
	ID              int64     `json:"id"`
	WordID          int64     `json:"wordId"`
	ReviewEventID   int64     `json:"reviewEventId"`
	ExerciseKind    string    `json:"exerciseKind"`
	SubmittedAnswer string    `json:"submittedAnswer"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
}

func validExerciseKind(value string) bool {
	return value == "translation" || value == "cloze"
}

func expectedExerciseKind(wordKind string) string {
	if wordKind == "phrase" {
		return "cloze"
	}
	return "translation"
}

func (r *Repository) SubmitAnswerSuggestion(
	ctx context.Context,
	userID string,
	wordID int64,
	request AnswerSuggestionRequest,
) (AnswerSuggestion, error) {
	normalized := NormalizeSubmittedAnswer(request.SubmittedAnswer)
	if normalized == "" {
		return AnswerSuggestion{}, ErrSuggestionReviewNotFound
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return AnswerSuggestion{}, fmt.Errorf("begin answer suggestion transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var wordKind string
	if err := tx.QueryRow(ctx, `
		select word.kind
		from user_words user_word
		join words word on word.id = user_word.word_id
		where user_word.user_id = $1::uuid and user_word.word_id = $2
	`, userID, wordID).Scan(&wordKind); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AnswerSuggestion{}, ErrWordNotFound
		}
		return AnswerSuggestion{}, fmt.Errorf("validate suggestion item: %w", err)
	}
	if expectedExerciseKind(wordKind) != request.ExerciseKind {
		return AnswerSuggestion{}, ErrSuggestionKindMismatch
	}

	var rejectedAnswer *string
	if err := tx.QueryRow(ctx, `
		select submitted_answer
		from review_events
		where id = $1
		  and user_id = $2::uuid
		  and word_id = $3
		  and correct is false
		  and judgement_source = 'server'
	`, request.ReviewEventID, userID, wordID).Scan(&rejectedAnswer); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AnswerSuggestion{}, ErrSuggestionReviewNotFound
		}
		return AnswerSuggestion{}, fmt.Errorf("validate rejected review event: %w", err)
	}
	if rejectedAnswer == nil || NormalizeSubmittedAnswer(*rejectedAnswer) != normalized {
		return AnswerSuggestion{}, ErrSuggestionReviewNotFound
	}

	var suggestion AnswerSuggestion
	if err := tx.QueryRow(ctx, `
		insert into answer_suggestions(
			user_id, word_id, review_event_id, exercise_kind,
			submitted_answer, normalized_answer
		) values ($1::uuid, $2, $3, $4, $5, $6)
		on conflict (user_id, word_id, exercise_kind, normalized_answer)
			where status = 'pending'
		do update set
			review_event_id = excluded.review_event_id,
			submitted_answer = excluded.submitted_answer,
			updated_at = now()
		returning id, word_id, review_event_id, exercise_kind, submitted_answer, status, created_at
	`, userID, wordID, request.ReviewEventID, request.ExerciseKind, strings.TrimSpace(request.SubmittedAnswer), normalized).Scan(
		&suggestion.ID,
		&suggestion.WordID,
		&suggestion.ReviewEventID,
		&suggestion.ExerciseKind,
		&suggestion.SubmittedAnswer,
		&suggestion.Status,
		&suggestion.CreatedAt,
	); err != nil {
		return AnswerSuggestion{}, fmt.Errorf("insert answer suggestion: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return AnswerSuggestion{}, fmt.Errorf("commit answer suggestion: %w", err)
	}
	return suggestion, nil
}

func (h *Handler) SubmitAnswerSuggestion(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	wordID, err := strconv.ParseInt(r.PathValue("wordID"), 10, 64)
	if err != nil || wordID <= 0 {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "learning item id must be a positive integer")
		return
	}

	var request AnswerSuggestionRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	request.SubmittedAnswer = strings.TrimSpace(request.SubmittedAnswer)
	if request.ReviewEventID <= 0 {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_review_event_id", "reviewEventId must be a positive integer")
		return
	}
	if !validExerciseKind(request.ExerciseKind) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_exercise_kind", "exerciseKind must be translation or cloze")
		return
	}
	if request.SubmittedAnswer == "" || !SubmittedAnswerWithinLimit(request.SubmittedAnswer) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_submitted_answer", "submittedAnswer must contain between 1 and 500 characters")
		return
	}

	suggestion, err := h.repository.SubmitAnswerSuggestion(r.Context(), userID, wordID, request)
	if err != nil {
		switch {
		case errors.Is(err, ErrWordNotFound):
			httpx.WriteError(w, http.StatusNotFound, "word_not_found", "learning item is not assigned to the current user")
		case errors.Is(err, ErrSuggestionReviewNotFound):
			httpx.WriteError(w, http.StatusConflict, "suggestion_review_not_found", "a matching server-rejected review event is required")
		case errors.Is(err, ErrSuggestionKindMismatch):
			httpx.WriteError(w, http.StatusUnprocessableEntity, "suggestion_kind_mismatch", "exerciseKind does not match the learning item")
		default:
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
		return
	}
	httpx.WriteJSON(w, http.StatusAccepted, suggestion)
}
