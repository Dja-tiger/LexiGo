package words

import (
	"errors"
	"net/http"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

func (h *Handler) CreateCustom(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}

	var request CreateCustomWordRequest
	if err := httpx.DecodeJSONLimit(w, r, &request, maxCustomWordRequestBytes); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must be one valid JSON object")
		return
	}

	normalized, err := NormalizeCustomWordRequest(request)
	if err != nil {
		var validationError *CustomWordValidationError
		if errors.As(err, &validationError) {
			httpx.WriteFieldError(
				w,
				http.StatusUnprocessableEntity,
				"invalid_custom_word",
				validationError.Message,
				validationError.Field,
			)
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	item, err := h.repository.CreateCustomWord(r.Context(), userID, normalized)
	if errors.Is(err, ErrCustomWordDuplicate) {
		httpx.WriteFieldError(
			w,
			http.StatusConflict,
			"custom_word_duplicate",
			"an equivalent custom word already exists for the current account",
			"lemma",
		)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, item)
}

func (h *Handler) DeleteCustom(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}

	wordID, err := positiveWordID(r.PathValue("wordID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "custom word id must be a positive integer")
		return
	}

	if err := h.repository.DeleteCustomWord(r.Context(), userID, wordID); err != nil {
		if errors.Is(err, ErrCustomWordNotFound) {
			// Missing, shared and another account's private word deliberately use
			// the same response to avoid exposing ownership boundaries.
			httpx.WriteError(w, http.StatusNotFound, "custom_word_not_found", "custom word is not available to the current account")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
