package server

import (
	"log/slog"
	"net/http"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/health"
	"github.com/Dja-tiger/New-project/backend/internal/httpx"
	"github.com/Dja-tiger/New-project/backend/internal/ratelimit"
	"github.com/Dja-tiger/New-project/backend/internal/words"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Server struct{ handler http.Handler }

func New(cfg config.Config, logger *slog.Logger, pg *pgxpool.Pool, rdb *redis.Client) (*Server, error) {
	tokenManager, err := auth.NewTokenManager(cfg.JWTSecret, cfg.AccessTokenTTL)
	if err != nil {
		return nil, err
	}
	authRepository := auth.NewPostgresRepository(pg)
	authService := auth.NewService(authRepository, authRepository, tokenManager, cfg.RefreshTokenTTL)
	authHandler := auth.NewHandler(authService)
	healthHandler := health.NewHandler(pg, rdb)
	wordsHandler := words.NewHandler(words.NewRepository(pg))
	limiter := ratelimit.New(rdb)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", healthHandler.Live)
	mux.HandleFunc("GET /health/ready", healthHandler.Ready)
	mux.Handle("POST /api/v1/auth/register", limiter.Middleware(10, http.HandlerFunc(authHandler.Register)))
	mux.Handle("POST /api/v1/auth/login", limiter.Middleware(20, http.HandlerFunc(authHandler.Login)))
	mux.Handle("POST /api/v1/auth/refresh", limiter.Middleware(30, http.HandlerFunc(authHandler.Refresh)))
	mux.HandleFunc("POST /api/v1/auth/logout", authHandler.Logout)
	mux.Handle("GET /api/v1/me", httpx.Authenticate(authService.ParseAccess, http.HandlerFunc(authHandler.Me)))
	mux.Handle("GET /api/v1/words/due", httpx.Authenticate(authService.ParseAccess, http.HandlerFunc(wordsHandler.Due)))

	var handler http.Handler = mux
	handler = httpx.CORS(cfg.CORSAllowedOrigin, handler)
	handler = httpx.AccessLog(logger, handler)
	handler = httpx.RequestID(handler)
	handler = httpx.Recover(logger, handler)
	return &Server{handler: handler}, nil
}

func (s *Server) Handler() http.Handler { return s.handler }
