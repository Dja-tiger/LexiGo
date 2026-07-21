package account

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/auth"
)

type fakeRepository struct {
	identity      Identity
	export        ExportData
	err           error
	exportCalls   int
	deleteCalls   int
	deletedHash   string
	deletedUserID string
}

func (f *fakeRepository) Identity(context.Context, string) (Identity, error) {
	return f.identity, f.err
}

func (f *fakeRepository) Export(context.Context, Identity, time.Time) (ExportData, error) {
	f.exportCalls++
	return f.export, f.err
}

func (f *fakeRepository) Delete(_ context.Context, userID, expectedPasswordHash string) error {
	f.deleteCalls++
	f.deletedUserID = userID
	f.deletedHash = expectedPasswordHash
	return f.err
}

func TestExportRequiresCurrentPassword(t *testing.T) {
	passwordHash, err := auth.HashPassword("current-password")
	if err != nil {
		t.Fatal(err)
	}
	repository := &fakeRepository{identity: Identity{ID: "user-1", PasswordHash: passwordHash}}
	service := NewService(repository)

	_, err = service.Export(context.Background(), "user-1", "wrong-password")
	if !errors.Is(err, ErrReauthenticationFailed) {
		t.Fatalf("expected ErrReauthenticationFailed, got %v", err)
	}
	if repository.exportCalls != 0 {
		t.Fatal("export repository must not run after failed reauthentication")
	}
}

func TestExportReturnsVersionedPayload(t *testing.T) {
	passwordHash, err := auth.HashPassword("current-password")
	if err != nil {
		t.Fatal(err)
	}
	repository := &fakeRepository{
		identity: Identity{ID: "user-1", PasswordHash: passwordHash},
		export: ExportData{
			SchemaVersion: ExportSchemaVersion,
			Account:       ExportAccount{ID: "user-1", Email: "user@example.com"},
			Words:         []ExportWord{},
			ReviewHistory: []ExportReviewEvent{},
			SecurityAudit: []ExportAuditEvent{},
		},
	}
	service := NewService(repository)

	result, err := service.Export(context.Background(), "user-1", "current-password")
	if err != nil {
		t.Fatal(err)
	}
	if result.SchemaVersion != ExportSchemaVersion || result.Account.Email != "user@example.com" {
		t.Fatalf("unexpected export: %+v", result)
	}
	if repository.exportCalls != 1 {
		t.Fatalf("export calls = %d, want 1", repository.exportCalls)
	}
}

func TestDeleteRequiresCurrentPasswordAndExactAccountEmail(t *testing.T) {
	passwordHash, err := auth.HashPassword("current-password")
	if err != nil {
		t.Fatal(err)
	}
	repository := &fakeRepository{
		identity: Identity{
			ID:           "user-1",
			Email:        "User@example.com",
			PasswordHash: passwordHash,
		},
	}
	service := NewService(repository)

	err = service.Delete(context.Background(), "user-1", "wrong-password", "User@example.com")
	if !errors.Is(err, ErrReauthenticationFailed) {
		t.Fatalf("expected ErrReauthenticationFailed, got %v", err)
	}
	err = service.Delete(context.Background(), "user-1", "current-password", "other@example.com")
	if !errors.Is(err, ErrEmailConfirmationFailed) {
		t.Fatalf("expected ErrEmailConfirmationFailed, got %v", err)
	}
	if repository.deleteCalls != 0 {
		t.Fatal("delete repository must not run before both confirmations pass")
	}

	err = service.Delete(context.Background(), "user-1", "current-password", " user@EXAMPLE.com ")
	if err != nil {
		t.Fatal(err)
	}
	if repository.deleteCalls != 1 || repository.deletedUserID != "user-1" || repository.deletedHash != passwordHash {
		t.Fatalf("unexpected delete call: %+v", repository)
	}
}
