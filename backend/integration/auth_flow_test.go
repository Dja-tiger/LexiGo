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
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

const (
	integrationRefreshCookieName = "lexigo_refresh"
	integrationCSRFCookieName    = "lexigo_csrf"
)

type integrationTokenPair struct {
	AccessToken string `json:"accessToken"`
	TokenType   string `json:"tokenType"`
	ExpiresIn   int64  `json:"expiresIn"`
}

type integrationUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type integrationAuthResponse struct {
	User   integrationUser      `json:"user"`
	Tokens integrationTokenPair `json:"tokens"`
}

type integrationHTTPResult struct {
	Body    []byte
	Cookies []*http.Cookie
}

func TestCompleteAuthenticationFlow(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table lesson_session_items, lesson_sessions, review_events, user_learning_preferences, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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
	email := fmt.Sprintf("integration-%d@example.com", time.Now().UnixNano())

	registeredResult := postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Integration Test",
	}, "", http.StatusCreated)
	if bytes.Contains(registeredResult.Body, []byte("refreshToken")) {
		t.Fatal("register response leaked the refresh token")
	}
	registered := decodeJSON[integrationAuthResponse](t, registeredResult.Body)
	if registered.Tokens.AccessToken == "" || registered.User.Email != email {
		t.Fatalf("unexpected register response: %+v", registered)
	}
	oldDeviceARefresh := requireSessionCookies(t, registeredResult.Cookies)

	var enrolledWords int
	if err := pg.QueryRow(ctx, `
		select count(*)
		from user_words
		join users on users.id = user_words.user_id
		where users.email = $1
	`, email).Scan(&enrolledWords); err != nil {
		t.Fatalf("count enrolled words: %v", err)
	}
	if enrolledWords != catalog.ExpectedCount {
		t.Fatalf("enrolled words = %d, want %d", enrolledWords, catalog.ExpectedCount)
	}

	getWithBearer(t, deviceA, testServer.URL+"/api/v1/me", registered.Tokens.AccessToken, http.StatusOK)
	assertDueWord(t, deviceA, testServer.URL, registered.Tokens.AccessToken)

	withoutCSRF := postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, "", http.StatusForbidden)
	if !bytes.Contains(withoutCSRF.Body, []byte("csrf_failed")) {
		t.Fatalf("missing CSRF error: %s", withoutCSRF.Body)
	}

	deviceACSRF := cookieFromJar(t, deviceA, testServer.URL, integrationCSRFCookieName)
	refreshedResult := postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, deviceACSRF, http.StatusOK)
	if bytes.Contains(refreshedResult.Body, []byte("refreshToken")) {
		t.Fatal("refresh response leaked the refresh token")
	}
	refreshed := decodeJSON[integrationAuthResponse](t, refreshedResult.Body)
	if refreshed.Tokens.AccessToken == "" || refreshed.User.ID != registered.User.ID {
		t.Fatalf("unexpected refresh response: %+v", refreshed)
	}
	requireSessionCookies(t, refreshedResult.Cookies)

	loggedInResult := postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "strong-password",
	}, "", http.StatusOK)
	loggedIn := decodeJSON[integrationAuthResponse](t, loggedInResult.Body)
	if loggedIn.Tokens.AccessToken == "" {
		t.Fatal("login response does not contain access token")
	}
	requireSessionCookies(t, loggedInResult.Cookies)

	currentDeviceACSRF := cookieFromJar(t, deviceA, testServer.URL, integrationCSRFCookieName)
	replayRefreshToken(t, testServer, oldDeviceARefresh, currentDeviceACSRF, http.StatusUnauthorized)
	postJSONWithClient(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, currentDeviceACSRF, http.StatusUnauthorized)

	// Reuse revokes only the compromised device family. An independent login on
	// another device remains valid and can continue rotating its own token.
	deviceBCSRF := cookieFromJar(t, deviceB, testServer.URL, integrationCSRFCookieName)
	postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/refresh", nil, deviceBCSRF, http.StatusOK)
	currentDeviceBRefresh := cookieFromJar(t, deviceB, testServer.URL, integrationRefreshCookieName)
	currentDeviceBCSRF := cookieFromJar(t, deviceB, testServer.URL, integrationCSRFCookieName)

	logoutResult := postJSONWithClient(t, deviceB, testServer.URL+"/api/v1/auth/logout", nil, currentDeviceBCSRF, http.StatusNoContent)
	requireClearedSessionCookies(t, logoutResult.Cookies)
	if hasCookie(deviceB, testServer.URL, integrationRefreshCookieName) || hasCookie(deviceB, testServer.URL, integrationCSRFCookieName) {
		t.Fatal("logout did not remove session cookies from the client jar")
	}
	replayRefreshToken(t, testServer, currentDeviceBRefresh, currentDeviceBCSRF, http.StatusUnauthorized)
}

func newIntegrationClient(t *testing.T, testServer *httptest.Server) *http.Client {
	t.Helper()
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	client := testServer.Client()
	client.Jar = jar
	return client
}

