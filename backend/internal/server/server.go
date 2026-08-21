package server

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/account"
	"github.com/Dja-tiger/LexiGo/backend/internal/auth"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/health"
	"github.com/Dja-tiger/LexiGo/backend/internal/httpx"
	"github.com/Dja-tiger/LexiGo/backend/internal/learning"
	"github.com/Dja-tiger/LexiGo/backend/internal/moderation"
	"github.com/Dja-tiger/LexiGo/backend/internal/performance"
	"github.com/Dja-tiger/LexiGo/backend/internal/ratelimit"
	"github.com/Dja-tiger/LexiGo/backend/internal/scenarios"
	"github.com/Dja-tiger/LexiGo/backend/internal/words"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Server struct{ handler http.Handler }

type Options struct {
	PasswordResetSender auth.PasswordResetSender
	EmailChangeSender   account.EmailChangeSender
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
	resetTTL := cfg.PasswordResetTTL
	if resetTTL <= 0 {
		resetTTL = 30 * time.Minute
	}

	resetSender := options.PasswordResetSender
	if resetSender == nil {
		resetSender, err = configuredPasswordResetSender(cfg, logger)
		if err != nil {
			return nil, err
		}
	}
	emailChangeSender := options.EmailChangeSender
	if emailChangeSender == nil {
		emailChangeSender, err = configuredEmailChangeSender(cfg, logger)
		if err != nil {
			return nil, err
		}
	}

	authRepository := auth.NewPostgresRepository(pg)
	authOptions := []auth.ServiceOption{
		auth.WithPasswordReset(authRepository, resetSender, cfg.CORSAllowedOrigin, resetTTL),
		auth.WithAccountSecurity(authRepository),
		auth.WithLogger(logger),
	}
	if sender, ok := emailChangeSender.(auth.SecurityNotificationSender); ok {
		authOptions = append(authOptions, auth.WithSecurityNotifications(sender))
	}
	authService := auth.NewService(
		authRepository,
		authRepository,
		tokenManager,
		cfg.RefreshTokenTTL,
		authOptions...,
	)
	authHandler := auth.NewHandler(authService, auth.CookieConfig{
		Secure:     cfg.SessionCookieSecure,
		RefreshTTL: cfg.RefreshTokenTTL,
	}, logger)

	accountRepository := account.NewPostgresRepository(pg)
	accountOptions := []account.ServiceOption{
		account.WithLogger(logger),
		account.WithEmailChange(
			accountRepository,
			emailChangeSender,
			cfg.CORSAllowedOrigin,
			resetTTL,
		),
	}
	if sender, ok := emailChangeSender.(account.CriticalNotificationSender); ok {
		accountOptions = append(accountOptions, account.WithCriticalNotifications(sender))
	}
	accountService := account.NewService(accountRepository, accountOptions...)
	accountHandler := account.NewHandler(accountService, cfg.SessionCookieSecure)

	healthHandler := health.NewHandler(pg, rdb)
	wordsHandler := words.NewHandler(words.NewRepository(pg))
	learningRepository := learning.NewRepository(pg)
	learningHandler := learning.NewHandler(learningRepository)
	scenariosHandler := scenarios.NewHandler(scenarios.NewRepository(pg, learningRepository))
	performanceHandler := performance.NewHandler(performance.NewRepository(pg), logger)
	moderationRepository := moderation.NewRepository(pg)
	moderationHandler := moderation.NewHandler(
		moderationRepository,
		cfg.ContentModeration.AdminEmails,
		logger,
		cfg.ContentModeration.PendingTTL,
		cfg.ContentModeration.DecidedTTL,
	)
	limiter := ratelimit.New(rdb)
	cspReportHandler := limiter.MiddlewareFailClosed("csp-report", 60, http.HandlerFunc(performanceHandler.CSPReport))
	authenticated := func(handler http.HandlerFunc) http.Handler {
		return httpx.Authenticate(authService.ValidateAccess, handler)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", healthHandler.Live)
	mux.HandleFunc("GET /health/ready", healthHandler.Ready)
	mux.HandleFunc("GET /api/v1/catalog/metadata", wordsHandler.Metadata)
	mux.HandleFunc("GET /api/v1/catalog/words", wordsHandler.PublicAll)
	mux.HandleFunc("GET /api/v1/catalog/words/{wordID}", wordsHandler.PublicDetail)
	mux.Handle("POST /api/v1/performance/rum", limiter.MiddlewareFailClosed("performance", 120, http.HandlerFunc(performanceHandler.Report)))
	mux.Handle("POST /api/v1/product/journey", limiter.MiddlewareFailClosed("product-journey", 120, http.HandlerFunc(performanceHandler.Journey)))
	mux.Handle("POST /api/v1/auth/register", limiter.Middleware(10, http.HandlerFunc(authHandler.Register)))
	mux.Handle("POST /api/v1/auth/login", limiter.Middleware(20, http.HandlerFunc(authHandler.Login)))
	mux.Handle("POST /api/v1/auth/password-reset/request", limiter.Middleware(5, http.HandlerFunc(authHandler.RequestPasswordReset)))
	mux.Handle("POST /api/v1/auth/password-reset/confirm", limiter.Middleware(10, http.HandlerFunc(authHandler.ConfirmPasswordReset)))
	mux.Handle("POST /api/v1/auth/refresh", limiter.Middleware(30, http.HandlerFunc(authHandler.Refresh)))
	mux.HandleFunc("POST /api/v1/auth/logout", authHandler.Logout)
	mux.Handle("GET /api/v1/auth/sessions", authenticated(http.HandlerFunc(authHandler.AccountSessions)))
	mux.Handle("POST /api/v1/auth/sessions/revoke-others", limiter.Middleware(10, authenticated(http.HandlerFunc(authHandler.RevokeOtherSessions))))
	mux.Handle("PUT /api/v1/auth/password", limiter.Middleware(10, authenticated(http.HandlerFunc(authHandler.ChangePassword))))
	mux.Handle("GET /api/v1/auth/audit-events", authenticated(http.HandlerFunc(authHandler.AccountAudit)))
	mux.Handle("POST /api/v1/account/export", limiter.Middleware(5, authenticated(http.HandlerFunc(accountHandler.Export))))
	mux.Handle("DELETE /api/v1/account", limiter.Middleware(3, authenticated(http.HandlerFunc(accountHandler.Delete))))
	mux.Handle("POST /api/v1/account/email-change/request", limiter.Middleware(5, authenticated(http.HandlerFunc(accountHandler.RequestEmailChange))))
	mux.Handle("POST /api/v1/account/email-change/confirm", limiter.Middleware(10, http.HandlerFunc(accountHandler.ConfirmEmailChange)))
	mux.Handle("GET /api/v1/me", authenticated(http.HandlerFunc(authHandler.Me)))
	mux.Handle("GET /api/v1/words", authenticated(http.HandlerFunc(wordsHandler.All)))
	mux.Handle("GET /api/v1/words/due", authenticated(http.HandlerFunc(wordsHandler.Due)))
	mux.Handle("GET /api/v1/words/custom/export", authenticated(http.HandlerFunc(wordsHandler.ExportCustomGlossary)))
	mux.Handle("POST /api/v1/words/custom/import", authenticated(http.HandlerFunc(wordsHandler.ImportCustomGlossary)))
	mux.Handle("POST /api/v1/words/custom", authenticated(http.HandlerFunc(wordsHandler.CreateCustom)))
	mux.Handle("DELETE /api/v1/words/custom/{wordID}", authenticated(http.HandlerFunc(wordsHandler.DeleteCustom)))
	mux.Handle("GET /api/v1/words/{wordID}", authenticated(http.HandlerFunc(wordsHandler.Detail)))
	mux.Handle("POST /api/v1/phrases/custom", authenticated(http.HandlerFunc(wordsHandler.CreateCustomPhrase)))
	mux.Handle("DELETE /api/v1/phrases/custom/{phraseID}", authenticated(http.HandlerFunc(wordsHandler.DeleteCustomPhrase)))
	mux.Handle("GET /api/v1/phrases/{slug}", authenticated(http.HandlerFunc(wordsHandler.PhraseDetail)))
	mux.Handle("POST /api/v1/words/{wordID}/review", authenticated(http.HandlerFunc(learningHandler.ReviewWord)))
	mux.Handle("POST /api/v1/words/{wordID}/answer-suggestions", limiter.Middleware(10, authenticated(http.HandlerFunc(learningHandler.SubmitAnswerSuggestion))))
	mux.Handle("POST /api/v1/lessons/preview", authenticated(http.HandlerFunc(learningHandler.PreviewLesson)))
	mux.Handle("POST /api/v1/lessons", authenticated(http.HandlerFunc(learningHandler.CreateLesson)))
	mux.Handle("GET /api/v1/lessons/active", authenticated(http.HandlerFunc(learningHandler.ActiveLesson)))
	mux.Handle("DELETE /api/v1/lessons/{lessonID}", authenticated(http.HandlerFunc(learningHandler.DiscardLesson)))
	mux.Handle("POST /api/v1/lessons/{lessonID}/words/{wordID}/review", authenticated(http.HandlerFunc(learningHandler.ReviewLessonWord)))
	mux.Handle("POST /api/v1/lessons/{lessonID}/result-action", authenticated(http.HandlerFunc(learningHandler.RecordLessonResultAction)))
	mux.Handle("GET /api/v1/onboarding", authenticated(http.HandlerFunc(learningHandler.OnboardingStatus)))
	mux.Handle("POST /api/v1/onboarding/start", authenticated(http.HandlerFunc(learningHandler.StartOnboarding)))
	mux.Handle("POST /api/v1/onboarding/items/{wordID}/mark", authenticated(http.HandlerFunc(learningHandler.MarkOnboardingItem)))
	mux.Handle("POST /api/v1/onboarding/complete", authenticated(http.HandlerFunc(learningHandler.CompleteOnboarding)))
	mux.Handle("POST /api/v1/onboarding/skip", authenticated(http.HandlerFunc(learningHandler.SkipOnboarding)))
	mux.Handle("GET /api/v1/scenarios", authenticated(http.HandlerFunc(scenariosHandler.List)))
	mux.Handle("GET /api/v1/scenarios/{slug}", authenticated(http.HandlerFunc(scenariosHandler.Detail)))
	mux.Handle("POST /api/v1/scenarios/{slug}/attempts", authenticated(http.HandlerFunc(scenariosHandler.Start)))
	mux.Handle("GET /api/v1/scenario-attempts/{attemptID}", authenticated(http.HandlerFunc(scenariosHandler.Attempt)))
	mux.Handle("POST /api/v1/scenario-attempts/{attemptID}/pause", authenticated(http.HandlerFunc(scenariosHandler.Pause)))
	mux.Handle("POST /api/v1/scenario-attempts/{attemptID}/resume", authenticated(http.HandlerFunc(scenariosHandler.Resume)))
	mux.Handle("PUT /api/v1/scenario-attempts/{attemptID}/steps/{position}", authenticated(http.HandlerFunc(scenariosHandler.SubmitStep)))
	mux.Handle("GET /api/v1/progress", authenticated(http.HandlerFunc(learningHandler.Progress)))
	mux.Handle("PUT /api/v1/progress/goal", authenticated(http.HandlerFunc(learningHandler.SetDailyGoal)))
	mux.Handle("GET /api/v1/admin/answer-suggestions", authenticated(http.HandlerFunc(moderationHandler.List)))
	mux.Handle("GET /api/v1/admin/answer-suggestions/metrics", authenticated(http.HandlerFunc(moderationHandler.Metrics)))
	mux.Handle(
		"POST /api/v1/admin/answer-suggestions/{suggestionID}/decision",
		limiter.MiddlewareFailClosed(
			"moderation-decision",
			60,
			authenticated(http.HandlerFunc(moderationHandler.Decide)),
		),
	)

	// CSP report delivery may carry an opaque Origin ("null") even when the
	// document is same-origin. Keep only this credential-free, media-type-
	// constrained and rate-limited endpoint outside the CSRF origin guard.
	root := http.NewServeMux()
	root.Handle("POST /api/v1/security/csp-report", cspReportHandler)
	root.Handle("/", httpx.SameOrigin(cfg.CORSAllowedOrigin, mux))

	var handler http.Handler = root
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

func configuredEmailChangeSender(cfg config.Config, logger *slog.Logger) (account.EmailChangeSender, error) {
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
			return nil, fmt.Errorf("log email change delivery is forbidden outside local and test environments")
		}
		return account.NewLogEmailChangeSender(logger), nil
	case "smtp":
		return account.NewSMTPEmailChangeSender(account.SMTPEmailChangeConfig{
			Host:     cfg.SMTP.Host,
			Port:     cfg.SMTP.Port,
			Username: cfg.SMTP.Username,
			Password: cfg.SMTP.Password,
			From:     cfg.SMTP.From,
			Timeout:  cfg.SMTP.Timeout,
		})
	default:
		return nil, fmt.Errorf("unsupported email change delivery %q", delivery)
	}
}

func (s *Server) Handler() http.Handler { return s.handler }
