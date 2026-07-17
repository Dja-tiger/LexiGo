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

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

type lessonCompositionPayload struct {
	Total            int    `json:"total"`
	Words            int    `json:"words"`
	Phrases          int    `json:"phrases"`
	Due              int    `json:"due"`
	New              int    `json:"new"`
	Scheduled        int    `json:"scheduled"`
	AvailableWords   int    `json:"availableWords"`
	AvailablePhrases int    `json:"availablePhrases"`
	Fallback         string `json:"fallback"`
}

func TestMixedLessonComposerPreviewCreateAndFallback(t *testing.T) {
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

	email := fmt.Sprintf("mixed-composer-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Mixed Learner",
	}, http.StatusCreated)

	var userID string
	if err := pg.QueryRow(ctx, "select id::text from users where email = $1", email).Scan(&userID); err != nil {
		t.Fatalf("query user id: %v", err)
	}
	var wordOne, wordTwo, phraseOne, phraseTwo int64
	if err := pg.QueryRow(ctx, `select min(id), max(id) filter (where id = (select min(id) from words where kind = 'word') + 1) from words where kind = 'word'`).Scan(&wordOne, &wordTwo); err != nil || wordTwo == 0 {
		rows, queryErr := pg.Query(ctx, "select id from words where kind = 'word' order by id limit 2")
		if queryErr != nil {
			t.Fatalf("query word ids: %v", queryErr)
		}
		defer rows.Close()
		ids := make([]int64, 0, 2)
		for rows.Next() {
			var id int64
			if scanErr := rows.Scan(&id); scanErr != nil {
				t.Fatalf("scan word id: %v", scanErr)
			}
			ids = append(ids, id)
		}
		if len(ids) != 2 {
			t.Fatalf("word ids = %v", ids)
		}
		wordOne, wordTwo = ids[0], ids[1]
	}
	rows, err := pg.Query(ctx, "select id from words where kind = 'phrase' order by id limit 2")
	if err != nil {
		t.Fatalf("query phrase ids: %v", err)
	}
	phraseIDs := make([]int64, 0, 2)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			t.Fatalf("scan phrase id: %v", err)
		}
		phraseIDs = append(phraseIDs, id)
	}
	rows.Close()
	if len(phraseIDs) != 2 {
		t.Fatalf("phrase ids = %v", phraseIDs)
	}
	phraseOne, phraseTwo = phraseIDs[0], phraseIDs[1]

	if _, err := pg.Exec(ctx, "update user_words set due_at = now() + interval '30 days', status = 'new' where user_id = $1::uuid", userID); err != nil {
		t.Fatalf("move queue to future: %v", err)
	}
	if _, err := pg.Exec(ctx, "update user_words set due_at = now() - interval '2 hours', status = 'review' where user_id = $1::uuid and word_id = any($2::bigint[])", userID, []int64{wordOne, phraseOne}); err != nil {
		t.Fatalf("mark due candidates: %v", err)
	}

	var preview struct {
		Composition lessonCompositionPayload `json:"composition"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/preview", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "study", "lessonSize": "15",
	}, http.StatusOK, &preview)
	if preview.Composition.Total != 15 || preview.Composition.Words != 8 || preview.Composition.Phrases != 7 || preview.Composition.Due != 2 || preview.Composition.New != 13 || preview.Composition.Fallback != "" {
		t.Fatalf("unexpected mixed preview: %+v", preview.Composition)
	}

	var lesson struct {
		ID    string `json:"id"`
		Items []struct {
			ID   int64  `json:"id"`
			Kind string `json:"kind"`
		} `json:"items"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "study", "lessonSize": "15",
	}, http.StatusCreated, &lesson)
	if lesson.ID == "" || len(lesson.Items) != 15 {
		t.Fatalf("unexpected lesson: %+v", lesson)
	}
	if lesson.Items[0].ID != wordOne || lesson.Items[0].Kind != "word" || lesson.Items[1].ID != phraseOne || lesson.Items[1].Kind != "phrase" {
		t.Fatalf("due candidates were not first and alternating: %+v", lesson.Items[:2])
	}
	for index := 1; index < len(lesson.Items); index++ {
		if lesson.Items[index].Kind == lesson.Items[index-1].Kind {
			t.Fatalf("mixed items did not alternate at %d: %+v", index, lesson.Items)
		}
	}

	if _, err := pg.Exec(ctx, "update user_words set due_at = now() + interval '30 days' where user_id = $1::uuid and word_id in (select id from words where kind = 'phrase')", userID); err != nil {
		t.Fatalf("move phrases out of due queue: %v", err)
	}
	if _, err := pg.Exec(ctx, "update user_words set due_at = now() - interval '1 hour' where user_id = $1::uuid and word_id = $2", userID, wordTwo); err != nil {
		t.Fatalf("mark word due: %v", err)
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/preview", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "recall", "lessonSize": "15",
	}, http.StatusOK, &preview)
	if preview.Composition.Total < 1 || preview.Composition.Words < 1 || preview.Composition.Phrases != 0 || preview.Composition.Fallback != "words_only" {
		t.Fatalf("unexpected words-only fallback: %+v", preview.Composition)
	}

	_ = phraseTwo
}
