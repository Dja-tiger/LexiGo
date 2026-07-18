//go:build integration

package integration

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

type capturePasswordResetSender struct {
	mu        sync.Mutex
	recipient string
	resetURL  string
}

func (s *capturePasswordResetSender) SendPasswordReset(_ context.Context, recipientEmail, _ string, resetURL string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.recipient = recipientEmail
	s.resetURL = resetURL
	return nil
}

func (s *capturePasswordResetSender) token(t *testing.T) string {
	t.Helper()
	s.mu.Lock()
	defer s.mu.Unlock()
	parsed, err := url.Parse(s.resetURL)
	if err != nil {
		t.Fatal(err)
	}
	token := parsed.Query().Get("reset_token")
	if token == "" || parsed.Query().Get("view") != "profile" {
		t.Fatalf("unexpected reset URL %q", s.resetURL)
	}
	return token
}

func TestPasswordRecoveryRevokesSessionsAndPreventsEnumeration(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, "truncate table password_reset_tokens, lesson_session_items, lesson_sessions, review_events, user_learning_preferences, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
		t.Fatalf("truncate test data: %v", err)
	}
	if _, err := catalog.Seed(ctx, pg); err != nil {
		t.Fatalf("catalog.Seed() error = %v", err)
	}

	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		t.Fatalf("flush redis: %v", err)
	}

	sender := &capturePasswordResetSender{}
	cfg := config.Config{
		AppEnv:              "test",
		HTTPAddr:            ":0",
		LogLevel:            "error",
		CORSAllowedOrigin:   "https://test.local",
		PostgresDSN:         requiredEnv(t, "TEST_POSTGRES_DSN"),
		Redis:               config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret:           "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL:      15 * time.Minute,
		RefreshTokenTTL:     24 * time.Hour,
		SessionCookieSecure: true,
		PasswordResetTTL:    30 * time.Minute,
	}
	app, err := server.NewWithOptions(
		cfg,
		slog.New(slog.NewTextHandler(io.Discard, nil)),
		pg,
		rdb,
		server.Options{PasswordResetSender: sender},
	)
	if err != nil {
		t.Fatalf("server.NewWithOptions() error = %v", err)
	}
	testServer := httptest.NewTLSServer(app.Handler())
	defer testServer.Close()

	deviceA := newIntegrationClient(t, testServer)
	deviceB := newIntegrationClient(t, testServer)
	email := fmt.Sprintf("recovery-%d@example.com", time.Now().UnixNano())
	oldPassword := "old-strong-password"
	newPassword := "new-strong-password"

	registered := decodeJSON[integrationAuthResponse](t, postJSONWithClient(
		t,
		deviceA,
		testServer.URL+"/api/v1/auth/register",
		map[string]string{"email": email, "password": oldPassword, "displayName": "Recovery Test"},
		"",
		http.StatusCreated,
	).Body)
	loggedIn := postJSONWithClient(
		t,
		deviceB,
		testServer.URL+"/api/v1/auth/login",
		map[string]string{"email": email, "password": oldPassword},
		"",
		http.StatusOK,
	)
	requireSessionCookies(t, loggedIn.Cookies)

	knownResponse := postJSONWithForwardedIP(t, deviceA, testServer.URL+"/api/v1/auth/password-reset/request", map[string]string{
		"email": email,
	}, "198.51.100.10", http.StatusAccepted)
	missingResponse := postJSONWithForwardedIP(t, deviceA, testServer.URL+"/api/v1/auth/password-reset/request", map[string]string{
		"email": "missing@example.com",
	}, "198.51.100.11", http.StatusAccepted)
	if !bytes.Equal(knownResponse.Body, missingResponse.Body) || string(knownResponse.Body) != "{\"accepted\":true}\n" {
		t.Fatalf("password reset request leaks account existence: known=%q missing=%q", knownResponse.Body, missingResponse.Body)
	}
	if sender.recipient != email {
		t.Fatalf("reset recipient = %q", sender.recipient)
	}
	token := sender.token(t)

	invalid := postJSONWithForwardedIP(t, deviceA, testServer.URL+"/api/v1/auth/password-reset/confirm", map[string]string{
		"token": "invalid", "newPassword": newPassword,
	}, "198.51.100.12", http.StatusBadRequest)
	if !bytes.Contains(invalid.Body, []byte(`"code":"password_reset_invalid"`)) {
		t.Fatalf("invalid reset response = %s", invalid.Body)
	}

	postJSONWithForwardedIP(t, deviceA, testServer.URL+"/api/v1/auth/password-reset/confirm", map[string]string{
		"token": token, "newPassword": newPassword,
	}, "198.51.100.13", http.StatusNoContent)

	deviceACSRF := cookieFromJar(t, deviceA, testServer.URL, integrationCSRFCookieName)
	postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, deviceACSRF, http.StatusUnauthorized)
	deviceBCSRF := cookieFromJar(t, deviceB, testServer.URL, integrationCSRFCookieName)
	postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/refresh", nil, deviceBCSRF, http.StatusUnauthorized)

	postJSONWithClient(t, newIntegrationClient(t, testServer), testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": oldPassword,
	}, "", http.StatusUnauthorized)
	newLogin := decodeJSON[integrationAuthResponse](t, postJSONWithClient(
		t,
		newIntegrationClient(t, testServer),
		testServer.URL+"/api/v1/auth/login",
		map[string]string{"email": email, "password": newPassword},
		"",
		http.StatusOK,
	).Body)
	if newLogin.Tokens.AccessToken == "" || newLogin.User.ID != registered.User.ID {
		t.Fatalf("unexpected new-password login response: %+v", newLogin)
	}

	reused := postJSONWithForwardedIP(t, newIntegrationClient(t, testServer), testServer.URL+"/api/v1/auth/password-reset/confirm", map[string]string{
		"token": token, "newPassword": "another-strong-password",
	}, "198.51.100.14", http.StatusBadRequest)
	if !bytes.Contains(reused.Body, []byte(`"code":"password_reset_invalid"`)) {
		t.Fatalf("reused token response = %s", reused.Body)
	}

	var activeResets int
	if err := pg.QueryRow(ctx, `
		select count(*)
		from password_reset_tokens
		where used_at is null
	`).Scan(&activeResets); err != nil {
		t.Fatal(err)
	}
	if activeResets != 0 {
		t.Fatalf("active reset tokens = %d", activeResets)
	}
}

