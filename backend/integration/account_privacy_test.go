//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestAccountExportAndDeletionLifecycle(t *testing.T) {
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
		t.Fatalf("truncate account privacy test data: %v", err)
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
	client := newIntegrationClient(t, testServer)

	email := "privacy-export-delete@example.com"
	registeredResult := postJSONWithClient(t, client, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       email,
		"password":    "strong-password",
		"displayName": "Privacy User",
	}, "", http.StatusCreated)
	registered := decodeJSON[integrationAuthResponse](t, registeredResult.Body)
	refreshToken := requireSessionCookies(t, registeredResult.Cookies)
	csrf := cookieFromJar(t, client, testServer.URL, integrationCSRFCookieName)

	privacyRequest(
		t,
		client,
		http.MethodPost,
		testServer.URL+"/api/v1/account/export",
		map[string]string{"currentPassword": "wrong-password"},
		registered.Tokens.AccessToken,
		csrf,
		http.StatusUnauthorized,
	)

	exportResponse := privacyRequest(
		t,
		client,
		http.MethodPost,
		testServer.URL+"/api/v1/account/export",
		map[string]string{"currentPassword": "strong-password"},
		registered.Tokens.AccessToken,
		csrf,
		http.StatusOK,
	)
	if !strings.Contains(exportResponse.Header.Get("Content-Disposition"), "lexigo-export-") {
		t.Fatalf("export Content-Disposition = %q", exportResponse.Header.Get("Content-Disposition"))
	}
	if exportResponse.Header.Get("Cache-Control") != "no-store" {
		t.Fatalf("export Cache-Control = %q", exportResponse.Header.Get("Cache-Control"))
	}
	var exported map[string]any
	if err := json.Unmarshal(exportResponse.Body, &exported); err != nil {
		t.Fatalf("decode export: %v; body=%s", err, exportResponse.Body)
	}
	if exported["schemaVersion"] != float64(1) {
		t.Fatalf("schemaVersion = %#v, want 1", exported["schemaVersion"])
	}
	accountValue, ok := exported["account"].(map[string]any)
	if !ok || accountValue["email"] != email {
		t.Fatalf("exported account = %#v", exported["account"])
	}
	rawExport := string(exportResponse.Body)
	for _, forbidden := range []string{"passwordHash", "refreshToken", "tokenHash"} {
		if strings.Contains(rawExport, forbidden) {
			t.Fatalf("export contains forbidden secret field %q: %s", forbidden, rawExport)
		}
	}

	privacyRequest(
		t,
		client,
		http.MethodDelete,
		testServer.URL+"/api/v1/account",
		map[string]string{
			"currentPassword":   "strong-password",
			"confirmationEmail": "different@example.com",
		},
		registered.Tokens.AccessToken,
		csrf,
		http.StatusUnprocessableEntity,
	)

	deleteResponse := privacyRequest(
		t,
		client,
		http.MethodDelete,
		testServer.URL+"/api/v1/account",
		map[string]string{
			"currentPassword":   "strong-password",
			"confirmationEmail": email,
		},
		registered.Tokens.AccessToken,
		csrf,
		http.StatusNoContent,
	)
	if deleteResponse.Header.Get("Clear-Site-Data") != `"cache", "storage"` {
		t.Fatalf("Clear-Site-Data = %q", deleteResponse.Header.Get("Clear-Site-Data"))
	}
	if len(deleteResponse.Cookies) < 2 {
		t.Fatalf("deleted account response cookies = %+v", deleteResponse.Cookies)
	}
	for _, cookie := range deleteResponse.Cookies {
		if cookie.MaxAge >= 0 {
			t.Fatalf("cookie %s MaxAge = %d, want negative", cookie.Name, cookie.MaxAge)
		}
	}

	getWithToken(t, client, testServer.URL+"/api/v1/me", registered.Tokens.AccessToken, http.StatusUnauthorized)
	postJSONWithClient(t, client, testServer.URL+"/api/v1/auth/refresh", nil, csrf, http.StatusForbidden)
	replayRefreshToken(t, testServer, refreshToken, csrf, http.StatusUnauthorized)

	for table, want := range map[string]int{
		"users":                0,
		"refresh_tokens":       0,
		"account_audit_events": 0,
	} {
		var count int
		query := "select count(*) from " + table // table names are static test constants.
		if err := pg.QueryRow(ctx, query).Scan(&count); err != nil {
			t.Fatalf("count %s: %v", table, err)
		}
		if count != want {
			t.Fatalf("%s count = %d, want %d", table, count, want)
		}
	}
}

type privacyHTTPResponse struct {
	Header  http.Header
	Cookies []*http.Cookie
	Body    []byte
}

func privacyRequest(
	t *testing.T,
	client *http.Client,
	method,
	endpoint string,
	payload any,
	accessToken,
	csrfToken string,
	expectedStatus int,
) privacyHTTPResponse {
	t.Helper()
	encoded, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	request, err := http.NewRequestWithContext(context.Background(), method, endpoint, bytes.NewReader(encoded))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+accessToken)
	request.Header.Set("X-CSRF-Token", csrfToken)
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != expectedStatus {
		t.Fatalf("%s %s status = %d, want %d, body = %s", method, endpoint, response.StatusCode, expectedStatus, body)
	}
	return privacyHTTPResponse{Header: response.Header.Clone(), Cookies: response.Cookies(), Body: body}
}
