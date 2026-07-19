package account

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
)

type fakeRepository struct {
	identity Identity
	export   ExportData
	err      error
	calls    int
}

func (f *fakeRepository) Identity(context.Context, string) (Identity, error) {
	return f.identity, f.err
}

func (f *fakeRepository) Export(context.Context, Identity, time.Time) (ExportData, error) {
	f.calls++
	return f.export, f.err
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
	if repository.calls != 0 {
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
	if repository.calls != 1 {
		t.Fatalf("export calls = %d, want 1", repository.calls)
	}
}
