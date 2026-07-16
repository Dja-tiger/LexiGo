from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + "\n", encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")
    if content.count(old) != 1:
        raise RuntimeError(f"expected exactly one match in {path}: {old[:80]!r}")
    target.write_text(content.replace(old, new), encoding="utf-8")


def regex_replace(path: str, pattern: str, replacement: str, expected: int = 1) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    if count != expected:
        raise RuntimeError(f"expected {expected} regex matches in {path}, got {count}: {pattern[:100]!r}")
    target.write_text(updated, encoding="utf-8")


write(
    "backend/internal/auth/model.go",
    r'''
package auth

import "time"

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"displayName"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

// TokenPair contains the short-lived access token returned to the browser and the
// refresh token used only by the HTTP layer to create an HttpOnly cookie. The
// refresh token must never be serialized into an API response.
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"-"`
	TokenType    string `json:"tokenType"`
	ExpiresIn    int64  `json:"expiresIn"`
}
''',
)

write(
    "backend/internal/auth/repository.go",
    r'''
package auth

import (
	"context"
	"errors"
	"time"
)

var (
	ErrUserNotFound        = errors.New("user not found")
	ErrEmailTaken          = errors.New("email already registered")
	ErrInvalidRefresh      = errors.New("invalid refresh token")
	ErrRefreshTokenReuse   = errors.New("refresh token reuse detected")
	ErrInvalidLogin        = errors.New("invalid email or password")
	ErrInvalidAccess       = errors.New("invalid access token")
)

type UserRepository interface {
	Create(ctx context.Context, email, passwordHash, displayName string) (User, error)
	ByEmail(ctx context.Context, email string) (User, error)
	ByID(ctx context.Context, id string) (User, error)
}

type RefreshTokenRepository interface {
	Store(ctx context.Context, userID string, tokenHash []byte, expiresAt time.Time, userAgent, ip string) error
	Rotate(ctx context.Context, oldHash, newHash []byte, newExpiresAt time.Time, userAgent, ip string) (string, error)
	Revoke(ctx context.Context, tokenHash []byte) error
}
''',
)

write(
    "backend/internal/auth/service.go",
    r'''
package auth

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"
)

type Service struct {
	users      UserRepository
	refresh    RefreshTokenRepository
	tokens     *TokenManager
	refreshTTL time.Duration
	now        func() time.Time
}

func NewService(users UserRepository, refresh RefreshTokenRepository, tokens *TokenManager, refreshTTL time.Duration) *Service {
	return &Service{users: users, refresh: refresh, tokens: tokens, refreshTTL: refreshTTL, now: time.Now}
}

func (s *Service) Register(ctx context.Context, email, password, displayName, userAgent, ip string) (User, TokenPair, error) {
	email, err := normalizeEmail(email)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	if err := validatePassword(password); err != nil {
		return User{}, TokenPair{}, err
	}
	hash, err := HashPassword(password)
	if err != nil {
		return User{}, TokenPair{}, fmt.Errorf("hash password: %w", err)
	}
	user, err := s.users.Create(ctx, email, hash, strings.TrimSpace(displayName))
	if err != nil {
		return User{}, TokenPair{}, err
	}
	pair, err := s.issuePair(ctx, user, userAgent, ip)
	return user, pair, err
}

func (s *Service) Login(ctx context.Context, email, password, userAgent, ip string) (User, TokenPair, error) {
	email, err := normalizeEmail(email)
	if err != nil {
		return User{}, TokenPair{}, ErrInvalidLogin
	}
	user, err := s.users.ByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return User{}, TokenPair{}, ErrInvalidLogin
		}
		return User{}, TokenPair{}, err
	}
	if !VerifyPassword(user.PasswordHash, password) {
		return User{}, TokenPair{}, ErrInvalidLogin
	}
	pair, err := s.issuePair(ctx, user, userAgent, ip)
	return user, pair, err
}

func (s *Service) Refresh(ctx context.Context, oldToken, userAgent, ip string) (User, TokenPair, error) {
	oldHash, err := HashRefreshToken(oldToken)
	if err != nil {
		return User{}, TokenPair{}, ErrInvalidRefresh
	}
	newPlain, newHash, err := NewRefreshToken()
	if err != nil {
		return User{}, TokenPair{}, err
	}
	expiresAt := s.now().UTC().Add(s.refreshTTL)
	userID, err := s.refresh.Rotate(ctx, oldHash, newHash, expiresAt, userAgent, ip)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	user, err := s.users.ByID(ctx, userID)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	access, accessExpiry, err := s.tokens.IssueAccess(user)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	return user, TokenPair{
		AccessToken: access, RefreshToken: newPlain, TokenType: "Bearer",
		ExpiresIn: int64(time.Until(accessExpiry).Seconds()),
	}, nil
}

func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	hash, err := HashRefreshToken(refreshToken)
	if err != nil {
		return ErrInvalidRefresh
	}
	return s.refresh.Revoke(ctx, hash)
}

func (s *Service) UserByID(ctx context.Context, id string) (User, error) {
	return s.users.ByID(ctx, id)
}

func (s *Service) ParseAccess(token string) (string, error) {
	return s.tokens.ParseAccess(token)
}

func (s *Service) issuePair(ctx context.Context, user User, userAgent, ip string) (TokenPair, error) {
	access, accessExpiry, err := s.tokens.IssueAccess(user)
	if err != nil {
		return TokenPair{}, err
	}
	refreshPlain, refreshHash, err := NewRefreshToken()
	if err != nil {
		return TokenPair{}, err
	}
	if err := s.refresh.Store(ctx, user.ID, refreshHash, s.now().UTC().Add(s.refreshTTL), userAgent, ip); err != nil {
		return TokenPair{}, err
	}
	return TokenPair{
		AccessToken: access, RefreshToken: refreshPlain, TokenType: "Bearer",
		ExpiresIn: int64(time.Until(accessExpiry).Seconds()),
	}, nil
}

func normalizeEmail(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	parsed, err := mail.ParseAddress(value)
	if err != nil || parsed.Address != value {
		return "", fmt.Errorf("invalid email")
	}
	return value, nil
}

func validatePassword(value string) error {
	if len([]byte(value)) < 10 || len([]byte(value)) > 72 {
		return fmt.Errorf("password must contain from 10 to 72 bytes")
	}
	return nil
}
''',
)

