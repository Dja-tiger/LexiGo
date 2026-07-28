package config

import (
	"fmt"
	"net/mail"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Redis struct {
	Addr     string
	Password string
	DB       int
}

type SMTP struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	Timeout  time.Duration
}

type RUMRetention struct {
	Enabled         bool
	TTL             time.Duration
	CleanupInterval time.Duration
	BatchSize       int
	MaxBatches      int
}

type ContentModeration struct {
	AdminEmails      []string
	RetentionEnabled bool
	PendingTTL       time.Duration
	DecidedTTL       time.Duration
	CleanupInterval  time.Duration
	BatchSize        int
	MaxBatches       int
}

type Config struct {
	AppEnv                string
	HTTPAddr              string
	LogLevel              string
	CORSAllowedOrigin     string
	PostgresDSN           string
	Redis                 Redis
	JWTSecret             string
	AccessTokenTTL        time.Duration
	RefreshTokenTTL       time.Duration
	SessionCookieSecure   bool
	PasswordResetTTL      time.Duration
	PasswordResetDelivery string
	SMTP                  SMTP
	RUMRetention          RUMRetention
	ContentModeration     ContentModeration
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
	passwordResetTTL, err := time.ParseDuration(env("PASSWORD_RESET_TTL", "30m"))
	if err != nil {
		return Config{}, fmt.Errorf("PASSWORD_RESET_TTL: %w", err)
	}
	smtpTimeout, err := time.ParseDuration(env("SMTP_TIMEOUT", "10s"))
	if err != nil {
		return Config{}, fmt.Errorf("SMTP_TIMEOUT: %w", err)
	}
	smtpPort, err := strconv.Atoi(env("SMTP_PORT", "587"))
	if err != nil {
		return Config{}, fmt.Errorf("SMTP_PORT must be an integer: %w", err)
	}

	rumRetentionEnabled, err := strconv.ParseBool(env("RUM_RETENTION_ENABLED", "true"))
	if err != nil {
		return Config{}, fmt.Errorf("RUM_RETENTION_ENABLED must be a boolean: %w", err)
	}
	rumRetentionTTL, err := time.ParseDuration(env("RUM_RETENTION_TTL", "720h"))
	if err != nil {
		return Config{}, fmt.Errorf("RUM_RETENTION_TTL: %w", err)
	}
	rumCleanupInterval, err := time.ParseDuration(env("RUM_RETENTION_CLEANUP_INTERVAL", "1h"))
	if err != nil {
		return Config{}, fmt.Errorf("RUM_RETENTION_CLEANUP_INTERVAL: %w", err)
	}
	rumBatchSize, err := strconv.Atoi(env("RUM_RETENTION_BATCH_SIZE", "5000"))
	if err != nil {
		return Config{}, fmt.Errorf("RUM_RETENTION_BATCH_SIZE must be an integer: %w", err)
	}
	rumMaxBatches, err := strconv.Atoi(env("RUM_RETENTION_MAX_BATCHES", "20"))
	if err != nil {
		return Config{}, fmt.Errorf("RUM_RETENTION_MAX_BATCHES must be an integer: %w", err)
	}

	moderationRetentionEnabled, err := strconv.ParseBool(env("MODERATION_RETENTION_ENABLED", "true"))
	if err != nil {
		return Config{}, fmt.Errorf("MODERATION_RETENTION_ENABLED must be a boolean: %w", err)
	}
	moderationPendingTTL, err := time.ParseDuration(env("MODERATION_PENDING_TTL", "2160h"))
	if err != nil {
		return Config{}, fmt.Errorf("MODERATION_PENDING_TTL: %w", err)
	}
	moderationDecidedTTL, err := time.ParseDuration(env("MODERATION_DECIDED_TTL", "8760h"))
	if err != nil {
		return Config{}, fmt.Errorf("MODERATION_DECIDED_TTL: %w", err)
	}
	moderationCleanupInterval, err := time.ParseDuration(env("MODERATION_CLEANUP_INTERVAL", "6h"))
	if err != nil {
		return Config{}, fmt.Errorf("MODERATION_CLEANUP_INTERVAL: %w", err)
	}
	moderationBatchSize, err := strconv.Atoi(env("MODERATION_CLEANUP_BATCH_SIZE", "1000"))
	if err != nil {
		return Config{}, fmt.Errorf("MODERATION_CLEANUP_BATCH_SIZE must be an integer: %w", err)
	}
	moderationMaxBatches, err := strconv.Atoi(env("MODERATION_CLEANUP_MAX_BATCHES", "20"))
	if err != nil {
		return Config{}, fmt.Errorf("MODERATION_CLEANUP_MAX_BATCHES must be an integer: %w", err)
	}
	adminEmails, err := parseAdminEmails(os.Getenv("CONTENT_ADMIN_EMAILS"))
	if err != nil {
		return Config{}, err
	}

	secureDefault := "true"
	passwordResetDeliveryDefault := "smtp"
	if appEnv == "local" || appEnv == "test" {
		secureDefault = "false"
		passwordResetDeliveryDefault = "log"
	}
	sessionCookieSecure, err := strconv.ParseBool(env("SESSION_COOKIE_SECURE", secureDefault))
	if err != nil {
		return Config{}, fmt.Errorf("SESSION_COOKIE_SECURE must be a boolean: %w", err)
	}

	allowedOrigin := strings.TrimSuffix(env("CORS_ALLOWED_ORIGIN", "http://localhost:3000"), "/")
	if err := validateBrowserOrigin(allowedOrigin); err != nil {
		return Config{}, err
	}

	cfg := Config{
		AppEnv:            appEnv,
		HTTPAddr:          env("HTTP_ADDR", ":8080"),
		LogLevel:          env("LOG_LEVEL", "info"),
		CORSAllowedOrigin: allowedOrigin,
		PostgresDSN:       os.Getenv("POSTGRES_DSN"),
		Redis: Redis{
			Addr:     env("REDIS_ADDR", "localhost:6379"),
			Password: os.Getenv("REDIS_PASSWORD"),
			DB:       redisDB,
		},
		JWTSecret:             os.Getenv("JWT_SECRET"),
		AccessTokenTTL:        accessTTL,
		RefreshTokenTTL:       refreshTTL,
		SessionCookieSecure:   sessionCookieSecure,
		PasswordResetTTL:      passwordResetTTL,
		PasswordResetDelivery: strings.ToLower(strings.TrimSpace(env("PASSWORD_RESET_DELIVERY", passwordResetDeliveryDefault))),
		SMTP: SMTP{
			Host:     strings.TrimSpace(os.Getenv("SMTP_HOST")),
			Port:     smtpPort,
			Username: strings.TrimSpace(os.Getenv("SMTP_USERNAME")),
			Password: os.Getenv("SMTP_PASSWORD"),
			From:     strings.TrimSpace(os.Getenv("SMTP_FROM")),
			Timeout:  smtpTimeout,
		},
		RUMRetention: RUMRetention{
			Enabled:         rumRetentionEnabled,
			TTL:             rumRetentionTTL,
			CleanupInterval: rumCleanupInterval,
			BatchSize:       rumBatchSize,
			MaxBatches:      rumMaxBatches,
		},
		ContentModeration: ContentModeration{
			AdminEmails:      adminEmails,
			RetentionEnabled: moderationRetentionEnabled,
			PendingTTL:       moderationPendingTTL,
			DecidedTTL:       moderationDecidedTTL,
			CleanupInterval:  moderationCleanupInterval,
			BatchSize:        moderationBatchSize,
			MaxBatches:       moderationMaxBatches,
		},
	}

	if cfg.PostgresDSN == "" {
		return Config{}, fmt.Errorf("POSTGRES_DSN is required")
	}
	if len(cfg.JWTSecret) < 32 {
		return Config{}, fmt.Errorf("JWT_SECRET must contain at least 32 characters")
	}
	if cfg.AccessTokenTTL <= 0 || cfg.RefreshTokenTTL <= 0 || cfg.PasswordResetTTL <= 0 {
		return Config{}, fmt.Errorf("token TTL values must be positive")
	}
	if cfg.AppEnv != "local" && cfg.AppEnv != "test" && !cfg.SessionCookieSecure {
		return Config{}, fmt.Errorf("SESSION_COOKIE_SECURE must be true outside local and test environments")
	}
	if cfg.PasswordResetDelivery != "log" && cfg.PasswordResetDelivery != "smtp" {
		return Config{}, fmt.Errorf("PASSWORD_RESET_DELIVERY must be log or smtp")
	}
	if cfg.AppEnv != "local" && cfg.AppEnv != "test" && cfg.PasswordResetDelivery != "smtp" {
		return Config{}, fmt.Errorf("PASSWORD_RESET_DELIVERY must be smtp outside local and test environments")
	}
	if cfg.PasswordResetDelivery == "smtp" {
		if err := validateSMTP(cfg.SMTP); err != nil {
			return Config{}, err
		}
	}
	if err := validateRUMRetention(cfg.RUMRetention); err != nil {
		return Config{}, err
	}
	if err := validateContentModeration(cfg.ContentModeration); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func parseAdminEmails(value string) ([]string, error) {
	seen := make(map[string]struct{})
	result := make([]string, 0)
	for _, raw := range strings.Split(value, ",") {
		email := strings.ToLower(strings.TrimSpace(raw))
		if email == "" {
			continue
		}
		parsed, err := mail.ParseAddress(email)
		if err != nil || parsed.Address != email {
			return nil, fmt.Errorf("CONTENT_ADMIN_EMAILS must contain comma-separated normalized email addresses")
		}
		if _, exists := seen[email]; exists {
			continue
		}
		seen[email] = struct{}{}
		result = append(result, email)
	}
	return result, nil
}

func validateBrowserOrigin(value string) error {
	if value == "" || value == "*" {
		return fmt.Errorf("CORS_ALLOWED_ORIGIN must contain one explicit browser origin")
	}
	parsed, err := url.Parse(value)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return fmt.Errorf("CORS_ALLOWED_ORIGIN must be an absolute http or https origin")
	}
	if parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" || (parsed.Path != "" && parsed.Path != "/") {
		return fmt.Errorf("CORS_ALLOWED_ORIGIN must not contain credentials, path, query, or fragment")
	}
	return nil
}

