//go:build integration

package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestPublicWordCatalogNeverLeaksLearningState(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table lesson_review_idempotency, lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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
		AppEnv: "test", HTTPAddr: ":0", LogLevel: "error", CORSAllowedOrigin: "http://test.local",
		PostgresDSN:    requiredEnv(t, "TEST_POSTGRES_DSN"),
		Redis:          config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret:      "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL: 15 * time.Minute, RefreshTokenTTL: 24 * time.Hour,
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewServer(app.Handler())
	defer testServer.Close()

	pageURL := testServer.URL + "/api/v1/catalog/words?source=academic-technical-english&sort=az&query=" + url.QueryEscape("analysis") + "&limit=5"
	page := getPublicJSONMap(t, pageURL, http.StatusOK)
	items, ok := page["items"].([]any)
	if !ok || len(items) == 0 {
		t.Fatalf("public catalog page has no items: %#v", page)
	}
	first, ok := items[0].(map[string]any)
	if !ok {
		t.Fatalf("public catalog item has unexpected shape: %#v", items[0])
	}
	assertNoLearningStateFields(t, first)
	if first["kind"] != "word" {
		t.Fatalf("public catalog item kind = %#v, want word", first["kind"])
	}

	wordID, ok := first["id"].(float64)
	if !ok || wordID <= 0 {
		t.Fatalf("public catalog item id = %#v", first["id"])
	}
	detail := getPublicJSONMap(t, fmt.Sprintf("%s/api/v1/catalog/words/%d", testServer.URL, int64(wordID)), http.StatusOK)
	assertNoLearningStateFields(t, detail)
	if detail["id"] != first["id"] || detail["lemma"] != first["lemma"] {
		t.Fatalf("public detail does not match catalog item: page=%#v detail=%#v", first, detail)
	}

	getPublicJSONMap(t, testServer.URL+"/api/v1/catalog/words?status=review", http.StatusUnprocessableEntity)
	getPublicJSONMap(t, testServer.URL+"/api/v1/catalog/words?source=phrases", http.StatusUnprocessableEntity)
	getPublicJSONMap(t, testServer.URL+"/api/v1/catalog/words/999999999", http.StatusNotFound)
	getPublicJSONMap(t, testServer.URL+"/api/v1/words", http.StatusUnauthorized)
}

func assertNoLearningStateFields(t *testing.T, item map[string]any) {
	t.Helper()
	for _, field := range []string{"status", "easiness", "intervalDays", "repetitions", "dueAt", "lastReviewedAt"} {
		if _, exists := item[field]; exists {
			t.Errorf("public catalog item leaks personalized field %q: %#v", field, item[field])
		}
	}
}

func getPublicJSONMap(t *testing.T, endpoint string, expectedStatus int) map[string]any {
	t.Helper()
	request, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		t.Fatalf("http.NewRequest(%q) error = %v", endpoint, err)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("GET %q error = %v", endpoint, err)
	}
	defer response.Body.Close()
	if response.StatusCode != expectedStatus {
		body, _ := io.ReadAll(response.Body)
		t.Fatalf("GET %q status = %d, want %d; body=%s", endpoint, response.StatusCode, expectedStatus, string(body))
	}
	var payload map[string]any
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode GET %q response: %v", endpoint, err)
	}
	return payload
}
