//go:build integration

package integration

import (
	"context"
	"database/sql"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestLessonResultRetentionMetrics(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pgDSN := requiredEnv(t, "TEST_POSTGRES_DSN")
	pg, err := postgresplatform.Open(ctx, pgDSN)
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, `
		truncate table
			lesson_result_actions,
			lesson_session_items,
			lesson_sessions,
			user_learning_preferences,
			review_events,
			user_words,
			refresh_tokens,
			users
		restart identity cascade
	`); err != nil {
		t.Fatalf("truncate test data: %v", err)
	}

	redisAddr := requiredEnv(t, "TEST_REDIS_ADDR")
	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: redisAddr})
	if err != nil {
		t.Fatalf("open redis: %v", err)
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

	ownerEmail := "result-owner@example.com"
	intruderEmail := "result-intruder@example.com"
	owner := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": ownerEmail, "password": "strong-password", "displayName": "Result Owner",
	}, http.StatusCreated)
	intruder := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": intruderEmail, "password": "strong-password", "displayName": "Result Intruder",
	}, http.StatusCreated)

	var ownerID string
	if err := pg.QueryRow(ctx, `select id::text from users where email = $1`, ownerEmail).Scan(&ownerID); err != nil {
		t.Fatalf("query owner id: %v", err)
	}

	var completedLessonID string
	if err := pg.QueryRow(ctx, `
		insert into lesson_sessions (
			user_id,
			source,
			study_mode,
			lesson_size,
			current_index,
			status,
			version,
			created_at,
			updated_at,
			completed_at
		)
		values (
			$1::uuid,
			'mixed',
			'recall',
			'15',
			1,
			'completed',
			1,
			now() - interval '10 minutes',
			now() - interval '5 minutes',
			now() - interval '5 minutes'
		)
		returning id::text
	`, ownerID).Scan(&completedLessonID); err != nil {
		t.Fatalf("insert completed lesson: %v", err)
	}

	postAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/lessons/"+completedLessonID+"/result-action",
		owner.Tokens.AccessToken,
		map[string]any{
			"recommendedAction": "due_review",
			"selectedAction":    "unknown",
		},
		http.StatusUnprocessableEntity,
		nil,
	)

	postAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/lessons/"+completedLessonID+"/result-action",
		intruder.Tokens.AccessToken,
		map[string]any{
			"recommendedAction": "due_review",
			"selectedAction":    "progress",
		},
		http.StatusNotFound,
		nil,
	)

	postAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/lessons/"+completedLessonID+"/result-action",
		owner.Tokens.AccessToken,
		map[string]any{
			"recommendedAction": "due_review",
			"selectedAction":    "progress",
		},
		http.StatusNoContent,
		nil,
	)

	// Reload/double-click must not rewrite the first choice used by the
	// completion-to-next-action metric.
	postAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/lessons/"+completedLessonID+"/result-action",
		owner.Tokens.AccessToken,
		map[string]any{
			"recommendedAction": "home",
			"selectedAction":    "home",
		},
		http.StatusNoContent,
		nil,
	)

	var actionCount int
	var recommendedAction string
	var selectedAction string
	if err := pg.QueryRow(ctx, `
		select count(*)::int, min(recommended_action), min(selected_action)
		from lesson_result_actions
		where user_id = $1::uuid
		  and lesson_id = $2::uuid
	`, ownerID, completedLessonID).Scan(&actionCount, &recommendedAction, &selectedAction); err != nil {
		t.Fatalf("query result action: %v", err)
	}
	if actionCount != 1 || recommendedAction != "due_review" || selectedAction != "progress" {
		t.Fatalf(
			"first action was not preserved: count=%d recommended=%q selected=%q",
			actionCount,
			recommendedAction,
			selectedAction,
		)
	}

	var nextLessonID string
	if err := pg.QueryRow(ctx, `
		insert into lesson_sessions (
			user_id,
			source,
			study_mode,
			lesson_size,
			current_index,
			status,
			version
		)
		values ($1::uuid, 'mixed', 'recall', '15', 0, 'active', 1)
		returning id::text
	`, ownerID).Scan(&nextLessonID); err != nil {
		t.Fatalf("insert next lesson: %v", err)
	}

	var metricRecommended string
	var metricSelected string
	var completionToActionSeconds sql.NullInt64
	var metricNextLessonID sql.NullString
	var returnToNextSessionSeconds sql.NullInt64
	var selectedRecommended sql.NullBool
	if err := pg.QueryRow(ctx, `
		select
			recommended_action,
			selected_action,
			completion_to_action_seconds,
			next_lesson_id::text,
			return_to_next_session_seconds,
			selected_recommended_action
		from lesson_result_retention
		where user_id = $1::uuid
		  and lesson_id = $2::uuid
	`, ownerID, completedLessonID).Scan(
		&metricRecommended,
		&metricSelected,
		&completionToActionSeconds,
		&metricNextLessonID,
		&returnToNextSessionSeconds,
		&selectedRecommended,
	); err != nil {
		t.Fatalf("query retention metric: %v", err)
	}

	if metricRecommended != "due_review" || metricSelected != "progress" {
		t.Fatalf("unexpected metric actions: recommended=%q selected=%q", metricRecommended, metricSelected)
	}
	if !completionToActionSeconds.Valid || completionToActionSeconds.Int64 < 0 {
		t.Fatalf("completion_to_action_seconds = %+v", completionToActionSeconds)
	}
	if !metricNextLessonID.Valid || metricNextLessonID.String != nextLessonID {
		t.Fatalf("next_lesson_id = %+v want %s", metricNextLessonID, nextLessonID)
	}
	if !returnToNextSessionSeconds.Valid || returnToNextSessionSeconds.Int64 < 0 {
		t.Fatalf("return_to_next_session_seconds = %+v", returnToNextSessionSeconds)
	}
	if !selectedRecommended.Valid || selectedRecommended.Bool {
		t.Fatalf("selected_recommended_action = %+v want false", selectedRecommended)
	}
}