write(
    "backend/internal/auth/postgres_repository.go",
    r'''
package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) Create(ctx context.Context, email, passwordHash, displayName string) (User, error) {
	var user User
	err := r.pool.QueryRow(ctx, `
		insert into users(email, password_hash, display_name)
		values ($1, $2, $3)
		returning id::text, email, display_name, password_hash, created_at
	`, email, passwordHash, displayName).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.PasswordHash, &user.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailTaken
		}
		return User{}, fmt.Errorf("insert user: %w", err)
	}
	return user, nil
}

func (r *PostgresRepository) ByEmail(ctx context.Context, email string) (User, error) {
	return r.readUser(ctx, `
		select id::text, email, display_name, password_hash, created_at
		from users where email = $1
	`, email)
}

func (r *PostgresRepository) ByID(ctx context.Context, id string) (User, error) {
	return r.readUser(ctx, `
		select id::text, email, display_name, password_hash, created_at
		from users where id = $1::uuid
	`, id)
}

func (r *PostgresRepository) readUser(ctx context.Context, query string, arg any) (User, error) {
	var user User
	err := r.pool.QueryRow(ctx, query, arg).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.PasswordHash, &user.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrUserNotFound
	}
	if err != nil {
		return User{}, fmt.Errorf("read user: %w", err)
	}
	return user, nil
}

func (r *PostgresRepository) Store(ctx context.Context, userID string, tokenHash []byte, expiresAt time.Time, userAgent, ip string) error {
	_, err := r.pool.Exec(ctx, `
		insert into refresh_tokens(user_id, family_id, token_hash, expires_at, user_agent, ip_address)
		values ($1::uuid, gen_random_uuid(), $2, $3, $4, nullif($5, '')::inet)
	`, userID, tokenHash, expiresAt, userAgent, ip)
	if err != nil {
		return fmt.Errorf("store refresh token: %w", err)
	}
	return nil
}

func (r *PostgresRepository) Rotate(ctx context.Context, oldHash, newHash []byte, newExpiresAt time.Time, userAgent, ip string) (string, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("begin token rotation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var (
		userID    string
		familyID  string
		expiresAt time.Time
		revokedAt *time.Time
	)
	err = tx.QueryRow(ctx, `
		select user_id::text, family_id::text, expires_at, revoked_at
		from refresh_tokens
		where token_hash = $1
		for update
	`, oldHash).Scan(&userID, &familyID, &expiresAt, &revokedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrInvalidRefresh
	}
	if err != nil {
		return "", fmt.Errorf("read refresh token for rotation: %w", err)
	}

	if revokedAt != nil {
		if _, err := tx.Exec(ctx, `
			update refresh_tokens
			set revoked_at = coalesce(revoked_at, now()),
				reuse_detected_at = coalesce(reuse_detected_at, now())
			where family_id = $1::uuid
		`, familyID); err != nil {
			return "", fmt.Errorf("revoke reused refresh token family: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return "", fmt.Errorf("commit refresh token reuse revocation: %w", err)
		}
		return "", ErrRefreshTokenReuse
	}

	if !expiresAt.After(time.Now().UTC()) {
		if _, err := tx.Exec(ctx, `
			update refresh_tokens set revoked_at = coalesce(revoked_at, now()) where token_hash = $1
		`, oldHash); err != nil {
			return "", fmt.Errorf("revoke expired refresh token: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return "", fmt.Errorf("commit expired refresh token revocation: %w", err)
		}
		return "", ErrInvalidRefresh
	}

	if _, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = now(), replaced_by_hash = $2
		where token_hash = $1
	`, oldHash, newHash); err != nil {
		return "", fmt.Errorf("revoke old refresh token: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into refresh_tokens(user_id, family_id, token_hash, expires_at, user_agent, ip_address)
		values ($1::uuid, $2::uuid, $3, $4, $5, nullif($6, '')::inet)
	`, userID, familyID, newHash, newExpiresAt, userAgent, ip); err != nil {
		return "", fmt.Errorf("insert rotated refresh token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("commit token rotation: %w", err)
	}
	return userID, nil
}

func (r *PostgresRepository) Revoke(ctx context.Context, tokenHash []byte) error {
	command, err := r.pool.Exec(ctx, `
		update refresh_tokens
		set revoked_at = coalesce(revoked_at, now())
		where family_id = (
			select family_id from refresh_tokens where token_hash = $1
		)
	`, tokenHash)
	if err != nil {
		return fmt.Errorf("revoke refresh token family: %w", err)
	}
	if command.RowsAffected() == 0 {
		return ErrInvalidRefresh
	}
	return nil
}
''',
)

