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

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestPersistentLearningFlow(t *testing.T) {
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

	email := fmt.Sprintf("learning-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Learner",
	}, http.StatusCreated)

	var duePayload struct {
		Items []struct {
			ID int64 `json:"id"`
		} `json:"items"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?limit=1", registered.Tokens.AccessToken, http.StatusOK, &duePayload)
	if len(duePayload.Items) != 1 {
		t.Fatalf("due items = %d, want 1", len(duePayload.Items))
	}
	wordID := duePayload.Items[0].ID

	var review struct {
		Status       string    `json:"status"`
		IntervalDays int       `json:"intervalDays"`
		Repetitions  int       `json:"repetitions"`
		DueAt        time.Time `json:"dueAt"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, wordID), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "responseMs": 1200, "answerMode": "recall", "correct": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &review)
	if review.Status != "review" || review.IntervalDays != 2 || review.Repetitions != 1 || !review.DueAt.After(time.Now()) {
		t.Fatalf("unexpected review result: %+v", review)
	}

	var eventCount int
	var rating, answerMode string
	var correct bool
	if err := pg.QueryRow(ctx, `
		select count(*)::int, max(rating), max(answer_mode), bool_and(correct)
		from review_events
		where word_id = $1
	`, wordID).Scan(&eventCount, &rating, &answerMode, &correct); err != nil {
		t.Fatalf("query review event: %v", err)
	}
	if eventCount != 1 || rating != "known" || answerMode != "recall" || !correct {
		t.Fatalf("unexpected review event: count=%d rating=%s mode=%s correct=%v", eventCount, rating, answerMode, correct)
	}

	var progress struct {
		DueNow        int `json:"dueNow"`
		TotalWords    int `json:"totalWords"`
		ReviewsToday  int `json:"reviewsToday"`
		DailyGoal     int `json:"dailyGoal"`
		CurrentStreak int `json:"currentStreak"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/progress?timezoneOffsetMinutes=0", registered.Tokens.AccessToken, http.StatusOK, &progress)
	if progress.TotalWords != catalog.ExpectedCount || progress.DueNow != catalog.ExpectedCount-1 || progress.ReviewsToday != 1 || progress.DailyGoal != 30 || progress.CurrentStreak != 1 {
		t.Fatalf("unexpected progress: %+v", progress)
	}

	putAuthenticatedJSON(t, testServer.URL+"/api/v1/progress/goal?timezoneOffsetMinutes=0", registered.Tokens.AccessToken, map[string]int{
		"dailyGoal": 60,
	}, http.StatusOK, &progress)
	if progress.DailyGoal != 60 {
		t.Fatalf("daily goal = %d, want 60", progress.DailyGoal)
	}
}

func getAuthenticatedJSON(t *testing.T, url, accessToken string, expectedStatus int, target any) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodGet, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	doJSONRequest(t, request, expectedStatus, target)
}

func postAuthenticatedJSON(t *testing.T, url, accessToken string, payload any, expectedStatus int, target any) {
	t.Helper()
	authenticatedJSONRequest(t, http.MethodPost, url, accessToken, payload, expectedStatus, target)
}

func putAuthenticatedJSON(t *testing.T, url, accessToken string, payload any, expectedStatus int, target any) {
	t.Helper()
	authenticatedJSONRequest(t, http.MethodPut, url, accessToken, payload, expectedStatus, target)
}

func authenticatedJSONRequest(t *testing.T, method, url, accessToken string, payload any, expectedStatus int, target any) {
	t.Helper()
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	request, err := http.NewRequestWithContext(context.Background(), method, url, bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	request.Header.Set("Content-Type", "application/json")
	doJSONRequest(t, request, expectedStatus, target)
}

func doJSONRequest(t *testing.T, request *http.Request, expectedStatus int, target any) {
	t.Helper()
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != expectedStatus {
		t.Fatalf("%s %s status = %d, body = %s", request.Method, request.URL, response.StatusCode, body)
	}
	if target != nil && len(body) > 0 {
		if err := json.Unmarshal(body, target); err != nil {
			t.Fatalf("decode response: %v; body=%s", err, body)
		}
	}
}
