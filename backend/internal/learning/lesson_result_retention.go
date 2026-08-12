package learning

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

var ErrCompletedLessonNotFound = errors.New("completed lesson is not owned by the user")

type LessonResultRecommendedAction string

type LessonResultSelectedAction string

const (
	LessonResultRecommendedNext LessonResultRecommendedAction = "next_lesson"
	LessonResultRecommendedDue  LessonResultRecommendedAction = "due_review"
	LessonResultRecommendedHome LessonResultRecommendedAction = "home"
	LessonResultRecommendedNone LessonResultRecommendedAction = "none"

	LessonResultSelectedNext     LessonResultSelectedAction = "next_lesson"
	LessonResultSelectedDue      LessonResultSelectedAction = "due_review"
	LessonResultSelectedHome     LessonResultSelectedAction = "home"
	LessonResultSelectedProgress LessonResultSelectedAction = "progress"
	LessonResultSelectedStay     LessonResultSelectedAction = "stay"
)

type LessonResultActionRequest struct {
	RecommendedAction LessonResultRecommendedAction `json:"recommendedAction"`
	SelectedAction    LessonResultSelectedAction    `json:"selectedAction"`
}

func validLessonResultRecommendedAction(value LessonResultRecommendedAction) bool {
	switch value {
	case LessonResultRecommendedNext,
		LessonResultRecommendedDue,
		LessonResultRecommendedHome,
		LessonResultRecommendedNone:
		return true
	default:
		return false
	}
}

func validLessonResultSelectedAction(value LessonResultSelectedAction) bool {
	switch value {
	case LessonResultSelectedNext,
		LessonResultSelectedDue,
		LessonResultSelectedHome,
		LessonResultSelectedProgress,
		LessonResultSelectedStay:
		return true
	default:
		return false
	}
}

// RecordLessonResultAction stores only the first action chosen from a completed
// Lesson Result. Repeated submissions are intentionally idempotent: reload,
// history restoration or a double click cannot rewrite the original retention
// evidence. The query also proves lesson ownership and completed state before
// the insert, so analytics cannot be attached to another user's lesson.
func (r *Repository) RecordLessonResultAction(
	ctx context.Context,
	userID string,
	lessonID string,
	request LessonResultActionRequest,
) error {
	var completedLessonExists bool
	var inserted bool
	if err := r.pool.QueryRow(ctx, `
		with completed_lesson as (
			select lesson.id, lesson.user_id
			from lesson_sessions as lesson
			where lesson.id = $2::uuid
			  and lesson.user_id = $1::uuid
			  and lesson.status = 'completed'
			  and lesson.completed_at is not null
		), inserted_action as (
			insert into lesson_result_actions (
				user_id,
				lesson_id,
				recommended_action,
				selected_action
			)
			select
				completed_lesson.user_id,
				completed_lesson.id,
				$3,
				$4
			from completed_lesson
			on conflict (user_id, lesson_id) do nothing
			returning 1
		)
		select
			exists(select 1 from completed_lesson),
			exists(select 1 from inserted_action)
	`, userID, lessonID, request.RecommendedAction, request.SelectedAction).Scan(
		&completedLessonExists,
		&inserted,
	); err != nil {
		return fmt.Errorf("record lesson result action: %w", err)
	}
	_ = inserted // Existence is read to force explicit idempotency semantics in the CTE result.
	if !completedLessonExists {
		return ErrCompletedLessonNotFound
	}
	return nil
}

func (h *Handler) RecordLessonResultAction(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	lessonID := r.PathValue("lessonID")
	if !validUUID(lessonID) {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_lesson_id", "lesson id must be a UUID")
		return
	}

	var request LessonResultActionRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if !validLessonResultRecommendedAction(request.RecommendedAction) {
		httpx.WriteError(
			w,
			http.StatusUnprocessableEntity,
			"invalid_recommended_action",
			"recommendedAction must be next_lesson, due_review, home or none",
		)
		return
	}
	if !validLessonResultSelectedAction(request.SelectedAction) {
		httpx.WriteError(
			w,
			http.StatusUnprocessableEntity,
			"invalid_selected_action",
			"selectedAction must be next_lesson, due_review, home, progress or stay",
		)
		return
	}

	if err := h.repository.RecordLessonResultAction(r.Context(), userID, lessonID, request); err != nil {
		if errors.Is(err, ErrCompletedLessonNotFound) {
			httpx.WriteError(w, http.StatusNotFound, "completed_lesson_not_found", "completed lesson was not found")
			return
		}
		slog.ErrorContext(
			r.Context(),
			"record lesson result action failed",
			"user_id", userID,
			"lesson_id", lessonID,
			"error", err,
		)
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
