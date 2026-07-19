package account

import (
	"context"
	"errors"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
)

var ErrReauthenticationFailed = errors.New("current password is invalid")

type Service struct {
	repository Repository
	now        func() time.Time
}

func NewService(repository Repository) *Service {
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
