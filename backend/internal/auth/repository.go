package auth

import (
	"context"
	"errors"
	"time"
)

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrEmailTaken     = errors.New("email already registered")
	ErrInvalidRefresh = errors.New("invalid refresh token")
	ErrInvalidLogin   = errors.New("invalid email or password")
	ErrInvalidAccess  = errors.New("invalid access token")
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
