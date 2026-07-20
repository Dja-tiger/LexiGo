package performance

import (
	"errors"
	"net/http"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

type Handler struct {
	store Store
}

func NewHandler(store Store) *Handler {
	return &Handler{store: store}
}

func (handler *Handler) Report(w http.ResponseWriter, r *http.Request) {
	var report Report
	if err := httpx.DecodeJSONLimit(w, r, &report, MaxReportBytes); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must contain one valid performance report")
		return
	}
	if err := report.Validate(); err != nil {
		var validationError *ValidationError
		if errors.As(err, &validationError) {
			httpx.WriteFieldError(w, http.StatusUnprocessableEntity, "invalid_performance_report", validationError.Message, validationError.Field)
			return
		}
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_performance_report", "performance report is invalid")
		return
	}
	if err := handler.store.StoreReport(r.Context(), report); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusAccepted)
}
