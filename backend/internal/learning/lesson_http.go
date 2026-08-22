package learning

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) PreviewLesson(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	var request LessonPreviewRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if !validateLessonConfiguration(w, request.Source, request.StudyMode, request.LessonSize, request.Topic, request.ReviewRatio) {
		return
	}
	if !validLessonSessionKind(request.SessionKind) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_session_kind", "sessionKind must be omitted or one of study, review or remediation")
		return
	}
	preview, err := h.repository.PreviewLesson(r.Context(), userID, request)
	if err != nil {
		slog.ErrorContext(r.Context(), "preview lesson failed", "user_id", userID, "error", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, preview)
}

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
	if !validateLessonConfiguration(w, request.Source, request.StudyMode, request.LessonSize, request.Topic, request.ReviewRatio) {
		return
	}
	if !validLessonSessionKind(request.SessionKind) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_session_kind", "sessionKind must be omitted or one of study, review or remediation")
		return
	}
	if request.WordIDs != nil && (len(request.WordIDs) == 0 || len(request.WordIDs) > 60 || !uniquePositiveWordIDs(request.WordIDs)) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_word_ids", "wordIds must be omitted or contain between 1 and 60 unique positive ids")
		return
	}

	lesson, err := h.repository.CreateProgressiveLesson(r.Context(), userID, request)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidLessonWords):
			httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_words", "all lesson items must be assigned to the current user")
		case errors.Is(err, ErrLessonQueueEmpty):
			httpx.WriteError(w, http.StatusUnprocessableEntity, "lesson_queue_empty", "no learning items are available for this lesson configuration")
		default:
			slog.ErrorContext(r.Context(), "create lesson failed", "user_id", userID, "error", err)
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, lesson)
}

func validateLessonConfiguration(w http.ResponseWriter, source string, studyMode AnswerMode, lessonSize, topic string, reviewRatio *int) bool {
	if !validLessonSource(source) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_source", "source must be a supported vocabulary or phrase collection")
		return false
	}
	if !validAnswerMode(studyMode) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_study_mode", "studyMode must be study, recall, choice or listening")
		return false
	}
	if !validLessonSize(lessonSize) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_size", "lessonSize must be 15, 30 or 60")
		return false
	}
	if len(strings.TrimSpace(topic)) > 120 {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_topic", "topic must contain at most 120 characters")
		return false
	}
	if reviewRatio != nil && (*reviewRatio < 0 || *reviewRatio > 100) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_review_ratio", "reviewRatio must be between 0 and 100")
		return false
	}
	return true
}

func (h *Handler) ActiveLesson(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	lesson, err := h.repository.ActiveLessonWithReasons(r.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrNoActiveLesson) {
			httpx.WriteError(w, http.StatusNotFound, "active_lesson_not_found", "there is no active lesson")
			return
		}
		slog.ErrorContext(r.Context(), "load active lesson failed", "user_id", userID, "error", err)
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
	expectedVersion, code := lessonVersionFromIfMatch(r.Header.Get("If-Match"))
	if code != "" {
		status := http.StatusUnprocessableEntity
		message := "If-Match must contain a positive lesson version"
		if code == "lesson_version_required" {
			status = http.StatusPreconditionRequired
			message = "If-Match lesson version is required"
		}
		httpx.WriteError(w, status, code, message)
		return
	}
	if err := h.repository.DiscardLesson(r.Context(), userID, lessonID, expectedVersion); err != nil {
		switch {
		case errors.Is(err, ErrNoActiveLesson):
			httpx.WriteError(w, http.StatusNotFound, "active_lesson_not_found", "active lesson was not found")
		case errors.Is(err, ErrLessonVersionConflict):
			httpx.WriteError(w, http.StatusConflict, "lesson_version_conflict", "lesson changed on another device; reload the active lesson")
		default:
			slog.ErrorContext(r.Context(), "discard lesson failed", "user_id", userID, "lesson_id", lessonID, "error", err)
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
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
		httpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "learning item id must be a positive integer")
		return
	}
	idempotencyKey := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	if idempotencyKey != "" && !validUUID(idempotencyKey) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_idempotency_key", "Idempotency-Key must be a UUID")
		return
	}

	var request LessonReviewRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if request.LessonVersion <= 0 {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_version", "lessonVersion must be a positive integer")
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
	if code, message := normalizeAndValidateReviewRequest(&request.ReviewRequest); code != "" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, code, message)
		return
	}

	result, err := h.repository.ReviewLessonWordIdempotent(
		r.Context(),
		userID,
		lessonID,
		wordID,
		request,
		idempotencyKey,
	)
	if err != nil {
		switch {
		case errors.Is(err, ErrIdempotencyKeyReused):
			httpx.WriteError(w, http.StatusConflict, "idempotency_key_reused", "Idempotency-Key was already used for a different lesson review")
		case errors.Is(err, ErrLessonVersionConflict):
			httpx.WriteError(w, http.StatusConflict, "lesson_version_conflict", "lesson changed on another device; reload the active lesson")
		case errors.Is(err, ErrLessonItemNotFound):
			httpx.WriteError(w, http.StatusNotFound, "lesson_item_not_found", "learning item is not part of the active lesson")
		case errors.Is(err, ErrLessonItemAlreadyReviewed):
			httpx.WriteError(w, http.StatusConflict, "lesson_item_already_reviewed", "lesson item was already reviewed")
		case errors.Is(err, ErrLessonItemOutOfOrder):
			httpx.WriteError(w, http.StatusConflict, "lesson_item_out_of_order", "review the current lesson item before moving forward")
		case errors.Is(err, ErrLessonModeMismatch):
			httpx.WriteError(w, http.StatusConflict, "lesson_mode_mismatch", "answerMode must match the active lesson studyMode")
		case errors.Is(err, ErrWordNotFound):
			httpx.WriteError(w, http.StatusNotFound, "word_not_found", "learning item is not assigned to the current user")
		case errors.Is(err, ErrInvalidRating):
			httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_rating", "rating must be again, almost or known")
		default:
			slog.ErrorContext(r.Context(), "review lesson item failed", "user_id", userID, "lesson_id", lessonID, "word_id", wordID, "error", err)
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func lessonVersionFromIfMatch(value string) (int64, string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, "lesson_version_required"
	}
	value = strings.TrimSpace(strings.TrimPrefix(value, "W/"))
	value = strings.Trim(value, "\"")
	version, err := strconv.ParseInt(value, 10, 64)
	if err != nil || version <= 0 {
		return 0, "invalid_lesson_version"
	}
	return version, ""
}

func validLessonSource(value string) bool {
	switch value {
	case "mixed", "noun", "verb", "adjective", "phrases", "daily-life", "travel", "data-engineering", "backend", "academic-technical-english":
		return true
	default:
		return false
	}
}

func validLessonSize(value string) bool {
	return value == "15" || value == "30" || value == "60"
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
