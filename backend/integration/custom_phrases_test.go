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

type customPhrasePayload struct {
	ID             int64     `json:"id"`
	Kind           string    `json:"kind"`
	Slug           string    `json:"slug"`
	Lemma          string    `json:"lemma"`
	Translation    string    `json:"translation"`
	Phonetic       string    `json:"phonetic"`
	PartOfSpeech   string    `json:"partOfSpeech"`
	Topic          string    `json:"topic"`
	Note           string    `json:"note"`
	Cloze          string    `json:"cloze"`
	ClozeAnswer    string    `json:"clozeAnswer"`
	Status         string    `json:"status"`
	DueAt          time.Time `json:"dueAt"`
	Repetitions    int       `json:"repetitions"`
	IntervalDays   int       `json:"intervalDays"`
}

func TestCustomPhrasesAreOwnerScopedAndReuseLearningScheduler(t *testing.T) {
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
		t.Fatalf("catalog.Seed() after custom-phrase migration error = %v", err)
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
		"email":       fmt.Sprintf("custom-phrase-owner-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Custom Phrase Owner",
	}, http.StatusCreated)

	// The API validates phrase-specific shape before PostgreSQL. In particular,
	// a private phrase must keep the same single-blank cloze contract as shared
	// phrase content.
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/phrases/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       "The deployment is complete.",
		"translation": "Развертывание завершено.",
		"cloze":       "The deployment is complete.",
		"clozeAnswer": "complete",
	}, http.StatusUnprocessableEntity, nil)

	checkpoint := time.Now().UnixNano()
	lemma := fmt.Sprintf("The private deployment checkpoint %d is complete.", checkpoint)
	translation := fmt.Sprintf("Личная контрольная точка развертывания %d завершена.", checkpoint)
	cloze := fmt.Sprintf("The private deployment checkpoint %d is _____.", checkpoint)

	var created customPhrasePayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/phrases/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       "  " + strings.ReplaceAll(lemma, " ", "   ") + "  ",
		"translation": "  " + strings.ReplaceAll(translation, " ", "   ") + "  ",
		"phonetic":    "  /dɪˈplɔɪmənt   ˈtʃekpɔɪnt/  ",
		"topic":       "  Backend   Development  ",
		"note":        "  owner-only   phrase  ",
		"cloze":       "  " + strings.ReplaceAll(cloze, " ", "   ") + "  ",
		"clozeAnswer": "  complete  ",
	}, http.StatusCreated, &created)
	if created.ID <= 0 {
		t.Fatalf("created phrase id = %d", created.ID)
	}
	if created.Kind != "phrase" || created.PartOfSpeech != "phrase" {
		t.Fatalf("created phrase kind=%q partOfSpeech=%q", created.Kind, created.PartOfSpeech)
	}
	if created.Lemma != lemma || created.Translation != translation || created.Cloze != cloze || created.ClozeAnswer != "complete" {
		t.Fatalf("unexpected normalized custom phrase: %+v", created)
	}
	if created.Topic != "Backend Development" || created.Note != "owner-only phrase" {
		t.Fatalf("unexpected optional custom phrase fields: %+v", created)
	}
	if !strings.HasPrefix(created.Slug, "custom-phrase-") || strings.ToLower(created.Slug) != created.Slug || strings.Contains(created.Slug, owner.User.ID) {
		t.Fatalf("unexpected server-owned custom phrase slug %q", created.Slug)
	}
	if created.Status != "new" || created.Repetitions != 0 || created.IntervalDays != 0 || created.DueAt.IsZero() {
		t.Fatalf("custom phrase did not inherit user_words defaults: %+v", created)
	}

	var storedOwner, source, kind, storedSlug, storedCloze, storedAnswer string
	var enrollmentCount int
	if err := pg.QueryRow(ctx, `
		select owner_user_id::text, source, kind, slug, cloze, cloze_answer
		from words
		where id = $1
	`, created.ID).Scan(&storedOwner, &source, &kind, &storedSlug, &storedCloze, &storedAnswer); err != nil {
		t.Fatalf("query stored custom phrase: %v", err)
	}
	if storedOwner != owner.User.ID || source != "user-custom-v1" || kind != "phrase" {
		t.Fatalf("stored custom phrase owner=%q source=%q kind=%q", storedOwner, source, kind)
	}
	if storedSlug != created.Slug || storedCloze != cloze || storedAnswer != "complete" {
		t.Fatalf("stored phrase shape slug=%q cloze=%q answer=%q", storedSlug, storedCloze, storedAnswer)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from user_words
		where user_id = $1::uuid and word_id = $2
	`, owner.User.ID, created.ID).Scan(&enrollmentCount); err != nil {
		t.Fatalf("count owner custom phrase enrollment: %v", err)
	}
	if enrollmentCount != 1 {
		t.Fatalf("owner custom phrase enrollment count = %d, want 1", enrollmentCount)
	}

	// Shared catalog seeding must continue to target shared partial indexes and
	// leave owner content untouched.
	if _, err := catalog.Seed(ctx, pg); err != nil {
		t.Fatalf("catalog.Seed() with private phrase error = %v", err)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from words
		where id = $1 and owner_user_id = $2::uuid and source = 'user-custom-v1' and kind = 'phrase'
	`, created.ID, owner.User.ID).Scan(&enrollmentCount); err != nil {
		t.Fatalf("verify custom phrase after catalog seed: %v", err)
	}
	if enrollmentCount != 1 {
		t.Fatalf("custom phrase count after catalog seed = %d, want 1", enrollmentCount)
	}

	var metadataAfter publicCatalogMetadataSnapshot
	getPublicJSON(t, testServer.URL+"/api/v1/catalog/metadata", http.StatusOK, &metadataAfter)
	if metadataAfter != metadataBefore {
		t.Fatalf("private custom phrase changed public catalog metadata: before=%+v after=%+v", metadataBefore, metadataAfter)
	}

	// Same-owner duplicates are content-based and case-insensitive. A different
	// account may keep equivalent private content independently.
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/phrases/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       strings.ToUpper(lemma),
		"translation": strings.ToUpper(translation),
		"cloze":       cloze,
		"clozeAnswer": "complete",
	}, http.StatusConflict, nil)

	var ownerPage struct {
		Items []customPhrasePayload `json:"items"`
		Total int                   `json:"total"`
	}
	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/words?kind=phrase&query="+url.QueryEscape(lemma)+"&limit=10",
		owner.Tokens.AccessToken,
		http.StatusOK,
		&ownerPage,
	)
	if ownerPage.Total != 1 || len(ownerPage.Items) != 1 || ownerPage.Items[0].ID != created.ID {
		t.Fatalf("custom phrase not present in owner phrase catalog: %+v", ownerPage)
	}

	var ownerDetail customPhrasePayload
	getAuthenticatedJSON(
		t,
		testServer.URL+"/api/v1/phrases/"+url.PathEscape(created.Slug),
		owner.Tokens.AccessToken,
		http.StatusOK,
		&ownerDetail,
	)
	if ownerDetail.ID != created.ID || ownerDetail.Slug != created.Slug || ownerDetail.Cloze != cloze {
		t.Fatalf("unexpected owner phrase detail: %+v", ownerDetail)
	}

	var publicPage struct {
		Total int `json:"total"`
	}
	getPublicJSON(t, testServer.URL+"/api/v1/catalog/words?query="+url.QueryEscape(lemma), http.StatusOK, &publicPage)
	if publicPage.Total != 0 {
		t.Fatalf("public catalog exposed %d private matches", publicPage.Total)
	}

	other := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("custom-phrase-other-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Other Phrase Learner",
	}, http.StatusCreated)
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from user_words
		where user_id = $1::uuid and word_id = $2
	`, other.User.ID, created.ID).Scan(&enrollmentCount); err != nil {
		t.Fatalf("count other-account custom phrase enrollment: %v", err)
	}
	if enrollmentCount != 0 {
		t.Fatalf("other account inherited private phrase: enrollment count = %d", enrollmentCount)
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/phrases/"+url.PathEscape(created.Slug), other.Tokens.AccessToken, http.StatusNotFound, nil)
	deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/phrases/custom/%d", testServer.URL, created.ID), other.Tokens.AccessToken, http.StatusNotFound)

	var otherCopy customPhrasePayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/phrases/custom", other.Tokens.AccessToken, map[string]string{
		"lemma":       strings.ToUpper(lemma),
		"translation": strings.ToUpper(translation),
		"cloze":       cloze,
		"clozeAnswer": "complete",
	}, http.StatusCreated, &otherCopy)
	if otherCopy.ID <= 0 || otherCopy.ID == created.ID || otherCopy.Slug == created.Slug {
		t.Fatalf("other account custom phrase copy = %+v, owner phrase = %+v", otherCopy, created)
	}

	// A custom-phrase delete route must never mutate shared phrase content.
	var sharedPhraseID int64
	if err := pg.QueryRow(ctx, `
		select id
		from words
		where owner_user_id is null and kind = 'phrase'
		order by id
		limit 1
	`).Scan(&sharedPhraseID); err != nil {
		t.Fatalf("select shared phrase: %v", err)
	}
	deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/phrases/custom/%d", testServer.URL, sharedPhraseID), owner.Tokens.AccessToken, http.StatusNotFound)
	var sharedStillExists bool
	if err := pg.QueryRow(ctx, "select exists(select 1 from words where id = $1)", sharedPhraseID).Scan(&sharedStillExists); err != nil {
		t.Fatalf("verify shared phrase after delete attempt: %v", err)
	}
	if !sharedStillExists {
		t.Fatal("custom-phrase delete removed a shared phrase")
	}

	// Widening the private scope must not regress the existing custom-word API.
	var compatibilityWord customWordPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       fmt.Sprintf("custom phrase compatibility word %d", checkpoint),
		"translation": fmt.Sprintf("совместимость пользовательского слова %d", checkpoint),
	}, http.StatusCreated, &compatibilityWord)
	if compatibilityWord.ID <= 0 {
		t.Fatalf("custom-word compatibility create = %+v", compatibilityWord)
	}
	deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/words/custom/%d", testServer.URL, compatibilityWord.ID), owner.Tokens.AccessToken, http.StatusNoContent)

	// Reuse the normal lesson pipeline with the private phrase selected
	// explicitly. This proves there is no parallel phrase scheduler.
	var lesson struct {
		ID      string `json:"id"`
		Version int64  `json:"version"`
		Items   []struct {
			ID   int64  `json:"id"`
			Kind string `json:"kind"`
		} `json:"items"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", owner.Tokens.AccessToken, map[string]any{
		"source":     "phrases",
		"studyMode":  "recall",
		"lessonSize": "15",
		"wordIds":    []int64{created.ID},
	}, http.StatusCreated, &lesson)
	if lesson.ID == "" || lesson.Version != 1 || len(lesson.Items) != 1 || lesson.Items[0].ID != created.ID || lesson.Items[0].Kind != "phrase" {
		t.Fatalf("custom phrase did not enter normal lesson flow: %+v", lesson)
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
			"submittedAnswer":       translation,
			"timezoneOffsetMinutes": 0,
		},
		http.StatusOK,
		nil,
	)

	var reviewCount int
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from review_events
		where user_id = $1::uuid and word_id = $2
	`, owner.User.ID, created.ID).Scan(&reviewCount); err != nil {
		t.Fatalf("count custom phrase review events: %v", err)
	}
	if reviewCount != 1 {
		t.Fatalf("custom phrase review event count = %d, want 1", reviewCount)
	}

	// Deleting content used by an active lesson must discard that session first.
	var activeDeletePhrase customPhrasePayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/phrases/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       fmt.Sprintf("The active deletion checkpoint %d is ready.", checkpoint),
		"translation": fmt.Sprintf("Активная точка удаления %d готова.", checkpoint),
		"cloze":       fmt.Sprintf("The active deletion checkpoint %d is _____.", checkpoint),
		"clozeAnswer": "ready",
	}, http.StatusCreated, &activeDeletePhrase)

	var activeDeleteLesson struct {
		ID      string `json:"id"`
		Version int64  `json:"version"`
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", owner.Tokens.AccessToken, map[string]any{
		"source":     "phrases",
		"studyMode":  "recall",
		"lessonSize": "15",
		"wordIds":    []int64{activeDeletePhrase.ID},
	}, http.StatusCreated, &activeDeleteLesson)
	deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/phrases/custom/%d", testServer.URL, activeDeletePhrase.ID), owner.Tokens.AccessToken, http.StatusNoContent)
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", owner.Tokens.AccessToken, http.StatusNotFound, nil)

	var activeDeleteStatus string
	if err := pg.QueryRow(ctx, `select status from lesson_sessions where id = $1::uuid`, activeDeleteLesson.ID).Scan(&activeDeleteStatus); err != nil {
		t.Fatalf("read discarded lesson status: %v", err)
	}
	if activeDeleteStatus != "discarded" {
		t.Fatalf("active lesson status after custom phrase delete = %q, want discarded", activeDeleteStatus)
	}
	for label, query := range map[string]string{
		"word row":     `select count(*)::int from words where id = $1`,
		"enrollment":   `select count(*)::int from user_words where word_id = $1`,
		"lesson item":  `select count(*)::int from lesson_session_items where word_id = $1`,
		"review event": `select count(*)::int from review_events where word_id = $1`,
	} {
		var count int
		if err := pg.QueryRow(ctx, query, activeDeletePhrase.ID).Scan(&count); err != nil {
			t.Fatalf("count %s after delete: %v", label, err)
		}
		if count != 0 {
			t.Fatalf("%s count after delete = %d, want 0", label, count)
		}
	}
}
