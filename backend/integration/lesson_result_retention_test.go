package integration

import (
	"context"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestLessonResultRetentionMetrics(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Fatalf("connect postgres: %v", err)
	}
	defer db.Close()
	if err := migrate.Up(ctx, db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if _, err := db.Exec(ctx, `
		truncate table
			lesson_result_actions,
			lesson_session_items,
			lesson_sessions,
			user_words,
			refresh_tokens,
			users
		restart identity cascade
	`); err != nil {
		t.Fatalf("truncate: %v", err)
	}

	cfg := testConfig()
	srv, err := server.New(cfg, newTestLogger(), db, nil)
	if err != nil {
		t.Fatalf("create server: %v", err)
	}
	api := srv.Handler()

	owner := registerUser(t, api, "result-owner@example.com", "Result Owner")
	intruder := registerUser(t, api, "result-intruder@example.com", "Result Intruder")

	var ownerID string
	if err := db.QueryRow(ctx, `select id::text from users where email = $1`, "result-owner@example.com").Scan(&ownerID); err != nil {
		t.Fatalf("query owner id: %v", err)
	}

	var completedLessonID string
	if err := db.QueryRow(ctx, `
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

	invalid := postAuthenticatedJSON(
		t,
		api,
		http.MethodPost,
		"/api/v1/lessons/"+completedLessonID+"/result-action",
		owner.AccessToken,
		map[string]any{
			"recommendedAction": "due_review",
			"selectedAction":    "unknown",
		},
	)
	if invalid.Code != http.StatusUnprocessableEntity {
		t.Fatalf("invalid action status = %d body=%s", invalid.Code, invalid.Body.String())
	}

	intruderResponse := postAuthenticatedJSON(
		t,
		api,
		http.MethodPost,
		"/api/v1/lessons/"+completedLessonID+"/result-action",
		intruder.AccessToken,
		map[string]any{
			"recommendedAction": "due_review",
			"selectedAction":    "progress",
		},
	)
	if intruderResponse.Code != http.StatusNotFound {
		t.Fatalf("intruder action status = %d body=%s", intruderResponse.Code, intruderResponse.Body.String())
	}

	first := postAuthenticatedJSON(
		t,
		api,
		http.MethodPost,
		"/api/v1/lessons/"+completedLessonID+"/result-action",
		owner.AccessToken,
		map[string]any{
			"recommendedAction": "due_review",
			"selectedAction":    "progress",
		},
	)
	if first.Code != http.StatusNoContent {
		t.Fatalf("first action status = %d body=%s", first.Code, first.Body.String())
	}

	// Reload/double-click must not rewrite the first choice used by the
	// completion-to-next-action metric.
	duplicate := postAuthenticatedJSON(
		t,
		api,
		http.MethodPost,
		"/api/v1/lessons/"+completedLessonID+"/result-action",
		owner.AccessToken,
		map[string]any{
			"recommendedAction": "home",
			"selectedAction":    "home",
		},
	)
	if duplicate.Code != http.StatusNoContent {
		t.Fatalf("duplicate action status = %d body=%s", duplicate.Code, duplicate.Body.String())
	}

	var actionCount int
	var recommendedAction string
	var selectedAction string
	if err := db.QueryRow(ctx, `
		select count(*), min(recommended_action), min(selected_action)
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
	if err := db.QueryRow(ctx, `
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
	var completionToActionSeconds *int64
	var metricNextLessonID *string
	var returnToNextSessionSeconds *int64
	var selectedRecommended *bool
	if err := db.QueryRow(ctx, `
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
	if completionToActionSeconds == nil || *completionToActionSeconds < 0 {
		t.Fatalf("completion_to_action_seconds = %v", completionToActionSeconds)
	}
	if metricNextLessonID == nil || *metricNextLessonID != nextLessonID {
		t.Fatalf("next_lesson_id = %v want %s", metricNextLessonID, nextLessonID)
	}
	if returnToNextSessionSeconds == nil || *returnToNextSessionSeconds < 0 {
		t.Fatalf("return_to_next_session_seconds = %v", returnToNextSessionSeconds)
	}
	if selectedRecommended == nil || *selectedRecommended {
		t.Fatalf("selected_recommended_action = %v want false", selectedRecommended)
	}
}
