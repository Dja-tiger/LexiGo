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
