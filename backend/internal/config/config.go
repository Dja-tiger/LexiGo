package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Redis struct {
	Addr     string
	Password string
	DB       int
}

type Config struct {
	AppEnv              string
	HTTPAddr            string
	LogLevel            string
	CORSAllowedOrigin   string
	PostgresDSN         string
	Redis               Redis
	JWTSecret           string
	AccessTokenTTL      time.Duration
	RefreshTokenTTL     time.Duration
	SessionCookieSecure bool
}

func Load() (Config, error) {
	appEnv := env("APP_ENV", "local")
	redisDB, err := strconv.Atoi(env("REDIS_DB", "0"))
	if err != nil {
		return Config{}, fmt.Errorf("REDIS_DB must be an integer: %w", err)
	}

	accessTTL, err := time.ParseDuration(env("ACCESS_TOKEN_TTL", "15m"))
	if err != nil {
		return Config{}, fmt.Errorf("ACCESS_TOKEN_TTL: %w", err)
	}

	refreshTTL, err := time.ParseDuration(env("REFRESH_TOKEN_TTL", "720h"))
	if err != nil {
		return Config{}, fmt.Errorf("REFRESH_TOKEN_TTL: %w", err)
	}

	secureDefault := "true"
	if appEnv == "local" || appEnv == "test" {
		secureDefault = "false"
	}
	sessionCookieSecure, err := strconv.ParseBool(env("SESSION_COOKIE_SECURE", secureDefault))
	if err != nil {
		return Config{}, fmt.Errorf("SESSION_COOKIE_SECURE must be a boolean: %w", err)
	}

	cfg := Config{
		AppEnv:            appEnv,
		HTTPAddr:          env("HTTP_ADDR", ":8080"),
		LogLevel:          env("LOG_LEVEL", "info"),
		CORSAllowedOrigin: env("CORS_ALLOWED_ORIGIN", "http://localhost:3000"),
		PostgresDSN:       os.Getenv("POSTGRES_DSN"),
		Redis: Redis{
			Addr:     env("REDIS_ADDR", "localhost:6379"),
			Password: os.Getenv("REDIS_PASSWORD"),
			DB:       redisDB,
		},
		JWTSecret:           os.Getenv("JWT_SECRET"),
		AccessTokenTTL:      accessTTL,
		RefreshTokenTTL:     refreshTTL,
		SessionCookieSecure: sessionCookieSecure,
	}

	if cfg.PostgresDSN == "" {
		return Config{}, fmt.Errorf("POSTGRES_DSN is required")
	}
	if len(cfg.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET must contain at least 32 characters")
	}
	if cfg.AccessTokenTTL <= 0 || cfg.RefreshTokenTTL <= 0 {
		return Config{}, fmt.Errorf("token TTL values must be positive")
	}
	if cfg.AppEnv != "local" && cfg.AppEnv != "test" && !cfg.SessionCookieSecure {
		return Config{}, fmt.Errorf("SESSION_COOKIE_SECURE must be true outside local and test environments")
	}
	return cfg, nil
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
