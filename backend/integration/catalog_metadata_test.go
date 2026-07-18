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

type catalogMetadataPayload struct {
	CatalogVersion string    `json:"catalogVersion"`
	UpdatedAt      time.Time `json:"updatedAt"`
	Totals         struct {
		Items   int `json:"items"`
		Words   int `json:"words"`
		Phrases int `json:"phrases"`
	} `json:"totals"`
	Sources struct {
		Mixed     int `json:"mixed"`
		Noun      int `json:"noun"`
		Phrases   int `json:"phrases"`
		DailyLife int `json:"dailyLife"`
	} `json:"sources"`
	Topics []struct {
		Topic string `json:"topic"`
		Count int    `json:"count"`
	} `json:"topics"`
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

	request, _ := http.NewRequest(http.MethodGet, testServer.URL+"/api/v1/catalog/metadata", nil)
	first, headers := read(request, http.StatusOK)
	if first.Totals.Words != catalog.ExpectedCount || first.Totals.Items != first.Totals.Words+first.Totals.Phrases {
		t.Fatalf("unexpected totals: %+v", first.Totals)
	}
	if first.Sources.Mixed != first.Totals.Items || first.CatalogVersion == "" || first.UpdatedAt.IsZero() {
		t.Fatalf("incomplete metadata: %+v", first)
	}
	etag := headers.Get("ETag")
	if etag == "" {
		t.Fatal("ETag is empty")
	}

	conditional, _ := http.NewRequest(http.MethodGet, testServer.URL+"/api/v1/catalog/metadata", nil)
	conditional.Header.Set("If-None-Match", etag)
	read(conditional, http.StatusNotModified)

	if _, err := pg.Exec(ctx, `insert into words(lemma, translation, part_of_speech, topic, source, kind) values ('metadata contract phrase', 'контрактная фраза', 'phrase', 'Integration Metadata', 'integration', 'phrase')`); err != nil {
		t.Fatalf("insert catalog item: %v", err)
	}
	request, _ = http.NewRequest(http.MethodGet, testServer.URL+"/api/v1/catalog/metadata", nil)
	second, secondHeaders := read(request, http.StatusOK)
	if second.Totals.Items != first.Totals.Items+1 || second.Totals.Phrases != first.Totals.Phrases+1 {
		t.Fatalf("metadata did not track insert: before=%+v after=%+v", first.Totals, second.Totals)
	}
	if second.CatalogVersion == first.CatalogVersion || secondHeaders.Get("ETag") == etag {
		t.Fatal("catalog version and ETag must change")
	}
	found := false
	for _, topic := range second.Topics {
		if topic.Topic == "Integration Metadata" && topic.Count == 1 {
			found = true
		}
	}
	if !found {
		t.Fatalf("new topic missing: %+v", second.Topics)
	}
}
