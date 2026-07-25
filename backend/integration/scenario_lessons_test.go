//go:build integration

package integration

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

type scenarioReviewTargetResponse struct {
	Term string `json:"term"`
}

type scenarioStepResponse struct {
	Position               int                          `json:"position"`
	Kind                   string                       `json:"kind"`
	Vocabulary             []string                     `json:"vocabulary"`
	ReviewTarget           scenarioReviewTargetResponse `json:"reviewTarget"`
	RequiresFactHypothesis bool                         `json:"requiresFactHypothesis"`
	MinResponseCharacters  int                          `json:"minResponseCharacters"`
}

type scenarioResponse struct {
	Slug                string                 `json:"slug"`
	Type                string                 `json:"type"`
	WorkplaceGoal       string                 `json:"workplaceGoal"`
	CompletionCriterion string                 `json:"completionCriterion"`
	StepCount           int                    `json:"stepCount"`
	Steps               []scenarioStepResponse `json:"steps"`
}

type scenarioAttemptResponse struct {
	ID                 string                `json:"id"`
	Scenario           scenarioResponse      `json:"scenario"`
	CurrentPosition    int                   `json:"currentPosition"`
	Status             string                `json:"status"`
	Version            int64                 `json:"version"`
	CompletedPositions []int                 `json:"completedPositions"`
	CurrentStep        *scenarioStepResponse `json:"currentStep"`
}

type startScenarioResponse struct {
	Attempt scenarioAttemptResponse `json:"attempt"`
	Resumed bool                    `json:"resumed"`
}

type submitScenarioStepResponse struct {
	Attempt scenarioAttemptResponse `json:"attempt"`
	Review  struct {
		WordID          int64  `json:"wordId"`
		ReviewEventID   int64  `json:"reviewEventId"`
		JudgementSource string `json:"judgementSource"`
		JudgementReason string `json:"judgementReason"`
		EffectiveRating string `json:"effectiveRating"`
		Correct         *bool  `json:"correct"`
		MatchedAnswer   string `json:"matchedAnswer"`
	} `json:"review"`
	IdempotentReplay bool `json:"idempotentReplay"`
}

