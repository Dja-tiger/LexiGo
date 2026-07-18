package server

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/health"
	"github.com/Dja-tiger/New-project/backend/internal/httpx"
	"github.com/Dja-tiger/New-project/backend/internal/learning"
	"github.com/Dja-tiger/New-project/backend/internal/ratelimit"
	"github.com/Dja-tiger/New-project/backend/internal/words"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Server struct{ handler http.Handler }

type Options struct {
	PasswordResetSender auth.PasswordResetSender
}

func New(cfg config.Config, logger *slog.Logger, pg *pgxpool.Pool, rdb *redis.Client) (*Server, error) {
	return NewWithOptions(cfg, logger, pg, rdb, Options{})
}

func NewWithOptions(
	cfg config.Config,
	logger *slog.Logger,
	pg *pgxpool.Pool,
	rdb *redis.Client,
	options Options,
) (*Server, error) {
	tokenManager, err := auth.NewTokenManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	if err != nil {
		return nil, err
	}
	authRepository := auth.NewPostgresRepository(pg)
	resetSender := options.PasswordResetSender
	if resetSender == nil {
		resetSender, err = configuredPasswordResetSender(cfg, logger)
		if err != nil {
			return nil, err
		}
	}
	resetTTL := cfg.PasswordResetTTL
	if resetTTL <= 0 {
		resetTTL = 30 * time.Minute
	}
	authService := auth.NewService(
		authRepository,
		authRepository,
		tokenManager,
		cfg.RefreshTokenTTL,
		auth.WithPasswordReset(authRepository, resetSender, cfg.CORSAllowedOrigin, resetTTL),
	)
	authHandler := auth.NewHandler(authService, auth.CookieConfig{
		Secure:     cfg.SessionCookieSecure,
		RefreshTTL: cfg.RefreshTokenTTL,
	}, logger)
	healthHandler := health.NewHandler(pg, rdb)
	wordsHandler := words.NewHandler(words.NewRepository(pg))
	learningHandler := learning.NewHandler(learning.NewRepository(pg))
	limiter := ratelimit.New(rdb)
	authenticated := func(handler http.HandlerFunc) http.Handler {
		return httpx.Authenticate(authService.ParseAccess, handler)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", healthHandler.Live)
	mux.HandleFunc("GET /health/ready", healthHandler.Ready)
	mux.HandleFunc("GET /api/v1/catalog/metadata", wordsHandler.Metadata)
	mux.Handle("POST /api/v1/auth/register", limiter.Middleware(10, http.HandlerFunc(authHandler.Register)))
	mux.Handle("POST /api/v1/auth/login", limiter.Middleware(20, http.HandlerFunc(authHandler.Login)))
	mux.Handle("POST /api/v1/auth/password-reset/request", limiter.Middleware(5, http.HandlerFunc(authHandler.RequestPasswordReset)))
	mux.Handle("POST /api/v1/auth/password-reset/confirm", limiter.Middleware(10, http.HandlerFunc(authHandler.ConfirmPasswordReset)))
	mux.Handle("POST /api/v1/auth/refresh", limiter.Middleware(30, http.HandlerFunc(authHandler.Refresh)))
	mux.HandleFunc("POST /api/v1/auth/logout", authHandler.Logout)
	mux.Handle("GET /api/v1/me", authenticated(http.HandlerFunc(authHandler.Me)))
	mux.Handle("GET /api/v1/words", authenticated(http.HandlerFunc(wordsHandler.All)))
	mux.Handle("GET /api/v1/words/due", authenticated(http.HandlerFunc(wordsHandler.Due)))
	mux.Handle("POST /api/v1/words/{wordID}/review", authenticated(http.HandlerFunc(learningHandler.ReviewWord)))
	mux.Handle("POST /api/v1/lessons/preview", authenticated(http.HandlerFunc(learningHandler.PreviewLesson)))
	mux.Handle("POST /api/v1/lessons", authenticated(http.HandlerFunc(learningHandler.CreateLesson)))
	mux.Handle("GET /api/v1/lessons/active", authenticated(http.HandlerFunc(learningHandler.ActiveLesson)))
	mux.Handle("DELETE /api/v1/lessons/{lessonID}", authenticated(http.HandlerFunc(learningHandler.DiscardLesson)))
	mux.Handle("POST /api/v1/lessons/{lessonID}/words/{wordID}/review", authenticated(http.HandlerFunc(learningHandler.ReviewLessonWord)))
	mux.Handle("GET /api/v1/progress", authenticated(http.HandlerFunc(learningHandler.Progress)))
	mux.Handle("PUT /api/v1/progress/goal", authenticated(http.HandlerFunc(learningHandler.SetDailyGoal)))

	var handler http.Handler = mux
	handler = httpx.SameOrigin(cfg.CORSAllowedOrigin, handler)
	handler = httpx.CORS(cfg.CORSAllowedOrigin, handler)
	handler = httpx.AccessLog(logger, handler)
	handler = httpx.RequestID(handler)
	handler = httpx.Recover(logger, handler)
	return &Server{handler: handler}, nil
}

func configuredPasswordResetSender(cfg config.Config, logger *slog.Logger) (auth.PasswordResetSender, error) {
	delivery := cfg.PasswordResetDelivery
	if delivery == "" {
		if cfg.AppEnv == "local" || cfg.AppEnv == "test" {
			delivery = "log"
		} else {
			delivery = "smtp"
		}
	}
	switch delivery {
	case "log":
		if cfg.AppEnv != "local" && cfg.AppEnv != "test" {
			return nil, fmt.Errorf("log password reset delivery is forbidden outside local and test environments")
		}
		return auth.NewLogPasswordResetSender(logger), nil
	case "smtp":
		return auth.NewSMTPPasswordResetSender(auth.SMTPPasswordResetConfig{
			Host:     cfg.SMTP.Host,
			Port:     cfg.SMTP.Port,
			Username: cfg.SMTP.Username,
			Password: cfg.SMTP.Password,
			From:     cfg.SMTP.From,
			Timeout:  cfg.SMTP.Timeout,
		})
	default:
		return nil, fmt.Errorf("unsupported password reset delivery %q", delivery)
	}
}

func (s *Server) Handler() http.Handler { return s.handler }
