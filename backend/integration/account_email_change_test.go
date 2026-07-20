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

	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

type captureEmailChangeSender struct {
	mu                    sync.Mutex
	verificationRecipient string
	verificationURL       string
	notificationRecipient string
	notificationNewEmail  string
}

func (s *captureEmailChangeSender) SendEmailChangeVerification(
	_ context.Context,
	recipientEmail,
	_ string,
	verificationURL string,
) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.verificationRecipient = recipientEmail
	s.verificationURL = verificationURL
	return nil
}

func (s *captureEmailChangeSender) SendEmailChangedNotification(
	_ context.Context,
	recipientEmail,
	_ string,
	newEmail string,
) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.notificationRecipient = recipientEmail
	s.notificationNewEmail = newEmail
	return nil
}

func (s *captureEmailChangeSender) token(t *testing.T) string {
	t.Helper()
	s.mu.Lock()
	defer s.mu.Unlock()
	parsed, err := url.Parse(s.verificationURL)
	if err != nil {
		t.Fatal(err)
	}
	fragment, err := url.ParseQuery(parsed.Fragment)
	if err != nil {
		t.Fatal(err)
	}
	token := fragment.Get("email_change_token")
	if parsed.Path != "/profile" || token == "" || parsed.RawQuery != "" {
		t.Fatalf("unexpected email verification URL %q", s.verificationURL)
	}
	return token
}

func TestVerifiedEmailChangeRevokesSessionsAndChangesLoginIdentity(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
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
			account_email_change_tokens,
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
		t.Fatalf("truncate email change test data: %v", err)
	}

	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		t.Fatalf("flush redis: %v", err)
	}

	sender := &captureEmailChangeSender{}
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
		server.Options{EmailChangeSender: sender},
	)
	if err != nil {
		t.Fatalf("server.NewWithOptions() error = %v", err)
	}
	testServer := httptest.NewTLSServer(app.Handler())
	defer testServer.Close()

	deviceA := newIntegrationClient(t, testServer)
	deviceB := newIntegrationClient(t, testServer)
	oldEmail := fmt.Sprintf("old-email-%d@example.com", time.Now().UnixNano())
	newEmail := fmt.Sprintf("new-email-%d@example.com", time.Now().UnixNano())
	password := "strong-password"

	registeredResult := postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": oldEmail, "password": password, "displayName": "Email Change",
	}, "", http.StatusCreated)
	registered := decodeJSON[integrationAuthResponse](t, registeredResult.Body)
	deviceARefresh := requireSessionCookies(t, registeredResult.Cookies)

	deviceBResult := postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": oldEmail, "password": password,
	}, "", http.StatusOK)
	deviceBSession := decodeJSON[integrationAuthResponse](t, deviceBResult.Body)
	deviceBRefresh := requireSessionCookies(t, deviceBResult.Cookies)

	deviceACSRF := cookieFromJar(t, deviceA, testServer.URL, integrationCSRFCookieName)
	wrongPassword := accountSecurityJSONRequest[map[string]any](
		t,
		deviceA,
		http.MethodPost,
		testServer.URL+"/api/v1/account/email-change/request",
		map[string]string{"currentPassword": "wrong-password", "newEmail": newEmail},
		registered.Tokens.AccessToken,
		deviceACSRF,
		http.StatusUnauthorized,
	)
	if wrongPassword == nil {
		t.Fatal("wrong-password response must contain a structured error")
	}

	accepted := accountSecurityJSONRequest[map[string]any](
		t,
		deviceA,
		http.MethodPost,
		testServer.URL+"/api/v1/account/email-change/request",
		map[string]string{"currentPassword": password, "newEmail": newEmail},
		registered.Tokens.AccessToken,
		deviceACSRF,
		http.StatusAccepted,
	)
	if accepted["accepted"] != true || sender.verificationRecipient != newEmail {
		t.Fatalf("unexpected email change request: response=%+v sender=%+v", accepted, sender)
	}
	token := sender.token(t)

	postJSONWithClient(t, newIntegrationClient(t, testServer), testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": oldEmail, "password": password,
	}, "", http.StatusOK)
	postJSONWithClient(t, newIntegrationClient(t, testServer), testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": newEmail, "password": password,
	}, "", http.StatusUnauthorized)

	invalid := postJSONWithClient(
		t,
		newIntegrationClient(t, testServer),
		testServer.URL+"/api/v1/account/email-change/confirm",
		map[string]string{"token": "invalid"},
		"",
		http.StatusBadRequest,
	)
	if !bytes.Contains(invalid.Body, []byte(`"code":"email_change_invalid"`)) {
		t.Fatalf("invalid email change response = %s", invalid.Body)
	}

	confirmResult := postJSONWithClient(
		t,
		deviceA,
		testServer.URL+"/api/v1/account/email-change/confirm",
		map[string]string{"token": token},
		"",
		http.StatusNoContent,
	)
	requireClearedSessionCookies(t, confirmResult.Cookies)
	if sender.notificationRecipient != oldEmail || sender.notificationNewEmail != newEmail {
		t.Fatalf("unexpected email changed notification: %+v", sender)
	}

	replayRefreshToken(t, testServer, deviceARefresh, deviceACSRF, http.StatusUnauthorized)
	deviceBCSRF := cookieFromJar(t, deviceB, testServer.URL, integrationCSRFCookieName)
	replayRefreshToken(t, testServer, deviceBRefresh, deviceBCSRF, http.StatusUnauthorized)

	postJSONWithClient(t, newIntegrationClient(t, testServer), testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": oldEmail, "password": password,
	}, "", http.StatusUnauthorized)
	newLogin := decodeJSON[integrationAuthResponse](t, postJSONWithClient(
		t,
		newIntegrationClient(t, testServer),
		testServer.URL+"/api/v1/auth/login",
		map[string]string{"email": newEmail, "password": password},
		"",
		http.StatusOK,
	).Body)
	if newLogin.User.ID != registered.User.ID || newLogin.User.Email != newEmail {
		t.Fatalf("unexpected new-email login: %+v", newLogin)
	}

	reused := postJSONWithClient(
		t,
		newIntegrationClient(t, testServer),
		testServer.URL+"/api/v1/account/email-change/confirm",
		map[string]string{"token": token},
		"",
		http.StatusBadRequest,
	)
	if !bytes.Contains(reused.Body, []byte(`"code":"email_change_invalid"`)) {
		t.Fatalf("reused email change response = %s", reused.Body)
	}

	var (
		persistedEmail string
		emailAudit     int
		activeTokens   int
	)
	if err := pg.QueryRow(ctx, `select email from users where id = $1::uuid`, registered.User.ID).Scan(&persistedEmail); err != nil {
		t.Fatal(err)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)
		from account_audit_events
		where user_id = $1::uuid
		  and event_type = 'email_changed'
	`, registered.User.ID).Scan(&emailAudit); err != nil {
		t.Fatal(err)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)
		from account_email_change_tokens
		where user_id = $1::uuid
		  and used_at is null
	`, registered.User.ID).Scan(&activeTokens); err != nil {
		t.Fatal(err)
	}
	if persistedEmail != newEmail || emailAudit != 1 || activeTokens != 0 {
		t.Fatalf("persisted email state: email=%q audit=%d active_tokens=%d", persistedEmail, emailAudit, activeTokens)
	}

	_ = deviceBSession
}