func validateSMTP(value SMTP) error {
	if value.Host == "" {
		return fmt.Errorf("SMTP_HOST is required when password reset delivery uses smtp")
	}
	if value.Port <= 0 || value.Port > 65535 {
		return fmt.Errorf("SMTP_PORT must be between 1 and 65535")
	}
	if value.Timeout <= 0 {
		return fmt.Errorf("SMTP_TIMEOUT must be positive")
	}
	parsed, err := mail.ParseAddress(value.From)
	if err != nil || parsed.Address == "" {
		return fmt.Errorf("SMTP_FROM must contain a valid email address")
	}
	if (value.Username == "") != (value.Password == "") {
		return fmt.Errorf("SMTP_USERNAME and SMTP_PASSWORD must be configured together")
	}
	return nil
}

func validateRUMRetention(value RUMRetention) error {
	if value.TTL < 24*time.Hour {
		return fmt.Errorf("RUM_RETENTION_TTL must be at least 24h")
	}
	if value.CleanupInterval < time.Minute {
		return fmt.Errorf("RUM_RETENTION_CLEANUP_INTERVAL must be at least 1m")
	}
	if value.BatchSize < 100 || value.BatchSize > 50_000 {
		return fmt.Errorf("RUM_RETENTION_BATCH_SIZE must be between 100 and 50000")
	}
	if value.MaxBatches < 1 || value.MaxBatches > 100 {
		return fmt.Errorf("RUM_RETENTION_MAX_BATCHES must be between 1 and 100")
	}
	return nil
}

func validateContentModeration(value ContentModeration) error {
	if value.PendingTTL < 24*time.Hour {
		return fmt.Errorf("MODERATION_PENDING_TTL must be at least 24h")
	}
	if value.DecidedTTL < value.PendingTTL {
		return fmt.Errorf("MODERATION_DECIDED_TTL must be greater than or equal to MODERATION_PENDING_TTL")
	}
	if value.CleanupInterval < time.Minute {
		return fmt.Errorf("MODERATION_CLEANUP_INTERVAL must be at least 1m")
	}
	if value.BatchSize < 100 || value.BatchSize > 10_000 {
		return fmt.Errorf("MODERATION_CLEANUP_BATCH_SIZE must be between 100 and 10000")
	}
	if value.MaxBatches < 1 || value.MaxBatches > 100 {
		return fmt.Errorf("MODERATION_CLEANUP_MAX_BATCHES must be between 1 and 100")
	}
	return nil
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
