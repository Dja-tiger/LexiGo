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

func TestLearningReviewModesAndAnalytics(t *testing.T) {
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
		"email":       fmt.Sprintf("review-modes-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Mode Learner",
	}, http.StatusCreated)

	var words struct {
		Items []struct {
			ID int64 `json:"id"`
		} `json:"items"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?limit=5", registered.Tokens.AccessToken, http.StatusOK, &words)
	if len(words.Items) < 4 {
		t.Fatalf("due items = %d, want at least 4", len(words.Items))
	}

	type reviewResult struct {
		Status       string `json:"status"`
		IntervalDays int    `json:"intervalDays"`
		Repetitions  int    `json:"repetitions"`
	}
	var study reviewResult
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[0].ID), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "responseMs": 900, "answerMode": "study", "answerRevealed": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &study)
	if study.Status != "learning" || study.Repetitions != 0 || study.IntervalDays != 0 {
		t.Fatalf("study result = %+v", study)
	}

	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[0].ID), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "answerMode": "study", "answerRevealed": true, "correct": true, "timezoneOffsetMinutes": 0,
	}, http.StatusUnprocessableEntity, nil)

	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[1].ID), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "responseMs": 1100, "answerMode": "recall", "answerRevealed": true, "correct": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &reviewResult{})
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[2].ID), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "responseMs": 800, "answerMode": "choice", "answerRevealed": false, "correct": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &reviewResult{})

	var recallDueAt time.Time
	var recallRepetitions int
	if err := pg.QueryRow(ctx, `
		select due_at, repetitions
		from user_words
		where user_id = $1::uuid and word_id = $2
	`, registered.User.ID, words.Items[1].ID).Scan(&recallDueAt, &recallRepetitions); err != nil {
		t.Fatalf("query recall state before study: %v", err)
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[1].ID), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "responseMs": 500, "answerMode": "study", "answerRevealed": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &reviewResult{})
	var recallDueAtAfterStudy time.Time
	var recallRepetitionsAfterStudy int
	if err := pg.QueryRow(ctx, `
		select due_at, repetitions
		from user_words
		where user_id = $1::uuid and word_id = $2
	`, registered.User.ID, words.Items[1].ID).Scan(&recallDueAtAfterStudy, &recallRepetitionsAfterStudy); err != nil {
		t.Fatalf("query recall state after study: %v", err)
	}
	if !recallDueAtAfterStudy.Equal(recallDueAt) || recallRepetitionsAfterStudy != recallRepetitions {
		t.Fatalf("study changed existing recall schedule: before due=%s reps=%d, after due=%s reps=%d", recallDueAt, recallRepetitions, recallDueAtAfterStudy, recallRepetitionsAfterStudy)
	}

	var mode string
	var correct *bool
	var answerRevealed *bool
	var schemaVersion int
	if err := pg.QueryRow(ctx, `
		select answer_mode, correct, answer_revealed, event_schema_version
		from review_events
		where user_id = $1::uuid and word_id = $2
		order by id desc
		limit 1
	`, registered.User.ID, words.Items[0].ID).Scan(&mode, &correct, &answerRevealed, &schemaVersion); err != nil {
		t.Fatalf("query study event: %v", err)
	}
	if mode != "study" || correct != nil || answerRevealed == nil || !*answerRevealed || schemaVersion != 2 {
		t.Fatalf("study event mode=%q correct=%v answerRevealed=%v schema=%d", mode, correct, answerRevealed, schemaVersion)
	}

	if _, err := pg.Exec(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
			answer_revealed, event_schema_version
		) values ($1::uuid, $2, 5, 1000, now(), 'known', 'recall', null, true, 1)
	`, registered.User.ID, words.Items[3].ID); err != nil {
		t.Fatalf("insert ambiguous schema-v1 event: %v", err)
	}

	for index, attemptMode := range []string{"study", "recall", "choice"} {
		wordID := words.Items[index].ID
		var objectiveCorrect any
		if attemptMode != "study" {
			objectiveCorrect = true
		}
		if _, err := pg.Exec(ctx, `
			insert into review_events(
				user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
				answer_revealed, event_schema_version
			) values (
				$1::uuid, $2, 5, 1000,
				date_trunc('week', now()) - interval '1 day',
				'known', $3, $4, true, 2
			)
		`, registered.User.ID, wordID, attemptMode, objectiveCorrect); err != nil {
			t.Fatalf("insert previous %s event: %v", attemptMode, err)
		}
	}

	if _, err := pg.Exec(ctx, `
	insert into review_events(
		user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
		answer_revealed, event_schema_version
	) values ($1::uuid, $2, 0, 120000, now(), 'again', 'recall', false, false, 2)
`, registered.User.ID, words.Items[3].ID); err != nil {
		t.Fatalf("insert incorrect recall event: %v", err)
	}
	if _, err := pg.Exec(ctx, `
	insert into lesson_sessions(
		user_id, source, study_mode, lesson_size, status, completed_at
	) values ($1::uuid, 'mixed', 'recall', '15', 'completed', now())
`, registered.User.ID); err != nil {
		t.Fatalf("insert completed lesson: %v", err)
	}

	var progress struct {
		ReviewsToday             int `json:"reviewsToday"`
		SuccessfulToday          int `json:"successfulToday"`
		ObjectiveReviewsToday    int `json:"objectiveReviewsToday"`
		ObjectiveSuccessfulToday int `json:"objectiveSuccessfulToday"`
		RetainedItemsWeek        int `json:"retainedItemsWeek"`
		EventSchemaVersion       int `json:"eventSchemaVersion"`

		Weekly struct {
			WeekStart                string `json:"weekStart"`
			WeekEnd                  string `json:"weekEnd"`
			RecallAttempts           int    `json:"recallAttempts"`
			RecallSuccessful         int    `json:"recallSuccessful"`
			RecallRate               int    `json:"recallRate"`
			PreviousRecallAttempts   int    `json:"previousRecallAttempts"`
			PreviousRecallSuccessful int    `json:"previousRecallSuccessful"`
			PreviousRecallRate       int    `json:"previousRecallRate"`
			ChoiceAttempts           int    `json:"choiceAttempts"`
			ChoiceSuccessful         int    `json:"choiceSuccessful"`
			ChoiceRate               int    `json:"choiceRate"`
			Reviews                  int    `json:"reviews"`
			Lessons                  int    `json:"lessons"`
			ActiveMinutes            int    `json:"activeMinutes"`
			Trend                    []struct {
				Date       string `json:"date"`
				Attempts   int    `json:"attempts"`
				Successful int    `json:"successful"`
				Rate       int    `json:"rate"`
			} `json:"trend"`
			WeakTopics []struct {
				Topic      string `json:"topic"`
				Attempts   int    `json:"attempts"`
				Successful int    `json:"successful"`
				Errors     int    `json:"errors"`
				Rate       int    `json:"rate"`
			} `json:"weakTopics"`
		} `json:"weekly"`
		Modes struct {
			Study struct {
				AttemptsToday int `json:"attemptsToday"`
			} `json:"study"`
			Recall struct {
				AttemptsToday   int `json:"attemptsToday"`
				SuccessfulToday int `json:"successfulToday"`
			} `json:"recall"`
			Choice struct {
				AttemptsToday   int `json:"attemptsToday"`
				SuccessfulToday int `json:"successfulToday"`
			} `json:"choice"`
			Legacy struct {
				AttemptsToday   int `json:"attemptsToday"`
				SuccessfulToday int `json:"successfulToday"`
			} `json:"legacy"`
		} `json:"modes"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/progress?timezoneOffsetMinutes=0", registered.Tokens.AccessToken, http.StatusOK, &progress)
	if progress.ReviewsToday != 6 || progress.ObjectiveReviewsToday != 3 || progress.ObjectiveSuccessfulToday != 2 || progress.SuccessfulToday != 3 {
		t.Fatalf("objective progress = %+v", progress)
	}
	if progress.Modes.Study.AttemptsToday != 2 || progress.Modes.Recall.AttemptsToday != 2 || progress.Modes.Recall.SuccessfulToday != 1 || progress.Modes.Choice.AttemptsToday != 1 || progress.Modes.Choice.SuccessfulToday != 1 || progress.Modes.Legacy.AttemptsToday != 1 || progress.Modes.Legacy.SuccessfulToday != 1 {
		t.Fatalf("mode progress = %+v", progress.Modes)
	}
	if progress.RetainedItemsWeek != 1 || progress.EventSchemaVersion != 2 {
		t.Fatalf("retained/schema progress = %+v", progress)
	}

	if progress.Weekly.RecallAttempts != 2 || progress.Weekly.RecallSuccessful != 1 || progress.Weekly.RecallRate != 50 {
		t.Fatalf("weekly recall evidence = %+v", progress.Weekly)
	}
	if progress.Weekly.PreviousRecallAttempts != 1 || progress.Weekly.PreviousRecallSuccessful != 1 || progress.Weekly.PreviousRecallRate != 100 {
		t.Fatalf("previous weekly recall evidence = %+v", progress.Weekly)
	}
	if progress.Weekly.ChoiceAttempts != 1 || progress.Weekly.ChoiceSuccessful != 1 || progress.Weekly.ChoiceRate != 100 {
		t.Fatalf("weekly choice evidence = %+v", progress.Weekly)
	}
	if progress.Weekly.Reviews != 6 || progress.Weekly.Lessons != 1 || progress.Weekly.ActiveMinutes != 3 {
		t.Fatalf("weekly activity = %+v", progress.Weekly)
	}
	if len(progress.Weekly.Trend) != 7 || len(progress.Weekly.WeakTopics) == 0 || progress.Weekly.WeakTopics[0].Errors != 1 {
		t.Fatalf("weekly trend/topics = %+v", progress.Weekly)
	}
	if progress.Weekly.WeekStart == "" || progress.Weekly.WeekEnd == "" {
		t.Fatalf("weekly bounds = %+v", progress.Weekly)
	}

	var lesson struct {
		ID        string `json:"id"`
		StudyMode string `json:"studyMode"`
		Version   int64  `json:"version"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
		"source": "mixed", "studyMode": "study", "lessonSize": "15", "wordIds": []int64{words.Items[3].ID},
	}, http.StatusCreated, &lesson)
	if lesson.StudyMode != "study" {
		t.Fatalf("lesson studyMode = %q, want study", lesson.StudyMode)
	}

	lessonReviewURL := fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, lesson.ID, words.Items[3].ID)
	postAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
		"lessonVersion": lesson.Version, "rating": "known", "answerMode": "recall", "answerRevealed": true, "correct": true, "timezoneOffsetMinutes": 0,
	}, http.StatusConflict, nil)
	postAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
		"lessonVersion": lesson.Version, "rating": "known", "answerMode": "study", "answerRevealed": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &struct{}{})
}
