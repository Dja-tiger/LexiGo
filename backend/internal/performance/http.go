package performance

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

type Handler struct {
	store  Store
	logger *slog.Logger
}

func NewHandler(store Store, loggers ...*slog.Logger) *Handler {
	logger := slog.Default()
	if len(loggers) > 0 && loggers[0] != nil {
		logger = loggers[0]
	}
	return &Handler{store: store, logger: logger}
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

func (handler *Handler) Journey(w http.ResponseWriter, r *http.Request) {
	var event JourneyEvent
	if err := httpx.DecodeJSONLimit(w, r, &event, MaxJourneyEventBytes); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "request body must contain one valid product journey event")
		return
	}
	if err := event.Validate(); err != nil {
		var validationError *ValidationError
		if errors.As(err, &validationError) {
			httpx.WriteFieldError(w, http.StatusUnprocessableEntity, "invalid_product_journey", validationError.Message, validationError.Field)
			return
		}
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_product_journey", "product journey event is invalid")
		return
	}
	if err := handler.store.StoreJourney(r.Context(), event); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusAccepted)
}
