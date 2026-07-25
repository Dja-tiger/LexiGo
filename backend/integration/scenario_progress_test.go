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

type scenarioProgressResponse struct {
	Scenarios struct {
		CompletedThisWeek int `json:"completedThisWeek"`
		CompletedTotal    int `json:"completedTotal"`
		Recommendation    *struct {
			Slug             string     `json:"slug"`
			Type             string     `json:"type"`
			Title            string     `json:"title"`
			EstimatedMinutes int        `json:"estimatedMinutes"`
			Reason           string     `json:"reason"`
			Action           string     `json:"action"`
			CompletedCount   int        `json:"completedCount"`
			LastCompletedAt  *time.Time `json:"lastCompletedAt"`
		} `json:"recommendation"`
	} `json:"scenarios"`
}

func TestScenarioProgressRecommendationContract(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, `
		truncate table
			scenario_attempt_steps,
			scenario_attempts,
			lesson_review_idempotency,
			lesson_session_items,
			lesson_sessions,
			user_learning_preferences,
			review_events,
			user_words,
			refresh_tokens,
			words,
			users
		restart identity cascade
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
		"email":       fmt.Sprintf("scenario-progress-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Scenario Progress Learner",
	}, http.StatusCreated)
	progressURL := testServer.URL + "/api/v1/progress?timezoneOffsetMinutes=0"

	initial := getScenarioProgress(t, progressURL, registered.Tokens.AccessToken)
	assertScenarioRecommendation(t, initial, 0, 0, "incident-update", "first_uncompleted", "start", 0)

	var started startScenarioResponse
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/scenarios/incident-update/attempts", registered.Tokens.AccessToken, nil, http.StatusCreated, &started)
	open := getScenarioProgress(t, progressURL, registered.Tokens.AccessToken)
	assertScenarioRecommendation(t, open, 0, 0, "incident-update", "resume_in_progress", "resume", 0)

	baseReview := map[string]any{
		"responseMs":            1200,
		"timezoneOffsetMinutes": 0,
	}
	steps := []struct {
		submissionID string
		response     string
		facts        []string
		hypotheses   []string
	}{
		{
			submissionID: "10000000-0000-0000-0000-000000000001",
			response:     "The incident is confirmed: customer requests are affected, while database saturation remains a hypothesis until metrics are checked.",
			facts:        []string{"Customer requests are affected."},
			hypotheses:   []string{"Database saturation may contribute."},
		},
		{
			submissionID: "10000000-0000-0000-0000-000000000002",
			response:     "Mitigation is owned by the on-call engineer, who disabled the failing route and is validating recovery through latency and error-rate signals.",
		},
		{
			submissionID: "10000000-0000-0000-0000-000000000003",
			response:     "Status: customer requests are affected. Confirmed fact: errors started after deployment. Hypothesis: database saturation may contribute. Mitigation: the failing route is disabled. The next checkpoint is in fifteen minutes after latency and error-rate metrics stabilize.",
			facts:        []string{"Errors started after deployment.", "Customer requests are affected."},
			hypotheses:   []string{"Database saturation may contribute."},
		},
	}

	attempt := started.Attempt
	for position, step := range steps {
		payload := scenarioStepPayload(
			step.submissionID,
			attempt.Version,
			step.response,
			step.facts,
			step.hypotheses,
			baseReview,
		)
		var submitted submitScenarioStepResponse
		putAuthenticatedJSON(
			t,
			fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/%d", testServer.URL, attempt.ID, position),
			registered.Tokens.AccessToken,
			payload,
			http.StatusOK,
			&submitted,
		)
		attempt = submitted.Attempt
	}
	if attempt.Status != "completed" {
		t.Fatalf("completed attempt status = %q, want completed", attempt.Status)
	}

	completed := getScenarioProgress(t, progressURL, registered.Tokens.AccessToken)
	assertScenarioRecommendation(t, completed, 1, 1, "troubleshoot-latency", "first_uncompleted", "start", 0)

	if _, err := pg.Exec(ctx, `
		update scenario_attempts
		set completed_at = now() - interval '10 days',
		    updated_at = now() - interval '10 days'
		where id = $1::uuid;

		insert into scenario_attempts (
			user_id,
			scenario_slug,
			scenario_version,
			current_position,
			status,
			version,
			started_at,
			updated_at,
			completed_at
		)
		select $2::uuid,
		       scenario.slug,
		       scenario.version,
		       step_count.value,
		       'completed',
		       1,
		       now(),
		       now(),
		       now()
		from scenarios scenario
		join lateral (
			select count(*)::int as value
			from scenario_steps step
			where step.scenario_slug = scenario.slug
		) step_count on true
		where scenario.slug <> 'incident-update';
	`, attempt.ID, registered.User.ID); err != nil {
		t.Fatalf("seed completed Scenario history: %v", err)
	}

	allCompleted := getScenarioProgress(t, progressURL, registered.Tokens.AccessToken)
	assertScenarioRecommendation(t, allCompleted, 5, 6, "incident-update", "least_recently_completed", "start", 1)
	if allCompleted.Scenarios.Recommendation.LastCompletedAt == nil {
		t.Fatal("least-recently-completed recommendation must expose lastCompletedAt")
	}
}

func getScenarioProgress(t *testing.T, url, accessToken string) scenarioProgressResponse {
	t.Helper()
	var progress scenarioProgressResponse
	getAuthenticatedJSON(t, url, accessToken, http.StatusOK, &progress)
	return progress
}

func assertScenarioRecommendation(
	t *testing.T,
	progress scenarioProgressResponse,
	wantCompletedThisWeek int,
	wantCompletedTotal int,
	wantSlug string,
	wantReason string,
	wantAction string,
	wantCompletedCount int,
) {
	t.Helper()
	if progress.Scenarios.CompletedThisWeek != wantCompletedThisWeek || progress.Scenarios.CompletedTotal != wantCompletedTotal {
		t.Fatalf(
			"Scenario completion progress = week:%d total:%d, want week:%d total:%d",
			progress.Scenarios.CompletedThisWeek,
			progress.Scenarios.CompletedTotal,
			wantCompletedThisWeek,
			wantCompletedTotal,
		)
	}
	recommendation := progress.Scenarios.Recommendation
	if recommendation == nil {
		t.Fatal("Scenario recommendation is nil")
	}
	if recommendation.Slug != wantSlug || recommendation.Reason != wantReason || recommendation.Action != wantAction || recommendation.CompletedCount != wantCompletedCount {
		t.Fatalf(
			"Scenario recommendation = slug:%q reason:%q action:%q completed:%d, want slug:%q reason:%q action:%q completed:%d",
			recommendation.Slug,
			recommendation.Reason,
			recommendation.Action,
			recommendation.CompletedCount,
			wantSlug,
			wantReason,
			wantAction,
			wantCompletedCount,
		)
	}
	if recommendation.Type == "" || recommendation.Title == "" || recommendation.EstimatedMinutes <= 0 {
		t.Fatalf("incomplete Scenario recommendation = %+v", recommendation)
	}
}