func TestScenarioLessonsContract(t *testing.T) {
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
		"email":       fmt.Sprintf("scenario-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Scenario Learner",
	}, http.StatusCreated)

	var catalogResponse struct {
		Items []scenarioResponse `json:"items"`
		Count int                `json:"count"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/scenarios", registered.Tokens.AccessToken, http.StatusOK, &catalogResponse)
	if catalogResponse.Count != 6 || len(catalogResponse.Items) != 6 {
		t.Fatalf("scenario catalog = %+v, want six scenarios", catalogResponse)
	}
	gotTypes := make([]string, 0, len(catalogResponse.Items))
	for _, item := range catalogResponse.Items {
		if item.WorkplaceGoal == "" || item.CompletionCriterion == "" || item.StepCount != 3 {
			t.Fatalf("incomplete scenario catalog item: %+v", item)
		}
		gotTypes = append(gotTypes, item.Type)
	}
	wantTypes := []string{"incident", "troubleshooting", "architecture-review", "data-pipeline", "release", "status-update"}
	if !reflect.DeepEqual(gotTypes, wantTypes) {
		t.Fatalf("scenario types = %v, want %v", gotTypes, wantTypes)
	}

	var incident scenarioResponse
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/scenarios/incident-update", registered.Tokens.AccessToken, http.StatusOK, &incident)
	if incident.StepCount != 3 || len(incident.Steps) != 3 {
		t.Fatalf("incident steps = %+v", incident.Steps)
	}
	wantTargets := []string{"incident", "mitigation", "status"}
	for position, step := range incident.Steps {
		if step.Position != position || step.Kind == "" || len(step.Vocabulary) == 0 {
			t.Fatalf("incident step order/content = %+v", incident.Steps)
		}
		if step.ReviewTarget.Term != wantTargets[position] || !containsString(step.Vocabulary, step.ReviewTarget.Term) {
			t.Fatalf("incident review target = %+v, want %q in vocabulary", step.ReviewTarget, wantTargets[position])
		}
	}
	if !incident.Steps[0].RequiresFactHypothesis || !incident.Steps[2].RequiresFactHypothesis {
		t.Fatalf("incident fact/hypothesis contract = %+v", incident.Steps)
	}

	var started startScenarioResponse
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/scenarios/incident-update/attempts", registered.Tokens.AccessToken, nil, http.StatusCreated, &started)
	if started.Resumed || started.Attempt.ID == "" || started.Attempt.Status != "active" || started.Attempt.Version != 1 || started.Attempt.CurrentPosition != 0 || started.Attempt.CurrentStep == nil || started.Attempt.CurrentStep.Position != 0 {
		t.Fatalf("started scenario attempt = %+v", started)
	}
	if started.Attempt.CurrentStep.ReviewTarget.Term != "incident" {
		t.Fatalf("started review target = %+v", started.Attempt.CurrentStep.ReviewTarget)
	}

	baseReview := map[string]any{
		"responseMs":            1200,
		"timezoneOffsetMinutes": 0,
	}
	outOfOrder := scenarioStepPayload(
		"00000000-0000-0000-0000-000000000002",
		started.Attempt.Version,
		"This response is deliberately long enough, but it targets the second step before the first step is complete.",
		nil,
		nil,
		baseReview,
	)
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/1", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, outOfOrder, http.StatusConflict, nil)

	legacyReviewPayload := scenarioStepPayload(
		"00000000-0000-0000-0000-000000000008",
		started.Attempt.Version,
		"The incident is confirmed and the API error rate is above baseline, while database saturation remains a hypothesis.",
		[]string{"The API error rate is above baseline."},
		[]string{"Database saturation may be the cause."},
		map[string]any{
			"wordId":                1,
			"rating":                "known",
			"responseMs":            1200,
			"submittedAnswer":       "incident",
			"answerRevealed":        false,
			"timezoneOffsetMinutes": 0,
		},
	)
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/0", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, legacyReviewPayload, http.StatusBadRequest, nil)

	var paused scenarioAttemptResponse
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/pause", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, map[string]any{
		"attemptVersion": started.Attempt.Version,
	}, http.StatusOK, &paused)
	if paused.Status != "paused" || paused.Version != 2 || paused.CurrentPosition != 0 {
		t.Fatalf("paused scenario attempt = %+v", paused)
	}

	var reloaded scenarioAttemptResponse
	getAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, http.StatusOK, &reloaded)
	if reloaded.Status != "paused" || reloaded.CurrentStep == nil || reloaded.CurrentStep.Position != 0 || reloaded.CurrentStep.ReviewTarget.Term != "incident" {
		t.Fatalf("reloaded paused attempt = %+v", reloaded)
	}

	pausedSubmission := scenarioStepPayload(
		"00000000-0000-0000-0000-000000000003",
		paused.Version,
		"The incident is confirmed above baseline, while a database saturation cause is still only a hypothesis.",
		[]string{"The API error rate is above baseline."},
		[]string{"Database saturation may be the cause."},
		baseReview,
	)
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/0", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, pausedSubmission, http.StatusConflict, nil)

	var resumed scenarioAttemptResponse
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/resume", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, map[string]any{
		"attemptVersion": paused.Version,
	}, http.StatusOK, &resumed)
	if resumed.Status != "active" || resumed.Version != 3 || resumed.CurrentPosition != 0 || resumed.CurrentStep == nil || resumed.CurrentStep.ReviewTarget.Term != "incident" {
		t.Fatalf("resumed scenario attempt = %+v", resumed)
	}

	overlapPayload := scenarioStepPayload(
		"00000000-0000-0000-0000-000000000004",
		resumed.Version,
		"The incident is confirmed, and the statement is intentionally duplicated across both evidence groups.",
		[]string{"The API error rate is above baseline."},
		[]string{"The API error rate is above baseline."},
		baseReview,
	)
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/0", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, overlapPayload, http.StatusUnprocessableEntity, nil)

	firstSubmissionID := "00000000-0000-0000-0000-000000000005"
	firstPayload := scenarioStepPayload(
		firstSubmissionID,
		resumed.Version,
		"The incident is confirmed: the API error rate is above baseline. Database saturation remains a hypothesis until connection metrics are checked.",
		[]string{"The API error rate is confirmed above baseline."},
		[]string{"Database saturation may be the cause."},
		baseReview,
	)
	var first submitScenarioStepResponse
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/0", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, firstPayload, http.StatusOK, &first)
	if first.IdempotentReplay || first.Review.ReviewEventID <= 0 || first.Review.WordID <= 0 || first.Attempt.CurrentPosition != 1 || first.Attempt.Version != 4 || first.Attempt.Status != "active" {
		t.Fatalf("first scenario submission = %+v", first)
	}
	if first.Review.Correct == nil || !*first.Review.Correct || first.Review.JudgementSource != "server" || first.Review.EffectiveRating != "known" || first.Review.JudgementReason != "scenario_target_present" || first.Review.MatchedAnswer != "incident" {
		t.Fatalf("first scenario review evidence = %+v", first.Review)
	}
	if first.Attempt.CurrentStep == nil || first.Attempt.CurrentStep.ReviewTarget.Term != "mitigation" {
		t.Fatalf("next Scenario target = %+v", first.Attempt.CurrentStep)
	}

	var replay submitScenarioStepResponse
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/0", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, firstPayload, http.StatusOK, &replay)
	if !replay.IdempotentReplay || replay.Review.ReviewEventID != first.Review.ReviewEventID || replay.Review.WordID != first.Review.WordID || replay.Attempt.Version != first.Attempt.Version {
		t.Fatalf("idempotent replay = %+v, first = %+v", replay, first)
	}

	mutatedFirstPayload := scenarioStepPayload(
		firstSubmissionID,
		resumed.Version,
		"This changed incident response reuses the same submission identifier and therefore must be rejected instead of replayed.",
		[]string{"The API error rate is confirmed above baseline."},
		[]string{"A network issue may be the cause."},
		baseReview,
	)
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/0", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, mutatedFirstPayload, http.StatusConflict, nil)

	var reviewEventCount int
	var linkedReviewEventID int64
	var linkedWordID int64
	var answerMode string
	var eventSchemaVersion int
	var correct bool
	var effectiveRating string
	var judgementSource string
	var judgementReason string
	var matchedAnswer string
	if err := pg.QueryRow(ctx, `
		select count(*)::int,
		       max(review_event.id),
		       max(review_event.word_id),
		       max(review_event.answer_mode),
		       max(review_event.event_schema_version),
		       bool_and(review_event.correct),
		       max(review_event.effective_rating),
		       max(review_event.judgement_source),
		       max(review_event.judgement_reason),
		       max(review_event.matched_answer)
		from review_events review_event
		join scenario_attempt_steps attempt_step on attempt_step.review_event_id = review_event.id
		where attempt_step.attempt_id = $1::uuid
	`, started.Attempt.ID).Scan(
		&reviewEventCount,
		&linkedReviewEventID,
		&linkedWordID,
		&answerMode,
		&eventSchemaVersion,
		&correct,
		&effectiveRating,
		&judgementSource,
		&judgementReason,
		&matchedAnswer,
	); err != nil {
		t.Fatalf("query linked scenario review event: %v", err)
	}
	if reviewEventCount != 1 || linkedReviewEventID != first.Review.ReviewEventID || linkedWordID != first.Review.WordID || answerMode != "recall" || eventSchemaVersion != 2 || !correct || effectiveRating != "known" || judgementSource != "server" || judgementReason != "scenario_target_present" || matchedAnswer != "incident" {
		t.Fatalf("linked Scenario review evidence count=%d id=%d word=%d mode=%s schema=%d correct=%v effective=%s source=%s reason=%s matched=%s", reviewEventCount, linkedReviewEventID, linkedWordID, answerMode, eventSchemaVersion, correct, effectiveRating, judgementSource, judgementReason, matchedAnswer)
	}

	var persistedLemma string
	var persistedTranslation string
	var assigned bool
	if err := pg.QueryRow(ctx, `
		select word.lemma,
		       word.translation,
		       exists (
		           select 1
		           from user_words user_word
		           where user_word.user_id = $1::uuid
		             and user_word.word_id = word.id
		       )
		from words word
		where word.id = $2
	`, registered.User.ID, first.Review.WordID).Scan(&persistedLemma, &persistedTranslation, &assigned); err != nil {
		t.Fatalf("query Scenario review target assignment: %v", err)
	}
	if persistedLemma != "incident" || persistedTranslation != "инцидент" || !assigned {
		t.Fatalf("persisted Scenario target lemma=%q translation=%q assigned=%v", persistedLemma, persistedTranslation, assigned)
	}

	var resumedAgain startScenarioResponse
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/scenarios/incident-update/attempts", registered.Tokens.AccessToken, nil, http.StatusOK, &resumedAgain)
	if !resumedAgain.Resumed || resumedAgain.Attempt.ID != started.Attempt.ID || resumedAgain.Attempt.CurrentPosition != 1 || resumedAgain.Attempt.CurrentStep == nil || resumedAgain.Attempt.CurrentStep.ReviewTarget.Term != "mitigation" {
		t.Fatalf("resumed open scenario from catalog = %+v", resumedAgain)
	}

	secondPayload := scenarioStepPayload(
		"00000000-0000-0000-0000-000000000006",
		first.Attempt.Version,
		"We disabled the failing route. The on-call owner will validate recovery through the error-rate and latency dashboards.",
		nil,
		nil,
		baseReview,
	)
	var second submitScenarioStepResponse
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/1", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, secondPayload, http.StatusOK, &second)
	if second.Attempt.CurrentPosition != 2 || second.Attempt.Version != 5 || second.Attempt.Status != "active" {
		t.Fatalf("second scenario submission = %+v", second)
	}
	if second.Review.Correct == nil || *second.Review.Correct || second.Review.EffectiveRating != "again" || second.Review.JudgementSource != "server" || second.Review.JudgementReason != "scenario_target_missing" || second.Review.MatchedAnswer != "" {
		t.Fatalf("missing-target Scenario evidence = %+v", second.Review)
	}
	if second.Attempt.CurrentStep == nil || second.Attempt.CurrentStep.ReviewTarget.Term != "status" {
		t.Fatalf("third Scenario target = %+v", second.Attempt.CurrentStep)
	}

	thirdPayload := scenarioStepPayload(
		"00000000-0000-0000-0000-000000000007",
		second.Attempt.Version,
		"Status: the API error rate is above baseline and customer requests are affected. Confirmed fact: errors started after the deployment. Hypothesis: database saturation may contribute, but it is not the confirmed root cause. Mitigation: the failing route is disabled and the on-call owner is validating recovery. The next checkpoint is in fifteen minutes after latency and error-rate metrics stabilize.",
		[]string{"Errors started after the deployment.", "Customer requests are affected."},
		[]string{"Database saturation may contribute."},
		baseReview,
	)
	var completed submitScenarioStepResponse
	putAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s/steps/2", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, thirdPayload, http.StatusOK, &completed)
	if completed.Attempt.Status != "completed" || completed.Attempt.CurrentPosition != 3 || completed.Attempt.Version != 6 || completed.Attempt.CurrentStep != nil || !reflect.DeepEqual(completed.Attempt.CompletedPositions, []int{0, 1, 2}) {
		t.Fatalf("completed scenario attempt = %+v", completed)
	}
	if completed.Review.Correct == nil || !*completed.Review.Correct || completed.Review.EffectiveRating != "known" || completed.Review.JudgementReason != "scenario_target_present" || completed.Review.MatchedAnswer != "status" {
		t.Fatalf("completed Scenario review evidence = %+v", completed.Review)
	}

	var persisted scenarioAttemptResponse
	getAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/scenario-attempts/%s", testServer.URL, started.Attempt.ID), registered.Tokens.AccessToken, http.StatusOK, &persisted)
	if persisted.Status != "completed" || !reflect.DeepEqual(persisted.CompletedPositions, []int{0, 1, 2}) {
		t.Fatalf("persisted completed scenario attempt = %+v", persisted)
	}

	var linkedCount int
	var assignedTargetCount int
	if err := pg.QueryRow(ctx, `
		select count(*)::int,
		       count(distinct user_word.word_id)::int
		from scenario_attempt_steps attempt_step
		join review_events review_event on review_event.id = attempt_step.review_event_id
		join user_words user_word
		  on user_word.user_id = $2::uuid
		 and user_word.word_id = review_event.word_id
		where attempt_step.attempt_id = $1::uuid
	`, started.Attempt.ID, registered.User.ID).Scan(&linkedCount, &assignedTargetCount); err != nil {
		t.Fatalf("query completed Scenario review targets: %v", err)
	}
	if linkedCount != 3 || assignedTargetCount != 3 {
		t.Fatalf("completed Scenario evidence linked=%d assignedTargets=%d, want 3/3", linkedCount, assignedTargetCount)
	}

	var next startScenarioResponse
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/scenarios/incident-update/attempts", registered.Tokens.AccessToken, nil, http.StatusCreated, &next)
	if next.Resumed || next.Attempt.ID == started.Attempt.ID || next.Attempt.CurrentPosition != 0 || next.Attempt.Version != 1 || next.Attempt.CurrentStep == nil || next.Attempt.CurrentStep.ReviewTarget.Term != "incident" {
		t.Fatalf("new scenario attempt after completion = %+v", next)
	}
}

func scenarioStepPayload(
	submissionID string,
	attemptVersion int64,
	response string,
	facts []string,
	hypotheses []string,
	review map[string]any,
) map[string]any {
	return map[string]any{
		"submissionId":   submissionID,
		"attemptVersion": attemptVersion,
		"response":       response,
		"facts":          facts,
		"hypotheses":     hypotheses,
		"review":         review,
	}
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