write(
    "backend/internal/auth/http.go",
    r'''
package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

const (
	refreshCookieName = "lexigo_refresh"
	csrfCookieName    = "lexigo_csrf"
	csrfHeaderName    = "X-CSRF-Token"
)

type CookieConfig struct {
	Secure     bool
	RefreshTTL time.Duration
}

type Handler struct {
	service *Service
	cookies CookieConfig
	now     func() time.Time
}

func NewHandler(service *Service, cookies CookieConfig) *Handler {
	return &Handler{service: service, cookies: cookies, now: time.Now}
}

type credentialsRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName,omitempty"`
}

type authResponse struct {
	User   User      `json:"user"`
	Tokens TokenPair `json:"tokens"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var request credentialsRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON request")
		return
	}
	csrfToken, err := newCSRFToken()
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	user, pair, err := h.service.Register(r.Context(), request.Email, request.Password, request.DisplayName, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	h.setSessionCookies(w, pair.RefreshToken, csrfToken)
	httpx.WriteJSON(w, http.StatusCreated, authResponse{User: user, Tokens: pair})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var request credentialsRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON request")
		return
	}
	csrfToken, err := newCSRFToken()
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	user, pair, err := h.service.Login(r.Context(), request.Email, request.Password, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	h.setSessionCookies(w, pair.RefreshToken, csrfToken)
	httpx.WriteJSON(w, http.StatusOK, authResponse{User: user, Tokens: pair})
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	if !validCSRF(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	refreshToken, err := h.refreshToken(r)
	if err != nil {
		h.clearSessionCookies(w)
		h.writeServiceError(w, ErrInvalidRefresh)
		return
	}
	csrfToken, err := newCSRFToken()
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	user, pair, err := h.service.Refresh(r.Context(), refreshToken, r.UserAgent(), clientIP(r))
	if err != nil {
		if errors.Is(err, ErrInvalidRefresh) || errors.Is(err, ErrRefreshTokenReuse) {
			h.clearSessionCookies(w)
		}
		h.writeServiceError(w, err)
		return
	}
	h.setSessionCookies(w, pair.RefreshToken, csrfToken)
	httpx.WriteJSON(w, http.StatusOK, authResponse{User: user, Tokens: pair})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if !validCSRF(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	refreshToken, err := h.refreshToken(r)
	if err == nil {
		if serviceErr := h.service.Logout(r.Context(), refreshToken); serviceErr != nil && !errors.Is(serviceErr, ErrInvalidRefresh) {
			h.writeServiceError(w, serviceErr)
			return
		}
	}
	h.clearSessionCookies(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	user, err := h.service.UserByID(r.Context(), userID)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, user)
}

func (h *Handler) setSessionCookies(w http.ResponseWriter, refreshToken, csrfToken string) {
	expiresAt := h.now().UTC().Add(h.cookies.RefreshTTL)
	maxAge := int(h.cookies.RefreshTTL.Seconds())
	http.SetCookie(w, &http.Cookie{
		Name: refreshCookieName, Value: refreshToken, Path: "/api/v1/auth",
		Expires: expiresAt, MaxAge: maxAge, HttpOnly: true, Secure: h.cookies.Secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name: csrfCookieName, Value: csrfToken, Path: "/",
		Expires: expiresAt, MaxAge: maxAge, HttpOnly: false, Secure: h.cookies.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *Handler) clearSessionCookies(w http.ResponseWriter) {
	expiresAt := time.Unix(1, 0).UTC()
	http.SetCookie(w, &http.Cookie{
		Name: refreshCookieName, Path: "/api/v1/auth", Expires: expiresAt,
		MaxAge: -1, HttpOnly: true, Secure: h.cookies.Secure, SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name: csrfCookieName, Path: "/", Expires: expiresAt,
		MaxAge: -1, HttpOnly: false, Secure: h.cookies.Secure, SameSite: http.SameSiteLaxMode,
	})
}

func (h *Handler) refreshToken(r *http.Request) (string, error) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return "", ErrInvalidRefresh
	}
	return cookie.Value, nil
}

func validCSRF(r *http.Request) bool {
	cookie, err := r.Cookie(csrfCookieName)
	if err != nil || cookie.Value == "" {
		return false
	}
	header := strings.TrimSpace(r.Header.Get(csrfHeaderName))
	if header == "" || len(header) != len(cookie.Value) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(header), []byte(cookie.Value)) == 1
}

func newCSRFToken() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}

func (h *Handler) writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrEmailTaken):
		httpx.WriteError(w, http.StatusConflict, "email_taken", "email is already registered")
	case errors.Is(err, ErrInvalidLogin), errors.Is(err, ErrInvalidRefresh), errors.Is(err, ErrRefreshTokenReuse), errors.Is(err, ErrInvalidAccess):
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "invalid credentials or token")
	case errors.Is(err, ErrUserNotFound):
		httpx.WriteError(w, http.StatusNotFound, "not_found", "user not found")
	case strings.Contains(err.Error(), "invalid email"), strings.Contains(err.Error(), "password must"):
		httpx.WriteError(w, http.StatusUnprocessableEntity, "validation_error", err.Error())
	default:
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

func clientIP(r *http.Request) string {
	if forwarded := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-For"), ",")[0]); net.ParseIP(forwarded) != nil {
		return forwarded
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && net.ParseIP(host) != nil {
		return host
	}
	return ""
}
''',
)