func postJSONWithClient(t *testing.T, client *http.Client, endpoint string, payload any, csrfToken string, expectedStatus int) integrationHTTPResult {
	t.Helper()
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			t.Fatal(err)
		}
		body = bytes.NewReader(encoded)
	}
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, body)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Accept", "application/json")
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
		t.Fatalf("POST %s status = %d, want %d, body = %s", endpoint, response.StatusCode, expectedStatus, responseBody)
	}
	return integrationHTTPResult{Body: responseBody, Cookies: response.Cookies()}
}

func decodeJSON[T any](t *testing.T, body []byte) T {
	t.Helper()
	var result T
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("decode response: %v; body=%s", err, body)
	}
	return result
}

func requireSessionCookies(t *testing.T, cookies []*http.Cookie) string {
	t.Helper()
	var refreshValue string
	var refreshSeen, csrfSeen bool
	for _, cookie := range cookies {
		switch cookie.Name {
		case integrationRefreshCookieName:
			refreshSeen = true
			if !cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/api/v1/auth" {
				t.Fatalf("insecure refresh cookie: %+v", cookie)
			}
			refreshValue = cookie.Value
		case integrationCSRFCookieName:
			csrfSeen = true
			if cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/" {
				t.Fatalf("invalid CSRF cookie: %+v", cookie)
			}
		}
	}
	if !refreshSeen || !csrfSeen || refreshValue == "" {
		t.Fatalf("session cookies are missing: %+v", cookies)
	}
	return refreshValue
}

func requireClearedSessionCookies(t *testing.T, cookies []*http.Cookie) {
	t.Helper()
	var refreshCleared, csrfCleared bool
	for _, cookie := range cookies {
		switch cookie.Name {
		case integrationRefreshCookieName:
			refreshCleared = cookie.MaxAge < 0 && cookie.Value == ""
		case integrationCSRFCookieName:
			csrfCleared = cookie.MaxAge < 0 && cookie.Value == ""
		}
	}
	if !refreshCleared || !csrfCleared {
		t.Fatalf("session deletion cookies are missing: %+v", cookies)
	}
}

func cookieFromJar(t *testing.T, client *http.Client, baseURL, name string) string {
	t.Helper()
	parsed, err := url.Parse(baseURL)
	if err != nil {
		t.Fatal(err)
	}
	for _, cookie := range client.Jar.Cookies(parsed) {
		if cookie.Name == name {
			return cookie.Value
		}
	}
	t.Fatalf("cookie %q is missing", name)
	return ""
}

func hasCookie(client *http.Client, baseURL, name string) bool {
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return false
	}
	for _, cookie := range client.Jar.Cookies(parsed) {
		if cookie.Name == name {
			return true
		}
	}
	return false
}

func replayRefreshToken(t *testing.T, testServer *httptest.Server, refreshToken, csrfToken string, expectedStatus int) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, testServer.URL+"/api/v1/auth/refresh", nil)
	if err != nil {
		t.Fatal(err)
	}
	request.AddCookie(&http.Cookie{Name: integrationRefreshCookieName, Value: refreshToken, Path: "/api/v1/auth", Secure: true})
	request.AddCookie(&http.Cookie{Name: integrationCSRFCookieName, Value: csrfToken, Path: "/", Secure: true})
	request.Header.Set("X-CSRF-Token", csrfToken)
	response, err := testServer.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != expectedStatus {
		body, _ := io.ReadAll(response.Body)
		t.Fatalf("replay status = %d, want %d, body = %s", response.StatusCode, expectedStatus, body)
	}
}

func getWithBearer(t *testing.T, client *http.Client, endpoint, accessToken string, expectedStatus int) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodGet, endpoint, nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != expectedStatus {
		t.Fatalf("GET %s status = %d, want %d", endpoint, response.StatusCode, expectedStatus)
	}
}

func assertDueWord(t *testing.T, client *http.Client, baseURL, accessToken string) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodGet, baseURL+"/api/v1/words/due?limit=1", nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("GET /words/due status = %d", response.StatusCode)
	}
	var payload struct {
		Items []struct {
			Lemma string `json:"lemma"`
		} `json:"items"`
		Count int `json:"count"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode due words: %v", err)
	}
	if payload.Count != 1 || len(payload.Items) != 1 || payload.Items[0].Lemma != "absolute" {
		t.Fatalf("unexpected due words payload: %+v", payload)
	}
}

// postJSON is shared by the other integration scenarios. Those calls use
// bearer authentication only and therefore remain independent of cookie state.
func postJSON[T any](t *testing.T, endpoint string, payload any, expectedStatus int) T {
	t.Helper()
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != expectedStatus {
		t.Fatalf("POST %s status = %d, body = %s", endpoint, response.StatusCode, responseBody)
	}

	var result T
	if len(responseBody) > 0 {
		if err := json.Unmarshal(responseBody, &result); err != nil {
			t.Fatalf("decode response: %v; body=%s", err, responseBody)
		}
	}
	return result
}
