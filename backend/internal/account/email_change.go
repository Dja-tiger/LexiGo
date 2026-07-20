package account

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/mail"
	"net/url"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
)

var (
	ErrEmailChangeDisabled = errors.New("email change is not configured")
	ErrInvalidEmailChange  = errors.New("invalid or expired email change token")
	ErrEmailInvalid        = errors.New("new email is invalid")
	ErrEmailUnchanged      = errors.New("new email matches the current email")
	ErrEmailTaken          = errors.New("email is already registered")
)

const emailChangeTokenBytes = 32

type EmailChangeRepository interface {
	ReplaceEmailChange(
		ctx context.Context,
		userID,
		oldEmail,
		newEmail string,
		tokenHash []byte,
		createdAt,
		expiresAt time.Time,
		userAgent,
		ip string,
	) error
	CancelEmailChange(ctx context.Context, tokenHash []byte, cancelledAt time.Time) error
	ConsumeEmailChange(
		ctx context.Context,
		tokenHash []byte,
		confirmedAt time.Time,
		userAgent,
		ip string,
	) (EmailChangeResult, error)
}

type EmailChangeSender interface {
	SendEmailChangeVerification(ctx context.Context, recipientEmail, displayName, verificationURL string) error
	SendEmailChangedNotification(ctx context.Context, recipientEmail, displayName, newEmail string) error
}

type EmailChangeResult struct {
	UserID      string
	OldEmail    string
	NewEmail    string
	DisplayName string
}

type emailChangeConfig struct {
	repository EmailChangeRepository
	sender     EmailChangeSender
	origin     string
	ttl        time.Duration
}

type ServiceOption func(*Service)

func WithEmailChange(
	repository EmailChangeRepository,
	sender EmailChangeSender,
	publicOrigin string,
	ttl time.Duration,
) ServiceOption {
	return func(service *Service) {
		service.emailChange = emailChangeConfig{
			repository: repository,
			sender:     sender,
			origin:     strings.TrimSuffix(strings.TrimSpace(publicOrigin), "/"),
			ttl:        ttl,
		}
	}
}

func (s *Service) RequestEmailChange(
	ctx context.Context,
	userID,
	currentPassword,
	newEmail,
	userAgent,
	ip string,
) error {
	configuration := s.emailChange
	if configuration.repository == nil || configuration.sender == nil || configuration.origin == "" || configuration.ttl <= 0 {
		return ErrEmailChangeDisabled
	}

	identity, err := s.repository.Identity(ctx, userID)
	if err != nil {
		return err
	}
	if !auth.VerifyPassword(identity.PasswordHash, currentPassword) {
		return ErrReauthenticationFailed
	}

	normalizedEmail, err := normalizeEmailChange(newEmail)
	if err != nil {
		return err
	}
	if strings.EqualFold(normalizedEmail, identity.Email) {
		return ErrEmailUnchanged
	}

	plainToken, tokenHash, err := newEmailChangeToken()
	if err != nil {
		return fmt.Errorf("generate email change token: %w", err)
	}
	now := s.now().UTC()
	if err := configuration.repository.ReplaceEmailChange(
		ctx,
		identity.ID,
		identity.Email,
		normalizedEmail,
		tokenHash,
		now,
		now.Add(configuration.ttl),
		strings.TrimSpace(userAgent),
		strings.TrimSpace(ip),
	); err != nil {
		return err
	}

	verificationURL, err := emailChangeURL(configuration.origin, plainToken)
	if err != nil {
		_ = configuration.repository.CancelEmailChange(ctx, tokenHash, s.now().UTC())
		return err
	}
	if err := configuration.sender.SendEmailChangeVerification(
		ctx,
		normalizedEmail,
		identity.DisplayName,
		verificationURL,
	); err != nil {
		cancelErr := configuration.repository.CancelEmailChange(ctx, tokenHash, s.now().UTC())
		if cancelErr != nil {
			return fmt.Errorf("send email change verification: %w; cancel token: %v", err, cancelErr)
		}
		return fmt.Errorf("send email change verification: %w", err)
	}
	return nil
}

func (s *Service) ConfirmEmailChange(
	ctx context.Context,
	token,
	userAgent,
	ip string,
) (EmailChangeResult, error) {
	configuration := s.emailChange
	if configuration.repository == nil || configuration.sender == nil {
		return EmailChangeResult{}, ErrEmailChangeDisabled
	}

	tokenHash, err := hashEmailChangeToken(token)
	if err != nil {
		return EmailChangeResult{}, ErrInvalidEmailChange
	}
	result, err := configuration.repository.ConsumeEmailChange(
		ctx,
		tokenHash,
		s.now().UTC(),
		strings.TrimSpace(userAgent),
		strings.TrimSpace(ip),
	)
	if err != nil {
		return EmailChangeResult{}, err
	}

	// The identity transaction has already committed. Notification delivery must
	// not make the client retry the one-time token or report that the email was
	// unchanged. Delivery errors are intentionally returned separately through
	// the service logger and the successful result remains authoritative.
	if err := configuration.sender.SendEmailChangedNotification(
		ctx,
		result.OldEmail,
		result.DisplayName,
		result.NewEmail,
	); err != nil {
		s.logger.ErrorContext(ctx, "email change notification failed",
			"user_id", result.UserID,
			"error", err,
		)
	}
	return result, nil
}

func normalizeEmailChange(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	parsed, err := mail.ParseAddress(value)
	if err != nil || parsed.Address != value {
		return "", ErrEmailInvalid
	}
	return value, nil
}

func newEmailChangeToken() (string, []byte, error) {
	value := make([]byte, emailChangeTokenBytes)
	if _, err := rand.Read(value); err != nil {
		return "", nil, err
	}
	plain := base64.RawURLEncoding.EncodeToString(value)
	digest := sha256.Sum256([]byte(plain))
	return plain, digest[:], nil
}

func hashEmailChangeToken(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil || len(decoded) != emailChangeTokenBytes {
		return nil, ErrInvalidEmailChange
	}
	digest := sha256.Sum256([]byte(value))
	return digest[:], nil
}

func emailChangeURL(origin, token string) (string, error) {
	target, err := url.Parse(origin)
	if err != nil || target.Scheme == "" || target.Host == "" {
		return "", fmt.Errorf("invalid email change origin")
	}
	target.Path = "/profile"
	target.RawQuery = ""
	fragment := url.Values{}
	fragment.Set("email_change_token", token)
	target.Fragment = fragment.Encode()
	return target.String(), nil
}