write(
    "backend/internal/platform/migrate/migrations/000007_secure_refresh_sessions.up.sql",
    r'''
alter table refresh_tokens
    add column family_id uuid,
    add column replaced_by_hash bytea,
    add column reuse_detected_at timestamptz;

update refresh_tokens
set family_id = id
where family_id is null;

alter table refresh_tokens
    alter column family_id set not null;

create index refresh_tokens_family_idx
    on refresh_tokens (family_id, created_at);
''',
)

write(
    "backend/internal/config/config.go",
    r'''
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
	AppEnv               string
	HTTPAddr             string
	LogLevel             string
	CORSAllowedOrigin    string
	PostgresDSN          string
	Redis                Redis
	JWTSecret            string
	AccessTokenTTL       time.Duration
	RefreshTokenTTL      time.Duration
	SessionCookieSecure  bool
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
''',
)

write(
    "backend/internal/httpx/middleware.go",
    r'''
package httpx

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/http"
	"runtime/debug"
	"strings"
	"time"
)

type contextKey string

const userIDKey contextKey = "user_id"

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			buf := make([]byte, 12)
			_, _ = rand.Read(buf)
			requestID = hex.EncodeToString(buf)
		}
		w.Header().Set("X-Request-ID", requestID)
		next.ServeHTTP(w, r)
	})
}

func Recover(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				logger.Error("panic recovered", slog.Any("panic", recovered), slog.String("stack", string(debug.Stack())))
				WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func AccessLog(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		logger.Info("http request", slog.String("method", r.Method), slog.String("path", r.URL.Path), slog.Duration("duration", time.Since(started)))
	})
}

func CORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (allowedOrigin == "*" || origin == allowedOrigin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID, X-CSRF-Token")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			if allowedOrigin != "*" {
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// SameOrigin rejects browser cross-site mutation requests before they reach an
// endpoint. Bearer-authenticated API calls are not ambiently authenticated, but
// this guard also covers login CSRF and provides defense in depth for cookie-backed
// refresh and logout endpoints.
func SameOrigin(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		if strings.EqualFold(r.Header.Get("Sec-Fetch-Site"), "cross-site") {
			WriteError(w, http.StatusForbidden, "cross_site_request", "cross-site request is not allowed")
			return
		}
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		if origin != "" && allowedOrigin != "*" && origin != allowedOrigin {
			WriteError(w, http.StatusForbidden, "origin_mismatch", "request origin is not allowed")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func Authenticate(parse func(string) (string, error), next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		parts := strings.Fields(header)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			WriteError(w, http.StatusUnauthorized, "unauthorized", "valid bearer token is required")
			return
		}
		userID, err := parse(parts[1])
		if err != nil {
			WriteError(w, http.StatusUnauthorized, "unauthorized", "valid bearer token is required")
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func UserID(ctx context.Context) (string, bool) {
	value, ok := ctx.Value(userIDKey).(string)
	return value, ok
}
''',
)

