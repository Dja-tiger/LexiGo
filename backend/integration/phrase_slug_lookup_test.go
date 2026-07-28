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
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestPhraseSlugLookup(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table answer_suggestion_audit, answer_suggestions, lesson_review_idempotency, lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
		t.Fatalf("truncate test data: %v", err)
	}
	if _, err := catalog.Seed(ctx, pg); err != nil {
		t.Fatalf("catalog.Seed() error = %v", err)
	}

	var phraseID int64
	if err := pg.QueryRow(ctx, `
		insert into words(
			lemma, translation, part_of_speech, topic, examples, source, note,
			kind, slug, cloze, cloze_answer
		) values (
			'Keep the route stable.',
			'Сохраняйте маршрут стабильным.',
			'phrase',
			'Frontend Architecture',
			jsonb_build_array('Keep the route stable across reloads.'),
			'lexigo-technical-phrases-v1',
			'Durable backend-only route contract.',
			'phrase',
			'backend-route-contract',
			'Keep the route _____.',
			'stable'
		)
		returning id
	`).Scan(&phraseID); err != nil {
		t.Fatalf("insert phrase: %v", err)
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

	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("phrase-slug-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Phrase Slug Tester",
	}, http.StatusCreated)
	if _, err := pg.Exec(ctx, `
		update user_words
		set status = 'review', interval_days = 3, repetitions = 2
		where user_id = $1::uuid and word_id = $2
	`, registered.User.ID, phraseID); err != nil {
		t.Fatalf("set personalized phrase status: %v", err)
	}

	var phrase struct {
		ID          int64  `json:"id"`
		Kind        string `json:"kind"`
		Slug        string `json:"slug"`
		Lemma       string `json:"lemma"`
		Status      string `json:"status"`
		Repetitions int    `json:"repetitions"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/phrases/backend-route-contract", registered.Tokens.AccessToken, http.StatusOK, &phrase)
	if phrase.ID != phraseID || phrase.Kind != "phrase" || phrase.Slug != "backend-route-contract" || phrase.Lemma != "Keep the route stable." {
		t.Fatalf("unexpected phrase payload: %+v", phrase)
	}
	if phrase.Status != "review" || phrase.Repetitions != 2 {
		t.Fatalf("personalized learning state was not returned: %+v", phrase)
	}

	if _, err := pg.Exec(ctx, `
		insert into words(
			lemma, translation, part_of_speech, topic, examples, source, note,
			kind, slug, cloze, cloze_answer
		) values (
			'Duplicate route.', 'Дубликат маршрута.', 'phrase', 'Frontend Architecture',
			'[]'::jsonb, 'lexigo-technical-phrases-v1', '',
			'phrase', 'backend-route-contract', 'Duplicate _____.', 'route'
		)
	`); err == nil {
		t.Fatal("duplicate canonical phrase slug was accepted")
	}
	if _, err := pg.Exec(ctx, `
		insert into words(
			lemma, translation, part_of_speech, topic, examples, source, note,
			kind, slug, cloze, cloze_answer
		) values (
			'Invalid route.', 'Некорректный маршрут.', 'phrase', 'Frontend Architecture',
			'[]'::jsonb, 'lexigo-technical-phrases-v1', '',
			'phrase', 'Invalid-Route', 'Invalid _____.', 'route'
		)
	`); err == nil {
		t.Fatal("non-canonical phrase slug was accepted")
	}

	assertPhraseLookupError(t, testServer.URL+"/api/v1/phrases/Backend-route-contract", registered.Tokens.AccessToken, "phrase_not_found")
	assertPhraseLookupError(t, testServer.URL+"/api/v1/phrases/missing-route-contract", registered.Tokens.AccessToken, "phrase_not_found")

	other := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("phrase-other-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Other Phrase User",
	}, http.StatusCreated)
	if _, err := pg.Exec(ctx, "delete from user_words where user_id = $1::uuid and word_id = $2", other.User.ID, phraseID); err != nil {
		t.Fatalf("remove phrase assignment: %v", err)
	}
	assertPhraseLookupError(t, testServer.URL+"/api/v1/phrases/backend-route-contract", other.Tokens.AccessToken, "phrase_not_found")

	request, err := http.NewRequest(http.MethodGet, testServer.URL+"/api/v1/phrases/backend-route-contract", nil)
	if err != nil {
		t.Fatal(err)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauthenticated status = %d, want 401", response.StatusCode)
	}
}

func assertPhraseLookupError(t *testing.T, url, accessToken, expectedCode string) {
	t.Helper()
	request, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusNotFound {
		t.Fatalf("lookup status = %d, want 404", response.StatusCode)
	}
	var payload struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode lookup error: %v", err)
	}
	if payload.Error.Code != expectedCode {
		t.Fatalf("lookup error code = %q, want %q", payload.Error.Code, expectedCode)
	}
}
