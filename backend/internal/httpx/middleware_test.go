package httpx

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type testAuthenticationUnavailable struct{ error }

func (testAuthenticationUnavailable) AuthenticationUnavailable() bool { return true }

func TestSameOriginRejectsCrossSiteMutation(t *testing.T) {
	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusNoContent)
	})
	handler := SameOrigin("https://lexigo.example", next)

	request := httptest.NewRequest(http.MethodPost, "https://api.lexigo.example/api/v1/auth/login", nil)
	request.Header.Set("Sec-Fetch-Site", "cross-site")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusForbidden)
	}
	if nextCalled {
		t.Fatal("cross-site request reached the protected handler")
	}
}

func TestSameOriginRejectsUnexpectedOrigin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := SameOrigin("https://lexigo.example", next)

	request := httptest.NewRequest(http.MethodPost, "https://api.lexigo.example/api/v1/auth/refresh", nil)
	request.Header.Set("Origin", "https://attacker.example")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusForbidden)
	}
}

func TestCORSAllowsCredentialsOnlyForExplicitOrigin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := CORS("https://lexigo.example", next)

	request := httptest.NewRequest(http.MethodOptions, "https://api.lexigo.example/api/v1/auth/refresh", nil)
	request.Header.Set("Origin", "https://lexigo.example")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
	if response.Header().Get("Access-Control-Allow-Credentials") != "true" {
		t.Fatal("credentialed CORS header is missing")
	}
	if response.Header().Get("Access-Control-Allow-Headers") != "Authorization, Content-Type, X-Request-ID, X-CSRF-Token" {
		t.Fatalf("unexpected allowed headers: %q", response.Header().Get("Access-Control-Allow-Headers"))
	}
}

func TestCORSDoesNotEnableCredentialsForWildcardOrigin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := CORS("*", next)

	request := httptest.NewRequest(http.MethodOptions, "https://api.lexigo.example/api/v1/auth/refresh", nil)
	request.Header.Set("Origin", "https://lexigo.example")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Header().Get("Access-Control-Allow-Credentials") != "" {
		t.Fatal("wildcard CORS must not enable credentials")
	}
}

func TestAuthenticateUsesRequestContextAndSetsUser(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if userID, ok := UserID(r.Context()); !ok || userID != "user-1" {
			t.Fatalf("authenticated user = %q, %v", userID, ok)
		}
		w.WriteHeader(http.StatusNoContent)
	})
	handler := Authenticate(func(ctx context.Context, token string) (string, error) {
		if ctx == nil || token != "valid-token" {
			return "", errors.New("invalid token")
		}
		return "user-1", nil
	}, next)
	request := httptest.NewRequest(http.MethodGet, "https://lexigo.example/api/v1/me", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
}

func TestAuthenticateFailsClosedWhenCredentialStoreIsUnavailable(t *testing.T) {
	nextCalled := false
	handler := Authenticate(func(context.Context, string) (string, error) {
		return "", testAuthenticationUnavailable{error: errors.New("database offline")}
	}, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		nextCalled = true
	}))
	request := httptest.NewRequest(http.MethodGet, "https://lexigo.example/api/v1/me", nil)
	request.Header.Set("Authorization", "Bearer signed-token")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusServiceUnavailable || response.Header().Get("Retry-After") != "1" {
		t.Fatalf("response = %d, Retry-After %q", response.Code, response.Header().Get("Retry-After"))
	}
	if nextCalled {
		t.Fatal("request reached the protected handler during credential-store failure")
	}
}

func TestAccessLogMeasuresAuthenticationValidation(t *testing.T) {
	var output bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&output, nil))
	handler := AccessLog(logger, Authenticate(
		func(context.Context, string) (string, error) { return "user-1", nil },
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }),
	))
	request := httptest.NewRequest(http.MethodGet, "https://lexigo.example/api/v1/me", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
	if !strings.Contains(output.String(), `"auth_validation_duration"`) {
		t.Fatalf("access log does not expose authentication latency: %s", output.String())
	}
}