replace_once(
    "backend/internal/server/server.go",
    "authHandler := auth.NewHandler(authService)",
    "authHandler := auth.NewHandler(authService, auth.CookieConfig{Secure: cfg.SessionCookieSecure, RefreshTTL: cfg.RefreshTokenTTL})",
)
replace_once(
    "backend/internal/server/server.go",
    "\tvar handler http.Handler = mux\n\thandler = httpx.CORS(cfg.CORSAllowedOrigin, handler)",
    "\tvar handler http.Handler = mux\n\thandler = httpx.SameOrigin(cfg.CORSAllowedOrigin, handler)\n\thandler = httpx.CORS(cfg.CORSAllowedOrigin, handler)",
)

replace_once(
    ".env.example",
    "REFRESH_TOKEN_TTL=720h\n",
    "REFRESH_TOKEN_TTL=720h\nSESSION_COOKIE_SECURE=false\n",
)

write(
    "frontend/lib/auth-session.ts",
    r'''
import { apiUrl } from "./api";

export type User = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type AccessTokens = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type Session = {
  user: User;
  tokens: AccessTokens;
};

const CSRF_COOKIE_NAME = "lexigo_csrf";
const LEGACY_SESSION_KEY = "lexigo.session.v1";

export class SessionRefreshError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function cookieValue(cookieHeader: string, name: string): string {
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rawValue.join("="));
  }
  return "";
}

export function csrfTokenFromCookie(cookieHeader = typeof document === "undefined" ? "" : document.cookie): string {
  return cookieValue(cookieHeader, CSRF_COOKIE_NAME);
}

export function clearLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
}

export async function refreshSession(): Promise<Session> {
  const csrfToken = csrfTokenFromCookie();
  if (!csrfToken) throw new SessionRefreshError(401, "Session marker is missing");

  const response = await fetch(apiUrl("/api/v1/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  if (!response.ok) {
    throw new SessionRefreshError(response.status, `Session refresh failed with status ${response.status}`);
  }
  return (await response.json()) as Session;
}

export async function restoreSession(): Promise<Session | null> {
  clearLegacyAuthStorage();
  if (!csrfTokenFromCookie()) return null;
  return refreshSession();
}
''',
)

write(
    "frontend/components/lexigo-bootstrapped-app.tsx",
    r'''
"use client";

import { useEffect, useState } from "react";

import { restoreSession, SessionRefreshError, type Session } from "../lib/auth-session";
import { CalendarReminderIntegration } from "./calendar-reminder-integration";
import { EnhancedUIInteractions } from "./enhanced-ui-interactions";
import { LexigoPremiumApp } from "./lexigo-premium-app";

export function LexigoBootstrappedApp() {
  const [initialSession, setInitialSession] = useState<Session | null | undefined>(undefined);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function preflightSession() {
      try {
        const restored = await restoreSession();
        if (!cancelled) setInitialSession(restored);
      } catch (requestError) {
        if (cancelled) return;
        setInitialSession(null);
        if (requestError instanceof SessionRefreshError && (requestError.status === 401 || requestError.status === 403)) {
          setNotice("Сессия истекла. Войдите снова, чтобы продолжить обучение.");
        } else {
          setNotice("Не удалось восстановить сессию. Проверьте подключение к сети.");
        }
      }
    }

    void preflightSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (initialSession === undefined) {
    return (
      <main className="lx-bootstrap" aria-live="polite">
        <div className="lx-bootstrap-mark">L</div>
        <strong>LexiGo</strong>
        <span>Восстанавливаем сессию…</span>
      </main>
    );
  }

  return (
    <>
      <EnhancedUIInteractions />
      <CalendarReminderIntegration />
      {notice ? <div className="lx-session-notice" role="status">{notice}</div> : null}
      <LexigoPremiumApp initialSession={initialSession} />
    </>
  );
}
''',
)

