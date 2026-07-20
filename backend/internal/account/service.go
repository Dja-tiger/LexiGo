package account

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
)

var (
	ErrReauthenticationFailed  = errors.New("current password is invalid")
	ErrEmailConfirmationFailed = errors.New("account email confirmation does not match")
	ErrAccountChanged          = errors.New("account credentials changed during the operation")
)

type PrivacyRepository interface {
	Repository
	Delete(ctx context.Context, userID, expectedPasswordHash string) error
}

type Service struct {
	repository PrivacyRepository
	now        func() time.Time
}

func NewService(repository PrivacyRepository) *Service {
	return &Service{repository: repository, now: time.Now}
}

func (s *Service) Export(ctx context.Context, userID, currentPassword string) (ExportData, error) {
	identity, err := s.repository.Identity(ctx, userID)
	if err != nil {
		return ExportData{}, err
	}
	if !auth.VerifyPassword(identity.PasswordHash, currentPassword) {
		return ExportData{}, ErrReauthenticationFailed
	}
	return s.repository.Export(ctx, identity, s.now().UTC())
}

func (s *Service) Delete(
	ctx context.Context,
	userID,
	currentPassword,
	confirmationEmail string,
) error {
	identity, err := s.repository.Identity(ctx, userID)
	if err != nil {
		return err
	}
	if !auth.VerifyPassword(identity.PasswordHash, currentPassword) {
		return ErrReauthenticationFailed
	}
	if !strings.EqualFold(strings.TrimSpace(confirmationEmail), identity.Email) {
		return ErrEmailConfirmationFailed
	}
	return s.repository.Delete(ctx, identity.ID, identity.PasswordHash)
}
