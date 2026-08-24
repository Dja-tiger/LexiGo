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
	"github.com/jackc/pgx/v5/pgtype"
)

func TestLessonReviewPersistsProcessAttributionWithoutAnswerModeInference(t *testing.T) {
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

	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("process-attribution-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Process Learner",
	}, http.StatusCreated)

	rows, err := pg.Query(ctx, "select word_id from user_words where user_id = $1::uuid order by word_id limit 3", registered.User.ID)
	if err != nil {
		t.Fatalf("query assigned words: %v", err)
	}
	wordIDs := make([]int64, 0, 3)
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			rows.Close()
			t.Fatalf("scan assigned word: %v", err)
		}
		wordIDs = append(wordIDs, wordID)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		t.Fatalf("iterate assigned words: %v", err)
	}
	rows.Close()
	if len(wordIDs) != 3 {
		t.Fatalf("assigned word count = %d, want 3", len(wordIDs))
	}

	type lessonPayload struct {
		ID      string `json:"id"`
		Version int64  `json:"version"`
	}
	createLesson := func(kind *string, mode string, wordID int64) lessonPayload {
		t.Helper()
		body := map[string]any{
			"source": "mixed", "studyMode": mode, "lessonSize": "15", "wordIds": []int64{wordID},
		}
		if kind != nil {
			body["sessionKind"] = *kind
		}
		var lesson lessonPayload
		postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, body, http.StatusCreated, &lesson)
		if lesson.ID == "" || lesson.Version < 1 {
			t.Fatalf("unexpected lesson payload: %+v", lesson)
		}
		return lesson
	}

	reviewKind := "review"
	reviewLesson := createLesson(&reviewKind, "choice", wordIDs[0])
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, reviewLesson.ID, wordIDs[0]), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "answerMode": "choice", "correct": true, "answerRevealed": false,
		"timezoneOffsetMinutes": 0, "lessonVersion": reviewLesson.Version,
	}, http.StatusOK, &map[string]any{})

	var sessionKind, selectionReason, answerMode string
	var reviewEventID int64
	if err := pg.QueryRow(ctx, `
		select id, session_kind, selection_reason, answer_mode
		from review_events
		where user_id = $1::uuid and word_id = $2
		order by id desc
		limit 1
	`, registered.User.ID, wordIDs[0]).Scan(&reviewEventID, &sessionKind, &selectionReason, &answerMode); err != nil {
		t.Fatalf("query attributed review event: %v", err)
	}
	if sessionKind != "review" || selectionReason != "manual" || answerMode != "choice" {
		t.Fatalf("review event attribution kind=%q reason=%q mode=%q, want review/manual/choice", sessionKind, selectionReason, answerMode)
	}

	legacyLesson := createLesson(nil, "study", wordIDs[1])
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, legacyLesson.ID, wordIDs[1]), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "answerMode": "study", "answerRevealed": true,
		"timezoneOffsetMinutes": 0, "lessonVersion": legacyLesson.Version,
	}, http.StatusOK, &map[string]any{})

	var legacySessionKind pgtype.Text
	var legacySelectionReason pgtype.Text
	if err := pg.QueryRow(ctx, `
		select session_kind, selection_reason
		from review_events
		where user_id = $1::uuid and word_id = $2
		order by id desc
		limit 1
	`, registered.User.ID, wordIDs[1]).Scan(&legacySessionKind, &legacySelectionReason); err != nil {
		t.Fatalf("query legacy lesson review attribution: %v", err)
	}
	if legacySessionKind.Valid {
		t.Fatalf("legacy lesson event session_kind = %q, want SQL NULL", legacySessionKind.String)
	}
	if !legacySelectionReason.Valid || legacySelectionReason.String != "manual" {
		t.Fatalf("legacy lesson event selection_reason = %+v, want manual", legacySelectionReason)
	}

	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, wordIDs[2]), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "answerMode": "recall", "correct": true, "answerRevealed": false,
		"timezoneOffsetMinutes": 0,
	}, http.StatusOK, &map[string]any{})

	var directSessionKind pgtype.Text
	var directSelectionReason pgtype.Text
	if err := pg.QueryRow(ctx, `
		select session_kind, selection_reason
		from review_events
		where user_id = $1::uuid and word_id = $2
		order by id desc
		limit 1
	`, registered.User.ID, wordIDs[2]).Scan(&directSessionKind, &directSelectionReason); err != nil {
		t.Fatalf("query direct review attribution: %v", err)
	}
	if directSessionKind.Valid || directSelectionReason.Valid {
		t.Fatalf("direct review attribution kind=%+v reason=%+v, want both SQL NULL", directSessionKind, directSelectionReason)
	}

	if _, err := pg.Exec(ctx, "update review_events set session_kind = 'future' where id = $1", reviewEventID); err == nil {
		t.Fatal("database accepted invalid review_events.session_kind")
	}
	if _, err := pg.Exec(ctx, "update review_events set selection_reason = 'future_reason' where id = $1", reviewEventID); err == nil {
		t.Fatal("database accepted invalid review_events.selection_reason")
	}
}
