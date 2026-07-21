package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"
)

type Service struct {
	users                 UserRepository
	refresh               RefreshTokenRepository
	tokens                *TokenManager
	refreshTTL            time.Duration
	passwordReset         passwordResetConfig
	accountSecurity       accountSecurityConfig
	securityNotifications SecurityNotificationSender
	now                   func() time.Time
	logger                *slog.Logger
}

type accessValidationUnavailableError struct {
	cause error
}

func (e *accessValidationUnavailableError) Error() string {
	return "access credential validation is unavailable: " + e.cause.Error()
}

func (e *accessValidationUnavailableError) Unwrap() error {
	return e.cause
}

func (e *accessValidationUnavailableError) AuthenticationUnavailable() bool {
	return true
}

func NewService(
	users UserRepository,
	refresh RefreshTokenRepository,
	tokens *TokenManager,
	refreshTTL time.Duration,
	options ...ServiceOption,
) *Service {
	service := &Service{
		users:      users,
		refresh:    refresh,
		tokens:     tokens,
		refreshTTL: refreshTTL,
		now:        time.Now,
		logger:     slog.Default(),
	}
	for _, option := range options {
		option(service)
	}
	return service
}

func WithLogger(logger *slog.Logger) ServiceOption {
	return func(service *Service) {
		if logger != nil {
			service.logger = logger
		}
	}
}

func (s *Service) Register(ctx context.Context, email, password, displayName, userAgent, ip string) (User, TokenPair, error) {
	email, err := normalizeEmail(email)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	displayName, err = normalizeDisplayName(displayName)
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
	user, err := s.users.Create(ctx, email, hash, displayName)
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
	userID, rotatedAuthVersion, err := s.refresh.Rotate(ctx, oldHash, newHash, expiresAt, userAgent, ip)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	user, err := s.users.ByID(ctx, userID)
	if err != nil {
		return User{}, TokenPair{}, err
	}
	// Bind the response to the version locked by Rotate. A credential change
	// may commit between rotation and this read. Minting the newer version here
	// would let the just-rotated request escape that revocation. Returning the
	// rotated refresh token with a now-stale access token is safe: a preserved
	// current family can refresh again, while a revoked family remains closed.
	user.AuthVersion = rotatedAuthVersion
	pair, err := s.issueAccess(user)
	pair.RefreshToken = newPlain
	return user, pair, err
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

func (s *Service) ValidateAccess(ctx context.Context, token string) (string, error) {
	identity, err := s.tokens.ParseAccessIdentity(token)
	if err != nil {
		return "", ErrInvalidAccess
	}
	currentVersion, err := s.users.AuthVersion(ctx, identity.UserID)
	if errors.Is(err, ErrUserNotFound) {
		return "", ErrInvalidAccess
	}
	if err != nil {
		s.logger.ErrorContext(ctx, "access credential validation failed",
			"user_id", identity.UserID,
			"error", err,
		)
		return "", &accessValidationUnavailableError{cause: err}
	}
	if currentVersion != identity.AuthVersion {
		return "", ErrInvalidAccess
	}
	return identity.UserID, nil
}

func (s *Service) issuePair(ctx context.Context, user User, userAgent, ip string) (TokenPair, error) {
	pair, err := s.issueAccess(user)
	if err != nil {
		return TokenPair{}, err
	}
	refreshPlain, refreshHash, err := NewRefreshToken()
	if err != nil {
		return TokenPair{}, err
	}
	if err := s.refresh.Store(
		ctx,
		user.ID,
		user.AuthVersion,
		refreshHash,
		s.now().UTC().Add(s.refreshTTL),
		userAgent,
		ip,
	); err != nil {
		return TokenPair{}, err
	}
	pair.RefreshToken = refreshPlain
	return pair, nil
}

func (s *Service) issueAccess(user User) (TokenPair, error) {
	access, accessExpiry, err := s.tokens.IssueAccess(user)
	if err != nil {
		return TokenPair{}, err
	}
	return TokenPair{
		AccessToken: access,
		TokenType:   "Bearer",
		ExpiresIn:   int64(time.Until(accessExpiry).Seconds()),
	}, nil
}