func TestPasswordResetRequestIsRateLimited(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatal(err)
	}
	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		t.Fatal(err)
	}
	cfg := config.Config{
		AppEnv: "test", CORSAllowedOrigin: "https://test.local",
		JWTSecret: "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL: 15 * time.Minute, RefreshTokenTTL: time.Hour,
		PasswordResetTTL: 30 * time.Minute,
	}
	app, err := server.NewWithOptions(
		cfg,
		slog.New(slog.NewTextHandler(io.Discard, nil)),
		pg,
		rdb,
		server.Options{PasswordResetSender: &capturePasswordResetSender{}},
	)
	if err != nil {
		t.Fatal(err)
	}
	testServer := httptest.NewTLSServer(app.Handler())
	defer testServer.Close()
	client := newIntegrationClient(t, testServer)
	for attempt := 1; attempt <= 6; attempt++ {
		expected := http.StatusAccepted
		if attempt == 6 {
			expected = http.StatusTooManyRequests
		}
		result := postJSONWithForwardedIP(t, client, testServer.URL+"/api/v1/auth/password-reset/request", map[string]string{
			"email": "nobody@example.com",
		}, "203.0.113.20", expected)
		if attempt == 6 && !bytes.Contains(result.Body, []byte(`"code":"rate_limited"`)) {
			t.Fatalf("rate limit response = %s", result.Body)
		}
	}
}

func postJSONWithForwardedIP(
	t *testing.T,
	client *http.Client,
	endpoint string,
	payload any,
	forwardedIP string,
	expectedStatus int,
) integrationHTTPResult {
	t.Helper()
	body, err := jsonMarshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Forwarded-For", forwardedIP)
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != expectedStatus {
		t.Fatalf("POST %s status = %d, want %d, body = %s", endpoint, response.StatusCode, expectedStatus, responseBody)
	}
	return integrationHTTPResult{Body: responseBody, Cookies: response.Cookies()}
}

func jsonMarshal(value any) ([]byte, error) {
	return json.Marshal(value)
}
