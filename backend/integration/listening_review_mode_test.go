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

func TestListeningReviewModePersistsAndAggregatesSeparately(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table lesson_review_idempotency, lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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
		"email":       fmt.Sprintf("listening-mode-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Listening Learner",
	}, http.StatusCreated)

	var due struct {
		Items []struct {
			ID int64 `json:"id"`
		} `json:"items"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?limit=3", registered.Tokens.AccessToken, http.StatusOK, &due)
	if len(due.Items) < 3 {
		t.Fatalf("due items = %d, want at least 3", len(due.Items))
	}

	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, due.Items[0].ID), registered.Tokens.AccessToken, map[string]any{
		"rating":                "known",
		"responseMs":            700,
		"answerMode":            "listening",
		"correct":               true,
		"timezoneOffsetMinutes": 0,
	}, http.StatusOK, nil)

	var storedMode string
	var storedCorrect *bool
	var schemaVersion int
	if err := pg.QueryRow(ctx, `
		select answer_mode, correct, event_schema_version
		from review_events
		where user_id = $1::uuid and word_id = $2
		order by id desc
		limit 1
	`, registered.User.ID, due.Items[0].ID).Scan(&storedMode, &storedCorrect, &schemaVersion); err != nil {
		t.Fatalf("query listening review event: %v", err)
	}
	if storedMode != "listening" || storedCorrect == nil || !*storedCorrect || schemaVersion != 2 {
		t.Fatalf("listening event mode=%q correct=%v schema=%d", storedMode, storedCorrect, schemaVersion)
	}

	var progress struct {
		ReviewsToday             int `json:"reviewsToday"`
		SuccessfulToday          int `json:"successfulToday"`
		ObjectiveReviewsToday    int `json:"objectiveReviewsToday"`
		ObjectiveSuccessfulToday int `json:"objectiveSuccessfulToday"`
		Modes                    struct {
			Listening struct {
				AttemptsToday   int `json:"attemptsToday"`
				SuccessfulToday int `json:"successfulToday"`
				AttemptsTotal   int `json:"attemptsTotal"`
				SuccessfulTotal int `json:"successfulTotal"`
			} `json:"listening"`
			Recall struct {
				AttemptsToday int `json:"attemptsToday"`
			} `json:"recall"`
		} `json:"modes"`
		Weekly struct {
			RecallAttempts int `json:"recallAttempts"`
			ChoiceAttempts int `json:"choiceAttempts"`
		} `json:"weekly"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/progress?timezoneOffsetMinutes=0", registered.Tokens.AccessToken, http.StatusOK, &progress)
	if progress.ReviewsToday != 1 || progress.SuccessfulToday != 1 || progress.ObjectiveReviewsToday != 1 || progress.ObjectiveSuccessfulToday != 1 {
		t.Fatalf("listening objective counters = %+v", progress)
	}
	if progress.Modes.Listening.AttemptsToday != 1 || progress.Modes.Listening.SuccessfulToday != 1 || progress.Modes.Listening.AttemptsTotal != 1 || progress.Modes.Listening.SuccessfulTotal != 1 {
		t.Fatalf("listening mode progress = %+v", progress.Modes.Listening)
	}
	if progress.Modes.Recall.AttemptsToday != 0 || progress.Weekly.RecallAttempts != 0 || progress.Weekly.ChoiceAttempts != 0 {
		t.Fatalf("listening leaked into typed weekly evidence: modes=%+v weekly=%+v", progress.Modes, progress.Weekly)
	}

	// Explicitly isolate one due candidate and one non-due candidate. The words
	// came from /words/due, so both must be normalized before asserting the
	// listening composer uses the same due-only boundary as recall/choice.
	if _, err := pg.Exec(ctx, `
		update user_words
		set status = 'review', due_at = now() - interval '1 minute'
		where user_id = $1::uuid and word_id = $2
	`, registered.User.ID, due.Items[1].ID); err != nil {
		t.Fatalf("make listening candidate due: %v", err)
	}
	if _, err := pg.Exec(ctx, `
		update user_words
		set status = 'new', due_at = now() + interval '1 day'
		where user_id = $1::uuid and word_id = $2
	`, registered.User.ID, due.Items[2].ID); err != nil {
		t.Fatalf("make listening control candidate non-due: %v", err)
	}

	var lesson struct {
		ID        string `json:"id"`
		StudyMode string `json:"studyMode"`
		Version   int64  `json:"version"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source":     "mixed",
		"studyMode":  "listening",
		"lessonSize": "15",
		"wordIds":    []int64{due.Items[1].ID, due.Items[2].ID},
	}, http.StatusCreated, &lesson)
	if lesson.StudyMode != "listening" || lesson.Version <= 0 {
		t.Fatalf("listening lesson = %+v", lesson)
	}

	var sessionMode string
	var itemCount int
	var selectedWordID int64
	if err := pg.QueryRow(ctx, `
		select lesson_sessions.study_mode, count(lesson_session_items.word_id)::int, min(lesson_session_items.word_id)
		from lesson_sessions
		join lesson_session_items on lesson_session_items.session_id = lesson_sessions.id
		where lesson_sessions.id = $1::uuid
		group by lesson_sessions.study_mode
	`, lesson.ID).Scan(&sessionMode, &itemCount, &selectedWordID); err != nil {
		t.Fatalf("query listening lesson: %v", err)
	}
	if sessionMode != "listening" || itemCount != 1 || selectedWordID != due.Items[1].ID {
		t.Fatalf("listening lesson mode=%q items=%d selected=%d, want listening/1/%d", sessionMode, itemCount, selectedWordID, due.Items[1].ID)
	}

	endpoint := fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, lesson.ID, selectedWordID)
	postAuthenticatedJSON(t, endpoint, registered.Tokens.AccessToken, map[string]any{
		"lessonVersion":         lesson.Version,
		"rating":                "known",
		"answerMode":            "recall",
		"correct":               true,
		"timezoneOffsetMinutes": 0,
	}, http.StatusConflict, nil)

	postAuthenticatedJSON(t, endpoint, registered.Tokens.AccessToken, map[string]any{
		"lessonVersion":         lesson.Version,
		"rating":                "known",
		"responseMs":            650,
		"answerMode":            "listening",
		"correct":               true,
		"timezoneOffsetMinutes": 0,
	}, http.StatusOK, nil)

	if err := pg.QueryRow(ctx, `
		select answer_mode
		from review_events
		where user_id = $1::uuid and word_id = $2
		order by id desc
		limit 1
	`, registered.User.ID, selectedWordID).Scan(&storedMode); err != nil {
		t.Fatalf("query lesson listening event: %v", err)
	}
	if storedMode != "listening" {
		t.Fatalf("lesson review answer_mode = %q, want listening", storedMode)
	}
}
