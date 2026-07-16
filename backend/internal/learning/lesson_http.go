package learning

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) CreateLesson(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}

	var request LessonCreateRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if !validLessonSource(request.Source) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_source", "source must be mixed, noun, verb or adjective")
		return
	}
	if request.StudyMode != "recall" && request.StudyMode != "choice" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_study_mode", "studyMode must be recall or choice")
		return
	}
	if !validLessonSize(request.LessonSize) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_size", "lessonSize must be 15, 30, 60 or all")
		return
	}
	if len(request.WordIDs) == 0 || len(request.WordIDs) > 1000 || !uniquePositiveWordIDs(request.WordIDs) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_word_ids", "wordIds must contain between 1 and 1000 unique positive ids")
		return
	}

	lesson, err := h.repository.CreateLesson(r.Context(), userID, request)
	if err != nil {
		if errors.Is(err, ErrInvalidLessonWords) {
			httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_words", "all lesson words must be assigned to the current user")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, lesson)
}

func (h *Handler) ActiveLesson(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	lesson, err := h.repository.ActiveLesson(r.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrNoActiveLesson) {
			httpx.WriteError(w, http.StatusNotFound, "active_lesson_not_found", "there is no active lesson")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, lesson)
}

func (h *Handler) DiscardLesson(w http.ResponseWriter, r *http.Request) {
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
	if err := h.repository.DiscardLesson(r.Context(), userID, lessonID); err != nil {
		if errors.Is(err, ErrNoActiveLesson) {
			httpx.WriteError(w, http.StatusNotFound, "active_lesson_not_found", "active lesson was not found")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ReviewLessonWord(w http.ResponseWriter, r *http.Request) {
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
	wordID, err := strconv.ParseInt(r.PathValue("wordID"), 10, 64)
	if err != nil || wordID <= 0 {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "word id must be a positive integer")
		return
	}

	var request ReviewRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if !validRating(request.Rating) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_rating", "rating must be again, almost or known")
		return
	}
	if request.ResponseMS != nil && (*request.ResponseMS < 0 || *request.ResponseMS > 3_600_000) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_response_ms", "responseMs must be between 0 and 3600000")
		return
	}
	if request.AnswerMode != "recall" && request.AnswerMode != "choice" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_answer_mode", "answerMode must be recall or choice")
		return
	}

	result, err := h.repository.ReviewLessonWord(r.Context(), userID, lessonID, wordID, request)
	if err != nil {
		switch {
		case errors.Is(err, ErrLessonItemNotFound):
			httpx.WriteError(w, http.StatusNotFound, "lesson_item_not_found", "word is not part of the active lesson")
		case errors.Is(err, ErrLessonItemAlreadyReviewed):
			httpx.WriteError(w, http.StatusConflict, "lesson_item_already_reviewed", "lesson item was already reviewed")
		case errors.Is(err, ErrWordNotFound):
			httpx.WriteError(w, http.StatusNotFound, "word_not_found", "word is not assigned to the current user")
		case errors.Is(err, ErrInvalidRating):
			httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_rating", "rating must be again, almost or known")
		default:
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func validLessonSource(value string) bool {
	return value == "mixed" || value == "noun" || value == "verb" || value == "adjective"
}

func validLessonSize(value string) bool {
	return value == "15" || value == "30" || value == "60" || value == "all"
}

func uniquePositiveWordIDs(values []int64) bool {
	seen := make(map[int64]struct{}, len(values))
	for _, value := range values {
		if value <= 0 {
			return false
		}
		if _, exists := seen[value]; exists {
			return false
		}
		seen[value] = struct{}{}
	}
	return true
}

func validUUID(value string) bool {
	var parsed pgtype.UUID
	return parsed.Scan(value) == nil && parsed.Valid
}
