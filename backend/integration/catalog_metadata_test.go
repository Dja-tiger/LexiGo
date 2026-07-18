//go:build integration

package integration

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

type catalogMetadataTotals struct {
	Items   int `json:"items"`
	Words   int `json:"words"`
	Phrases int `json:"phrases"`
}

type catalogMetadataSources struct {
	Mixed           int `json:"mixed"`
	Noun            int `json:"noun"`
	Verb            int `json:"verb"`
	Adjective       int `json:"adjective"`
	Phrases         int `json:"phrases"`
	DailyLife       int `json:"dailyLife"`
	Travel          int `json:"travel"`
	DataEngineering int `json:"dataEngineering"`
	Backend         int `json:"backend"`
}

type catalogMetadataTopic struct {
	Topic string `json:"topic"`
	Count int    `json:"count"`
}

type catalogMetadataPayload struct {
	CatalogVersion string                 `json:"catalogVersion"`
	UpdatedAt      time.Time              `json:"updatedAt"`
	Totals         catalogMetadataTotals  `json:"totals"`
	Sources        catalogMetadataSources `json:"sources"`
	Topics         []catalogMetadataTopic `json:"topics"`
}

func TestCatalogMetadataIsPublicCacheableAndTracksCatalogChanges(t *testing.T) {
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

	var expectedTotals catalogMetadataTotals
	var expectedSources catalogMetadataSources
	if err := pg.QueryRow(ctx, `
		select count(*)::int,
		       count(*) filter (where kind = 'word')::int,
		       count(*) filter (where kind = 'phrase')::int,
		       count(*) filter (where kind = 'word' and lower(part_of_speech) = 'noun')::int,
		       count(*) filter (where kind = 'word' and lower(part_of_speech) = 'verb')::int,
		       count(*) filter (where kind = 'word' and lower(part_of_speech) = 'adjective')::int,
		       count(*) filter (where kind = 'word' and topic = 'Daily Life')::int,
		       count(*) filter (where kind = 'word' and topic = 'Travel')::int,
		       count(*) filter (where kind = 'word' and topic = 'Data Engineering')::int,
		       count(*) filter (where kind = 'word' and topic = 'Backend Development')::int
		from words
	`).Scan(
		&expectedTotals.Items,
		&expectedTotals.Words,
		&expectedTotals.Phrases,
		&expectedSources.Noun,
		&expectedSources.Verb,
		&expectedSources.Adjective,
		&expectedSources.DailyLife,
		&expectedSources.Travel,
		&expectedSources.DataEngineering,
		&expectedSources.Backend,
	); err != nil {
		t.Fatalf("query expected catalog metadata: %v", err)
	}
	expectedSources.Mixed = expectedTotals.Items
	expectedSources.Phrases = expectedTotals.Phrases

	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()

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

	read := func(request *http.Request, expectedStatus int) (catalogMetadataPayload, http.Header) {
		t.Helper()
		response, requestErr := http.DefaultClient.Do(request)
		if requestErr != nil {
			t.Fatalf("metadata request: %v", requestErr)
		}
		defer response.Body.Close()
		if response.StatusCode != expectedStatus {
			t.Fatalf("metadata status = %d, want %d", response.StatusCode, expectedStatus)
		}
		var payload catalogMetadataPayload
		if expectedStatus != http.StatusNotModified {
			if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
				t.Fatalf("decode metadata: %v", err)
			}
		}
		return payload, response.Header
	}

	request, err := http.NewRequest(http.MethodGet, testServer.URL+"/api/v1/catalog/metadata", nil)
	if err != nil {
		t.Fatalf("create metadata request: %v", err)
	}
	first, headers := read(request, http.StatusOK)
	if first.Totals != expectedTotals {
		t.Fatalf("catalog totals = %+v, want %+v", first.Totals, expectedTotals)
	}
	if first.Sources != expectedSources {
		t.Fatalf("catalog source totals = %+v, want %+v", first.Sources, expectedSources)
	}
	if first.Totals.Words != catalog.ExpectedCount || first.Totals.Items != first.Totals.Words+first.Totals.Phrases {
		t.Fatalf("unexpected totals: %+v", first.Totals)
	}
	if first.CatalogVersion == "" || first.UpdatedAt.IsZero() || len(first.Topics) == 0 {
		t.Fatalf("incomplete metadata: %+v", first)
	}
	if cacheControl := headers.Get("Cache-Control"); cacheControl != "public, max-age=60, must-revalidate" {
		t.Fatalf("Cache-Control = %q", cacheControl)
	}
	etag := headers.Get("ETag")
	if etag == "" {
		t.Fatal("ETag is empty")
	}

	conditional, err := http.NewRequest(http.MethodGet, testServer.URL+"/api/v1/catalog/metadata", nil)
	if err != nil {
		t.Fatalf("create conditional metadata request: %v", err)
	}
	conditional.Header.Set("If-None-Match", etag)
	read(conditional, http.StatusNotModified)

	if _, err := pg.Exec(ctx, `
		insert into words (
			lemma,
			translation,
			part_of_speech,
			topic,
			source,
			kind,
			slug,
			cloze,
			cloze_answer
		) values (
			'metadata contract phrase',
			'контрактная фраза',
			'phrase',
			'Integration Metadata',
			'integration',
			'phrase',
			'integration-metadata-contract-phrase',
			'metadata contract _____',
			'phrase'
		)
	`); err != nil {
		t.Fatalf("insert catalog item: %v", err)
	}

	request, err = http.NewRequest(http.MethodGet, testServer.URL+"/api/v1/catalog/metadata", nil)
	if err != nil {
		t.Fatalf("create updated metadata request: %v", err)
	}
	second, secondHeaders := read(request, http.StatusOK)
	if second.Totals.Items != first.Totals.Items+1 || second.Totals.Phrases != first.Totals.Phrases+1 {
		t.Fatalf("metadata did not track insert: before=%+v after=%+v", first.Totals, second.Totals)
	}
	if second.Sources.Mixed != first.Sources.Mixed+1 || second.Sources.Phrases != first.Sources.Phrases+1 {
		t.Fatalf("source totals did not track phrase insert: before=%+v after=%+v", first.Sources, second.Sources)
	}
	if second.CatalogVersion == first.CatalogVersion || secondHeaders.Get("ETag") == etag {
		t.Fatal("catalog version and ETag must change")
	}
	found := false
	for _, topic := range second.Topics {
		if topic.Topic == "Integration Metadata" && topic.Count == 1 {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("new topic missing: %+v", second.Topics)
	}
}
