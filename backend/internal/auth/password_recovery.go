package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"
)

var (
	ErrInvalidPasswordReset  = errors.New("invalid or expired password reset token")
	ErrPasswordResetDisabled = errors.New("password reset is not configured")
)

// PasswordResetRepository stores only SHA-256 token digests. A successful
// reset must update the password and revoke active sessions atomically.
type PasswordResetRepository interface {
	ReplacePasswordReset(ctx context.Context, userID string, tokenHash []byte, expiresAt time.Time, userAgent, ip string) error
	ConsumePasswordReset(ctx context.Context, tokenHash []byte, passwordHash string, now time.Time) error
}

// PasswordResetSender delivers the one-time link outside the request body.
// Implementations must never persist or log the raw token in production.
type PasswordResetSender interface {
	SendPasswordReset(ctx context.Context, recipientEmail, displayName, resetURL string) error
}

type passwordResetConfig struct {
	repository PasswordResetRepository
	sender     PasswordResetSender
	origin     string
	ttl        time.Duration
}

type ServiceOption func(*Service)

func WithPasswordReset(
	repository PasswordResetRepository,
	sender PasswordResetSender,
	publicOrigin string,
	ttl time.Duration,
) ServiceOption {
	return func(service *Service) {
		service.passwordReset = passwordResetConfig{
			repository: repository,
			sender:     sender,
			origin:     strings.TrimSuffix(publicOrigin, "/"),
			ttl:        ttl,
		}
	}
}

func (s *Service) RequestPasswordReset(ctx context.Context, email, userAgent, ip string) error {
	if s.passwordReset.repository == nil || s.passwordReset.sender == nil || s.passwordReset.ttl <= 0 || s.passwordReset.origin == "" {
		return ErrPasswordResetDisabled
	}

	normalizedEmail, err := normalizeEmail(email)
	if err != nil {
		// Password reset requests intentionally accept malformed/non-existent
		// addresses without exposing account existence.
		return nil
	}
	user, err := s.users.ByEmail(ctx, normalizedEmail)
	if errors.Is(err, ErrUserNotFound) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("read password reset user: %w", err)
	}

	plain, hash, err := newPasswordResetToken()
	if err != nil {
		return fmt.Errorf("generate password reset token: %w", err)
	}
	if err := s.passwordReset.repository.ReplacePasswordReset(
		ctx,
		user.ID,
		hash,
		s.now().UTC().Add(s.passwordReset.ttl),
		userAgent,
		ip,
	); err != nil {
		return err
	}

	resetURL, err := passwordResetURL(s.passwordReset.origin, plain)
	if err != nil {
		return err
	}
	if err := s.passwordReset.sender.SendPasswordReset(ctx, user.Email, user.DisplayName, resetURL); err != nil {
		return fmt.Errorf("send password reset: %w", err)
	}
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	if s.passwordReset.repository == nil {
		return ErrPasswordResetDisabled
	}
	if err := validatePassword(newPassword); err != nil {
		return err
	}
	hash, err := hashPasswordResetToken(token)
	if err != nil {
		return ErrInvalidPasswordReset
	}
	passwordHash, err := HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash reset password: %w", err)
	}
	if err := s.passwordReset.repository.ConsumePasswordReset(ctx, hash, passwordHash, s.now().UTC()); err != nil {
		return err
	}
	return nil
}

func newPasswordResetToken() (string, []byte, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", nil, err
	}
	plain := base64.RawURLEncoding.EncodeToString(value)
	digest := sha256.Sum256([]byte(plain))
	return plain, digest[:], nil
}

func hashPasswordResetToken(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil || len(decoded) != 32 {
		return nil, ErrInvalidPasswordReset
	}
	digest := sha256.Sum256([]byte(value))
	return digest[:], nil
}

func passwordResetURL(origin, token string) (string, error) {
	target, err := url.Parse(origin)
	if err != nil || target.Scheme == "" || target.Host == "" {
		return "", fmt.Errorf("invalid password reset origin")
	}
	query := target.Query()
	query.Set("view", "profile")
	query.Set("reset_token", token)
	target.RawQuery = query.Encode()
	target.Fragment = ""
	return target.String(), nil
}