premium_path = "frontend/components/lexigo-premium-app.tsx"
replace_once(
    premium_path,
    'import { apiUrl } from "../lib/api";\n',
    'import { apiUrl } from "../lib/api";\nimport { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";\n',
)
regex_replace(
    premium_path,
    r'type User = \{.*?type Session = \{\n  user: User;\n  tokens: TokenPair;\n\};\n\n',
    "",
)
replace_once(premium_path, 'const SESSION_KEY = "lexigo.session.v1";\n', "")
replace_once(
    premium_path,
    '  if (init.body) headers.set("Content-Type", "application/json");\n  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);\n  const response = await fetch(apiUrl(path), { ...init, headers });',
    '  if (init.body) headers.set("Content-Type", "application/json");\n  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);\n  const method = (init.method ?? "GET").toUpperCase();\n  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {\n    const csrfToken = csrfTokenFromCookie();\n    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);\n  }\n  const response = await fetch(apiUrl(path), { ...init, headers, credentials: "include" });',
)
replace_once(
    premium_path,
    '    const tokens = await requestJSON<TokenPair>("/api/v1/auth/refresh", {\n      method: "POST",\n      body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),\n    });\n    const refreshed = { ...current, tokens };\n    storeSession(refreshed);\n    return { activeSession: refreshed, data: await requestJSON<T>(path, init, refreshed.tokens.accessToken) };',
    '    const refreshed = await refreshSession();\n    return { activeSession: refreshed, data: await requestJSON<T>(path, init, refreshed.tokens.accessToken) };',
)
regex_replace(
    premium_path,
    r'function readSession\(\): Session \| null \{.*?function presentationKey',
    'function presentationKey',
)
replace_once(
    premium_path,
    'export function LexigoPremiumApp() {',
    'export function LexigoPremiumApp({ initialSession }: { initialSession: Session | null }) {',
)
replace_once(
    premium_path,
    '  const [session, setSession] = useState<Session | null>(null);',
    '  const [session, setSession] = useState<Session | null>(initialSession);',
)
replace_once(
    premium_path,
    '    const timer = window.setTimeout(() => setSession(readSession()), 0);\n    return () => {\n      window.removeEventListener("popstate", syncNavigation);\n      window.clearTimeout(timer);\n    };',
    '    return () => {\n      window.removeEventListener("popstate", syncNavigation);\n    };',
)
regex_replace(premium_path, r'^\s*storeSession\([^\n]*\);\n', "", expected=10)
regex_replace(
    premium_path,
    r'  async function logout\(\) \{.*?\n  \}\n\n  async function updateDailyGoal',
    r'''  async function logout() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      await requestJSON<void>("/api/v1/auth/logout", { method: "POST" });
      setSession(null);
      setProgress(null);
      setActiveLesson(null);
      setPhraseCatalog(TECHNICAL_PHRASES);
      setHydratedUserID("");
      clearLessonState();
      navigate({ view: "home" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось завершить выход");
    } finally {
      setBusy(false);
    }
  }

  async function updateDailyGoal''',
)

write(
    "frontend/lib/auth-session.test.ts",
    r'''
import { afterEach, describe, expect, it, vi } from "vitest";

import { cookieValue, csrfTokenFromCookie, refreshSession } from "./auth-session";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("auth session", () => {
  it("reads an encoded CSRF cookie without exposing the HttpOnly refresh token", () => {
    expect(cookieValue("other=1; lexigo_csrf=abc%2Fdef%3D; theme=dark", "lexigo_csrf")).toBe("abc/def=");
    expect(csrfTokenFromCookie("lexigo_csrf=csrf-token")).toBe("csrf-token");
  });

  it("refreshes with credentials and the double-submit CSRF header", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    const session = {
      user: { id: "user-1", email: "test@example.com", displayName: "Test", createdAt: "2026-01-01T00:00:00Z" },
      tokens: { accessToken: "access-token", tokenType: "Bearer", expiresIn: 900 },
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).resolves.toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/refresh", expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({ "X-CSRF-Token": "csrf-token" }),
    }));
  });

  it("never persists access or refresh tokens in browser storage", async () => {
    const { readFile } = await import("node:fs/promises");
    const files = [
      "components/lexigo-bootstrapped-app.tsx",
      "components/lexigo-premium-app.tsx",
      "lib/auth-session.ts",
    ];
    for (const file of files) {
      const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
      expect(source).not.toMatch(/localStorage\.setItem\([^\n]*(?:token|session)/i);
      expect(source).not.toMatch(/sessionStorage\.setItem\([^\n]*(?:token|session)/i);
      expect(source).not.toMatch(/indexedDB\.(?:add|put)/i);
    }
  });
});
''',
)

write(
    "backend/internal/httpx/middleware_test.go",
    r'''
package httpx

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSameOriginRejectsCrossSiteMutation(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) })
	handler := SameOrigin("https://lexigo.example", next)

	request := httptest.NewRequest(http.MethodPost, "https://api.lexigo.example/api/v1/auth/login", nil)
	request.Header.Set("Sec-Fetch-Site", "cross-site")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusForbidden)
	}
}

func TestCORSAllowsCredentialsOnlyForExplicitOrigin(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) })
	handler := CORS("https://lexigo.example", next)

	request := httptest.NewRequest(http.MethodOptions, "https://api.lexigo.example/api/v1/auth/refresh", nil)
	request.Header.Set("Origin", "https://lexigo.example")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Header().Get("Access-Control-Allow-Credentials") != "true" {
		t.Fatal("credentialed CORS header is missing")
	}
	if response.Header().Get("Access-Control-Allow-Headers") != "Authorization, Content-Type, X-Request-ID, X-CSRF-Token" {
		t.Fatalf("unexpected allowed headers: %q", response.Header().Get("Access-Control-Allow-Headers"))
	}
}
''',
)

