//go:build integration

package integration

import (
	"bytes"
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

func TestCSPReportAcceptsBrowserOpaqueOriginOutsideMutationGuard(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()

	var logs bytes.Buffer
	cfg := config.Config{
		AppEnv:            "test",
		CORSAllowedOrigin: "https://lexigo.example",
		JWTSecret:         "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL:    15 * time.Minute,
		RefreshTokenTTL:   24 * time.Hour,
	}
	app, err := server.New(cfg, slog.New(slog.NewJSONHandler(&logs, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}

	request := httptest.NewRequest(http.MethodPost, "https://lexigo.example/api/v1/security/csp-report", strings.NewReader(`{
		"csp-report": {
			"document-uri": "https://lexigo.example/profile?credential=secret#token",
			"blocked-uri": "https://blocked.example/script.js?credential=secret",
			"effective-directive": "script-src-elem",
			"script-sample": "secret inline source"
		}
	}`))
	request.Header.Set("Content-Type", "application/csp-report")
	request.Header.Set("Origin", "null")
	request.Header.Set("Sec-Fetch-Site", "cross-site")
	response := httptest.NewRecorder()

	app.Handler().ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusNoContent, response.Body.String())
	}
	output := logs.String()
	if !strings.Contains(output, "script-src-elem") || !strings.Contains(output, "https://blocked.example") {
		t.Fatalf("sanitized CSP report was not logged: %s", output)
	}
	for _, secret := range []string{"credential=secret", "#token", "secret inline source"} {
		if strings.Contains(output, secret) {
			t.Fatalf("CSP report leaked %q: %s", secret, output)
		}
	}
}
