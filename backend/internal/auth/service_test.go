package auth

import (
	"context"
	"errors"
	"testing"
	"time"
)

type fakeUsers struct {
	created User
	byEmail User
	byID    User
	err     error
}

func (f *fakeUsers) Create(context.Context, string, string, string) (User, error) {
	return f.created, f.err
}
func (f *fakeUsers) ByEmail(context.Context, string) (User, error) { return f.byEmail, f.err }
func (f *fakeUsers) ByID(context.Context, string) (User, error)    { return f.byID, f.err }

type fakeRefresh struct {
	stored    bool
	rotateErr error
}

func (f *fakeRefresh) Store(context.Context, string, []byte, time.Time, string, string) error {
	f.stored = true
	return nil
}
func (f *fakeRefresh) Rotate(context.Context, []byte, []byte, time.Time, string, string) (string, error) {
	return "user-1", f.rotateErr
}
func (f *fakeRefresh) Revoke(context.Context, []byte) error { return nil }

func TestRegisterIssuesTokens(t *testing.T) {
	manager, _ := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	users := &fakeUsers{created: User{ID: "user-1", Email: "test@example.com"}}
	refresh := &fakeRefresh{}
	service := NewService(users, refresh, manager, 30*24*time.Hour)

	user, pair, err := service.Register(context.Background(), "TEST@example.com", "strong-password", "Tester", "", "")
	if err != nil {
		t.Fatal(err)
	}
	if user.ID != "user-1" || pair.AccessToken == "" || pair.RefreshToken == "" || !refresh.stored {
		t.Fatalf("unexpected result: user=%+v pair=%+v stored=%v", user, pair, refresh.stored)
	}
}

func TestLoginHidesUserEnumeration(t *testing.T) {
	manager, _ := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	service := NewService(&fakeUsers{err: ErrUserNotFound}, &fakeRefresh{}, manager, time.Hour)
	_, _, err := service.Login(context.Background(), "missing@example.com", "strong-password", "", "")
	if !errors.Is(err, ErrInvalidLogin) {
		t.Fatalf("expected ErrInvalidLogin, got %v", err)
	}
}
