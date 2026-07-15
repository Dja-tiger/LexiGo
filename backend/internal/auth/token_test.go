package auth

import (
	"errors"
	"testing"
	"time"
)

func TestAccessTokenRoundTripAndExpiry(t *testing.T) {
	manager, err := NewTokenManager("01234567890123456789012345678901", time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Date(2026, 7, 16, 0, 0, 0, 0, time.UTC)
	manager.now = func() time.Time { return now }

	token, _, err := manager.IssueAccess(User{ID: "user-1", Email: "test@example.com"})
	if err != nil {
		t.Fatal(err)
	}
	id, err := manager.ParseAccess(token)
	if err != nil || id != "user-1" {
		t.Fatalf("ParseAccess() = %q, %v", id, err)
	}

	manager.now = func() time.Time { return now.Add(2 * time.Minute) }
	if _, err := manager.ParseAccess(token); !errors.Is(err, ErrInvalidAccess) {
		t.Fatalf("expected expiry error, got %v", err)
	}
}

func TestRefreshTokenHashIsStable(t *testing.T) {
	plain, hash, err := NewRefreshToken()
	if err != nil {
		t.Fatal(err)
	}
	recomputed, err := HashRefreshToken(plain)
	if err != nil {
		t.Fatal(err)
	}
	if string(hash) != string(recomputed) {
		t.Fatal("refresh token hash mismatch")
	}
}
