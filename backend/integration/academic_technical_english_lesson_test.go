//go:build integration

package integration

import (
	"context"
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

func TestAcademicTechnicalEnglishLessonUsesOnlyCuratedCatalogSource(t *testing.T) {
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
		AppEnv: "test", HTTPAddr: ":0", LogLevel: "error", CORSAllowedOrigin: "http://test.local",
		PostgresDSN: requiredEnv(t, "TEST_POSTGRES_DSN"), Redis: config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret: "integration-test-secret-with-at-least-32-bytes", AccessTokenTTL: 15 * time.Minute, RefreshTokenTTL: 24 * time.Hour,
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewServer(app.Handler())
	defer testServer.Close()

	email := fmt.Sprintf("academic-lesson-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Academic Learner",
	}, http.StatusCreated)

	type previewPayload struct {
		Source      string `json:"source"`
		Composition struct {
			Total          int `json:"total"`
			AvailableWords int `json:"availableWords"`
			Phrases        int `json:"phrases"`
		} `json:"composition"`
	}
	request := map[string]any{"source": "academic-technical-english", "studyMode": "study", "lessonSize": "15"}
	var preview previewPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/preview", registered.Tokens.AccessToken, request, http.StatusOK, &preview)
	if preview.Source != "academic-technical-english" || preview.Composition.Total != 15 || preview.Composition.AvailableWords != catalog.ExpectedCount || preview.Composition.Phrases != 0 {
		t.Fatalf("unexpected academic preview: %+v", preview)
	}

	type lessonItem struct {
		ID    int64  `json:"id"`
		Kind  string `json:"kind"`
		Topic string `json:"topic"`
	}
	var lesson struct {
		ID     string       `json:"id"`
		Source string       `json:"source"`
		Items  []lessonItem `json:"items"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, request, http.StatusCreated, &lesson)
	if lesson.ID == "" || lesson.Source != "academic-technical-english" || len(lesson.Items) != 15 {
		t.Fatalf("unexpected academic lesson: %+v", lesson)
	}
	ids := make([]int64, 0, len(lesson.Items))
	for _, item := range lesson.Items {
		if item.Kind != "word" || item.Topic != catalog.Topic {
			t.Fatalf("unexpected academic lesson item: %+v", item)
		}
		ids = append(ids, item.ID)
	}
	var matching int
	if err := pg.QueryRow(ctx, "select count(*)::int from words where id = any($1::bigint[]) and source = $2", ids, catalog.Source).Scan(&matching); err != nil {
		t.Fatalf("query academic lesson sources: %v", err)
	}
	if matching != len(ids) {
		t.Fatalf("academic source matches = %d, want %d", matching, len(ids))
	}
}
