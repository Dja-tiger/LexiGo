//go:build integration

package integration

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/moderation"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

type moderationReviewResponse struct {
	ReviewEventID int64 `json:"reviewEventId"`
}

type moderationSuggestionResponse struct {
	ID int64 `json:"id"`
}

func TestAnswerSuggestionModerationWorkflow(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	var logOutput bytes.Buffer
	defer func() {
		if t.Failed() {
			t.Logf("moderation server log:\n%s", logOutput.String())
		}
	}()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, `
		truncate table answer_suggestion_audit, answer_suggestions,
		    lesson_review_idempotency, lesson_session_items, lesson_sessions,
		    user_learning_preferences, review_events, user_words, refresh_tokens,
		    words, users restart identity cascade
	`); err != nil {
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

	const adminEmail = "content-admin@example.com"
	cfg := config.Config{
		AppEnv: "test", HTTPAddr: ":0", LogLevel: "error",
		CORSAllowedOrigin: "http://test.local",
		PostgresDSN:       requiredEnv(t, "TEST_POSTGRES_DSN"),
		Redis:             config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret:         "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL:    15 * time.Minute,
		RefreshTokenTTL:   24 * time.Hour,
		ContentModeration: config.ContentModeration{
			AdminEmails: []string{adminEmail},
			PendingTTL:  90 * 24 * time.Hour, DecidedTTL: 365 * 24 * time.Hour,
		},
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(&logOutput, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewServer(app.Handler())
	defer testServer.Close()

	admin := registerModerationUser(t, testServer.URL, adminEmail, "Content Admin")
	learnerA := registerModerationUser(t, testServer.URL, "learner-a@example.com", "Learner A")
	learnerB := registerModerationUser(t, testServer.URL, "learner-b@example.com", "Learner B")
	failClosedConfig := cfg
	failClosedConfig.ContentModeration.AdminEmails = nil
	failClosedApp, err := server.New(
		failClosedConfig,
		slog.New(slog.NewTextHandler(&logOutput, nil)),
		pg,
		rdb,
	)
	if err != nil {
		t.Fatalf("fail-closed server.New() error = %v", err)
	}
	failClosedServer := httptest.NewServer(failClosedApp.Handler())
	defer failClosedServer.Close()
	getAuthenticatedJSON(
		t,
		failClosedServer.URL+"/api/v1/admin/answer-suggestions",
		admin.Tokens.AccessToken,
		http.StatusForbidden,
		nil,
	)

	rows, err := pg.Query(ctx, "select id, lemma from words where kind = 'word' order by id limit 4")
	if err != nil {
		t.Fatal(err)
	}
	var wordIDs []int64
	var wordLemmas []string
	for rows.Next() {
		var wordID int64
		var lemma string
		if err := rows.Scan(&wordID, &lemma); err != nil {
			t.Fatal(err)
		}
		wordIDs = append(wordIDs, wordID)
		wordLemmas = append(wordLemmas, lemma)
	}
	rows.Close()
	if len(wordIDs) != 4 {
		t.Fatalf("word ids = %v", wordIDs)
	}

	suggestionA, reviewA := submitModerationSuggestion(
		t, testServer.URL, learnerA.Tokens.AccessToken, wordIDs[0], "новый допустимый вариант",
	)
	suggestionB, _ := submitModerationSuggestion(
		t, testServer.URL, learnerB.Tokens.AccessToken, wordIDs[0], "Новый, допустимый вариант!",
	)

	unauthenticated, err := http.Get(testServer.URL + "/api/v1/admin/answer-suggestions")
	if err != nil {
		t.Fatal(err)
	}
	defer unauthenticated.Body.Close()
	if unauthenticated.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauthenticated moderation status = %d", unauthenticated.StatusCode)
	}

	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/admin/answer-suggestions",
		learnerA.Tokens.AccessToken,
		http.StatusForbidden,
		nil,
	)
	postAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/admin/answer-suggestions/%d/decision", testServer.URL, suggestionA),
		learnerA.Tokens.AccessToken,
		moderation.DecisionRequest{
			Decision: "accepted", ExpectedVersion: 1, Reason: "valid_variant",
		},
		http.StatusForbidden,
		nil,
	)

	var firstPage moderation.ListResponse
	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/admin/answer-suggestions?status=pending&limit=1&itemQuery="+url.QueryEscape(wordLemmas[0]),
		admin.Tokens.AccessToken,
		http.StatusOK,
		&firstPage,
	)
	if len(firstPage.Items) != 1 || firstPage.NextCursor == "" {
		t.Fatalf("first moderation page = %+v", firstPage)
	}
	if firstPage.Items[0].Item.Lemma != wordLemmas[0] ||
		firstPage.Items[0].Item.Translation == "" ||
		firstPage.Items[0].Item.AcceptedAnswers == nil ||
		firstPage.Items[0].Review.ID <= 0 ||
		firstPage.Items[0].SubmittedAnswer == "" {
		t.Fatalf("incomplete moderation context = %+v", firstPage.Items[0])
	}
	var secondPage moderation.ListResponse
	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/admin/answer-suggestions?status=pending&limit=1&itemQuery="+url.QueryEscape(wordLemmas[0])+"&cursor="+url.QueryEscape(firstPage.NextCursor),
		admin.Tokens.AccessToken,
		http.StatusOK,
		&secondPage,
	)
	if len(secondPage.Items) != 1 || secondPage.Items[0].ID == firstPage.Items[0].ID {
		t.Fatalf("second moderation page = %+v", secondPage)
	}
	var pendingMetrics moderation.Metrics
	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/admin/answer-suggestions/metrics",
		admin.Tokens.AccessToken,
		http.StatusOK,
		&pendingMetrics,
	)
	if pendingMetrics.PendingCount != 2 || pendingMetrics.OldestPendingAt == nil ||
		pendingMetrics.OldestPendingAgeSecs < 0 {
		t.Fatalf("pending moderation metrics = %+v", pendingMetrics)
	}

	var beforeReview struct {
		Rating, EffectiveRating, JudgementReason string
		Correct                                  bool
	}
	if err := pg.QueryRow(ctx, `
		select rating, effective_rating, judgement_reason, correct
		from review_events where id = $1
	`, reviewA).Scan(
		&beforeReview.Rating,
		&beforeReview.EffectiveRating,
		&beforeReview.JudgementReason,
		&beforeReview.Correct,
	); err != nil {
		t.Fatal(err)
	}
	var beforeStatus string
	var beforeRepetitions int
	var beforeDueAt time.Time
	if err := pg.QueryRow(ctx, `
		select status, repetitions, due_at
		from user_words where user_id = $1::uuid and word_id = $2
	`, learnerA.User.ID, wordIDs[0]).Scan(&beforeStatus, &beforeRepetitions, &beforeDueAt); err != nil {
		t.Fatal(err)
	}

	var accepted moderation.DecisionResult
	postAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/admin/answer-suggestions/%d/decision", testServer.URL, suggestionA),
		admin.Tokens.AccessToken,
		moderation.DecisionRequest{
			Decision: "accepted", ExpectedVersion: 1, Reason: "valid_variant",
			Comment: "Confirmed against the content guide.",
		},
		http.StatusOK,
		&accepted,
	)
	if accepted.Status != "accepted" || accepted.Version != 2 || !accepted.AnswerAdded {
		t.Fatalf("accepted decision = %+v", accepted)
	}

	var duplicateAccepted moderation.DecisionResult
	postAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/admin/answer-suggestions/%d/decision", testServer.URL, suggestionB),
		admin.Tokens.AccessToken,
		moderation.DecisionRequest{Decision: "accepted", ExpectedVersion: 1, Reason: "valid_variant"},
		http.StatusOK,
		&duplicateAccepted,
	)
	if duplicateAccepted.AnswerAdded {
		t.Fatalf("normalized duplicate was appended: %+v", duplicateAccepted)
	}

	var normalizedMatches int
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from words word
		cross join unnest(word.accepted_answers) accepted(answer)
		where word.id = $1
		  and regexp_replace(lower(accepted.answer), '[^[:alnum:]]+', ' ', 'g')
		      = 'новый допустимый вариант'
	`, wordIDs[0]).Scan(&normalizedMatches); err != nil {
		t.Fatal(err)
	}
	if normalizedMatches != 1 {
		t.Fatalf("normalized accepted answer count = %d, want 1", normalizedMatches)
	}

	var afterReview struct {
		Rating, EffectiveRating, JudgementReason string
		Correct                                  bool
	}
	if err := pg.QueryRow(ctx, `
		select rating, effective_rating, judgement_reason, correct
		from review_events where id = $1
	`, reviewA).Scan(
		&afterReview.Rating,
		&afterReview.EffectiveRating,
		&afterReview.JudgementReason,
		&afterReview.Correct,
	); err != nil {
		t.Fatal(err)
	}
	var afterStatus string
	var afterRepetitions int
	var afterDueAt time.Time
	if err := pg.QueryRow(ctx, `
		select status, repetitions, due_at
		from user_words where user_id = $1::uuid and word_id = $2
	`, learnerA.User.ID, wordIDs[0]).Scan(&afterStatus, &afterRepetitions, &afterDueAt); err != nil {
		t.Fatal(err)
	}
	if beforeReview != afterReview || beforeStatus != afterStatus ||
		beforeRepetitions != afterRepetitions || !beforeDueAt.Equal(afterDueAt) {
		t.Fatalf("moderation changed history/scheduler: review %+v -> %+v, state %s/%d/%s -> %s/%d/%s",
			beforeReview, afterReview, beforeStatus, beforeRepetitions, beforeDueAt,
			afterStatus, afterRepetitions, afterDueAt)
	}

	rejectedID, _ := submitModerationSuggestion(
		t, testServer.URL, learnerA.Tokens.AccessToken, wordIDs[1], "контекст не подходит",
	)
	var rejected moderation.DecisionResult
	postAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/admin/answer-suggestions/%d/decision", testServer.URL, rejectedID),
		admin.Tokens.AccessToken,
		moderation.DecisionRequest{
			Decision: "rejected", ExpectedVersion: 1, Reason: "irrelevant",
			Comment: "Different learning item context.",
		},
		http.StatusOK,
		&rejected,
	)
	if rejected.Status != "rejected" || rejected.AnswerAdded {
		t.Fatalf("rejected decision = %+v", rejected)
	}

	concurrentID, _ := submitModerationSuggestion(
		t, testServer.URL, learnerA.Tokens.AccessToken, wordIDs[2], "конкурентный вариант",
	)
	repository := moderation.NewRepository(pg)
	start := make(chan struct{})
	results := make(chan error, 2)
	var wait sync.WaitGroup
	for index := 0; index < 2; index++ {
		wait.Add(1)
		go func() {
			defer wait.Done()
			<-start
			_, err := repository.Decide(ctx, admin.User.ID, concurrentID, moderation.DecisionRequest{
				Decision: "rejected", ExpectedVersion: 1, Reason: "incorrect",
			})
			results <- err
		}()
	}
	close(start)
	wait.Wait()
	close(results)
	successes, conflicts := 0, 0
	for decisionErr := range results {
		switch {
		case decisionErr == nil:
			successes++
		case errors.Is(decisionErr, moderation.ErrVersionConflict):
			conflicts++
		default:
			t.Fatalf("concurrent decision error = %v", decisionErr)
		}
	}
	if successes != 1 || conflicts != 1 {
		t.Fatalf("concurrent outcomes success=%d conflict=%d", successes, conflicts)
	}

	var auditRows int
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from answer_suggestion_audit
		where suggestion_id = any($1::bigint[])
	`, []int64{suggestionA, suggestionB, rejectedID, concurrentID}).Scan(&auditRows); err != nil {
		t.Fatal(err)
	}
	if auditRows != 4 {
		t.Fatalf("audit rows = %d, want 4", auditRows)
	}
	var auditedActor, auditedAction, auditedReason string
	var previousVersion, resultingVersion int64
	var previousAnswers, resultingAnswers []string
	var auditedAt time.Time
	if err := pg.QueryRow(ctx, `
		select actor_user_id::text, action, reason, previous_version, resulting_version,
		       previous_accepted_answers, resulting_accepted_answers, created_at
		from answer_suggestion_audit
		where suggestion_id = $1
	`, suggestionA).Scan(
		&auditedActor, &auditedAction, &auditedReason, &previousVersion, &resultingVersion,
		&previousAnswers, &resultingAnswers, &auditedAt,
	); err != nil {
		t.Fatal(err)
	}
	if auditedActor != admin.User.ID || auditedAction != "accepted" ||
		auditedReason != "valid_variant" || previousVersion != 1 || resultingVersion != 2 ||
		len(previousAnswers) != 0 || len(resultingAnswers) != 1 || auditedAt.IsZero() {
		t.Fatalf("accepted audit context = actor=%s action=%s reason=%s versions=%d/%d before=%v after=%v at=%s",
			auditedActor, auditedAction, auditedReason, previousVersion, resultingVersion,
			previousAnswers, resultingAnswers, auditedAt)
	}

	var metrics moderation.Metrics
	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/admin/answer-suggestions/metrics",
		admin.Tokens.AccessToken,
		http.StatusOK,
		&metrics,
	)
	if metrics.AcceptedCount != 2 || metrics.RejectedCount != 2 || metrics.AcceptanceRatePercent != 50 {
		t.Fatalf("moderation metrics = %+v", metrics)
	}

	expiredID, _ := submitModerationSuggestion(
		t, testServer.URL, learnerA.Tokens.AccessToken, wordIDs[3], "устаревший вариант",
	)
	secondExpiredID, _ := submitModerationSuggestion(
		t, testServer.URL, learnerB.Tokens.AccessToken, wordIDs[3], "ещё один устаревший вариант",
	)
	if _, err := pg.Exec(ctx, `
		update answer_suggestions
		set created_at = now() - interval '91 days',
		    updated_at = now() - interval '91 days'
		where id = any($1::bigint[])
	`, []int64{expiredID, secondExpiredID}); err != nil {
		t.Fatal(err)
	}
	if _, err := pg.Exec(ctx, `
		update answer_suggestions
		set decided_at = now() - interval '366 days',
		    updated_at = now() - interval '366 days'
		where id = $1
	`, rejectedID); err != nil {
		t.Fatal(err)
	}
	cleanup, err := repository.CleanupExpired(
		ctx, time.Now().UTC().Add(-90*24*time.Hour),
		time.Now().UTC().Add(-365*24*time.Hour), 1, 1,
	)
	if err != nil {
		t.Fatal(err)
	}
	if cleanup.DeletedRows != 1 || !cleanup.LimitReached {
		t.Fatalf("retention cleanup = %+v", cleanup)
	}
	var retainedTerminal, retainedAudit int
	if err := pg.QueryRow(ctx, `
		select
		    (select count(*)::int from answer_suggestions where id = $1),
		    (select count(*)::int from answer_suggestion_audit where suggestion_id = $1)
	`, rejectedID).Scan(&retainedTerminal, &retainedAudit); err != nil {
		t.Fatal(err)
	}
	if retainedTerminal != 0 || retainedAudit != 0 {
		t.Fatalf("expired terminal suggestion/audit retained = %d/%d", retainedTerminal, retainedAudit)
	}

	lockConn, err := pg.Acquire(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer lockConn.Release()
	const moderationRetentionAdvisoryLockID int64 = 6_783_219_440_132
	if _, err := lockConn.Exec(ctx, "select pg_advisory_lock($1)", moderationRetentionAdvisoryLockID); err != nil {
		t.Fatal(err)
	}
	skipped, err := repository.CleanupExpired(
		ctx, time.Now().UTC().Add(-90*24*time.Hour),
		time.Now().UTC().Add(-365*24*time.Hour), 100, 2,
	)
	if err != nil {
		t.Fatal(err)
	}
	if !skipped.Skipped || skipped.DeletedRows != 0 {
		t.Fatalf("locked retention cleanup = %+v", skipped)
	}
	if _, err := lockConn.Exec(ctx, "select pg_advisory_unlock($1)", moderationRetentionAdvisoryLockID); err != nil {
		t.Fatal(err)
	}

	cleanup, err = repository.CleanupExpired(
		ctx, time.Now().UTC().Add(-90*24*time.Hour),
		time.Now().UTC().Add(-365*24*time.Hour), 100, 2,
	)
	if err != nil {
		t.Fatal(err)
	}
	if cleanup.DeletedRows != 2 || cleanup.LimitReached {
		t.Fatalf("final retention cleanup = %+v", cleanup)
	}
}

func registerModerationUser(t *testing.T, baseURL, email, displayName string) integrationAuthResponse {
	t.Helper()
	return postJSON[integrationAuthResponse](t, baseURL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": displayName,
	}, http.StatusCreated)
}

func submitModerationSuggestion(
	t *testing.T,
	baseURL string,
	accessToken string,
	wordID int64,
	answer string,
) (int64, int64) {
	t.Helper()
	var review moderationReviewResponse
	postAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/words/%d/review", baseURL, wordID),
		accessToken,
		map[string]any{
			"rating": "known", "answerMode": "recall", "submittedAnswer": answer,
			"answerRevealed": true, "timezoneOffsetMinutes": 0,
		},
		http.StatusOK,
		&review,
	)
	var suggestion moderationSuggestionResponse
	postAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/words/%d/answer-suggestions", baseURL, wordID),
		accessToken,
		map[string]any{
			"reviewEventId":   review.ReviewEventID,
			"exerciseKind":    "translation",
			"submittedAnswer": answer,
		},
		http.StatusAccepted,
		&suggestion,
	)
	return suggestion.ID, review.ReviewEventID
}
