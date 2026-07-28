package config

import (
	"strings"
	"testing"
	"time"
)

func setRequiredEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("POSTGRES_DSN", "postgres://test")
	t.Setenv("JWT_SECRET", "01234567890123456789012345678901")
}

func setSMTPEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_PORT", "587")
	t.Setenv("SMTP_USERNAME", "lexigo")
	t.Setenv("SMTP_PASSWORD", "secret")
	t.Setenv("SMTP_FROM", "LexiGo <noreply@example.com>")
}

func TestLoadRejectsShortJWTSecret(t *testing.T) {
	t.Setenv("POSTGRES_DSN", "postgres://test")
	t.Setenv("JWT_SECRET", "short")

	if _, err := Load(); err == nil {
		t.Fatal("expected validation error")
	}
}

func TestLoadUsesLocalDefaults(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("APP_ENV", "local")
	t.Setenv("HTTP_ADDR", "")
	t.Setenv("REDIS_ADDR", "")
	t.Setenv("SESSION_COOKIE_SECURE", "")
	t.Setenv("PASSWORD_RESET_DELIVERY", "")
	t.Setenv("RUM_RETENTION_ENABLED", "")
	t.Setenv("RUM_RETENTION_TTL", "")
	t.Setenv("RUM_RETENTION_CLEANUP_INTERVAL", "")
	t.Setenv("RUM_RETENTION_BATCH_SIZE", "")
	t.Setenv("RUM_RETENTION_MAX_BATCHES", "")
	t.Setenv("CONTENT_ADMIN_EMAILS", "")
	t.Setenv("MODERATION_RETENTION_ENABLED", "")
	t.Setenv("MODERATION_PENDING_TTL", "")
	t.Setenv("MODERATION_DECIDED_TTL", "")
	t.Setenv("MODERATION_CLEANUP_INTERVAL", "")
	t.Setenv("MODERATION_CLEANUP_BATCH_SIZE", "")
	t.Setenv("MODERATION_CLEANUP_MAX_BATCHES", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.HTTPAddr != ":8080" {
		t.Fatalf("HTTPAddr = %q", cfg.HTTPAddr)
	}
	if cfg.Redis.Addr != "localhost:6379" {
		t.Fatalf("Redis.Addr = %q", cfg.Redis.Addr)
	}
	if cfg.SessionCookieSecure {
		t.Fatal("local HTTP development must not enable Secure cookies by default")
	}
	if cfg.PasswordResetDelivery != "log" || cfg.PasswordResetTTL != 30*time.Minute {
		t.Fatalf("unexpected local password reset config: delivery=%q ttl=%s", cfg.PasswordResetDelivery, cfg.PasswordResetTTL)
	}
	if !cfg.RUMRetention.Enabled || cfg.RUMRetention.TTL != 30*24*time.Hour {
		t.Fatalf("unexpected RUM retention defaults: %+v", cfg.RUMRetention)
	}
	if cfg.RUMRetention.CleanupInterval != time.Hour || cfg.RUMRetention.BatchSize != 5000 || cfg.RUMRetention.MaxBatches != 20 {
		t.Fatalf("unexpected RUM cleanup bounds: %+v", cfg.RUMRetention)
	}
	if len(cfg.ContentModeration.AdminEmails) != 0 ||
		cfg.ContentModeration.PendingTTL != 90*24*time.Hour ||
		cfg.ContentModeration.DecidedTTL != 365*24*time.Hour ||
		cfg.ContentModeration.CleanupInterval != 6*time.Hour {
		t.Fatalf("unexpected moderation defaults: %+v", cfg.ContentModeration)
	}
}

func TestLoadDefaultsToSecureCookiesAndSMTPOutsideLocalEnvironment(t *testing.T) {
	setRequiredEnvironment(t)
	setSMTPEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGIN", "https://lexigo.example")
	t.Setenv("SESSION_COOKIE_SECURE", "")
	t.Setenv("PASSWORD_RESET_DELIVERY", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if !cfg.SessionCookieSecure {
		t.Fatal("production cookies must be Secure by default")
	}
	if cfg.PasswordResetDelivery != "smtp" || cfg.SMTP.Host != "smtp.example.com" {
		t.Fatalf("unexpected production reset config: %+v", cfg)
	}
}

func TestLoadRejectsInsecureProductionCookies(t *testing.T) {
	setRequiredEnvironment(t)
	setSMTPEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGIN", "https://lexigo.example")
	t.Setenv("SESSION_COOKIE_SECURE", "false")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "SESSION_COOKIE_SECURE") {
		t.Fatalf("expected secure-cookie validation error, got %v", err)
	}
}

func TestLoadRejectsNonSMTPPasswordResetOutsideLocalEnvironment(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGIN", "https://lexigo.example")
	t.Setenv("PASSWORD_RESET_DELIVERY", "log")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "PASSWORD_RESET_DELIVERY") {
		t.Fatalf("expected production delivery validation error, got %v", err)
	}
}

