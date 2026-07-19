package auth

import (
	"context"
	"errors"
	"testing"
	"time"
)

type fakeAccountSecurity struct {
	sessions            []AccountSession
	audit               []AccountAuditEvent
	changedPasswordHash string
	changedTokenHash    []byte
	revokedTokenHash    []byte
	changeCalls         int
	revokeCalls         int
	err                 error
}

func (f *fakeAccountSecurity) ActiveSessions(
	context.Context,
	string,
	[]byte,
	time.Time,
) ([]AccountSession, error) {
	return f.sessions, f.err
}

func (f *fakeAccountSecurity) ChangePasswordAndRevokeOtherSessions(
	_ context.Context,
	_ string,
	currentTokenHash []byte,
	passwordHash string,
	_ time.Time,
	_, _ string,
) error {
	f.changeCalls++
	f.changedPasswordHash = passwordHash
	f.changedTokenHash = append([]byte(nil), currentTokenHash...)
	return f.err
}

func (f *fakeAccountSecurity) RevokeOtherSessions(
	_ context.Context,
	_ string,
	currentTokenHash []byte,
	_ time.Time,
	_, _ string,
) error {
	f.revokeCalls++
	f.revokedTokenHash = append([]byte(nil), currentTokenHash...)
	return f.err
}

func (f *fakeAccountSecurity) RecentAccountAudit(context.Context, string, int) ([]AccountAuditEvent, error) {
	return f.audit, f.err
}

func accountSecurityService(t *testing.T, password string, repository *fakeAccountSecurity) *Service {
	t.Helper()
	passwordHash, err := HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	return NewService(
		&fakeUsers{byID: User{ID: "user-1", Email: "user@example.com", PasswordHash: passwordHash}},
		&fakeRefresh{},
		manager,
		30*24*time.Hour,
		WithAccountSecurity(repository),
	)
}

func TestChangePasswordRequiresCurrentPassword(t *testing.T) {
	repository := &fakeAccountSecurity{}
	service := accountSecurityService(t, "current-password", repository)

	err := service.ChangePassword(
		context.Background(),
		"user-1",
		"refresh-token",
		"incorrect-password",
		"new-secure-password",
		"browser",
		"127.0.0.1",
	)
	if !errors.Is(err, ErrReauthenticationFailed) {
		t.Fatalf("expected ErrReauthenticationFailed, got %v", err)
	}
	if repository.changeCalls != 0 {
		t.Fatalf("repository must not be called after failed reauthentication: %d", repository.changeCalls)
	}
}

func TestChangePasswordHashesNewPasswordAndPreservesCurrentFamily(t *testing.T) {
	repository := &fakeAccountSecurity{}
	service := accountSecurityService(t, "current-password", repository)

	err := service.ChangePassword(
		context.Background(),
		"user-1",
		"refresh-token",
		"current-password",
		"new-secure-password",
		"browser",
		"127.0.0.1",
	)
	if err != nil {
		t.Fatal(err)
	}
	if repository.changeCalls != 1 {
		t.Fatalf("expected one password transaction, got %d", repository.changeCalls)
	}
	if !VerifyPassword(repository.changedPasswordHash, "new-secure-password") {
		t.Fatal("repository did not receive a hash of the new password")
	}
	expectedTokenHash, err := HashRefreshToken("refresh-token")
	if err != nil {
		t.Fatal(err)
	}
	if string(repository.changedTokenHash) != string(expectedTokenHash) {
		t.Fatal("current refresh token hash was not forwarded to the transaction")
	}
}

func TestChangePasswordRejectsUnchangedPassword(t *testing.T) {
	repository := &fakeAccountSecurity{}
	service := accountSecurityService(t, "current-password", repository)

	err := service.ChangePassword(
		context.Background(),
		"user-1",
		"refresh-token",
		"current-password",
		"current-password",
		"browser",
		"127.0.0.1",
	)
	var fieldError *FieldError
	if !errors.As(err, &fieldError) || fieldError.Code != "password_unchanged" || fieldError.Field != "newPassword" {
		t.Fatalf("expected password_unchanged field error, got %v", err)
	}
	if repository.changeCalls != 0 {
		t.Fatal("unchanged password must not reach the repository")
	}
}

func TestRevokeOtherSessionsRequiresReauthentication(t *testing.T) {
	repository := &fakeAccountSecurity{}
	service := accountSecurityService(t, "current-password", repository)

	err := service.RevokeOtherSessions(
		context.Background(),
		"user-1",
		"refresh-token",
		"wrong-password",
		"browser",
		"127.0.0.1",
	)
	if !errors.Is(err, ErrReauthenticationFailed) {
		t.Fatalf("expected ErrReauthenticationFailed, got %v", err)
	}
	if repository.revokeCalls != 0 {
		t.Fatal("session revocation must not run after failed reauthentication")
	}
}

func TestAccountSessionsRequiresConfiguredSecurityRepository(t *testing.T) {
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	service := NewService(&fakeUsers{}, &fakeRefresh{}, manager, time.Hour)

	_, err = service.AccountSessions(context.Background(), "user-1", "refresh-token")
	if !errors.Is(err, ErrAccountSecurityDisabled) {
		t.Fatalf("expected ErrAccountSecurityDisabled, got %v", err)
	}
}
