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

func TestObjectiveAnswerJudgementAndSuggestion(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table answer_suggestions, lesson_review_idempotency, lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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
		"email":       fmt.Sprintf("judgement-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Judgement Tester",
	}, http.StatusCreated)

	rows, err := pg.Query(ctx, `
		select word.id
		from words word
		join user_words user_word on user_word.word_id = word.id
		where user_word.user_id = $1::uuid and word.kind = 'word'
		order by word.id
		limit 2
	`, registered.User.ID)
	if err != nil {
		t.Fatalf("query assigned words: %v", err)
	}
	defer rows.Close()
	wordIDs := make([]int64, 0, 2)
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			t.Fatal(err)
		}
		wordIDs = append(wordIDs, wordID)
	}
	if len(wordIDs) != 2 {
		t.Fatalf("assigned word ids = %v, want two", wordIDs)
	}
	if _, err := pg.Exec(ctx, `
		update words
		set translation = 'инцидент, происшествие',
		    accepted_answers = array['инцидента']::text[]
		where id = any($1::bigint[])
	`, wordIDs); err != nil {
		t.Fatalf("curate accepted answers: %v", err)
	}

	var rejected struct {
		RequestedRating     string `json:"requestedRating"`
		EffectiveRating     string `json:"effectiveRating"`
		Correct             bool   `json:"correct"`
		JudgementReason     string `json:"judgementReason"`
		ReviewEventID       int64  `json:"reviewEventId"`
		SuggestionAvailable bool   `json:"suggestionAvailable"`
		Status              string `json:"status"`
		IntervalDays        int    `json:"intervalDays"`
		Repetitions         int    `json:"repetitions"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, wordIDs[0]), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "answerMode": "recall", "submittedAnswer": "неверный вариант", "answerRevealed": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &rejected)
	if rejected.RequestedRating != "known" || rejected.EffectiveRating != "again" || rejected.Correct || rejected.JudgementReason != "rejected_no_match" || !rejected.SuggestionAvailable {
		t.Fatalf("unexpected rejected assessment: %+v", rejected)
	}
	if rejected.Status != "learning" || rejected.IntervalDays != 0 || rejected.Repetitions != 0 {
		t.Fatalf("incorrect answer advanced scheduler: %+v", rejected)
	}

	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/answer-suggestions", testServer.URL, wordIDs[0]), registered.Tokens.AccessToken, map[string]any{
		"reviewEventId": rejected.ReviewEventID, "exerciseKind": "translation", "submittedAnswer": "подменённый вариант",
	}, http.StatusConflict, nil)

	var suggestion struct {
		Status          string `json:"status"`
		SubmittedAnswer string `json:"submittedAnswer"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/answer-suggestions", testServer.URL, wordIDs[0]), registered.Tokens.AccessToken, map[string]any{
		"reviewEventId": rejected.ReviewEventID, "exerciseKind": "translation", "submittedAnswer": "неверный вариант",
	}, http.StatusAccepted, &suggestion)
	if suggestion.Status != "pending" || suggestion.SubmittedAnswer != "неверный вариант" {
		t.Fatalf("unexpected suggestion: %+v", suggestion)
	}

	var accepted struct {
		RequestedRating string `json:"requestedRating"`
		EffectiveRating string `json:"effectiveRating"`
		Correct         bool   `json:"correct"`
		MatchedAnswer   string `json:"matchedAnswer"`
		Repetitions     int    `json:"repetitions"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, wordIDs[1]), registered.Tokens.AccessToken, map[string]any{
		"rating": "almost", "answerMode": "recall", "submittedAnswer": "Происшествие!", "answerRevealed": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &accepted)
	if !accepted.Correct || accepted.RequestedRating != "almost" || accepted.EffectiveRating != "almost" || accepted.MatchedAnswer != "происшествие" || accepted.Repetitions != 1 {
		t.Fatalf("unexpected accepted assessment: %+v", accepted)
	}

	var storedRating, effectiveRating, judgementSource string
	var storedCorrect bool
	if err := pg.QueryRow(ctx, `
		select rating, effective_rating, correct, judgement_source
		from review_events
		where id = $1
	`, rejected.ReviewEventID).Scan(&storedRating, &effectiveRating, &storedCorrect, &judgementSource); err != nil {
		t.Fatalf("query rejected event: %v", err)
	}
	if storedRating != "known" || effectiveRating != "again" || storedCorrect || judgementSource != "server" {
		t.Fatalf("unexpected stored judgement: rating=%s effective=%s correct=%v source=%s", storedRating, effectiveRating, storedCorrect, judgementSource)
	}
}
