package health

import (
	"context"
	"net/http"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Handler struct {
	postgres *pgxpool.Pool
	redis    *redis.Client
}

func NewHandler(postgres *pgxpool.Pool, redis *redis.Client) *Handler {
	return &Handler{postgres: postgres, redis: redis}
}

func (h *Handler) Live(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	status := map[string]string{"postgres": "ok", "redis": "ok"}
	ready := true
	if err := h.postgres.Ping(ctx); err != nil {
		status["postgres"] = "unavailable"
		ready = false
	}
	if err := h.redis.Ping(ctx).Err(); err != nil {
		status["redis"] = "unavailable"
		ready = false
	}
	if !ready {
		httpx.WriteJSON(w, http.StatusServiceUnavailable, map[string]any{"status": "degraded", "dependencies": status})
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"status": "ok", "dependencies": status})
}
