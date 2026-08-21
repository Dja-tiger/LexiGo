package words

import (
	"errors"
	"net/http"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

func (h *Handler) CreateCustomPhrase(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}

	var request CreateCustomPhraseRequest
	if err := httpx.DecodeJSONLimit(w, r, &request, maxCustomPhraseRequestBytes); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must be one valid JSON object")
		return
	}

	normalized, err := NormalizeCustomPhraseRequest(request)
	if err != nil {
		var validationError *CustomPhraseValidationError
		if errors.As(err, &validationError) {
			httpx.WriteFieldError(
				w,
				http.StatusUnprocessableEntity,
				"invalid_custom_phrase",
				validationError.Message,
				validationError.Field,
			)
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	item, err := h.repository.CreateCustomPhrase(r.Context(), userID, normalized)
	if errors.Is(err, ErrCustomPhraseDuplicate) {
		httpx.WriteFieldError(
			w,
			http.StatusConflict,
			"custom_phrase_duplicate",
			"an equivalent custom item already exists for the current account",
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

func (h *Handler) DeleteCustomPhrase(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}

	phraseID, err := positiveWordID(r.PathValue("phraseID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_phrase_id", "custom phrase id must be a positive integer")
		return
	}

	if err := h.repository.DeleteCustomPhrase(r.Context(), userID, phraseID); err != nil {
		if errors.Is(err, ErrCustomPhraseNotFound) {
			// Missing, shared and another account's private phrase deliberately
			// share one response so ownership cannot be enumerated.
			httpx.WriteError(w, http.StatusNotFound, "custom_phrase_not_found", "custom phrase is not available to the current account")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
