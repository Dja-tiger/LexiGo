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

	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

func TestPerformanceRUMIsAnonymousBoundedAndQueryableByP75(t *testing.T) {
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
	if _, err := pg.Exec(ctx, "truncate table performance_samples restart identity"); err != nil {
		t.Fatalf("truncate performance samples: %v", err)
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
		"route":         "/dictionary",
		"deviceClass":   "mobile",
		"browserFamily": "webkit",
		"displayMode":   "standalone",
		"samples": []map[string]any{
			{"name": "LCP", "value": 1000, "rating": "good", "navigationType": "navigate"},
			{"name": "LCP", "value": 2000, "rating": "good", "navigationType": "navigate"},
			{"name": "LCP", "value": 3000, "rating": "needs-improvement", "navigationType": "navigate"},
			{"name": "LCP", "value": 4000, "rating": "poor", "navigationType": "navigate"},
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal report: %v", err)
	}
	request, err := http.NewRequest(http.MethodPost, testServer.URL+"/api/v1/performance/rum", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("create report request: %v", err)
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Origin", cfg.CORSAllowedOrigin)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("send report request: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusAccepted {
		responseBody, _ := io.ReadAll(response.Body)
		t.Fatalf("report status = %d, want %d; body=%s", response.StatusCode, http.StatusAccepted, responseBody)
	}
	if response.Header.Get("Cache-Control") != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", response.Header.Get("Cache-Control"))
	}

	var stored int
	if err := pg.QueryRow(ctx, `
		select count(*)::int
		from performance_samples
		where app_version = 'integration-release'
		  and route = '/dictionary'
		  and device_class = 'mobile'
		  and browser_family = 'webkit'
		  and display_mode = 'standalone'
		  and metric_name = 'LCP'
	`).Scan(&stored); err != nil {
		t.Fatalf("count stored samples: %v", err)
	}
	if stored != 4 {
		t.Fatalf("stored samples = %d, want 4", stored)
	}

	var sampleCount int64
	var p75 float64
	if err := pg.QueryRow(ctx, `
		select sample_count, p75_value
		from performance_core_web_vitals_daily_p75
		where sample_date = current_date
		  and app_version = 'integration-release'
		  and route = '/dictionary'
		  and device_class = 'mobile'
		  and browser_family = 'webkit'
		  and display_mode = 'standalone'
		  and metric_name = 'LCP'
	`).Scan(&sampleCount, &p75); err != nil {
		t.Fatalf("query p75 view: %v", err)
	}
	if sampleCount != 4 || p75 != 3250 {
		t.Fatalf("p75 aggregate = count %d value %.2f, want count 4 value 3250", sampleCount, p75)
	}

	forbiddenColumns := []string{"user_id", "ip_address", "url", "query", "referrer", "user_agent", "email"}
	for _, column := range forbiddenColumns {
		var exists bool
		if err := pg.QueryRow(ctx, `
			select exists (
				select 1
				from information_schema.columns
				where table_schema = 'public'
				  and table_name = 'performance_samples'
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
