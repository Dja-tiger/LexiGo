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

func TestPersistentPhraseLearningFlow(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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
			'We need to identify the root cause.',
			'Нам нужно определить первопричину.',
			'phrase',
			'Incidents',
			jsonb_build_array('Before applying another workaround, we need to identify the root cause.'),
			'lexigo-technical-phrases-v1',
			'root cause — первопричина',
			'phrase',
			'phrase-root-cause',
			'We need to identify the _____ cause.',
			'root'
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

	email := fmt.Sprintf("phrase-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Phrase Learner",
	}, http.StatusCreated)

	type phrasePayload struct {
		ID          int64  `json:"id"`
		Kind        string `json:"kind"`
		Slug        string `json:"slug"`
		Cloze       string `json:"cloze"`
		ClozeAnswer string `json:"clozeAnswer"`
		Status      string `json:"status"`
	}
	var due struct {
		Items []phrasePayload `json:"items"`
		Count int             `json:"count"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?kind=phrase&limit=10", registered.Tokens.AccessToken, http.StatusOK, &due)
	if due.Count != 1 || len(due.Items) != 1 {
		t.Fatalf("due phrase count = %d, items = %d, want 1", due.Count, len(due.Items))
	}
	if due.Items[0].ID != phraseID || due.Items[0].Kind != "phrase" || due.Items[0].Slug != "phrase-root-cause" {
		t.Fatalf("unexpected due phrase: %+v", due.Items[0])
	}
	if due.Items[0].Cloze != "We need to identify the _____ cause." || due.Items[0].ClozeAnswer != "root" {
		t.Fatalf("cloze contract mismatch: %+v", due.Items[0])
	}

	var created struct {
		ID           string          `json:"id"`
		Source       string          `json:"source"`
		CurrentIndex int             `json:"currentIndex"`
		Items        []phrasePayload `json:"items"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "phrases", "studyMode": "recall", "lessonSize": "15", "wordIds": []int64{phraseID},
	}, http.StatusCreated, &created)
	if created.ID == "" || created.Source != "phrases" || created.CurrentIndex != 0 || len(created.Items) != 1 {
		t.Fatalf("unexpected phrase lesson: %+v", created)
	}

	var reviewed struct {
		LessonCompleted bool      `json:"lessonCompleted"`
		DueAt           time.Time `json:"dueAt"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, phraseID), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "responseMs": 700, "answerMode": "recall", "correct": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &reviewed)
	if !reviewed.LessonCompleted || !reviewed.DueAt.After(time.Now()) {
		t.Fatalf("unexpected phrase review: %+v", reviewed)
	}

	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?kind=phrase&limit=10", registered.Tokens.AccessToken, http.StatusOK, &due)
	if due.Count != 0 || len(due.Items) != 0 {
		t.Fatalf("reviewed phrase remained due: %+v", due)
	}

	var eventCount int
	var rating, answerMode string
	var correct bool
	if err := pg.QueryRow(ctx, `
		select count(*)::int, max(rating), max(answer_mode), bool_and(correct)
		from review_events
		where word_id = $1
	`, phraseID).Scan(&eventCount, &rating, &answerMode, &correct); err != nil {
		t.Fatalf("query phrase review event: %v", err)
	}
	if eventCount != 1 || rating != "known" || answerMode != "recall" || !correct {
		t.Fatalf("unexpected phrase review event: count=%d rating=%s mode=%s correct=%v", eventCount, rating, answerMode, correct)
	}

	loggedIn := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "strong-password",
	}, http.StatusOK)
	var progress struct {
		TotalWords      int `json:"totalWords"`
		TotalPhrases    int `json:"totalPhrases"`
		DuePhrases      int `json:"duePhrases"`
		ReviewsToday    int `json:"reviewsToday"`
		MasteredPhrases int `json:"masteredPhrases"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/progress?timezoneOffsetMinutes=0", loggedIn.Tokens.AccessToken, http.StatusOK, &progress)
	if progress.TotalWords != catalog.ExpectedCount || progress.TotalPhrases != 1 || progress.DuePhrases != 0 || progress.ReviewsToday != 1 || progress.MasteredPhrases != 0 {
		t.Fatalf("unexpected phrase progress after login: %+v", progress)
	}
}
