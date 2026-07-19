package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrAccountSecurityDisabled = errors.New("account security is not configured")
	ErrReauthenticationFailed  = errors.New("current password is invalid")
	ErrCurrentSessionNotFound  = errors.New("current session is unavailable")
)

const (
	AuditPasswordChanged      = "password_changed"
	AuditOtherSessionsRevoked = "other_sessions_revoked"
)

// AccountSession represents one refresh-token family, not an individual
// rotated token. Rotation therefore does not create duplicate devices in the
// account UI.
type AccountSession struct {
	ID         string    `json:"id"`
	Current    bool      `json:"current"`
	UserAgent  string    `json:"userAgent"`
	IPAddress  string    `json:"ipAddress,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	LastSeenAt time.Time `json:"lastSeenAt"`
	ExpiresAt  time.Time `json:"expiresAt"`
}

type AccountAuditEvent struct {
	ID        int64             `json:"id"`
	Type      string            `json:"type"`
	UserAgent string            `json:"userAgent"`
	IPAddress string            `json:"ipAddress,omitempty"`
	Metadata  map[string]string `json:"metadata"`
	CreatedAt time.Time         `json:"createdAt"`
}

// AccountSecurityRepository owns transactions that combine identity and
// refresh-session changes. Password updates and session revocation must never
// be split across independent repository calls.
type AccountSecurityRepository interface {
	ActiveSessions(ctx context.Context, userID string, currentTokenHash []byte, now time.Time) ([]AccountSession, error)
	ChangePasswordAndRevokeOtherSessions(
		ctx context.Context,
		userID string,
		currentTokenHash []byte,
		passwordHash string,
		now time.Time,
		userAgent,
		ip string,
	) error
	RevokeOtherSessions(
		ctx context.Context,
		userID string,
		currentTokenHash []byte,
		now time.Time,
		userAgent,
		ip string,
	) error
	RecentAccountAudit(ctx context.Context, userID string, limit int) ([]AccountAuditEvent, error)
}

type accountSecurityConfig struct {
	repository AccountSecurityRepository
}

func WithAccountSecurity(repository AccountSecurityRepository) ServiceOption {
	return func(service *Service) {
		service.accountSecurity = accountSecurityConfig{repository: repository}
	}
}

func (s *Service) AccountSessions(ctx context.Context, userID, refreshToken string) ([]AccountSession, error) {
	repository, tokenHash, err := s.accountSecurityContext(refreshToken)
	if err != nil {
		return nil, err
	}
	sessions, err := repository.ActiveSessions(ctx, userID, tokenHash, s.now().UTC())
	if err != nil {
		return nil, err
	}
	return sessions, nil
}

func (s *Service) ChangePassword(
	ctx context.Context,
	userID,
	refreshToken,
	currentPassword,
	newPassword,
	userAgent,
	ip string,
) error {
	repository, tokenHash, err := s.accountSecurityContext(refreshToken)
	if err != nil {
		return err
	}
	user, err := s.reauthenticate(ctx, userID, currentPassword)
	if err != nil {
		return err
	}
	if err := validatePassword(newPassword); err != nil {
		return err
	}
	if VerifyPassword(user.PasswordHash, newPassword) {
		return &FieldError{Field: "newPassword", Code: "password_unchanged", Message: "new password must differ from the current password"}
	}
	passwordHash, err := HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash new password: %w", err)
	}
	return repository.ChangePasswordAndRevokeOtherSessions(
		ctx,
		userID,
		tokenHash,
		passwordHash,
		s.now().UTC(),
		strings.TrimSpace(userAgent),
		strings.TrimSpace(ip),
	)
}

func (s *Service) RevokeOtherSessions(
	ctx context.Context,
	userID,
	refreshToken,
	currentPassword,
	userAgent,
	ip string,
) error {
	repository, tokenHash, err := s.accountSecurityContext(refreshToken)
	if err != nil {
		return err
	}
	if _, err := s.reauthenticate(ctx, userID, currentPassword); err != nil {
		return err
	}
	return repository.RevokeOtherSessions(
		ctx,
		userID,
		tokenHash,
		s.now().UTC(),
		strings.TrimSpace(userAgent),
		strings.TrimSpace(ip),
	)
}

func (s *Service) RecentAccountAudit(ctx context.Context, userID string, limit int) ([]AccountAuditEvent, error) {
	if s.accountSecurity.repository == nil {
		return nil, ErrAccountSecurityDisabled
	}
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.accountSecurity.repository.RecentAccountAudit(ctx, userID, limit)
}

func (s *Service) reauthenticate(ctx context.Context, userID, currentPassword string) (User, error) {
	user, err := s.users.ByID(ctx, userID)
	if err != nil {
		return User{}, err
	}
	if strings.TrimSpace(currentPassword) == "" || !VerifyPassword(user.PasswordHash, currentPassword) {
		return User{}, ErrReauthenticationFailed
	}
	return user, nil
}

func (s *Service) accountSecurityContext(refreshToken string) (AccountSecurityRepository, []byte, error) {
	if s.accountSecurity.repository == nil {
		return nil, nil, ErrAccountSecurityDisabled
	}
	tokenHash, err := HashRefreshToken(refreshToken)
	if err != nil {
		return nil, nil, ErrCurrentSessionNotFound
	}
	return s.accountSecurity.repository, tokenHash, nil
}
