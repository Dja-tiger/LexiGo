package words

import (
	"errors"
	"net/http"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

func (h *Handler) ExportCustomGlossary(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	document, err := h.repository.ExportCustomGlossary(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, document)
}

func (h *Handler) ImportCustomGlossary(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	var document CustomGlossaryDocument
	if err := httpx.DecodeJSONLimit(w, r, &document, maxCustomGlossaryRequestBytes); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must be one valid bounded glossary document")
		return
	}
	result, err := h.repository.ImportCustomGlossary(r.Context(), userID, document)
	if err != nil {
		var validationError *CustomGlossaryValidationError
		if errors.As(err, &validationError) {
			httpx.WriteFieldError(w, http.StatusUnprocessableEntity, "invalid_custom_glossary", validationError.Message, validationError.Field)
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, result)
}
