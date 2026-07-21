package auth

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

type atomicUsers struct {
	version atomic.Int64
}

func (f *atomicUsers) Create(context.Context, string, string, string) (User, error) {
	return User{}, errors.New("not implemented")
}
func (f *atomicUsers) ByEmail(context.Context, string) (User, error) {
	return User{}, errors.New("not implemented")
}
func (f *atomicUsers) ByID(context.Context, string) (User, error) {
	return User{}, errors.New("not implemented")
}
func (f *atomicUsers) AuthVersion(context.Context, string) (int64, error) {
	return f.version.Load(), nil
}

type fakeUsers struct {
	created        User
	byEmail        User
	byID           User
	authVersion    int64
	authVersionErr error
	err            error
}

func (f *fakeUsers) Create(context.Context, string, string, string) (User, error) {
	return f.created, f.err
}
func (f *fakeUsers) ByEmail(context.Context, string) (User, error) { return f.byEmail, f.err }
func (f *fakeUsers) ByID(context.Context, string) (User, error)    { return f.byID, f.err }
func (f *fakeUsers) AuthVersion(context.Context, string) (int64, error) {
	if f.authVersionErr != nil {
		return 0, f.authVersionErr
	}
	if f.authVersion != 0 {
		return f.authVersion, nil
	}
	return f.byID.AuthVersion, f.err
}

type fakeRefresh struct {
	stored        bool
	storedVersion int64
	rotateVersion int64
	rotateErr     error
}

func (f *fakeRefresh) Store(_ context.Context, _ string, authVersion int64, _ []byte, _ time.Time, _, _ string) error {
	f.stored = true
	f.storedVersion = authVersion
	return nil
}
func (f *fakeRefresh) Rotate(context.Context, []byte, []byte, time.Time, string, string) (string, int64, error) {
	version := f.rotateVersion
	if version == 0 {
		version = 1
	}
	return "user-1", version, f.rotateErr
}
func (f *fakeRefresh) Revoke(context.Context, []byte) error { return nil }

func TestRegisterIssuesTokens(t *testing.T) {
	manager, _ := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	users := &fakeUsers{created: User{ID: "user-1", Email: "test@example.com", AuthVersion: 1}}
	refresh := &fakeRefresh{}
	service := NewService(users, refresh, manager, 30*24*time.Hour)

	user, pair, err := service.Register(context.Background(), "TEST@example.com", "strong-password", "Tester", "", "")
	if err != nil {
		t.Fatal(err)
	}
	if user.ID != "user-1" || pair.AccessToken == "" || pair.RefreshToken == "" || !refresh.stored || refresh.storedVersion != 1 {
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

func TestValidateAccessRejectsCredentialVersionMismatch(t *testing.T) {
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	token, _, err := manager.IssueAccess(User{ID: "user-1", Email: "test@example.com", AuthVersion: 3})
	if err != nil {
		t.Fatal(err)
	}
	users := &fakeUsers{authVersion: 3}
	service := NewService(users, &fakeRefresh{}, manager, time.Hour)
	if userID, err := service.ValidateAccess(context.Background(), token); err != nil || userID != "user-1" {
		t.Fatalf("valid access = %q, %v", userID, err)
	}
	users.authVersion = 4
	if _, err := service.ValidateAccess(context.Background(), token); !errors.Is(err, ErrInvalidAccess) {
		t.Fatalf("expected stale credential version rejection, got %v", err)
	}
}

func TestValidateAccessMarksRepositoryFailureUnavailable(t *testing.T) {
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	token, _, err := manager.IssueAccess(User{ID: "user-1", Email: "test@example.com", AuthVersion: 1})
	if err != nil {
		t.Fatal(err)
	}
	service := NewService(
		&fakeUsers{authVersionErr: context.DeadlineExceeded},
		&fakeRefresh{},
		manager,
		time.Hour,
	)
	_, err = service.ValidateAccess(context.Background(), token)
	var unavailable interface{ AuthenticationUnavailable() bool }
	if !errors.As(err, &unavailable) || !unavailable.AuthenticationUnavailable() {
		t.Fatalf("expected fail-closed unavailable error, got %v", err)
	}
}

func TestValidateAccessConcurrentCredentialVersionChange(t *testing.T) {
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	token, _, err := manager.IssueAccess(User{ID: "user-1", Email: "test@example.com", AuthVersion: 1})
	if err != nil {
		t.Fatal(err)
	}
	users := &atomicUsers{}
	users.version.Store(1)
	service := NewService(users, &fakeRefresh{}, manager, time.Hour)

	start := make(chan struct{})
	var workers sync.WaitGroup
	for worker := 0; worker < 8; worker++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			<-start
			for attempt := 0; attempt < 250; attempt++ {
				_, _ = service.ValidateAccess(context.Background(), token)
			}
		}()
	}
	close(start)
	users.version.Store(2)
	workers.Wait()

	for attempt := 0; attempt < 100; attempt++ {
		if _, err := service.ValidateAccess(context.Background(), token); !errors.Is(err, ErrInvalidAccess) {
			t.Fatalf("post-change validation %d did not reject the old token: %v", attempt, err)
		}
	}
}

func TestRefreshRaceCannotMintNewCredentialVersion(t *testing.T) {
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	users := &fakeUsers{
		byID:        User{ID: "user-1", Email: "test@example.com", AuthVersion: 2},
		authVersion: 2,
	}
	service := NewService(users, &fakeRefresh{rotateVersion: 1}, manager, time.Hour)
	_, pair, err := service.Refresh(context.Background(), "old-refresh", "browser", "127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	if pair.RefreshToken == "" {
		t.Fatal("the rotated refresh token must still reach a preserved current family")
	}
	identity, err := manager.ParseAccessIdentity(pair.AccessToken)
	if err != nil || identity.AuthVersion != 1 {
		t.Fatalf("race response minted the wrong credential version: %+v, %v", identity, err)
	}
	if _, err := service.ValidateAccess(context.Background(), pair.AccessToken); !errors.Is(err, ErrInvalidAccess) {
		t.Fatalf("race response access token must be stale after version 2 commits: %v", err)
	}
}
