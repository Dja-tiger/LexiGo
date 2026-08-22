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
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestExplicitLessonSessionQueuesAreIndependent(t *testing.T) {
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

	email := fmt.Sprintf("session-queues-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Queue Learner",
	}, http.StatusCreated)

	var userID string
	if err := pg.QueryRow(ctx, "select id::text from users where email = $1", email).Scan(&userID); err != nil {
		t.Fatalf("query registered user: %v", err)
	}

	rows, err := pg.Query(ctx, "select word_id from user_words where user_id = $1::uuid order by word_id limit 7", userID)
	if err != nil {
		t.Fatalf("query assigned learning items: %v", err)
	}
	wordIDs := make([]int64, 0, 7)
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			rows.Close()
			t.Fatalf("scan assigned learning item: %v", err)
		}
		wordIDs = append(wordIDs, wordID)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		t.Fatalf("iterate assigned learning items: %v", err)
	}
	rows.Close()
	if len(wordIDs) != 7 {
		t.Fatalf("assigned learning item count = %d, want 7", len(wordIDs))
	}

	newOnly := wordIDs[0]
	reviewDue := wordIDs[1]
	overdue := wordIDs[2]
	relearningDue := wordIDs[3]
	repeatedAgainFuture := wordIDs[4]
	repeatedAlmostFuture := wordIDs[5]
	plainScheduledFuture := wordIDs[6]

	if _, err := pg.Exec(ctx, `
		update user_words
		set status = 'new',
		    easiness = 2.50,
		    interval_days = 0,
		    repetitions = 0,
		    due_at = now() + interval '30 days',
		    last_reviewed_at = null,
		    updated_at = now()
		where user_id = $1::uuid
	`, userID); err != nil {
		t.Fatalf("reset learning state: %v", err)
	}
	if _, err := pg.Exec(ctx, `
		update user_words
		set status = case
		        when word_id in ($2, $3) then 'review'
		        when word_id = $4 then 'learning'
		        when word_id in ($5, $6, $7) then 'review'
		        else status
		    end,
		    due_at = case
		        when word_id = $2 then now() - interval '1 hour'
		        when word_id = $3 then now() - interval '48 hours'
		        when word_id = $4 then now() - interval '10 minutes'
		        when word_id in ($5, $6, $7) then now() + interval '10 days'
		        else due_at
		    end,
		    updated_at = now()
		where user_id = $1::uuid
		  and word_id = any($8::bigint[])
	`, userID, reviewDue, overdue, relearningDue, repeatedAgainFuture, repeatedAlmostFuture, plainScheduledFuture, wordIDs[1:]); err != nil {
		t.Fatalf("prepare explicit queue states: %v", err)
	}

	if _, err := pg.Exec(ctx, `
		insert into review_events(
			user_id, word_id, grade, reviewed_at, rating, answer_mode, correct,
			answer_revealed, event_schema_version, effective_rating,
			judgement_source, judgement_reason
		)
		values
			($1::uuid, $2, 1, now() - interval '2 days', 'again', 'recall', false, false, 2, 'again', 'server', 'rejected_no_match'),
			($1::uuid, $2, 1, now() - interval '1 day', 'again', 'recall', false, false, 2, 'again', 'server', 'rejected_no_match'),
			($1::uuid, $3, 3, now() - interval '3 days', 'almost', 'recall', true, false, 2, 'almost', 'server', 'accepted_exact'),
			($1::uuid, $3, 3, now() - interval '2 days', 'almost', 'recall', true, false, 2, 'almost', 'server', 'accepted_exact'),
			($1::uuid, $3, 3, now() - interval '1 day', 'almost', 'recall', true, false, 2, 'almost', 'server', 'accepted_exact')
	`, userID, repeatedAgainFuture, repeatedAlmostFuture); err != nil {
		t.Fatalf("seed remediation review evidence: %v", err)
	}

	type lessonQueueItem struct {
		ID     int64  `json:"id"`
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	type lessonQueuePayload struct {
		ID          string            `json:"id"`
		SessionKind string            `json:"sessionKind"`
		Items       []lessonQueueItem `json:"items"`
	}

	createAutomaticLesson := func(sessionKind string) lessonQueuePayload {
		t.Helper()
		var lesson lessonQueuePayload
		postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
			"source": "mixed", "studyMode": "study", "sessionKind": sessionKind, "lessonSize": "15",
		}, http.StatusCreated, &lesson)
		if lesson.ID == "" || lesson.SessionKind != sessionKind {
			t.Fatalf("unexpected %s lesson payload: %+v", sessionKind, lesson)
		}
		return lesson
	}

	study := createAutomaticLesson("study")
	if len(study.Items) != 15 {
		t.Fatalf("study lesson size = %d, want 15 new items", len(study.Items))
	}
	foundNewOnly := false
	for _, item := range study.Items {
		if item.Status != "new" || item.Reason != "new" {
			t.Fatalf("study selected non-new candidate: %+v", item)
		}
		if item.ID == newOnly {
			foundNewOnly = true
		}
	}
	if !foundNewOnly {
		t.Fatalf("study lesson did not include deterministic earliest new item %d", newOnly)
	}

	review := createAutomaticLesson("review")
	if len(review.Items) != 3 {
		t.Fatalf("review lesson size = %d, want exact due backlog 3; items=%+v", len(review.Items), review.Items)
	}
	wantReviewReasons := map[int64]string{
		reviewDue:     "due",
		overdue:       "overdue",
		relearningDue: "relearning_due",
	}
	for _, item := range review.Items {
		wantReason, found := wantReviewReasons[item.ID]
		if !found {
			t.Fatalf("review selected non-due/future candidate %+v; future remediation=%d/%d plain=%d", item, repeatedAgainFuture, repeatedAlmostFuture, plainScheduledFuture)
		}
		if item.Reason != wantReason {
			t.Fatalf("review item %d reason = %q, want %q", item.ID, item.Reason, wantReason)
		}
		delete(wantReviewReasons, item.ID)
	}
	if len(wantReviewReasons) != 0 {
		t.Fatalf("review queue missed due candidates: %v", wantReviewReasons)
	}
	assertPersistedLessonReasons(t, ctx, pg, review.ID, map[int64]string{
		reviewDue:     "due",
		overdue:       "overdue",
		relearningDue: "relearning_due",
	})

	remediation := createAutomaticLesson("remediation")
	if len(remediation.Items) != 2 {
		t.Fatalf("remediation lesson size = %d, want only two signalled future candidates; items=%+v", len(remediation.Items), remediation.Items)
	}
	wantRemediationReasons := map[int64]string{
		repeatedAgainFuture:  "repeated_again",
		repeatedAlmostFuture: "repeated_almost",
	}
	for _, item := range remediation.Items {
		wantReason, found := wantRemediationReasons[item.ID]
		if !found {
			t.Fatalf("remediation selected ordinary candidate %+v; plain scheduled id=%d", item, plainScheduledFuture)
		}
		if item.Reason != wantReason {
			t.Fatalf("remediation item %d reason = %q, want %q", item.ID, item.Reason, wantReason)
		}
		delete(wantRemediationReasons, item.ID)
	}
	if len(wantRemediationReasons) != 0 {
		t.Fatalf("remediation queue missed signalled candidates: %v", wantRemediationReasons)
	}
	assertPersistedLessonReasons(t, ctx, pg, remediation.ID, map[int64]string{
		repeatedAgainFuture:  "repeated_again",
		repeatedAlmostFuture: "repeated_almost",
	})

	var legacy lessonQueuePayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "study", "lessonSize": "15",
	}, http.StatusCreated, &legacy)
	if legacy.ID == "" || legacy.SessionKind != "" || len(legacy.Items) != 15 {
		t.Fatalf("legacy omitted session intent changed unexpectedly: %+v", legacy)
	}
}

func assertPersistedLessonReasons(
	t *testing.T,
	ctx context.Context,
	pg *pgxpool.Pool,
	lessonID string,
	want map[int64]string,
) {
	t.Helper()
	rows, err := pg.Query(ctx, `
		select word_id, selection_reason
		from lesson_session_items
		where session_id = $1::uuid
		order by position
	`, lessonID)
	if err != nil {
		t.Fatalf("query persisted lesson reasons: %v", err)
	}
	defer rows.Close()

	seen := make(map[int64]string, len(want))
	for rows.Next() {
		var wordID int64
		var reason string
		if err := rows.Scan(&wordID, &reason); err != nil {
			t.Fatalf("scan persisted lesson reason: %v", err)
		}
		seen[wordID] = reason
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("iterate persisted lesson reasons: %v", err)
	}
	if len(seen) != len(want) {
		t.Fatalf("persisted reasons count = %d, want %d; got=%v want=%v", len(seen), len(want), seen, want)
	}
	for wordID, wantReason := range want {
		if got := seen[wordID]; got != wantReason {
			t.Fatalf("persisted reason for %d = %q, want %q", wordID, got, wantReason)
		}
	}
}
