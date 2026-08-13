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
	w.Header().Set("Cache-Control", "no-store")

	items, err := h.repository.ExportCustomGlossary(r.Context(), userID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, newCustomGlossaryExport(items))
}

func (h *Handler) ImportCustomGlossary(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	w.Header().Set("Cache-Control", "no-store")

	var request CustomGlossaryEnvelope
	if err := httpx.DecodeJSONLimit(w, r, &request, maxCustomGlossaryRequestBytes); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must be one valid JSON object")
		return
	}

	normalized, err := NormalizeCustomGlossaryImport(request)
	if err != nil {
		var validationError *CustomWordValidationError
		if errors.As(err, &validationError) {
			field := validationError.Field
			if field != "version" && field != "items" {
				field = "items"
			}
			httpx.WriteFieldError(
				w,
				http.StatusUnprocessableEntity,
				"invalid_custom_glossary",
				validationError.Message,
				field,
			)
			return
		}
		var duplicateError *CustomGlossaryDuplicateError
		if errors.As(err, &duplicateError) {
			httpx.WriteFieldError(
				w,
				http.StatusConflict,
				"custom_glossary_duplicate",
				"the import contains an equivalent duplicate custom word",
				"items",
			)
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	imported, err := h.repository.ImportCustomGlossary(r.Context(), userID, normalized.Items)
	if errors.Is(err, ErrCustomWordDuplicate) {
		httpx.WriteFieldError(
			w,
			http.StatusConflict,
			"custom_glossary_duplicate",
			"an equivalent custom word already exists for the current account; no glossary items were imported",
			"items",
		)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	httpx.WriteJSON(w, http.StatusCreated, CustomGlossaryImportResult{
		Version:  customGlossaryVersion,
		Imported: imported,
	})
}
