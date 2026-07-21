//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestProductJourneyIsAnonymousAndQueryableByTransition(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table product_navigation_events restart identity"); err != nil {
		t.Fatalf("truncate product navigation events: %v", err)
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

	payload := map[string]any{
		"appVersion":    "integration-release",
		"fromRoute":     "/dictionary",
		"toRoute":       "/learn",
		"intent":        "catalog_configure_lesson",
		"backtrack":     false,
		"deviceClass":   "tablet",
		"browserFamily": "webkit",
		"displayMode":   "standalone",
	}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal event: %v", err)
	}
	request, err := http.NewRequest(http.MethodPost, testServer.URL+"/api/v1/product/journey", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("create journey request: %v", err)
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Origin", cfg.CORSAllowedOrigin)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("send journey request: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusAccepted {
		responseBody, _ := io.ReadAll(response.Body)
		t.Fatalf("journey status = %d, want %d; body=%s", response.StatusCode, http.StatusAccepted, responseBody)
	}

	var transitions int64
	if err := pg.QueryRow(ctx, `
		select transition_count
		from product_navigation_daily
		where event_date = current_date
		  and app_version = 'integration-release'
		  and from_route = '/dictionary'
		  and to_route = '/learn'
		  and intent = 'catalog_configure_lesson'
		  and is_backtrack = false
		  and device_class = 'tablet'
		  and browser_family = 'webkit'
		  and display_mode = 'standalone'
	`).Scan(&transitions); err != nil {
		t.Fatalf("query navigation aggregate: %v", err)
	}
	if transitions != 1 {
		t.Fatalf("transition count = %d, want 1", transitions)
	}

	forbiddenColumns := []string{"user_id", "session_id", "ip_address", "url", "query", "referrer", "user_agent", "email"}
	for _, column := range forbiddenColumns {
		var exists bool
		if err := pg.QueryRow(ctx, `
			select exists (
				select 1
				from information_schema.columns
				where table_schema = 'public'
				  and table_name = 'product_navigation_events'
				  and column_name = $1
			)
		`, column).Scan(&exists); err != nil {
			t.Fatalf("check forbidden column %s: %v", column, err)
		}
		if exists {
			t.Fatalf("privacy-sensitive column %q must not exist", column)
		}
	}
}
