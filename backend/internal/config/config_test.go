package config

import (
	"strings"
	"testing"
)

func setRequiredEnvironment(t *testing.T) {
	t.Helper()
	t.Setenv("POSTGRES_DSN", "postgres://test")
	t.Setenv("JWT_SECRET", "01234567890123456789012345678901")
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
}

func TestLoadDefaultsToSecureCookiesOutsideLocalEnvironment(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGIN", "https://lexigo.example")
	t.Setenv("SESSION_COOKIE_SECURE", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if !cfg.SessionCookieSecure {
		t.Fatal("production cookies must be Secure by default")
	}
}

func TestLoadRejectsInsecureProductionCookies(t *testing.T) {
	setRequiredEnvironment(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("CORS_ALLOWED_ORIGIN", "https://lexigo.example")
	t.Setenv("SESSION_COOKIE_SECURE", "false")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "SESSION_COOKIE_SECURE") {
		t.Fatalf("expected secure-cookie validation error, got %v", err)
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