write(
    "backend/integration/auth_flow_test.go",
    r'''
//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

const (
	refreshCookieName = "lexigo_refresh"
	csrfCookieName    = "lexigo_csrf"
)

type integrationTokenPair struct {
	AccessToken string `json:"accessToken"`
	TokenType   string `json:"tokenType"`
	ExpiresIn   int64  `json:"expiresIn"`
}

type integrationUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type integrationAuthResponse struct {
	User   integrationUser      `json:"user"`
	Tokens integrationTokenPair `json:"tokens"`
}

type httpResult struct {
	Status  int
	Body    []byte
	Cookies []*http.Cookie
}

func TestCompleteAuthenticationFlow(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
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
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		t.Fatalf("flush redis: %v", err)
	}

	cfg := config.Config{
		AppEnv:              "test",
		HTTPAddr:            ":0",
		LogLevel:            "error",
		CORSAllowedOrigin:   "https://test.local",
		PostgresDSN:         requiredEnv(t, "TEST_POSTGRES_DSN"),
		Redis:               config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret:           "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL:      15 * time.Minute,
		RefreshTokenTTL:     24 * time.Hour,
		SessionCookieSecure: true,
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewTLSServer(app.Handler())
	defer testServer.Close()

	deviceA := newClient(t, testServer)
	deviceB := newClient(t, testServer)
	email := fmt.Sprintf("integration-%d@example.com", time.Now().UnixNano())

	registeredResult := postJSON(t, deviceA, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": email, "password": "strong-password", "displayName": "Integration Test",
	}, "", http.StatusCreated)
	if strings.Contains(string(registeredResult.Body), "refreshToken") {
		t.Fatal("register response leaked the refresh token")
	}
	registered := decode[integrationAuthResponse](t, registeredResult.Body)
	if registered.Tokens.AccessToken == "" || registered.User.Email != email {
		t.Fatalf("unexpected register response: %+v", registered)
	}
	oldDeviceARefresh := requireSessionCookies(t, registeredResult.Cookies, true)

	var enrolledWords int
	if err := pg.QueryRow(ctx, `
		select count(*)
		from user_words
		join users on users.id = user_words.user_id
		where users.email = $1
	`, email).Scan(&enrolledWords); err != nil {
		t.Fatalf("count enrolled words: %v", err)
	}
	if enrolledWords != catalog.ExpectedCount {
		t.Fatalf("enrolled words = %d, want %d", enrolledWords, catalog.ExpectedCount)
	}

	getWithBearer(t, deviceA, testServer.URL+"/api/v1/me", registered.Tokens.AccessToken, http.StatusOK)

	withoutCSRF := postJSON(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, "", http.StatusForbidden)
	if !strings.Contains(string(withoutCSRF.Body), "csrf_failed") {
		t.Fatalf("missing CSRF error: %s", withoutCSRF.Body)
	}

	refreshedResult := postJSON(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, csrfFromJar(t, deviceA, testServer.URL), http.StatusOK)
	if strings.Contains(string(refreshedResult.Body), "refreshToken") {
		t.Fatal("refresh response leaked the refresh token")
	}
	refreshed := decode[integrationAuthResponse](t, refreshedResult.Body)
	if refreshed.Tokens.AccessToken == "" || refreshed.User.ID != registered.User.ID {
		t.Fatalf("unexpected refresh response: %+v", refreshed)
	}
	requireSessionCookies(t, refreshedResult.Cookies, true)

	loggedInResult := postJSON(t, deviceB, testServer.URL+"/api/v1/auth/login", map[string]string{
		"email": email, "password": "strong-password",
	}, "", http.StatusOK)
	loggedIn := decode[integrationAuthResponse](t, loggedInResult.Body)
	if loggedIn.Tokens.AccessToken == "" {
		t.Fatal("login response does not contain access token")
	}
	deviceBRefresh := requireSessionCookies(t, loggedInResult.Cookies, true)
	deviceBCSRF := csrfFromJar(t, deviceB, testServer.URL)

	currentDeviceACSRF := csrfFromJar(t, deviceA, testServer.URL)
	reuseOldRefresh(t, testServer, oldDeviceARefresh, currentDeviceACSRF, http.StatusUnauthorized)
	postJSON(t, deviceA, testServer.URL+"/api/v1/auth/refresh", nil, currentDeviceACSRF, http.StatusUnauthorized)

	// A reused token revokes only its device family. The independent login on device B remains valid.
	postJSON(t, deviceB, testServer.URL+"/api/v1/auth/refresh", nil, deviceBCSRF, http.StatusOK)

	logoutCSRF := csrfFromJar(t, deviceB, testServer.URL)
	logoutResult := postJSON(t, deviceB, testServer.URL+"/api/v1/auth/logout", nil, logoutCSRF, http.StatusNoContent)
	requireSessionCookies(t, logoutResult.Cookies, false)
	if hasCookie(deviceB, testServer.URL, refreshCookieName) || hasCookie(deviceB, testServer.URL, csrfCookieName) {
		t.Fatal("logout did not remove session cookies from the client jar")
	}
	reuseOldRefresh(t, testServer, deviceBRefresh, logoutCSRF, http.StatusUnauthorized)
}

func newClient(t *testing.T, testServer *httptest.Server) *http.Client {
	t.Helper()
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	client := testServer.Client()
	client.Jar = jar
	return client
}

func postJSON(t *testing.T, client *http.Client, endpoint string, payload any, csrf string, expectedStatus int) httpResult {
	t.Helper()
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			t.Fatal(err)
		}
		body = bytes.NewReader(encoded)
	}
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, body)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Accept", "application/json")
	if payload != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if csrf != "" {
		request.Header.Set("X-CSRF-Token", csrf)
	}
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != expectedStatus {
		t.Fatalf("POST %s status = %d, want %d, body = %s", endpoint, response.StatusCode, expectedStatus, responseBody)
	}
	return httpResult{Status: response.StatusCode, Body: responseBody, Cookies: response.Cookies()}
}

func decode[T any](t *testing.T, body []byte) T {
	t.Helper()
	var value T
	if err := json.Unmarshal(body, &value); err != nil {
		t.Fatalf("decode response: %v; body=%s", err, body)
	}
	return value
}

func requireSessionCookies(t *testing.T, cookies []*http.Cookie, active bool) string {
	t.Helper()
	var refreshValue string
	var refreshSeen, csrfSeen bool
	for _, cookie := range cookies {
		switch cookie.Name {
		case refreshCookieName:
			refreshSeen = true
			if active {
				if !cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/api/v1/auth" {
					t.Fatalf("insecure refresh cookie: %+v", cookie)
				}
				refreshValue = cookie.Value
			} else if cookie.MaxAge >= 0 {
				t.Fatalf("refresh cookie was not expired: %+v", cookie)
			}
		case csrfCookieName:
			csrfSeen = true
			if active {
				if cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/" {
					t.Fatalf("invalid CSRF cookie: %+v", cookie)
				}
			} else if cookie.MaxAge >= 0 {
				t.Fatalf("CSRF cookie was not expired: %+v", cookie)
			}
		}
	}
	if !refreshSeen || !csrfSeen {
		t.Fatalf("session cookies missing: %+v", cookies)
	}
	return refreshValue
}

func csrfFromJar(t *testing.T, client *http.Client, baseURL string) string {
	t.Helper()
	parsed, err := url.Parse(baseURL)
	if err != nil {
		t.Fatal(err)
	}
	for _, cookie := range client.Jar.Cookies(parsed) {
		if cookie.Name == csrfCookieName {
			return cookie.Value
		}
	}
	t.Fatal("CSRF cookie is missing")
	return ""
}

func hasCookie(client *http.Client, baseURL, name string) bool {
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return false
	}
	for _, cookie := range client.Jar.Cookies(parsed) {
		if cookie.Name == name {
			return true
		}
	}
	return false
}

func reuseOldRefresh(t *testing.T, testServer *httptest.Server, refreshToken, csrf string, expectedStatus int) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, testServer.URL+"/api/v1/auth/refresh", nil)
	if err != nil {
		t.Fatal(err)
	}
	request.AddCookie(&http.Cookie{Name: refreshCookieName, Value: refreshToken, Path: "/api/v1/auth"})
	request.AddCookie(&http.Cookie{Name: csrfCookieName, Value: csrf, Path: "/"})
	request.Header.Set("X-CSRF-Token", csrf)
	response, err := testServer.Client().Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != expectedStatus {
		body, _ := io.ReadAll(response.Body)
		t.Fatalf("reuse status = %d, want %d, body=%s", response.StatusCode, expectedStatus, body)
	}
}

func getWithBearer(t *testing.T, client *http.Client, endpoint, accessToken string, expectedStatus int) {
	t.Helper()
	request, err := http.NewRequestWithContext(context.Background(), http.MethodGet, endpoint, nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+accessToken)
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != expectedStatus {
		t.Fatalf("GET %s status = %d, want %d", endpoint, response.StatusCode, expectedStatus)
	}
}
''',
)

# Update the existing service unit-test fake to match the new Refresh signature expectations.
replace_once(
    "backend/internal/auth/service_test.go",
    'func (f *fakeRefresh) Revoke(context.Context, []byte) error { return nil }',
    'func (f *fakeRefresh) Revoke(context.Context, []byte) error { return nil }',
)

# The migration helper is intentionally removed in the generated commit.
(ROOT / "scripts/apply_issue_34.py").unlink(missing_ok=True)
(ROOT / ".github/workflows/apply-issue-34.yml").unlink(missing_ok=True)
