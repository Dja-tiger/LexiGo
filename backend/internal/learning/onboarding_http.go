package learning

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

func (h *Handler) OnboardingStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	snapshot, err := h.repository.OnboardingStatus(r.Context(), userID)
	if err != nil {
		slog.ErrorContext(r.Context(), "load onboarding status failed", "user_id", userID, "error", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, snapshot)
}

func (h *Handler) StartOnboarding(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	snapshot, err := h.repository.StartOnboarding(r.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrOnboardingNoCandidates) {
			httpx.WriteError(w, http.StatusUnprocessableEntity, "onboarding_no_candidates", "no learning items are available for diagnostic onboarding")
			return
		}
		slog.ErrorContext(r.Context(), "start onboarding failed", "user_id", userID, "error", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, snapshot)
}

func (h *Handler) MarkOnboardingItem(w http.ResponseWriter, r *http.Request) {
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
	var request DiagnosticMarkRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if !validDiagnosticSelfMark(request.Mark) {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_self_mark", "mark must be known, unsure or new")
		return
	}

	result, err := h.repository.MarkOnboardingItem(r.Context(), userID, wordID, request.Mark)
	if err != nil {
		switch {
		case errors.Is(err, ErrOnboardingNotInProgress):
			httpx.WriteError(w, http.StatusConflict, "onboarding_not_in_progress", "diagnostic onboarding is not in progress")
		case errors.Is(err, ErrOnboardingItemOutOfOrder):
			httpx.WriteError(w, http.StatusConflict, "onboarding_item_out_of_order", "mark the current diagnostic item before moving forward")
		case errors.Is(err, ErrOnboardingIncomplete):
			httpx.WriteError(w, http.StatusConflict, "onboarding_diagnostic_complete", "all diagnostic items are already marked")
		default:
			slog.ErrorContext(r.Context(), "mark onboarding item failed", "user_id", userID, "word_id", wordID, "error", err)
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) CompleteOnboarding(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	snapshot, err := h.repository.CompleteOnboarding(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrOnboardingNotInProgress):
			httpx.WriteError(w, http.StatusConflict, "onboarding_not_in_progress", "diagnostic onboarding is not in progress")
		case errors.Is(err, ErrOnboardingIncomplete):
			httpx.WriteError(w, http.StatusConflict, "onboarding_incomplete", "mark every diagnostic item before completing onboarding")
		default:
			slog.ErrorContext(r.Context(), "complete onboarding failed", "user_id", userID, "error", err)
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
		return
	}
	httpx.WriteJSON(w, http.StatusOK, snapshot)
}

func (h *Handler) SkipOnboarding(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	snapshot, err := h.repository.SkipOnboarding(r.Context(), userID)
	if err != nil {
		slog.ErrorContext(r.Context(), "skip onboarding failed", "user_id", userID, "error", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, snapshot)
}
