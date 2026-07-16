package httpx

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

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
