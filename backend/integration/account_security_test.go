//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

type integrationAccountSession struct {
	ID      string `json:"id"`
	Current bool   `json:"current"`
}

type integrationAccountSessionsResponse struct {
	Sessions []integrationAccountSession `json:"sessions"`
}

type integrationAccountAuditEvent struct {
	Type string `json:"type"`
}

type integrationAccountAuditResponse struct {
	Events []integrationAccountAuditEvent `json:"events"`
}

func TestAccountPasswordAndSessionSecurity(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, `
		truncate table
			account_audit_events,
			lesson_session_items,
			lesson_sessions,
			review_events,
			user_learning_preferences,
			user_words,
			password_reset_tokens,
			refresh_tokens,
			users
		restart identity cascade
	`); err != nil {
		t.Fatalf("truncate account security test data: %v", err)
	}

	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		t.Fatalf("flush redis: %v", err)
	}

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
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewTLSServer(app.Handler())
	defer testServer.Close()

	deviceA := newIntegrationClient(t, testServer)
	deviceB := newIntegrationClient(t, testServer)
	email := fmt.Sprintf("account-security-%d@example.com", time.Now().UnixNano())

	registeredResult := postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Account Security",
	}, "", http.StatusCreated)
	registered := decodeJSON[integrationAuthResponse](t, registeredResult.Body)
	requireSessionCookies(t, registeredResult.Cookies)

	loggedInResult := postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "strong-password",
	}, "", http.StatusOK)
	loggedIn := decodeJSON[integrationAuthResponse](t, loggedInResult.Body)
	requireSessionCookies(t, loggedInResult.Cookies)

	sessions := accountSecurityJSONRequest[integrationAccountSessionsResponse](
		t,
		deviceA,
		http.MethodGet,
		testServer.URL+"/api/v1/auth/sessions",
		nil,
		registered.Tokens.AccessToken,
		"",
		http.StatusOK,
	)
	if len(sessions.Sessions) != 2 {
		t.Fatalf("active sessions = %d, want 2: %+v", len(sessions.Sessions), sessions.Sessions)
	}
	currentSessions := 0
	for _, session := range sessions.Sessions {
		if session.Current {
			currentSessions++
		}
	}
	if currentSessions != 1 {
		t.Fatalf("current sessions = %d, want 1", currentSessions)
	}

	deviceACSRF := cookieFromJar(t, deviceA, testServer.URL, integrationCSRFCookieName)
	accountSecurityJSONRequest[map[string]any](
		t,
		deviceA,
		http.MethodPost,
		testServer.URL+"/api/v1/auth/sessions/revoke-others",
		map[string]string{"currentPassword": "wrong-password"},
		registered.Tokens.AccessToken,
		deviceACSRF,
		http.StatusUnauthorized,
	)

	accountSecurityJSONRequest[map[string]any](
		t,
		deviceA,
		http.MethodPost,
		testServer.URL+"/api/v1/auth/sessions/revoke-others",
		map[string]string{"currentPassword": "strong-password"},
		registered.Tokens.AccessToken,
		deviceACSRF,
		http.StatusNoContent,
	)

	deviceBCSRF := cookieFromJar(t, deviceB, testServer.URL, integrationCSRFCookieName)
	postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/refresh", nil, deviceBCSRF, http.StatusUnauthorized)

	sessions = accountSecurityJSONRequest[integrationAccountSessionsResponse](
		t,
		deviceA,
		http.MethodGet,
		testServer.URL+"/api/v1/auth/sessions",
		nil,
		registered.Tokens.AccessToken,
		"",
		http.StatusOK,
	)
	if len(sessions.Sessions) != 1 || !sessions.Sessions[0].Current {
		t.Fatalf("sessions after revocation = %+v, want only current session", sessions.Sessions)
	}

	loggedInResult = postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "strong-password",
	}, "", http.StatusOK)
	loggedIn = decodeJSON[integrationAuthResponse](t, loggedInResult.Body)
	requireSessionCookies(t, loggedInResult.Cookies)

	accountSecurityJSONRequest[map[string]any](
		t,
		deviceA,
		http.MethodPut,
		testServer.URL+"/api/v1/auth/password",
		map[string]string{
			"currentPassword": "strong-password",
			"newPassword":     "new-strong-password",
		},
		registered.Tokens.AccessToken,
		deviceACSRF,
		http.StatusNoContent,
	)

	postJSONWithClient(t, newIntegrationClient(t, testServer), testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "strong-password",
	}, "", http.StatusUnauthorized)
	postJSONWithClient(t, newIntegrationClient(t, testServer), testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "new-strong-password",
	}, "", http.StatusOK)

	deviceBCSRF = cookieFromJar(t, deviceB, testServer.URL, integrationCSRFCookieName)
	postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/refresh", nil, deviceBCSRF, http.StatusUnauthorized)
	postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, deviceACSRF, http.StatusOK)

	audit := accountSecurityJSONRequest[integrationAccountAuditResponse](
		t,
		deviceA,
		http.MethodGet,
		testServer.URL+"/api/v1/auth/audit-events",
		nil,
		registered.Tokens.AccessToken,
		"",
		http.StatusOK,
	)
	if len(audit.Events) != 2 {
		t.Fatalf("audit events = %d, want 2: %+v", len(audit.Events), audit.Events)
	}
	if audit.Events[0].Type != "password_changed" || audit.Events[1].Type != "other_sessions_revoked" {
		t.Fatalf("unexpected audit event order: %+v", audit.Events)
	}

	var persistedAudit int
	if err := pg.QueryRow(ctx, `
		select count(*)
		from account_audit_events
		where user_id = $1::uuid
	`, registered.User.ID).Scan(&persistedAudit); err != nil {
		t.Fatalf("count account audit events: %v", err)
	}
	if persistedAudit != 2 {
		t.Fatalf("persisted audit events = %d, want 2", persistedAudit)
	}

	_ = loggedIn
}

func accountSecurityJSONRequest[T any](
	t *testing.T,
	client *http.Client,
	method,
	endpoint string,
	payload any,
	accessToken,
	csrfToken string,
	expectedStatus int,
) T {
	t.Helper()
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			t.Fatal(err)
		}
		body = bytes.NewReader(encoded)
	}
	request, err := http.NewRequestWithContext(context.Background(), method, endpoint, body)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Authorization", "Bearer "+accessToken)
	if payload != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if csrfToken != "" {
		request.Header.Set("X-CSRF-Token", csrfToken)
	}
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
		t.Fatalf("%s %s status = %d, want %d, body = %s", method, endpoint, response.StatusCode, expectedStatus, responseBody)
	}
	var result T
	if len(responseBody) == 0 {
		return result
	}
	if err := json.Unmarshal(responseBody, &result); err != nil {
		t.Fatalf("decode %s %s response: %v; body=%s", method, endpoint, err, responseBody)
	}
	return result
}
