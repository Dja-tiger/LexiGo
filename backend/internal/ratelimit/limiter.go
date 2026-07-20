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

type failureMode uint8

const (
	failOpen failureMode = iota
	failClosed
)

type Limiter struct {
	redis  *redis.Client
	window time.Duration
}

func New(client *redis.Client) *Limiter {
	return &Limiter{redis: client, window: time.Minute}
}

// Middleware keeps the existing fail-open behavior used by authentication and
// account endpoints: a Redis incident must not make core account operations
// unavailable.
func (l *Limiter) Middleware(limit int64, next http.Handler) http.Handler {
	return l.middleware("auth", limit, failOpen, next)
}

// MiddlewareFailClosed protects non-essential public ingestion endpoints. If
// Redis is unavailable, the request is rejected before it can create an
// unbounded write path to a downstream database.
func (l *Limiter) MiddlewareFailClosed(namespace string, limit int64, next http.Handler) http.Handler {
	return l.middleware(normalizeNamespace(namespace), limit, failClosed, next)
}

func (l *Limiter) middleware(namespace string, limit int64, mode failureMode, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := "rate:" + namespace + ":" + r.URL.Path + ":" + clientIP(r)
		allowed, err := l.allow(r.Context(), key, limit)
		if err != nil {
			if mode == failOpen {
				next.ServeHTTP(w, r)
				return
			}
			w.Header().Set("Retry-After", "60")
			httpx.WriteError(
				w,
				http.StatusServiceUnavailable,
				"rate_limiter_unavailable",
				"request throttling is temporarily unavailable",
			)
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

func normalizeNamespace(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "generic"
	}

	var normalized strings.Builder
	normalized.Grow(min(len(value), 32))
	for index := 0; index < len(value) && normalized.Len() < 32; index++ {
		character := value[index]
		if character >= 'a' && character <= 'z' ||
			character >= 'A' && character <= 'Z' ||
			character >= '0' && character <= '9' ||
			character == '-' || character == '_' {
			normalized.WriteByte(character)
			continue
		}
		normalized.WriteByte('_')
	}

	result := strings.Trim(normalized.String(), "_")
	if result == "" {
		return "generic"
	}
	return result
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
