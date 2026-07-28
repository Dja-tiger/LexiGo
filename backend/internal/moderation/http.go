package moderation

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
)

type Store interface {
	UserEmail(ctx context.Context, userID string) (string, error)
	List(ctx context.Context, filter ListFilter) (ListResponse, error)
	Metrics(ctx context.Context, pendingCutoff, decidedCutoff time.Time) (Metrics, error)
	Decide(ctx context.Context, actorUserID string, suggestionID int64, request DecisionRequest) (DecisionResult, error)
}

type Handler struct {
	store       Store
	adminEmails map[string]struct{}
	logger      *slog.Logger
	pendingTTL  time.Duration
	decidedTTL  time.Duration
}

func NewHandler(
	store Store,
	adminEmails []string,
	logger *slog.Logger,
	pendingTTL time.Duration,
	decidedTTL time.Duration,
) *Handler {
	allowed := make(map[string]struct{}, len(adminEmails))
	for _, email := range adminEmails {
		normalized := strings.ToLower(strings.TrimSpace(email))
		if normalized != "" {
			allowed[normalized] = struct{}{}
		}
	}
	if logger == nil {
		logger = slog.Default()
	}
	return &Handler{
		store: store, adminEmails: allowed, logger: logger,
		pendingTTL: pendingTTL, decidedTTL: decidedTTL,
	}
}

func (handler *Handler) authorize(r *http.Request) (string, bool) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		return "", false
	}
	email, err := handler.store.UserEmail(r.Context(), userID)
	if err != nil {
		handler.logger.Error("moderation authorization failed", slog.String("error", err.Error()))
		return "", false
	}
	_, allowed := handler.adminEmails[strings.ToLower(strings.TrimSpace(email))]
	return userID, allowed
}

func (handler *Handler) List(w http.ResponseWriter, r *http.Request) {
	if _, ok := handler.authorize(r); !ok {
		httpx.WriteError(w, http.StatusForbidden, "moderation_forbidden", "content administrator access is required")
		return
	}
	filter := ListFilter{
		Status:       strings.TrimSpace(r.URL.Query().Get("status")),
		ExerciseKind: strings.TrimSpace(r.URL.Query().Get("exerciseKind")),
		ItemQuery:    r.URL.Query().Get("itemQuery"),
	}
	if value := r.URL.Query().Get("limit"); value != "" {
		limit, err := strconv.Atoi(value)
		if err != nil {
			httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_limit", "limit must be an integer")
			return
		}
		filter.Limit = limit
	}
	if value := r.URL.Query().Get("createdBefore"); value != "" {
		createdBefore, err := time.Parse(time.RFC3339, value)
		if err != nil {
			httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_created_before", "createdBefore must be RFC3339")
			return
		}
		filter.CreatedBefore = &createdBefore
	}
	if value := r.URL.Query().Get("cursor"); value != "" {
		cursor, err := DecodeCursor(value)
		if err != nil {
			httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_cursor", "cursor is invalid")
			return
		}
		filter.Cursor = &cursor
	}
	if err := NormalizeListFilter(&filter); err != nil {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_moderation_filter", err.Error())
		return
	}
	response, err := handler.store.List(r.Context(), filter)
	if err != nil {
		handler.logger.Error("moderation queue query failed", slog.String("error", err.Error()))
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, response)
}

func (handler *Handler) Metrics(w http.ResponseWriter, r *http.Request) {
	if _, ok := handler.authorize(r); !ok {
		httpx.WriteError(w, http.StatusForbidden, "moderation_forbidden", "content administrator access is required")
		return
	}
	now := time.Now().UTC()
	metrics, err := handler.store.Metrics(
		r.Context(),
		now.Add(-handler.pendingTTL),
		now.Add(-handler.decidedTTL),
	)
	if err != nil {
		handler.logger.Error("moderation metrics query failed", slog.String("error", err.Error()))
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, metrics)
}

func (handler *Handler) Decide(w http.ResponseWriter, r *http.Request) {
	actorUserID, ok := handler.authorize(r)
	if !ok {
		httpx.WriteError(w, http.StatusForbidden, "moderation_forbidden", "content administrator access is required")
		return
	}
	suggestionID, err := strconv.ParseInt(r.PathValue("suggestionID"), 10, 64)
	if err != nil || suggestionID <= 0 {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_suggestion_id", "suggestion id must be a positive integer")
		return
	}
	var request DecisionRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
		return
	}
	if err := ValidateDecision(&request); err != nil {
		httpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_moderation_decision", err.Error())
		return
	}
	result, err := handler.store.Decide(r.Context(), actorUserID, suggestionID, request)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotFound):
			httpx.WriteError(w, http.StatusNotFound, "suggestion_not_found", "answer suggestion was not found")
		case errors.Is(err, ErrVersionConflict):
			httpx.WriteError(w, http.StatusConflict, "suggestion_version_conflict", "answer suggestion was already decided or the expected version is stale")
		default:
			handler.logger.Error("moderation decision failed",
				slog.Int64("suggestion_id", suggestionID),
				slog.String("actor_user_id", actorUserID),
				slog.String("error", err.Error()),
			)
			httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		}
		return
	}
	handler.logger.Info("answer suggestion moderated",
		slog.Int64("suggestion_id", result.ID),
		slog.String("actor_user_id", actorUserID),
		slog.String("decision", result.Status),
		slog.String("reason", result.DecisionReason),
		slog.Bool("answer_added", result.AnswerAdded),
	)
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, result)
}
