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

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

type integrationTokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type integrationAuthResponse struct {
	Tokens integrationTokenPair `json:"tokens"`
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
		AppEnv:            "test",
		HTTPAddr:          ":0",
		LogLevel:          "error",
		CORSAllowedOrigin: "http://test.local",
		PostgresDSN:       requiredEnv(t, "TEST_POSTGRES_DSN"),
		Redis:             config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret:         "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL:    15 * time.Minute,
		RefreshTokenTTL:   24 * time.Hour,
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewServer(app.Handler())
	defer testServer.Close()

	email := fmt.Sprintf("integration-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Integration Test",
	}, http.StatusCreated)
	if registered.Tokens.AccessToken == "" || registered.Tokens.RefreshToken == "" {
		t.Fatal("register response does not contain tokens")
	}

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

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, testServer.URL+"/api/v1/me", nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+registered.Tokens.AccessToken)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("GET /me status = %d", response.StatusCode)
	}

	dueRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, testServer.URL+"/api/v1/words/due?limit=1", nil)
	if err != nil {
		t.Fatal(err)
	}
	dueRequest.Header.Set("Authorization", "Bearer "+registered.Tokens.AccessToken)
	dueResponse, err := http.DefaultClient.Do(dueRequest)
	if err != nil {
		t.Fatal(err)
	}
	defer dueResponse.Body.Close()
	if dueResponse.StatusCode != http.StatusOK {
		t.Fatalf("GET /words/due status = %d", dueResponse.StatusCode)
	}
	var duePayload struct {
		Items []struct {
			Lemma string `json:"lemma"`
		} `json:"items"`
		Count int `json:"count"`
	}
	if err := json.NewDecoder(dueResponse.Body).Decode(&duePayload); err != nil {
		t.Fatalf("decode due words: %v", err)
	}
	if duePayload.Count != 1 || len(duePayload.Items) != 1 || duePayload.Items[0].Lemma != "absolute" {
		t.Fatalf("unexpected due words payload: %+v", duePayload)
	}

	refreshed := postJSON[integrationTokenPair](t, testServer.URL+"/api/v1/auth/refresh", map[string]string{
		"refreshToken": registered.Tokens.RefreshToken,
	}, http.StatusOK)
	if refreshed.RefreshToken == registered.Tokens.RefreshToken || refreshed.AccessToken == "" {
		t.Fatal("refresh token was not rotated")
	}

	postJSON[map[string]any](t, testServer.URL+"/api/v1/auth/refresh", map[string]string{
		"refreshToken": registered.Tokens.RefreshToken,
	}, http.StatusUnauthorized)

	loggedIn := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "strong-password",
	}, http.StatusOK)
	if loggedIn.Tokens.AccessToken == "" {
		t.Fatal("login response does not contain access token")
	}

	postJSON[map[string]any](t, testServer.URL+"/api/v1/auth/logout", map[string]string{
		"refreshToken": refreshed.RefreshToken,
	}, http.StatusNoContent)
}

func postJSON[T any](t *testing.T, url string, payload any, expectedStatus int) T {
	t.Helper()
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, url, bytes.NewReader(body))
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
		t.Fatalf("POST %s status = %d, body = %s", url, response.StatusCode, responseBody)
	}

	var result T
	if len(responseBody) > 0 {
		if err := json.Unmarshal(responseBody, &result); err != nil {
			t.Fatalf("decode response: %v; body=%s", err, responseBody)
		}
	}
	return result
}
