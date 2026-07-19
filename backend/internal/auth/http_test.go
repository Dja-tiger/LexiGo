package auth

import (
	"bytes"
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func newTestAuthHandler(
	t *testing.T,
	users *fakeUsers,
	resetRepository *fakePasswordResetRepository,
	sender *fakePasswordResetSender,
	refreshRepositories ...RefreshTokenRepository,
) *Handler {
	t.Helper()
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	refreshRepository := RefreshTokenRepository(&fakeRefresh{})
	if len(refreshRepositories) > 0 && refreshRepositories[0] != nil {
		refreshRepository = refreshRepositories[0]
	}
	service := NewService(
		users,
		refreshRepository,
		manager,
		time.Hour,
		WithPasswordReset(resetRepository, sender, "https://lexigo.example", 30*time.Minute),
	)
	return NewHandler(
		service,
		CookieConfig{RefreshTTL: time.Hour},
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
}

func TestPasswordResetRequestHasIdenticalAntiEnumerationResponse(t *testing.T) {
	knownHandler := newTestAuthHandler(
		t,
		&fakeUsers{byEmail: User{ID: "user-1", Email: "known@example.com", DisplayName: "Known User"}},
		&fakePasswordResetRepository{},
		&fakePasswordResetSender{},
	)
	missingHandler := newTestAuthHandler(
		t,
		&fakeUsers{err: ErrUserNotFound},
		&fakePasswordResetRepository{},
		&fakePasswordResetSender{},
	)

	known := performJSONRequest(t, http.HandlerFunc(knownHandler.RequestPasswordReset), `{"email":"known@example.com"}`)
	missing := performJSONRequest(t, http.HandlerFunc(missingHandler.RequestPasswordReset), `{"email":"missing@example.com"}`)
	if known.Code != http.StatusAccepted || missing.Code != http.StatusAccepted {
		t.Fatalf("statuses = %d and %d", known.Code, missing.Code)
	}
	if known.Body.String() != missing.Body.String() || known.Body.String() != "{\"accepted\":true}\n" {
		t.Fatalf("anti-enumeration bodies differ: known=%q missing=%q", known.Body.String(), missing.Body.String())
	}
	if known.Header().Get("Cache-Control") != "no-store" || missing.Header().Get("Cache-Control") != "no-store" {
		t.Fatal("password reset request responses must not be cached")
	}
}

func TestAuthenticationErrorsUseStableCodesAndFields(t *testing.T) {
	handler := newTestAuthHandler(
		t,
		&fakeUsers{err: ErrUserNotFound},
		&fakePasswordResetRepository{},
		&fakePasswordResetSender{},
	)

	login := performJSONRequest(t, http.HandlerFunc(handler.Login), `{"email":"missing@example.com","password":"strong-password"}`)
	if login.Code != http.StatusUnauthorized || !bytes.Contains(login.Body.Bytes(), []byte(`"code":"invalid_credentials"`)) {
		t.Fatalf("login response = %d %s", login.Code, login.Body.String())
	}

	register := performJSONRequest(t, http.HandlerFunc(handler.Register), `{"email":"test@example.com","password":"short","displayName":"T"}`)
	if register.Code != http.StatusUnprocessableEntity ||
		!bytes.Contains(register.Body.Bytes(), []byte(`"code":"display_name_too_short"`)) ||
		!bytes.Contains(register.Body.Bytes(), []byte(`"field":"displayName"`)) {
		t.Fatalf("register response = %d %s", register.Code, register.Body.String())
	}

	confirm := performJSONRequest(t, http.HandlerFunc(handler.ConfirmPasswordReset), `{"token":"invalid","newPassword":"new-strong-password"}`)
	if confirm.Code != http.StatusBadRequest ||
		!bytes.Contains(confirm.Body.Bytes(), []byte(`"code":"password_reset_invalid"`)) ||
		!bytes.Contains(confirm.Body.Bytes(), []byte(`"field":"token"`)) {
		t.Fatalf("confirm response = %d %s", confirm.Code, confirm.Body.String())
	}
}

func TestPasswordResetRequestRejectsMalformedJSONWithoutAccountLookup(t *testing.T) {
	users := &fakeUsers{err: context.Canceled}
	handler := newTestAuthHandler(t, users, &fakePasswordResetRepository{}, &fakePasswordResetSender{})
	response := performJSONRequest(t, http.HandlerFunc(handler.RequestPasswordReset), `{"email":`)
	if response.Code != http.StatusBadRequest || !bytes.Contains(response.Body.Bytes(), []byte(`"code":"invalid_request"`)) {
		t.Fatalf("response = %d %s", response.Code, response.Body.String())
	}
}

func TestRefreshConflictDoesNotClearRotatedSessionCookies(t *testing.T) {
	handler := newTestAuthHandler(
		t,
		&fakeUsers{},
		&fakePasswordResetRepository{},
		&fakePasswordResetSender{},
		&fakeRefresh{rotateErr: ErrRefreshInProgress},
	)
	request := httptest.NewRequest(http.MethodPost, "https://lexigo.example/api/v1/auth/refresh", nil)
	request.AddCookie(&http.Cookie{Name: refreshCookieName, Value: "old-refresh"})
	request.AddCookie(&http.Cookie{Name: csrfCookieName, Value: "csrf-token"})
	request.Header.Set(csrfHeaderName, "csrf-token")
	response := httptest.NewRecorder()

	handler.Refresh(response, request)

	if response.Code != http.StatusConflict || !strings.Contains(response.Body.String(), `"code":"refresh_conflict"`) {
		t.Fatalf("response = %d %s", response.Code, response.Body.String())
	}
	if response.Header().Get("Retry-After") != "1" {
		t.Fatalf("Retry-After = %q", response.Header().Get("Retry-After"))
	}
	if cookies := response.Result().Cookies(); len(cookies) != 0 {
		t.Fatalf("refresh conflict must not overwrite the winner's cookies: %+v", cookies)
	}
}

func performJSONRequest(t *testing.T, handler http.Handler, body string) *httptest.ResponseRecorder {
	t.Helper()
	request := httptest.NewRequest(http.MethodPost, "https://lexigo.example/api/v1/auth/test", bytes.NewBufferString(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}
