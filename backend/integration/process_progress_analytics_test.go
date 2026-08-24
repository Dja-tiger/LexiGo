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

func TestProcessProgressAnalyticsUsesExplicitSessionAttribution(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	pgDSN := requiredEnv(t, "TEST_POSTGRES_DSN")
	pg, err := postgresplatform.Open(ctx, pgDSN)
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

	redisAddr := requiredEnv(t, "TEST_REDIS_ADDR")
	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: redisAddr})
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
		PostgresDSN:       pgDSN,
		Redis:             config.Redis{Addr: redisAddr},
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
		"email":       fmt.Sprintf("process-progress-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Process Progress Learner",
	}, http.StatusCreated)

	rows, err := pg.Query(ctx, `
        select word_id
        from user_words
        where user_id = $1::uuid
        order by word_id
        limit 6
    `, registered.User.ID)
	if err != nil {
		t.Fatalf("query assigned learning items: %v", err)
	}
	var wordIDs []int64
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			rows.Close()
			t.Fatalf("scan learning item: %v", err)
		}
		wordIDs = append(wordIDs, wordID)
	}
	rows.Close()
	if len(wordIDs) < 6 {
		t.Fatalf("assigned items = %d, want at least 6", len(wordIDs))
	}

	if _, err := pg.Exec(ctx, `
        update user_words
        set status = 'review', due_at = case word_id
  when $2 then now() - interval '1 hour'
  when $3 then now() + interval '1 day'
  else due_at
        end
        where user_id = $1::uuid and word_id in ($2, $3)
    `, registered.User.ID, wordIDs[0], wordIDs[1]); err != nil {
		t.Fatalf("prepare review backlog: %v", err)
	}

	insertEvent := func(wordID int64, reviewedAt string, grade int, rating, answerMode string, correct any, effectiveRating, sessionKind, reason string) {
		t.Helper()
		if _, err := pg.Exec(ctx, `
  insert into review_events(
      user_id, word_id, grade, reviewed_at, rating, answer_mode, correct,
      answer_revealed, event_schema_version, effective_rating, session_kind, selection_reason
  ) values (
      $1::uuid, $2, $3, `+reviewedAt+`, $4, $5, $6,
      false, 2, $7, $8, $9
  )
        `, registered.User.ID, wordID, grade, rating, answerMode, correct, effectiveRating, sessionKind, reason); err != nil {
			t.Fatalf("insert %s/%s event: %v", sessionKind, answerMode, err)
		}
	}

	// Explicit Study + new + known counts as newly learned.
	insertEvent(wordIDs[2], "now()", 5, "known", "study", nil, "known", "study", "new")
	// Study retrieval evidence must never inflate Review retention.
	insertEvent(wordIDs[3], "now() - interval '8 days'", 5, "known", "recall", true, "known", "study", "manual")
	insertEvent(wordIDs[3], "now()", 5, "known", "recall", true, "known", "study", "manual")
	// Review retrieval: one retained success and one lapse.
	insertEvent(wordIDs[4], "now() - interval '8 days'", 5, "known", "recall", true, "known", "review", "due")
	insertEvent(wordIDs[4], "now()", 5, "known", "recall", true, "known", "review", "due")
	insertEvent(wordIDs[5], "now()", 1, "again", "recall", false, "again", "review", "recent_failure")
	// Remediation remains a distinct process even with an objective answer mode.
	insertEvent(wordIDs[2], "now()", 3, "almost", "choice", true, "almost", "remediation", "repeated_almost")

	var progress struct {
		RetainedItemsWeek int `json:"retainedItemsWeek"`
		Processes         struct {
			WeekStart           string `json:"weekStart"`
			WeekEnd             string `json:"weekEnd"`
			NewLearned          int    `json:"newLearned"`
			DueReviewed         int    `json:"dueReviewed"`
			RemediationReviewed int    `json:"remediationReviewed"`
			ReviewBacklog       int    `json:"reviewBacklog"`
			Lapses              int    `json:"lapses"`
			Retention           struct {
				Attempts   int `json:"attempts"`
				Successful int `json:"successful"`
				Rate       int `json:"rate"`
			} `json:"retention"`
		} `json:"processes"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/progress?timezoneOffsetMinutes=0", registered.Tokens.AccessToken, http.StatusOK, &progress)

	if progress.Processes.WeekStart == "" || progress.Processes.WeekEnd == "" {
		t.Fatalf("process week bounds are empty: %+v", progress.Processes)
	}
	if progress.Processes.NewLearned != 1 {
		t.Fatalf("newLearned = %d, want 1", progress.Processes.NewLearned)
	}
	if progress.Processes.DueReviewed != 2 {
		t.Fatalf("dueReviewed = %d, want 2", progress.Processes.DueReviewed)
	}
	if progress.Processes.RemediationReviewed != 1 {
		t.Fatalf("remediationReviewed = %d, want 1", progress.Processes.RemediationReviewed)
	}
	if progress.Processes.ReviewBacklog != 1 {
		t.Fatalf("reviewBacklog = %d, want 1 due non-new item", progress.Processes.ReviewBacklog)
	}
	if progress.Processes.Lapses != 1 {
		t.Fatalf("lapses = %d, want 1", progress.Processes.Lapses)
	}
	if progress.Processes.Retention.Attempts != 2 || progress.Processes.Retention.Successful != 1 || progress.Processes.Retention.Rate != 50 {
		t.Fatalf("process retention = %+v, want 1/2 = 50%%", progress.Processes.Retention)
	}
	if progress.RetainedItemsWeek != 1 {
		t.Fatalf("retainedItemsWeek = %d, want explicit Review item only", progress.RetainedItemsWeek)
	}
}
