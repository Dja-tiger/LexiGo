package ratelimit

import (
	"context"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
	"github.com/redis/go-redis/v9"
)

var incrementScript = redis.NewScript(`
local current = redis.call('incr', KEYS[1])
if current == 1 then
  redis.call('pexpire', KEYS[1], ARGV[1])
end
return current
`)

type Limiter struct {
	redis  *redis.Client
	window time.Duration
}

func New(client *redis.Client) *Limiter {
	return &Limiter{redis: client, window: time.Minute}
}

func (l *Limiter) Middleware(limit int64, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := "rate:auth:" + r.URL.Path + ":" + clientIP(r)
		allowed, err := l.allow(r.Context(), key, limit)
		if err != nil {
			// Rate limiter is fail-open: a Redis incident must not make authentication fully unavailable.
			next.ServeHTTP(w, r)
			return
		}
		if !allowed {
			w.Header().Set("Retry-After", "60")
			httpx.WriteError(w, http.StatusTooManyRequests, "rate_limited", "too many requests")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (l *Limiter) allow(ctx context.Context, key string, limit int64) (bool, error) {
	result, err := incrementScript.Run(ctx, l.redis, []string{key}, l.window.Milliseconds()).Int64()
	if err != nil {
		return false, err
	}
	return result <= limit, nil
}

func clientIP(r *http.Request) string {
	candidate := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-For"), ",")[0])
	if net.ParseIP(candidate) != nil {
		return candidate
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && net.ParseIP(host) != nil {
		return host
	}
	return "unknown"
}
