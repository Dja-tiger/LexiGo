package auth

import (
	"context"
	"errors"
	"testing"
	"time"
)

type fakeSecurityNotificationSender struct {
	recipient   string
	displayName string
	err         error
}

func (f *fakeSecurityNotificationSender) SendPasswordChangedNotification(
	_ context.Context,
	recipientEmail,
	displayName string,
) error {
	f.recipient = recipientEmail
	f.displayName = displayName
	return f.err
}

func TestPasswordChangeNotificationRunsOnlyAfterCommittedTransaction(t *testing.T) {
	passwordHash, err := HashPassword("current-password")
	if err != nil {
		t.Fatal(err)
	}
	manager, err := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	repository := &fakeAccountSecurity{}
	sender := &fakeSecurityNotificationSender{err: errors.New("mailbox unavailable")}
	service := NewService(
		&fakeUsers{byID: User{
			ID:           "user-1",
			Email:        "user@example.com",
			DisplayName:  "Security User",
			PasswordHash: passwordHash,
			AuthVersion:  1,
		}},
		&fakeRefresh{},
		manager,
		time.Hour,
		WithAccountSecurity(repository),
		WithSecurityNotifications(sender),
	)

	_, _, err = service.ChangePassword(
		context.Background(),
		"user-1",
		"refresh-token",
		"current-password",
		"new-secure-password",
		"browser",
		"127.0.0.1",
	)
	if err != nil {
		t.Fatalf("notification failure must not roll back a committed password change: %v", err)
	}
	if repository.changeCalls != 1 || sender.recipient != "user@example.com" || sender.displayName != "Security User" {
		t.Fatalf("unexpected notification state: repository=%+v sender=%+v", repository, sender)
	}

	repository.err = errors.New("transaction failed")
	sender.recipient = ""
	_, _, err = service.ChangePassword(
		context.Background(),
		"user-1",
		"refresh-token",
		"current-password",
		"another-secure-password",
		"browser",
		"127.0.0.1",
	)
	if err == nil {
		t.Fatal("expected repository failure")
	}
	if sender.recipient != "" {
		t.Fatal("notification must not run before the password transaction commits")
	}
}
