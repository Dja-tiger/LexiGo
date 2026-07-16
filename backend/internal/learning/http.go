package learning

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

type Handler struct{ repository *Repository }

func NewHandler(repository *Repository) *Handler { return &Handler{repository: repository} }

func (h *Handler) ReviewWord(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
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
	if request.AnswerMode != "" && request.AnswerMode != "recall" && request.AnswerMode != "choice" {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_answer_mode", "answerMode must be recall or choice")
		return
	}

	result, err := h.repository.ReviewWord(r.Context(), userID, wordID, request)
	if err != nil {
		switch {
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

func (h *Handler) Progress(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("timezoneOffsetMinutes"))
	result, err := h.repository.Progress(r.Context(), userID, offset)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) SetDailyGoal(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	var request GoalRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if request.DailyGoal < 5 || request.DailyGoal > 200 {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_daily_goal", "dailyGoal must be between 5 and 200")
		return
	}
	if err := h.repository.SetDailyGoal(r.Context(), userID, request.DailyGoal); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("timezoneOffsetMinutes"))
	result, err := h.repository.Progress(r.Context(), userID, offset)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func validRating(rating Rating) bool {
	return rating == RatingAgain || rating == RatingAlmost || rating == RatingKnown
}
