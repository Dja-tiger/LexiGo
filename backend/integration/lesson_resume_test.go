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

type lessonProgressPayload struct {
	LessonCurrentIndex  int  `json:"lessonCurrentIndex"`
	LessonCompleted     bool `json:"lessonCompleted"`
	LessonReviewedItems int  `json:"lessonReviewedItems"`
	LessonSkippedItems  int  `json:"lessonSkippedItems"`
	LessonTotalItems    int  `json:"lessonTotalItems"`
}

type lessonHTTPResult struct {
	status int
	body   []byte
	err    error
}

func TestResumeAndCompleteLessonWithOrderedPersistedReviews(t *testing.T) {
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
		"source": "mixed", "studyMode": "recall", "lessonSize": "15", "wordIds": wordIDs,
	}, http.StatusCreated, &created)
	if created.ID == "" || created.CurrentIndex != 0 || created.Status != "active" || len(created.Items) != 3 {
		t.Fatalf("unexpected created lesson: %+v", created)
	}

	var resumed lessonPayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &resumed)
	if resumed.ID != created.ID || resumed.CurrentIndex != 0 || len(resumed.Items) != 3 {
		t.Fatalf("unexpected resumed lesson: %+v", resumed)
	}

	// A later card cannot be reviewed before the current required card.
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[1]), registered.Tokens.AccessToken, lessonReviewPayload("known"), http.StatusConflict, nil)

	// Simulate a slow request and a repeated click. The row lock allows one
	// persisted review and returns a conflict for the duplicate.
	endpoint := fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[0])
	start := make(chan struct{})
	results := make(chan lessonHTTPResult, 2)
	var wg sync.WaitGroup
	for range 2 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			results <- sendLessonReview(endpoint, registered.Tokens.AccessToken, lessonReviewPayload("known"))
		}()
	}
	close(start)
	wg.Wait()
	close(results)

	statuses := make([]int, 0, 2)
	var first lessonProgressPayload
	for result := range results {
		if result.err != nil {
			t.Fatalf("concurrent review: %v", result.err)
		}
		statuses = append(statuses, result.status)
		if result.status == http.StatusOK {
			if err := json.Unmarshal(result.body, &first); err != nil {
				t.Fatalf("decode first review: %v; body=%s", err, result.body)
			}
		}
	}
	sort.Ints(statuses)
	if len(statuses) != 2 || statuses[0] != http.StatusOK || statuses[1] != http.StatusConflict {
		t.Fatalf("concurrent statuses = %v", statuses)
	}
	assertLessonProgress(t, first, 1, 3, false)

	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &resumed)
	if resumed.CurrentIndex != 1 || resumed.Items[0].Rating == nil || *resumed.Items[0].Rating != "known" {
		t.Fatalf("lesson did not resume at the next item: %+v", resumed)
	}

	var second lessonProgressPayload
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[1]), registered.Tokens.AccessToken, lessonReviewPayload("almost"), http.StatusOK, &second)
	assertLessonProgress(t, second, 2, 3, false)

	var completed lessonProgressPayload
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[2]), registered.Tokens.AccessToken, lessonReviewPayload("again"), http.StatusOK, &completed)
	assertLessonProgress(t, completed, 3, 3, true)

	// Completion is server-owned: the session disappears from the active queue,
	// and a repeated final click cannot persist another review.
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusNotFound, nil)
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[2]), registered.Tokens.AccessToken, lessonReviewPayload("again"), http.StatusNotFound, nil)

	var status string
	var currentIndex, ratedItems, reviewEvents int
	if err := pg.QueryRow(ctx, `
		select lesson_sessions.status, lesson_sessions.current_index,
		       count(lesson_session_items.rating)::int
		from lesson_sessions
		join lesson_session_items on lesson_session_items.session_id = lesson_sessions.id
		where lesson_sessions.id = $1::uuid
		group by lesson_sessions.status, lesson_sessions.current_index
	`, created.ID).Scan(&status, &currentIndex, &ratedItems); err != nil {
		t.Fatalf("query completed lesson: %v", err)
	}
	if err := pg.QueryRow(ctx, "select count(*)::int from review_events where word_id = any($1::bigint[])", wordIDs).Scan(&reviewEvents); err != nil {
		t.Fatalf("count lesson review events: %v", err)
	}
	if status != "completed" || currentIndex != 3 || ratedItems != 3 || reviewEvents != 3 {
		t.Fatalf("completed lesson: status=%s index=%d rated=%d events=%d", status, currentIndex, ratedItems, reviewEvents)
	}
}

func lessonReviewPayload(rating string) map[string]any {
	return map[string]any{
		"rating": rating, "responseMs": 500, "answerMode": "recall", "correct": true, "timezoneOffsetMinutes": 0,
	}
}

func sendLessonReview(endpoint, accessToken string, payload any) lessonHTTPResult {
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
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return lessonHTTPResult{err: err}
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(response.Body)
	return lessonHTTPResult{status: response.StatusCode, body: responseBody, err: err}
}

func assertLessonProgress(t *testing.T, payload lessonProgressPayload, reviewed, total int, completed bool) {
	t.Helper()
	if payload.LessonReviewedItems != reviewed || payload.LessonTotalItems != total || payload.LessonSkippedItems != 0 || payload.LessonCompleted != completed || payload.LessonCurrentIndex != reviewed {
		t.Fatalf("unexpected lesson progress: %+v", payload)
	}
}
