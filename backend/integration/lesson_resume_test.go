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

func TestResumeLessonAcrossRequests(t *testing.T) {
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

	email := fmt.Sprintf("resume-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Learner",
	}, http.StatusCreated)

	var due struct {
		Items []struct {
			ID int64 `json:"id"`
		} `json:"items"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?limit=3", registered.Tokens.AccessToken, http.StatusOK, &due)
	if len(due.Items) != 3 {
		t.Fatalf("due items = %d, want 3", len(due.Items))
	}
	wordIDs := []int64{due.Items[0].ID, due.Items[1].ID, due.Items[2].ID}

	type lessonItem struct {
		ID     int64   `json:"id"`
		Rating *string `json:"rating"`
	}
	type lessonPayload struct {
		ID           string       `json:"id"`
		CurrentIndex int          `json:"currentIndex"`
		Status       string       `json:"status"`
		Items        []lessonItem `json:"items"`
	}

	var created lessonPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "recall", "lessonSize": "30", "wordIds": wordIDs,
	}, http.StatusCreated, &created)
	if created.ID == "" || created.CurrentIndex != 0 || created.Status != "active" || len(created.Items) != 3 {
		t.Fatalf("unexpected created lesson: %+v", created)
	}

	var resumed lessonPayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &resumed)
	if resumed.ID != created.ID || resumed.CurrentIndex != 0 || len(resumed.Items) != 3 {
		t.Fatalf("unexpected resumed lesson: %+v", resumed)
	}

	var reviewed struct {
		LessonCurrentIndex int  `json:"lessonCurrentIndex"`
		LessonCompleted    bool `json:"lessonCompleted"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[0]), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "responseMs": 900, "answerMode": "recall", "correct": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &reviewed)
	if reviewed.LessonCurrentIndex != 1 || reviewed.LessonCompleted {
		t.Fatalf("unexpected review response: %+v", reviewed)
	}

	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &resumed)
	if resumed.CurrentIndex != 1 || resumed.Items[0].Rating == nil || *resumed.Items[0].Rating != "known" {
		t.Fatalf("lesson did not resume at the next item: %+v", resumed)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodDelete, testServer.URL+"/api/v1/lessons/"+created.ID, nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+registered.Tokens.AccessToken)
	doJSONRequest(t, request, http.StatusNoContent, nil)

	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusNotFound, nil)
}
