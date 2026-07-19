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
	"sort"
	"sync"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

func TestLessonReviewIdempotencySurvivesConcurrentReplay(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 40*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, "truncate table lesson_review_idempotency, lesson_session_items, lesson_sessions, review_events, user_learning_preferences, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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

	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": fmt.Sprintf("idempotency-%d@example.com", time.Now().UnixNano()),
		"password": "strong-password",
		"displayName": "Learner",
	}, http.StatusCreated)

	var due struct {
		Items []struct {
			ID int64 `json:"id"`
		} `json:"items"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?limit=1", registered.Tokens.AccessToken, http.StatusOK, &due)
	if len(due.Items) != 1 {
		t.Fatalf("due items = %d, want 1", len(due.Items))
	}

	var lesson struct {
		ID      string `json:"id"`
		Version int64  `json:"version"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed",
		"studyMode": "recall",
		"lessonSize": "15",
		"wordIds": []int64{due.Items[0].ID},
	}, http.StatusCreated, &lesson)

	endpoint := fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, lesson.ID, due.Items[0].ID)
	payload := lessonReviewPayload("known", lesson.Version)
	idempotencyKey := "780269b3-ea3f-4c82-8f25-19818e13d667"
	start := make(chan struct{})
	results := make(chan lessonHTTPResult, 2)
	var wait sync.WaitGroup
	for range 2 {
		wait.Add(1)
		go func() {
			defer wait.Done()
			<-start
			results <- sendIdempotentLessonReview(endpoint, registered.Tokens.AccessToken, idempotencyKey, payload)
		}()
	}
	close(start)
	wait.Wait()
	close(results)

	statuses := make([]int, 0, 2)
	responses := make([]lessonProgressPayload, 0, 2)
	for result := range results {
		if result.err != nil {
			t.Fatalf("idempotent review: %v", result.err)
		}
		statuses = append(statuses, result.status)
		var response lessonProgressPayload
		if err := json.Unmarshal(result.body, &response); err != nil {
			t.Fatalf("decode idempotent response: %v; body=%s", err, result.body)
		}
		responses = append(responses, response)
	}
	sort.Ints(statuses)
	if len(statuses) != 2 || statuses[0] != http.StatusOK || statuses[1] != http.StatusOK {
		t.Fatalf("idempotent statuses = %v, want [200 200]", statuses)
	}
	if len(responses) != 2 || responses[0] != responses[1] {
		t.Fatalf("idempotent responses differ: %+v", responses)
	}
	assertLessonProgress(t, responses[0], 1, 1, 2, true)

	var reviewEvents, idempotencyRows int
	if err := pg.QueryRow(ctx, "select count(*)::int from review_events where word_id = $1", due.Items[0].ID).Scan(&reviewEvents); err != nil {
		t.Fatalf("count review events: %v", err)
	}
	if err := pg.QueryRow(ctx, "select count(*)::int from lesson_review_idempotency where idempotency_key = $1::uuid", idempotencyKey).Scan(&idempotencyRows); err != nil {
		t.Fatalf("count idempotency rows: %v", err)
	}
	if reviewEvents != 1 || idempotencyRows != 1 {
		t.Fatalf("review events=%d idempotency rows=%d, want 1 and 1", reviewEvents, idempotencyRows)
	}

	changedPayload := lessonReviewPayload("almost", lesson.Version)
	conflict := sendIdempotentLessonReview(endpoint, registered.Tokens.AccessToken, idempotencyKey, changedPayload)
	if conflict.err != nil {
		t.Fatalf("reused key request: %v", conflict.err)
	}
	if conflict.status != http.StatusConflict || responseErrorCode(t, conflict.body) != "idempotency_key_reused" {
		t.Fatalf("reused key status=%d body=%s", conflict.status, conflict.body)
	}

	invalid := sendIdempotentLessonReview(endpoint, registered.Tokens.AccessToken, "not-a-uuid", payload)
	if invalid.err != nil {
		t.Fatalf("invalid key request: %v", invalid.err)
	}
	if invalid.status != http.StatusUnprocessableEntity || responseErrorCode(t, invalid.body) != "invalid_idempotency_key" {
		t.Fatalf("invalid key status=%d body=%s", invalid.status, invalid.body)
	}
}

func sendIdempotentLessonReview(endpoint, accessToken, idempotencyKey string, payload any) lessonHTTPResult {
	body, err := json.Marshal(payload)
	if err != nil {
		return lessonHTTPResult{err: err}
	}
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return lessonHTTPResult{err: err}
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Idempotency-Key", idempotencyKey)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return lessonHTTPResult{err: err}
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(response.Body)
	return lessonHTTPResult{status: response.StatusCode, body: responseBody, err: err}
}

func responseErrorCode(t *testing.T, body []byte) string {
	t.Helper()
	var payload struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("decode error response: %v; body=%s", err, body)
	}
	return payload.Error.Code
}
