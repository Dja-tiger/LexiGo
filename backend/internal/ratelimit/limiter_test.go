package ratelimit

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func TestMiddlewareFailsOpenForCoreAccountEndpoints(t *testing.T) {
	limiter := New(unavailableRedis(t))
	nextCalled := false
	handler := limiter.Middleware(10, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	request.RemoteAddr = "203.0.113.10:42310"
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if !nextCalled {
		t.Fatal("fail-open limiter did not call the protected handler")
	}
	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
}

func TestMiddlewareFailClosedRejectsPublicIngestionWhenRedisIsUnavailable(t *testing.T) {
	limiter := New(unavailableRedis(t))
	nextCalled := false
	handler := limiter.MiddlewareFailClosed("performance", 120, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodPost, "/api/v1/performance/rum", nil)
	request.RemoteAddr = "203.0.113.10:42310"
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if nextCalled {
		t.Fatal("fail-closed limiter called the protected handler during a Redis failure")
	}
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusServiceUnavailable, response.Body.String())
	}
	if response.Header().Get("Retry-After") != "60" {
		t.Fatalf("Retry-After = %q, want 60", response.Header().Get("Retry-After"))
	}
	if !strings.Contains(response.Body.String(), `"code":"rate_limiter_unavailable"`) {
		t.Fatalf("unexpected error response: %s", response.Body.String())
	}
}

func TestNormalizeNamespaceProducesBoundedRedisKeySegment(t *testing.T) {
	if got := normalizeNamespace(" performance:public/rum "); got != "performance_public_rum" {
		t.Fatalf("normalizeNamespace() = %q, want performance_public_rum", got)
	}
	if got := normalizeNamespace(strings.Repeat("x", 64)); len(got) != 32 {
		t.Fatalf("normalizeNamespace() length = %d, want 32", len(got))
	}
	if got := normalizeNamespace(":::"); got != "generic" {
		t.Fatalf("normalizeNamespace() = %q, want generic", got)
	}
}

func unavailableRedis(t *testing.T) *redis.Client {
	t.Helper()
	client := redis.NewClient(&redis.Options{
		Addr:         "127.0.0.1:1",
		DialTimeout:  25 * time.Millisecond,
		ReadTimeout:  25 * time.Millisecond,
		WriteTimeout: 25 * time.Millisecond,
		MaxRetries:   -1,
	})
	t.Cleanup(func() {
		_ = client.Close()
	})
	return client
}
