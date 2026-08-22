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

func TestLessonSessionKindPersistenceDedupeAndLegacyCompatibility(t *testing.T) {
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

	email := fmt.Sprintf("session-kind-%d@example.com", time.Now().UnixNano())
	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Learner",
	}, http.StatusCreated)

	var userID string
	if err := pg.QueryRow(ctx, "select id::text from users where email = $1", email).Scan(&userID); err != nil {
		t.Fatalf("query registered user: %v", err)
	}
	rows, err := pg.Query(ctx, "select word_id from user_words where user_id = $1::uuid order by word_id limit 3", userID)
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

	type lessonItem struct {
		ID     int64  `json:"id"`
		Reason string `json:"reason"`
	}
	type lessonPayload struct {
		ID          string       `json:"id"`
		SessionKind string       `json:"sessionKind"`
		Items       []lessonItem `json:"items"`
	}

	var invalid map[string]any
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "study", "sessionKind": "future", "lessonSize": "15", "wordIds": wordIDs,
	}, http.StatusUnprocessableEntity, &invalid)

	create := func(kind *string) lessonPayload {
		t.Helper()
		body := map[string]any{
			"source": "mixed", "studyMode": "study", "lessonSize": "15", "wordIds": wordIDs,
		}
		if kind != nil {
			body["sessionKind"] = *kind
		}
		var lesson lessonPayload
		postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, body, http.StatusCreated, &lesson)
		if lesson.ID == "" || len(lesson.Items) != len(wordIDs) {
			t.Fatalf("unexpected lesson payload: %+v", lesson)
		}
		return lesson
	}

	studyKind := "study"
	study := create(&studyKind)
	if study.SessionKind != studyKind {
		t.Fatalf("study sessionKind = %q, want %q", study.SessionKind, studyKind)
	}
	var persistedStudyKind string
	if err := pg.QueryRow(ctx, "select session_kind from lesson_sessions where id = $1::uuid", study.ID).Scan(&persistedStudyKind); err != nil {
		t.Fatalf("query persisted study session kind: %v", err)
	}
	if persistedStudyKind != studyKind {
		t.Fatalf("persisted study session kind = %q, want %q", persistedStudyKind, studyKind)
	}

	duplicateStudy := create(&studyKind)
	if duplicateStudy.ID != study.ID {
		t.Fatalf("duplicate study lesson id = %s, want %s", duplicateStudy.ID, study.ID)
	}

	reviewKind := "review"
	review := create(&reviewKind)
	if review.ID == study.ID || review.SessionKind != reviewKind {
		t.Fatalf("review lesson = %+v, must differ from study %s and preserve session kind", review, study.ID)
	}

	remediationKind := "remediation"
	remediation := create(&remediationKind)
	if remediation.ID == review.ID || remediation.SessionKind != remediationKind {
		t.Fatalf("remediation lesson = %+v, must differ from review %s and preserve session kind", remediation, review.ID)
	}

	legacy := create(nil)
	if legacy.ID == remediation.ID {
		t.Fatalf("legacy omitted session kind deduped with explicit remediation lesson %s", remediation.ID)
	}
	if legacy.SessionKind != "" {
		t.Fatalf("legacy response sessionKind = %q, want omitted/empty", legacy.SessionKind)
	}
	var legacyKind pgtype.Text
	if err := pg.QueryRow(ctx, "select session_kind from lesson_sessions where id = $1::uuid", legacy.ID).Scan(&legacyKind); err != nil {
		t.Fatalf("query legacy session kind: %v", err)
	}
	if legacyKind.Valid {
		t.Fatalf("legacy session kind = %q, want SQL NULL", legacyKind.String)
	}

	var active lessonPayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &active)
	if active.ID != legacy.ID || active.SessionKind != "" {
		t.Fatalf("active legacy lesson = %+v, want id %s with omitted session kind", active, legacy.ID)
	}

	if _, err := pg.Exec(ctx, "update lesson_sessions set session_kind = 'future' where id = $1::uuid", legacy.ID); err == nil {
		t.Fatal("database accepted invalid lesson session_kind")
	}

	newReasons := []string{"overdue", "relearning_due", "repeated_again", "repeated_almost", "scheduled"}
	for _, reason := range newReasons {
		if _, err := pg.Exec(ctx, `
			update lesson_session_items
			set selection_reason = $1
			where session_id = $2::uuid and position = 0
		`, reason, legacy.ID); err != nil {
			t.Fatalf("database rejected selection reason %q: %v", reason, err)
		}
	}
	if _, err := pg.Exec(ctx, `
		update lesson_session_items
		set selection_reason = 'future_reason'
		where session_id = $1::uuid and position = 0
	`, legacy.ID); err == nil {
		t.Fatal("database accepted invalid lesson selection_reason")
	}

	if _, err := pg.Exec(ctx, `
		update lesson_session_items
		set selection_reason = 'repeated_almost'
		where session_id = $1::uuid and position = 0
	`, legacy.ID); err != nil {
		t.Fatalf("set API round-trip reason: %v", err)
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &active)
	if len(active.Items) == 0 || active.Items[0].Reason != "repeated_almost" {
		t.Fatalf("active lesson reason = %+v, want repeated_almost", active.Items)
	}
}