func TestLoadRejectsMissingSMTPConfiguration(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGIN", "https://lexigo.example")
	t.Setenv("PASSWORD_RESET_DELIVERY", "smtp")
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_FROM", "")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "SMTP_HOST") {
		t.Fatalf("expected SMTP validation error, got %v", err)
	}
}

func TestLoadRejectsWildcardCORSForCookieSessions(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("CORS_ALLOWED_ORIGIN", "*")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "explicit browser origin") {
		t.Fatalf("expected explicit-origin validation error, got %v", err)
	}
}

func TestLoadNormalizesOriginTrailingSlash(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("CORS_ALLOWED_ORIGIN", "https://lexigo.example/")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.CORSAllowedOrigin != "https://lexigo.example" {
		t.Fatalf("CORSAllowedOrigin = %q", cfg.CORSAllowedOrigin)
	}
}

func TestLoadRejectsUnsafeRUMRetentionBounds(t *testing.T) {
	tests := []struct {
		name      string
		key       string
		value     string
		errorText string
	}{
		{name: "short TTL", key: "RUM_RETENTION_TTL", value: "23h", errorText: "RUM_RETENTION_TTL"},
		{name: "frequent cleanup", key: "RUM_RETENTION_CLEANUP_INTERVAL", value: "30s", errorText: "RUM_RETENTION_CLEANUP_INTERVAL"},
		{name: "small batch", key: "RUM_RETENTION_BATCH_SIZE", value: "99", errorText: "RUM_RETENTION_BATCH_SIZE"},
		{name: "too many batches", key: "RUM_RETENTION_MAX_BATCHES", value: "101", errorText: "RUM_RETENTION_MAX_BATCHES"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			setRequiredEnvironment(t)
			t.Setenv(test.key, test.value)

			_, err := Load()
			if err == nil || !strings.Contains(err.Error(), test.errorText) {
				t.Fatalf("expected %s validation error, got %v", test.errorText, err)
			}
		})
	}
}

func TestLoadNormalizesAndDeduplicatesContentAdminEmails(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("CONTENT_ADMIN_EMAILS", " Admin@Example.com,admin@example.com, editor@example.com ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if len(cfg.ContentModeration.AdminEmails) != 2 ||
		cfg.ContentModeration.AdminEmails[0] != "admin@example.com" ||
		cfg.ContentModeration.AdminEmails[1] != "editor@example.com" {
		t.Fatalf("admin emails = %#v", cfg.ContentModeration.AdminEmails)
	}
}

func TestLoadRejectsInvalidContentAdminAndRetentionConfiguration(t *testing.T) {
	tests := []struct {
		key       string
		value     string
		errorText string
	}{
		{key: "CONTENT_ADMIN_EMAILS", value: "not-an-email", errorText: "CONTENT_ADMIN_EMAILS"},
		{key: "MODERATION_PENDING_TTL", value: "23h", errorText: "MODERATION_PENDING_TTL"},
		{key: "MODERATION_DECIDED_TTL", value: "24h", errorText: "MODERATION_DECIDED_TTL"},
		{key: "MODERATION_CLEANUP_INTERVAL", value: "30s", errorText: "MODERATION_CLEANUP_INTERVAL"},
		{key: "MODERATION_CLEANUP_BATCH_SIZE", value: "99", errorText: "MODERATION_CLEANUP_BATCH_SIZE"},
		{key: "MODERATION_CLEANUP_MAX_BATCHES", value: "101", errorText: "MODERATION_CLEANUP_MAX_BATCHES"},
	}
	for _, test := range tests {
		t.Run(test.key, func(t *testing.T) {
			setRequiredEnvironment(t)
			t.Setenv(test.key, test.value)
			if test.key == "MODERATION_DECIDED_TTL" {
				t.Setenv("MODERATION_PENDING_TTL", "48h")
			}
			_, err := Load()
			if err == nil || !strings.Contains(err.Error(), test.errorText) {
				t.Fatalf("expected %s error, got %v", test.errorText, err)
			}
		})
	}
}
