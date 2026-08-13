//go:build integration

package integration

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
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

type customGlossaryEnvelopePayload struct {
	Version int                         `json:"version"`
	Items   []customGlossaryItemPayload `json:"items"`
}

type customGlossaryImportResultPayload struct {
	Version  int `json:"version"`
	Imported int `json:"imported"`
}

func TestCustomGlossaryImportExportIsOwnerScopedAtomicAndPortable(t *testing.T) {
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

	owner := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("glossary-owner-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Glossary Owner",
	}, http.StatusCreated)
	other := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":       fmt.Sprintf("glossary-other-%d@example.com", time.Now().UnixNano()),
		"password":    "strong-password",
		"displayName": "Glossary Other",
	}, http.StatusCreated)

	var emptyExport customGlossaryEnvelopePayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/export", owner.Tokens.AccessToken, http.StatusOK, &emptyExport)
	if emptyExport.Version != 1 || emptyExport.Items == nil || len(emptyExport.Items) != 0 {
		t.Fatalf("empty export = %#v, want version=1 and items=[]", emptyExport)
	}

	importRequest := customGlossaryEnvelopePayload{
		Version: 1,
		Items: []customGlossaryItemPayload{
			{Lemma: "  Zeta   watermark ", Translation: " верхняя   граница ", PartOfSpeech: "noun phrase", Topic: "Data Engineering", Note: "portable zeta note"},
			{Lemma: " alpha backfill ", Translation: " историческая дозагрузка ", Phonetic: "al-fa", PartOfSpeech: "noun", Topic: "Data Engineering", Note: "portable alpha note"},
		},
	}
	var imported customGlossaryImportResultPayload
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, importRequest, http.StatusCreated, &imported)
	if imported.Version != 1 || imported.Imported != 2 {
		t.Fatalf("import result = %+v", imported)
	}

	var ownerWordCount, ownerEnrollmentCount int
	if err := pg.QueryRow(ctx, `select count(*)::int from words where owner_user_id = $1::uuid and source = 'user-custom-v1' and kind = 'word'`, owner.User.ID).Scan(&ownerWordCount); err != nil {
		t.Fatalf("count imported owner words: %v", err)
	}
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid and w.owner_user_id = uw.user_id and w.source = 'user-custom-v1'
	`, owner.User.ID).Scan(&ownerEnrollmentCount); err != nil {
		t.Fatalf("count imported owner enrollments: %v", err)
	}
	if ownerWordCount != 2 || ownerEnrollmentCount != 2 {
		t.Fatalf("import counts words=%d enrollments=%d, want 2/2", ownerWordCount, ownerEnrollmentCount)
	}

	var exported customGlossaryEnvelopePayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/export", owner.Tokens.AccessToken, http.StatusOK, &exported)
	if exported.Version != 1 || len(exported.Items) != 2 {
		t.Fatalf("owner export = %+v", exported)
	}
	if exported.Items[0].Lemma != "alpha backfill" || exported.Items[1].Lemma != "Zeta watermark" {
		t.Fatalf("export is not deterministic by normalized identity: %+v", exported.Items)
	}

	var rawExport map[string]any
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/export", owner.Tokens.AccessToken, http.StatusOK, &rawExport)
	rawItems, ok := rawExport["items"].([]any)
	if !ok || len(rawItems) != 2 {
		t.Fatalf("raw export items = %#v", rawExport["items"])
	}
	for _, raw := range rawItems {
		item, ok := raw.(map[string]any)
		if !ok {
			t.Fatalf("raw export item type = %T", raw)
		}
		for _, forbidden := range []string{"id", "ownerUserId", "owner_user_id", "status", "easiness", "intervalDays", "repetitions", "dueAt", "lastReviewedAt", "source"} {
			if _, exists := item[forbidden]; exists {
				t.Fatalf("portable export leaked %q in %#v", forbidden, item)
			}
		}
	}

	var otherExport customGlossaryEnvelopePayload
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/export", other.Tokens.AccessToken, http.StatusOK, &otherExport)
	if len(otherExport.Items) != 0 {
		t.Fatalf("other account saw owner glossary: %+v", otherExport)
	}

	initialIDs := make(map[string]int64)
	rows, err := pg.Query(ctx, `select lemma, id from words where owner_user_id = $1::uuid and source = 'user-custom-v1'`, owner.User.ID)
	if err != nil {
		t.Fatalf("query initial owner ids: %v", err)
	}
	for rows.Next() {
		var lemma string
		var id int64
		if err := rows.Scan(&lemma, &id); err != nil {
			rows.Close()
			t.Fatalf("scan initial owner id: %v", err)
		}
		initialIDs[lemma] = id
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		t.Fatalf("iterate initial owner ids: %v", err)
	}
	rows.Close()
	for _, id := range initialIDs {
		deleteAuthenticated(t, fmt.Sprintf("%s/api/v1/words/custom/%d", testServer.URL, id), owner.Tokens.AccessToken, http.StatusNoContent)
	}

	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, exported, http.StatusCreated, &imported)
	if imported.Imported != 2 {
		t.Fatalf("round-trip imported = %d, want 2", imported.Imported)
	}

	rows, err = pg.Query(ctx, `
		select w.lemma, w.id, uw.status, uw.repetitions, uw.interval_days
		from words w
		join user_words uw on uw.word_id = w.id and uw.user_id = w.owner_user_id
		where w.owner_user_id = $1::uuid and w.source = 'user-custom-v1'
	`, owner.User.ID)
	if err != nil {
		t.Fatalf("query round-trip scheduler state: %v", err)
	}
	seenRoundTrip := 0
	for rows.Next() {
		var lemma, status string
		var id int64
		var repetitions, intervalDays int
		if err := rows.Scan(&lemma, &id, &status, &repetitions, &intervalDays); err != nil {
			rows.Close()
			t.Fatalf("scan round-trip scheduler state: %v", err)
		}
		if id == initialIDs[lemma] {
			rows.Close()
			t.Fatalf("round-trip reused deleted database id %d for %q", id, lemma)
		}
		if status != "new" || repetitions != 0 || intervalDays != 0 {
			rows.Close()
			t.Fatalf("round-trip scheduler state for %q = %s/%d/%d", lemma, status, repetitions, intervalDays)
		}
		seenRoundTrip++
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		t.Fatalf("iterate round-trip scheduler state: %v", err)
	}
	rows.Close()
	if seenRoundTrip != 2 {
		t.Fatalf("round-trip scheduler rows = %d, want 2", seenRoundTrip)
	}

	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", other.Tokens.AccessToken, customGlossaryEnvelopePayload{Version: 1, Items: []customGlossaryItemPayload{exported.Items[0]}}, http.StatusCreated, nil)
	if err := pg.QueryRow(ctx, `
		select count(*)::int from words
		where lower(lemma) = lower($1) and lower(translation) = lower($2) and owner_user_id is not null
	`, exported.Items[0].Lemma, exported.Items[0].Translation).Scan(&ownerWordCount); err != nil {
		t.Fatalf("count cross-account equivalent terms: %v", err)
	}
	if ownerWordCount != 2 {
		t.Fatalf("cross-account equivalent private terms = %d, want 2", ownerWordCount)
	}

	var beforeRejected int
	if err := pg.QueryRow(ctx, `select count(*)::int from words where owner_user_id = $1::uuid and source = 'user-custom-v1'`, owner.User.ID).Scan(&beforeRejected); err != nil {
		t.Fatalf("count before rejected imports: %v", err)
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, customGlossaryEnvelopePayload{
		Version: 1,
		Items: []customGlossaryItemPayload{
			{Lemma: "Payload duplicate", Translation: "дубликат"},
			{Lemma: "  PAYLOAD DUPLICATE ", Translation: " ДУБЛИКАТ "},
		},
	}, http.StatusConflict, nil)

	conflictFreshLemma := fmt.Sprintf("rollback checkpoint %d", time.Now().UnixNano())
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, customGlossaryEnvelopePayload{
		Version: 1,
		Items: []customGlossaryItemPayload{
			{Lemma: conflictFreshLemma, Translation: "must roll back"},
			exported.Items[0],
		},
	}, http.StatusConflict, nil)
	var rolledBackCount int
	if err := pg.QueryRow(ctx, `select count(*)::int from words where owner_user_id = $1::uuid and lemma = $2`, owner.User.ID, conflictFreshLemma).Scan(&rolledBackCount); err != nil {
		t.Fatalf("count rolled-back first item: %v", err)
	}
	if rolledBackCount != 0 {
		t.Fatalf("existing-owner conflict left %d partial rows", rolledBackCount)
	}
	var afterRejected int
	if err := pg.QueryRow(ctx, `select count(*)::int from words where owner_user_id = $1::uuid and source = 'user-custom-v1'`, owner.User.ID).Scan(&afterRejected); err != nil {
		t.Fatalf("count after rejected imports: %v", err)
	}
	if afterRejected != beforeRejected {
		t.Fatalf("rejected imports changed owner glossary count: before=%d after=%d", beforeRejected, afterRejected)
	}

	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, customGlossaryEnvelopePayload{Version: 2, Items: []customGlossaryItemPayload{{Lemma: "version", Translation: "invalid"}}}, http.StatusUnprocessableEntity, nil)
	oversizedItems := make([]customGlossaryItemPayload, 0, 101)
	for index := 0; index < 101; index++ {
		oversizedItems = append(oversizedItems, customGlossaryItemPayload{Lemma: fmt.Sprintf("bounded item %03d", index), Translation: "bounded"})
	}
	postAuthenticatedJSON(t, testServer.URL+"/api/v1/words/custom/import", owner.Tokens.AccessToken, customGlossaryEnvelopePayload{Version: 1, Items: oversizedItems}, http.StatusUnprocessableEntity, nil)

	// Keep the JSON object itself valid and within all field/item limits, then
	// exceed the HTTP body ceiling only with legal JSON whitespace. DecodeJSONLimit
	// must consume the trailing input while proving that there is exactly one JSON
	// value, so http.MaxBytesReader rejects the request before persistence.
	bodyLimitedJSON := `{"version":1,"items":[{"lemma":"body ceiling","translation":"bounded"}]}` + strings.Repeat(" ", (256<<10)+1)
	request, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodPost,
		testServer.URL+"/api/v1/words/custom/import",
		strings.NewReader(bodyLimitedJSON),
	)
	if err != nil {
		t.Fatalf("build oversized glossary request: %v", err)
	}
	request.Header.Set("Authorization", "Bearer "+owner.Tokens.AccessToken)
	request.Header.Set("Content-Type", "application/json")
	doJSONRequest(t, request, http.StatusBadRequest, nil)

	var afterBodyLimit int
	if err := pg.QueryRow(ctx, `select count(*)::int from words where owner_user_id = $1::uuid and source = 'user-custom-v1'`, owner.User.ID).Scan(&afterBodyLimit); err != nil {
		t.Fatalf("count after oversized body: %v", err)
	}
	if afterBodyLimit != afterRejected {
		t.Fatalf("oversized body changed owner glossary count: before=%d after=%d", afterRejected, afterBodyLimit)
	}
}
