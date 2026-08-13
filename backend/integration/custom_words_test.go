//go:build integration

package integration

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

type customWordPayload struct {
	ID           int64     `json:"id"`
	Lemma        string    `json:"lemma"`
	Translation  string    `json:"translation"`
	Topic        string    `json:"topic"`
	Status       string    `json:"status"`
	DueAt        time.Time `json:"dueAt"`
	Repetitions  int       `json:"repetitions"`
	IntervalDays int       `json:"intervalDays"`
}

type publicCatalogMetadataSnapshot struct {
	CatalogVersion string `json:"catalogVersion"`
	Totals         struct {
		Items   int `json:"items"`
		Words   int `json:"words"`
		Phrases int `json:"phrases"`
	} `json:"totals"`
}

func TestCustomWordsAreOwnerScopedAndReuseLearningScheduler(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table users restart identity cascade"); err != nil {
		t.Fatalf("truncate test data: %v", err)
	}
	if _, err := catalog.Seed(ctx, pg); err != nil {
		t.Fatalf("catalog.Seed() after custom-word migration error = %v", err)
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

	var metadataBefore publicCatalogMetadataSnapshot
	getPublicJSON(t, testServer.URL+"/api/v1/catalog/metadata", http.StatusOK, &metadataBefore)

	owner := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("custom-owner-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Custom Owner",
	}, http.StatusCreated)

	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       "   ",
		"translation": "перевод",
	}, http.StatusUnprocessableEntity, nil)

	checkpoint := time.Now().UnixNano()
	lemma := fmt.Sprintf("owner scoped checkpoint %d", checkpoint)
	translation := fmt.Sprintf("личный термин %d", checkpoint)
	spacedLemma := "  " + strings.ReplaceAll(lemma, " ", "   ") + "  "
	spacedTranslation := "  " + strings.ReplaceAll(translation, " ", "   ") + "  "

	var created customWordPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":        spacedLemma,
		"translation":  spacedTranslation,
		"partOfSpeech": "noun phrase",
		"topic":        "Data Engineering",
		"note":         "owner-only integration checkpoint",
	}, http.StatusCreated, &created)
	if created.ID <= 0 || created.Lemma != lemma || created.Translation != translation || created.Topic != "Data Engineering" {
		t.Fatalf("unexpected created custom word: %+v", created)
	}
	if created.Status != "new" || created.Repetitions != 0 || created.IntervalDays != 0 || created.DueAt.IsZero() {
		t.Fatalf("custom word did not inherit user_words defaults: %+v", created)
	}

	var storedOwner, source, kind string
	var enrollmentCount int
	if err := pg.QueryRow(ctx, `
		select owner_user_id::text, source, kind
		from words
		where id = $1
	`, created.ID).Scan(&storedOwner, &source, &kind); err != nil {
		t.Fatalf("query stored custom word: %v", err)
	}
	if storedOwner != owner.User.ID || source != "user-custom-v1" || kind != "word" {
		t.Fatalf("stored custom word owner=%q source=%q kind=%q", storedOwner, source, kind)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from user_words
		where user_id = $1::uuid and word_id = $2
	`, owner.User.ID, created.ID).Scan(&enrollmentCount); err != nil {
		t.Fatalf("count owner enrollment: %v", err)
	}
	if enrollmentCount != 1 {
		t.Fatalf("owner enrollment count = %d, want 1", enrollmentCount)
	}

	// Re-seeding after a private row exists proves that the shared catalog upsert
	// targets its partial unique index and does not mutate or enroll private data.
	if _, err := catalog.Seed(ctx, pg); err != nil {
		t.Fatalf("catalog.Seed() with private rows error = %v", err)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from words
		where id = $1 and owner_user_id = $2::uuid and source = 'user-custom-v1'
	`, created.ID, owner.User.ID).Scan(&enrollmentCount); err != nil {
		t.Fatalf("verify custom word after catalog seed: %v", err)
	}
	if enrollmentCount != 1 {
		t.Fatalf("custom word count after catalog seed = %d, want 1", enrollmentCount)
	}

	var metadataAfter publicCatalogMetadataSnapshot
	getPublicJSON(t, testServer.URL+"/api/v1/catalog/metadata", http.StatusOK, &metadataAfter)
	if metadataAfter != metadataBefore {
		t.Fatalf("private custom word changed public catalog metadata: before=%+v after=%+v", metadataBefore, metadataAfter)
	}

	// Whitespace is normalized in the API and case is normalized by the owner
	// unique index, so the same account cannot create an equivalent duplicate.
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       strings.ToUpper(lemma),
		"translation": strings.ToUpper(translation),
	}, http.StatusConflict, nil)

	var ownerDue struct {
		Items []customWordPayload `json:"items"`
		Total int                 `json:"total"`
	}
	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/words/due?query="+url.QueryEscape(lemma)+"&limit=10",
		owner.Tokens.AccessToken,
		http.StatusOK,
		&ownerDue,
	)
	if ownerDue.Total != 1 || len(ownerDue.Items) != 1 || ownerDue.Items[0].ID != created.ID {
		t.Fatalf("custom word not present in owner due queue: %+v", ownerDue)
	}

	getPublicStatus(t, fmt.Sprintf("%s/api/v1/catalog/words/%d", testServer.URL, created.ID), http.StatusNotFound)
	var publicPage struct {
		Total int `json:"total"`
	}
	getPublicJSON(t, testServer.URL+"/api/v1/catalog/words?query="+url.QueryEscape(lemma), http.StatusOK, &publicPage)
	if publicPage.Total != 0 {
		t.Fatalf("public catalog exposed %d private matches", publicPage.Total)
	}

	// Register the second account after the private row exists. Source-scoped
	// registration triggers must not enroll that private row automatically.
	other := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("custom-other-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Other Learner",
	}, http.StatusCreated)
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from user_words
		where user_id = $1::uuid and word_id = $2
	`, other.User.ID, created.ID).Scan(&enrollmentCount); err != nil {
		t.Fatalf("count other-account enrollment: %v", err)
	}
	if enrollmentCount != 0 {
		t.Fatalf("other account inherited private word: enrollment count = %d", enrollmentCount)
	}
	getAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d", testServer.URL, created.ID), other.Tokens.AccessToken, http.StatusNotFound, nil)
	deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/words/custom/%d", testServer.URL, created.ID), other.Tokens.AccessToken, http.StatusNotFound)

	// The owner-scoped unique index intentionally permits an equivalent private
	// term to exist independently for another account.
	var otherCopy customWordPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom", other.Tokens.AccessToken, map[string]string{
		"lemma":       strings.ToUpper(lemma),
		"translation": strings.ToUpper(translation),
	}, http.StatusCreated, &otherCopy)
	if otherCopy.ID <= 0 || otherCopy.ID == created.ID {
		t.Fatalf("other account custom copy = %+v, owner id = %d", otherCopy, created.ID)
	}

	var sharedWordID int64
	if err := pg.QueryRow(ctx, `
		select id
		from words
		where owner_user_id is null and kind = 'word'
		order by id
		limit 1
	`).Scan(&sharedWordID); err != nil {
		t.Fatalf("select shared catalog word: %v", err)
	}
	deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/words/custom/%d", testServer.URL, sharedWordID), owner.Tokens.AccessToken, http.StatusNotFound)
	var sharedStillExists bool
	if err := pg.QueryRow(ctx, "select exists(select 1 from words where id = $1)", sharedWordID).Scan(&sharedStillExists); err != nil {
		t.Fatalf("verify shared word after delete attempt: %v", err)
	}
	if !sharedStillExists {
		t.Fatal("custom-word delete removed a shared catalog row")
	}

	// Reuse the normal lesson pipeline with the private word selected explicitly.
	// This is the key no-parallel-SRS contract for the feature.
	var lesson struct {
		ID      string `json:"id"`
		Version int64  `json:"version"`
		Items   []struct {
			ID int64 `json:"id"`
		} `json:"items"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", owner.Tokens.AccessToken, map[string]any{
		"source":     "mixed",
		"studyMode":  "recall",
		"lessonSize": "15",
		"wordIds":    []int64{created.ID},
	}, http.StatusCreated, &lesson)
	if lesson.ID == "" || lesson.Version != 1 || len(lesson.Items) != 1 || lesson.Items[0].ID != created.ID {
		t.Fatalf("custom word did not enter normal lesson flow: %+v", lesson)
	}

	postAuthenticatedJSON(
		t,
		fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, lesson.ID, created.ID),
		owner.Tokens.AccessToken,
		map[string]any{
			"lessonVersion":         1,
			"rating":                "known",
			"responseMs":            650,
			"answerMode":            "recall",
			"correct":               true,
			"timezoneOffsetMinutes": 0,
		},
		http.StatusOK,
		nil,
	)

	var reviewCount, lessonItemCount int
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from review_events
		where user_id = $1::uuid and word_id = $2
	`, owner.User.ID, created.ID).Scan(&reviewCount); err != nil {
		t.Fatalf("count custom review events: %v", err)
	}
	if reviewCount != 1 {
		t.Fatalf("custom review event count = %d, want 1", reviewCount)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from lesson_session_items
		where session_id = $1::uuid and word_id = $2
	`, lesson.ID, created.ID).Scan(&lessonItemCount); err != nil {
		t.Fatalf("count custom lesson item: %v", err)
	}
	if lessonItemCount != 1 {
		t.Fatalf("custom lesson item count = %d, want 1", lessonItemCount)
	}

	// Deleting a custom word that is still in an active lesson must discard that
	// session first; otherwise the cascade would leave an active lesson whose
	// lesson_size/current_index no longer match its surviving item rows.
	var activeDeleteWord customWordPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       fmt.Sprintf("active deletion checkpoint %d", checkpoint),
		"translation": fmt.Sprintf("активное удаление %d", checkpoint),
	}, http.StatusCreated, &activeDeleteWord)

	var activeDeleteLesson struct {
		ID      string `json:"id"`
		Version int64  `json:"version"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", owner.Tokens.AccessToken, map[string]any{
		"source":     "mixed",
		"studyMode":  "recall",
		"lessonSize": "15",
		"wordIds":    []int64{activeDeleteWord.ID},
	}, http.StatusCreated, &activeDeleteLesson)
	deleteAuthenticated(
		t,
		fmt.Sprintf("%s/api/v1/words/custom/%d", testServer.URL, activeDeleteWord.ID),
		owner.Tokens.AccessToken,
		http.StatusNoContent,
	)
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", owner.Tokens.AccessToken, http.StatusNotFound, nil)

	var activeDeleteStatus string
	var activeDeleteVersion int64
	if err := pg.QueryRow(ctx, `
		select status, version
		from lesson_sessions
		where id = $1::uuid
	`, activeDeleteLesson.ID).Scan(&activeDeleteStatus, &activeDeleteVersion); err != nil {
		t.Fatalf("query lesson discarded by custom delete: %v", err)
	}
	if activeDeleteStatus != "discarded" || activeDeleteVersion != activeDeleteLesson.Version+1 {
		t.Fatalf(
			"active lesson after custom delete status=%q version=%d, want discarded/%d",
			activeDeleteStatus,
			activeDeleteVersion,
			activeDeleteLesson.Version+1,
		)
	}

	deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/words/custom/%d", testServer.URL, created.ID), owner.Tokens.AccessToken, http.StatusNoContent)

	var wordCount, userWordCount int
	if err := pg.QueryRow(ctx, "select count(*)::int from words where id = $1", created.ID).Scan(&wordCount); err != nil {
		t.Fatalf("count deleted custom words: %v", err)
	}
	if err := pg.QueryRow(ctx, "select count(*)::int from user_words where word_id = $1", created.ID).Scan(&userWordCount); err != nil {
		t.Fatalf("count deleted custom user_words: %v", err)
	}
	if err := pg.QueryRow(ctx, "select count(*)::int from review_events where word_id = $1", created.ID).Scan(&reviewCount); err != nil {
		t.Fatalf("count deleted custom review events: %v", err)
	}
	if err := pg.QueryRow(ctx, "select count(*)::int from lesson_session_items where word_id = $1", created.ID).Scan(&lessonItemCount); err != nil {
		t.Fatalf("count deleted custom lesson items: %v", err)
	}
	if wordCount != 0 || userWordCount != 0 || reviewCount != 0 || lessonItemCount != 0 {
		t.Fatalf(
			"custom delete left dependent rows: words=%d user_words=%d reviews=%d lesson_items=%d",
			wordCount,
			userWordCount,
			reviewCount,
			lessonItemCount,
		)
	}
	getAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d", testServer.URL, created.ID), owner.Tokens.AccessToken, http.StatusNotFound, nil)
	getAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d", testServer.URL, otherCopy.ID), other.Tokens.AccessToken, http.StatusOK, &customWordPayload{})
}

func getPublicStatus(t *testing.T, endpoint string, expectedStatus int) {
	t.Helper()
	getPublicJSON(t, endpoint, expectedStatus, nil)
}

func getPublicJSON(t *testing.T, endpoint string, expectedStatus int, target any) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodGet, endpoint, nil)
	if err != nil {
		t.Fatal(err)
	}
	doJSONRequest(t, request, expectedStatus, target)
}

func deleteAuthenticated(t *testing.T, endpoint, accessToken string, expectedStatus int) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodDelete, endpoint, nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	doJSONRequest(t, request, expectedStatus, nil)
}
