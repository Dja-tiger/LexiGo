package account

import (
	"context"
	"errors"
	"testing"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
)

type fakeCriticalNotificationSender struct {
	recipient   string
	displayName string
	err         error
}

func (f *fakeCriticalNotificationSender) SendAccountDeletedNotification(
	_ context.Context,
	recipientEmail,
	displayName string,
) error {
	f.recipient = recipientEmail
	f.displayName = displayName
	return f.err
}

func TestAccountDeletionNotificationRunsAfterSuccessfulDelete(t *testing.T) {
	passwordHash, err := auth.HashPassword("current-password")
	if err != nil {
		t.Fatal(err)
	}
	repository := &fakeRepository{identity: Identity{
		ID:           "user-1",
		Email:        "user@example.com",
		DisplayName:  "Privacy User",
		PasswordHash: passwordHash,
	}}
	sender := &fakeCriticalNotificationSender{err: errors.New("temporary mail failure")}
	service := NewService(repository, WithCriticalNotifications(sender))

	err = service.Delete(
		context.Background(),
		"user-1",
		"current-password",
		"user@example.com",
	)
	if err != nil {
		t.Fatalf("notification failure must not reverse account deletion: %v", err)
	}
	if repository.deleteCalls != 1 || sender.recipient != "user@example.com" || sender.displayName != "Privacy User" {
		t.Fatalf("unexpected deletion notification state: repository=%+v sender=%+v", repository, sender)
	}

	repository.err = errors.New("delete transaction failed")
	sender.recipient = ""
	err = service.Delete(
		context.Background(),
		"user-1",
		"current-password",
		"user@example.com",
	)
	if err == nil {
		t.Fatal("expected delete failure")
	}
	if sender.recipient != "" {
		t.Fatal("notification must not run when account deletion fails")
	}
}
