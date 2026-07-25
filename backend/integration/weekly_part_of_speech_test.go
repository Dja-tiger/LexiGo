//go:build integration

package integration

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestWeeklyWeakPartOfSpeechRecommendationUsesDueSource(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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

	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("weekly-pos-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Weekly POS Learner",
	}, http.StatusCreated)

	type learningItem struct {
		ID           int64  `json:"id"`
		PartOfSpeech string `json:"partOfSpeech"`
	}
	var catalogPage struct {
		Items []learningItem `json:"items"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words?kind=word&limit=100", registered.Tokens.AccessToken, http.StatusOK, &catalogPage)

	var selected learningItem
	for _, item := range catalogPage.Items {
		normalized := strings.ToLower(strings.TrimSpace(item.PartOfSpeech))
		if normalized == "noun" || normalized == "verb" || normalized == "adjective" {
			selected = item
			break
		}
	}
	if selected.ID == 0 {
		t.Fatal("seed catalog does not contain an actionable noun, verb or adjective")
	}

	if _, err := pg.Exec(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
			answer_revealed, event_schema_version
		) values ($1::uuid, $2, 0, 1200, now(), 'again', 'recall', false, false, 2)
	`, registered.User.ID, selected.ID); err != nil {
		t.Fatalf("insert incorrect recall event: %v", err)
	}

	var progress struct {
		Weekly struct {
			WeakPartsOfSpeech []struct {
				PartOfSpeech string `json:"partOfSpeech"`
				Attempts     int    `json:"attempts"`
				Successful   int    `json:"successful"`
				Errors       int    `json:"errors"`
				Rate         int    `json:"rate"`
			} `json:"weakPartsOfSpeech"`
		} `json:"weekly"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/progress?timezoneOffsetMinutes=0", registered.Tokens.AccessToken, http.StatusOK, &progress)
	if len(progress.Weekly.WeakPartsOfSpeech) != 1 {
		t.Fatalf("weak parts of speech = %+v, want one recommendation", progress.Weekly.WeakPartsOfSpeech)
	}
	recommendation := progress.Weekly.WeakPartsOfSpeech[0]
	if recommendation.PartOfSpeech != strings.ToLower(strings.TrimSpace(selected.PartOfSpeech)) || recommendation.Attempts != 1 || recommendation.Successful != 0 || recommendation.Errors != 1 || recommendation.Rate != 0 {
		t.Fatalf("weak part-of-speech recommendation = %+v", recommendation)
	}

	var due struct {
		Items []learningItem `json:"items"`
	}
	getAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/words/due?kind=all&source=%s&limit=100", testServer.URL, recommendation.PartOfSpeech),
		registered.Tokens.AccessToken,
		http.StatusOK,
		&due,
	)
	found := false
	for _, item := range due.Items {
		if item.ID == selected.ID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("due source %q did not return recommended item %d", recommendation.PartOfSpeech, selected.ID)
	}
}
