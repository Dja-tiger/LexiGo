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

type customGlossaryItemPayload struct {
	Lemma        string `json:"lemma"`
	Translation  string `json:"translation"`
	Phonetic     string `json:"phonetic,omitempty"`
	PartOfSpeech string `json:"partOfSpeech,omitempty"`
	Topic        string `json:"topic,omitempty"`
	Note         string `json:"note,omitempty"`
}

type customGlossaryDocumentPayload struct {
	SchemaVersion string                      `json:"schemaVersion"`
	Items         []customGlossaryItemPayload `json:"items"`
}

type customGlossaryImportPayload struct {
	SchemaVersion string                      `json:"schemaVersion"`
	Created       int                         `json:"created"`
	Skipped       int                         `json:"skipped"`
	Items         []customGlossaryItemPayload `json:"items"`
}

func TestCustomGlossaryImportExportIsOwnerScopedAndDoesNotRestoreSRSHistory(t *testing.T) {
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

	checkpoint := time.Now().UnixNano()
	owner := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("glossary-owner-%d@example.com", checkpoint),
		"password":    "strong-password",
		"displayName": "Glossary Owner",
	}, http.StatusCreated)
	other := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("glossary-other-%d@example.com", checkpoint),
		"password":    "strong-password",
		"displayName": "Other Learner",
	}, http.StatusCreated)

	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, customGlossaryDocumentPayload{
		SchemaVersion: "future-v2",
		Items:         []customGlossaryItemPayload{},
	}, http.StatusUnprocessableEntity, nil)

	existingLemma := fmt.Sprintf("existing glossary checkpoint %d", checkpoint)
	existingTranslation := fmt.Sprintf("существующий термин %d", checkpoint)
	var existing customWordPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom", owner.Tokens.AccessToken, map[string]string{
		"lemma":       existingLemma,
		"translation": existingTranslation,
	}, http.StatusCreated, &existing)

	lemmaA := fmt.Sprintf("query planner glossary %d", checkpoint)
	translationA := fmt.Sprintf("планировщик запросов %d", checkpoint)
	lemmaB := fmt.Sprintf("backpressure glossary %d", checkpoint)
	translationB := fmt.Sprintf("обратное давление %d", checkpoint)

	var imported customGlossaryImportPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, customGlossaryDocumentPayload{
		SchemaVersion: "lexigo-custom-glossary-v1",
		Items: []customGlossaryItemPayload{
			{Lemma: strings.ToUpper(existingLemma), Translation: strings.ToUpper(existingTranslation)},
			{Lemma: "  " + strings.ReplaceAll(lemmaA, " ", "   ") + "  ", Translation: "  " + translationA + "  ", Topic: "Data Engineering", Note: "  canonical   note "},
			{Lemma: strings.ToUpper(lemmaA), Translation: strings.ToUpper(translationA), Note: "payload duplicate"},
			{Lemma: lemmaB, Translation: translationB, PartOfSpeech: "noun", Topic: "Backend Development"},
		},
	}, http.StatusOK, &imported)
	if imported.SchemaVersion != "lexigo-custom-glossary-v1" || imported.Created != 2 || imported.Skipped != 2 || len(imported.Items) != 3 {
		t.Fatalf("unexpected import result: %+v", imported)
	}
	if imported.Items[1].Lemma != lemmaA || imported.Items[1].Note != "canonical note" {
		t.Fatalf("import did not return canonical normalized item: %+v", imported.Items[1])
	}

	var ownerExport customGlossaryDocumentPayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/export", owner.Tokens.AccessToken, http.StatusOK, &ownerExport)
	if ownerExport.SchemaVersion != "lexigo-custom-glossary-v1" || len(ownerExport.Items) != 3 {
		t.Fatalf("owner export = %+v", ownerExport)
	}
	for _, item := range ownerExport.Items {
		if item.Lemma == "" || item.Translation == "" {
			t.Fatalf("export contains invalid item: %+v", item)
		}
	}

	var otherExport customGlossaryDocumentPayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/export", other.Tokens.AccessToken, http.StatusOK, &otherExport)
	if otherExport.SchemaVersion != "lexigo-custom-glossary-v1" || len(otherExport.Items) != 0 {
		t.Fatalf("other account observed owner glossary: %+v", otherExport)
	}

	var privateCount, enrollmentCount int
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from words
		where owner_user_id = $1::uuid and source = 'user-custom-v1' and kind = 'word'
	`, owner.User.ID).Scan(&privateCount); err != nil {
		t.Fatalf("count owner private words: %v", err)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid and w.owner_user_id = uw.user_id and w.source = 'user-custom-v1'
	`, owner.User.ID).Scan(&enrollmentCount); err != nil {
		t.Fatalf("count owner glossary enrollments: %v", err)
	}
	if privateCount != 3 || enrollmentCount != 3 {
		t.Fatalf("privateCount=%d enrollmentCount=%d, want 3/3", privateCount, enrollmentCount)
	}

	var due struct {
		Total int `json:"total"`
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?query="+url.QueryEscape(lemmaA)+"&limit=10", owner.Tokens.AccessToken, http.StatusOK, &due)
	if due.Total != 1 {
		t.Fatalf("imported glossary item due total = %d, want 1", due.Total)
	}
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words?query="+url.QueryEscape(lemmaA)+"&limit=10", other.Tokens.AccessToken, http.StatusOK, &due)
	if due.Total != 0 {
		t.Fatalf("other account catalog exposed owner glossary item: total=%d", due.Total)
	}

	// Re-import is an idempotent merge: all canonical entries already exist.
	var repeated customGlossaryImportPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, ownerExport, http.StatusOK, &repeated)
	if repeated.Created != 0 || repeated.Skipped != 3 {
		t.Fatalf("re-import result = %+v, want created=0 skipped=3", repeated)
	}

	// Invalid item validation happens before the transaction. The first valid
	// entry in this document must not be partially persisted.
	beforeInvalid := privateCount
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, customGlossaryDocumentPayload{
		SchemaVersion: "lexigo-custom-glossary-v1",
		Items: []customGlossaryItemPayload{
			{Lemma: fmt.Sprintf("must rollback %d", checkpoint), Translation: "не сохранять"},
			{Lemma: "   ", Translation: "invalid"},
		},
	}, http.StatusUnprocessableEntity, nil)
	if err := pg.QueryRow(ctx, `
		select count(*)::int from words
		where owner_user_id = $1::uuid and source = 'user-custom-v1'
	`, owner.User.ID).Scan(&privateCount); err != nil {
		t.Fatalf("count after invalid import: %v", err)
	}
	if privateCount != beforeInvalid {
		t.Fatalf("invalid import partially persisted: before=%d after=%d", beforeInvalid, privateCount)
	}

	// Give one glossary enrollment historical state. Export must not transport
	// this state; after delete + import every restored item must use fresh defaults.
	if _, err := pg.Exec(ctx, `
		update user_words uw
		set status = 'review', repetitions = 7, interval_days = 30, due_at = now() + interval '30 days'
		from words w
		where uw.word_id = w.id
		  and uw.user_id = $1::uuid
		  and w.owner_user_id = uw.user_id
		  and lower(w.lemma) = lower($2)
	`, owner.User.ID, lemmaA); err != nil {
		t.Fatalf("seed historical scheduler state: %v", err)
	}

	rows, err := pg.Query(ctx, `
		select id
		from words
		where owner_user_id = $1::uuid and source = 'user-custom-v1'
		order by id
	`, owner.User.ID)
	if err != nil {
		t.Fatalf("select custom ids for round trip: %v", err)
	}
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			t.Fatalf("scan custom id: %v", err)
		}
		ids = append(ids, id)
	}
	rows.Close()
	if len(ids) != 3 {
		t.Fatalf("round-trip ids = %v, want 3", ids)
	}
	for _, id := range ids {
		deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/words/custom/%d", testServer.URL, id), owner.Tokens.AccessToken, http.StatusNoContent)
	}

	var restored customGlossaryImportPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, ownerExport, http.StatusOK, &restored)
	if restored.Created != 3 || restored.Skipped != 0 {
		t.Fatalf("round-trip restore = %+v", restored)
	}

	var restoredCount, freshStateCount int
	if err := pg.QueryRow(ctx, `
		select
			count(*)::int,
			count(*) filter (
				where uw.status = 'new'
				  and uw.repetitions = 0
				  and uw.interval_days = 0
			)::int
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid
		  and w.owner_user_id = uw.user_id
		  and w.source = 'user-custom-v1'
	`, owner.User.ID).Scan(&restoredCount, &freshStateCount); err != nil {
		t.Fatalf("query restored scheduler defaults: %v", err)
	}
	if restoredCount != 3 || freshStateCount != 3 {
		t.Fatalf("restoredCount=%d freshStateCount=%d, want 3/3", restoredCount, freshStateCount)
	}
}
