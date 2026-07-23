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

func TestNextLessonExcludesCompletedBlockAndDeduplicatesRapidCreate(t *testing.T) {
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

	email := fmt.Sprintf("next-lesson-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Learner",
	}, http.StatusCreated)

	var userID string
	if err := pg.QueryRow(ctx, "select id::text from users where email = $1", email).Scan(&userID); err != nil {
		t.Fatalf("query registered user: %v", err)
	}
	rows, err := pg.Query(ctx, "select word_id from user_words where user_id = $1::uuid order by word_id limit 6", userID)
	if err != nil {
		t.Fatalf("query assigned words: %v", err)
	}
	wordIDs := make([]int64, 0, 6)
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			t.Fatalf("scan assigned word: %v", err)
		}
		wordIDs = append(wordIDs, wordID)
	}
	rows.Close()
	if len(wordIDs) < 6 {
		t.Fatalf("assigned words = %d, want at least 6", len(wordIDs))
	}
	firstWordIDs := append([]int64(nil), wordIDs[:3]...)
	if _, err := pg.Exec(ctx, `
		update user_words
		set status = 'learning', due_at = now() - interval '1 hour'
		where user_id = $1::uuid and word_id = any($2::bigint[])
	`, userID, firstWordIDs); err != nil {
		t.Fatalf("prepare due study block: %v", err)
	}

	type lessonItem struct {
		ID int64 `json:"id"`
	}
	type lessonPayload struct {
		ID      string       `json:"id"`
		Version int64        `json:"version"`
		Items   []lessonItem `json:"items"`
	}
	var first lessonPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "study", "lessonSize": "15", "wordIds": firstWordIDs,
	}, http.StatusCreated, &first)
	if first.ID == "" || len(first.Items) != 3 {
		t.Fatalf("unexpected first lesson: %+v", first)
	}

	version := first.Version
	for index, item := range first.Items {
		var result struct {
			LessonVersion   int64 `json:"lessonVersion"`
			LessonCompleted bool  `json:"lessonCompleted"`
		}
		postAuthenticatedJSON(t,
			fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, first.ID, item.ID),
			registered.Tokens.AccessToken,
			map[string]any{
				"lessonVersion": version, "rating": "known", "responseMs": 200,
				"answerMode": "study", "answerRevealed": true, "timezoneOffsetMinutes": 0,
			},
			http.StatusOK,
			&result,
		)
		version = result.LessonVersion
		if result.LessonCompleted != (index == len(first.Items)-1) {
			t.Fatalf("completion after item %d = %v", index, result.LessonCompleted)
		}
	}

	createPayload := map[string]any{"source": "mixed", "studyMode": "study", "lessonSize": "15"}
	var next lessonPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, createPayload, http.StatusCreated, &next)
	if next.ID == "" || next.ID == first.ID || len(next.Items) == 0 {
		t.Fatalf("unexpected next lesson: %+v", next)
	}
	completed := make(map[int64]struct{}, len(first.Items))
	for _, item := range first.Items {
		completed[item.ID] = struct{}{}
	}
	for _, item := range next.Items {
		if _, repeated := completed[item.ID]; repeated {
			t.Fatalf("next lesson repeated completed word %d", item.ID)
		}
	}

	var duplicate lessonPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, createPayload, http.StatusCreated, &duplicate)
	if duplicate.ID != next.ID {
		t.Fatalf("rapid duplicate created lesson %s, want existing %s", duplicate.ID, next.ID)
	}
	var activeCount int
	if err := pg.QueryRow(ctx, "select count(*)::int from lesson_sessions where user_id = $1::uuid and status = 'active'", userID).Scan(&activeCount); err != nil {
		t.Fatalf("count active lessons: %v", err)
	}
	if activeCount != 1 {
		t.Fatalf("active lesson count = %d, want 1", activeCount)
	}
}
