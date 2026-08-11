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

func TestProductRetentionIsAnonymousAndQueryableByAggregateDimensions(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table product_retention_events restart identity"); err != nil {
		t.Fatalf("truncate product retention events: %v", err)
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
		"event":         "completion_to_next_action",
		"action":        "review_due",
		"delayBucket":   "under_5m",
		"deviceClass":   "mobile",
		"browserFamily": "webkit",
		"displayMode":   "standalone",
	}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal retention event: %v", err)
	}
	request, err := http.NewRequest(http.MethodPost, testServer.URL+"/api/v1/product/retention", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("create retention request: %v", err)
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Origin", cfg.CORSAllowedOrigin)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("send retention request: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusAccepted {
		responseBody, _ := io.ReadAll(response.Body)
		t.Fatalf("retention status = %d, want %d; body=%s", response.StatusCode, http.StatusAccepted, responseBody)
	}

	var eventCount int64
	if err := pg.QueryRow(ctx, `
		select event_count
		from product_retention_daily
		where event_date = current_date
		  and app_version = 'integration-release'
		  and event_name = 'completion_to_next_action'
		  and action = 'review_due'
		  and delay_bucket = 'under_5m'
		  and device_class = 'mobile'
		  and browser_family = 'webkit'
		  and display_mode = 'standalone'
	`).Scan(&eventCount); err != nil {
		t.Fatalf("query retention aggregate: %v", err)
	}
	if eventCount != 1 {
		t.Fatalf("retention event count = %d, want 1", eventCount)
	}

	forbiddenColumns := []string{
		"user_id",
		"session_id",
		"lesson_id",
		"word_id",
		"content_id",
		"ip_address",
		"url",
		"query",
		"referrer",
		"user_agent",
		"email",
		"auth_token",
	}
	for _, column := range forbiddenColumns {
		var exists bool
		if err := pg.QueryRow(ctx, `
			select exists (
				select 1
				from information_schema.columns
				where table_schema = 'public'
				  and table_name = 'product_retention_events'
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
