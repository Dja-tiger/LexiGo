package auth

import (
	"context"
	"errors"
	"net/url"
	"testing"
	"time"
)

type fakePasswordResetRepository struct {
	replacedUserID string
	replacedHash   []byte
	expiresAt      time.Time
	consumedHash   []byte
	passwordHash   string
	err            error
}

func (f *fakePasswordResetRepository) ReplacePasswordReset(
	_ context.Context,
	userID string,
	tokenHash []byte,
	expiresAt time.Time,
	_, _ string,
) error {
	f.replacedUserID = userID
	f.replacedHash = append([]byte(nil), tokenHash...)
	f.expiresAt = expiresAt
	return f.err
}

func (f *fakePasswordResetRepository) ConsumePasswordReset(
	_ context.Context,
	tokenHash []byte,
	passwordHash string,
	_ time.Time,
) error {
	f.consumedHash = append([]byte(nil), tokenHash...)
	f.passwordHash = passwordHash
	return f.err
}

type fakePasswordResetSender struct {
	recipient string
	resetURL  string
	err       error
}

func (f *fakePasswordResetSender) SendPasswordReset(_ context.Context, recipientEmail, _ string, resetURL string) error {
	f.recipient = recipientEmail
	f.resetURL = resetURL
	return f.err
}

func TestRequestPasswordResetStoresOnlyHashAndBuildsOneTimeURL(t *testing.T) {
	manager, _ := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	users := &fakeUsers{byEmail: User{ID: "user-1", Email: "test@example.com", DisplayName: "Tester"}}
	resetRepository := &fakePasswordResetRepository{}
	sender := &fakePasswordResetSender{}
	service := NewService(
		users,
		&fakeRefresh{},
		manager,
		time.Hour,
		WithPasswordReset(resetRepository, sender, "https://lexigo.example", 30*time.Minute),
	)
	fixedNow := time.Date(2026, 7, 18, 10, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return fixedNow }

	if err := service.RequestPasswordReset(context.Background(), " TEST@example.com ", "agent", "127.0.0.1"); err != nil {
		t.Fatalf("RequestPasswordReset() error = %v", err)
	}
	if resetRepository.replacedUserID != "user-1" || len(resetRepository.replacedHash) != 32 {
		t.Fatalf("unexpected stored reset: user=%q hash=%x", resetRepository.replacedUserID, resetRepository.replacedHash)
	}
	if !resetRepository.expiresAt.Equal(fixedNow.Add(30 * time.Minute)) {
		t.Fatalf("expiresAt = %s", resetRepository.expiresAt)
	}
	parsed, err := url.Parse(sender.resetURL)
	if err != nil {
		t.Fatal(err)
	}
	token := parsed.Query().Get("reset_token")
	if parsed.Query().Get("view") != "profile" || token == "" {
		t.Fatalf("unexpected reset URL %q", sender.resetURL)
	}
	hash, err := hashPasswordResetToken(token)
	if err != nil {
		t.Fatal(err)
	}
	if string(hash) != string(resetRepository.replacedHash) {
		t.Fatal("stored digest does not match delivered token")
	}
	if sender.recipient != "test@example.com" {
		t.Fatalf("recipient = %q", sender.recipient)
	}
}

func TestRequestPasswordResetDoesNotRevealMissingOrInvalidEmail(t *testing.T) {
	manager, _ := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	resetRepository := &fakePasswordResetRepository{}
	sender := &fakePasswordResetSender{}
	service := NewService(
		&fakeUsers{err: ErrUserNotFound},
		&fakeRefresh{},
		manager,
		time.Hour,
		WithPasswordReset(resetRepository, sender, "https://lexigo.example", 30*time.Minute),
	)

	for _, email := range []string{"missing@example.com", "not-an-email"} {
		if err := service.RequestPasswordReset(context.Background(), email, "", ""); err != nil {
			t.Fatalf("RequestPasswordReset(%q) error = %v", email, err)
		}
	}
	if resetRepository.replacedUserID != "" || sender.resetURL != "" {
		t.Fatal("missing account must not create or deliver a token")
	}
}

func TestResetPasswordValidatesAndHashesNewCredential(t *testing.T) {
	manager, _ := NewTokenManager("01234567890123456789012345678901", 15*time.Minute)
	resetRepository := &fakePasswordResetRepository{}
	service := NewService(
		&fakeUsers{},
		&fakeRefresh{},
		manager,
		time.Hour,
		WithPasswordReset(resetRepository, &fakePasswordResetSender{}, "https://lexigo.example", 30*time.Minute),
	)
	plain, expectedHash, err := newPasswordResetToken()
	if err != nil {
		t.Fatal(err)
	}

	if err := service.ResetPassword(context.Background(), plain, "new-strong-password"); err != nil {
		t.Fatalf("ResetPassword() error = %v", err)
	}
	if string(resetRepository.consumedHash) != string(expectedHash) {
		t.Fatal("reset token was not hashed consistently")
	}
	if !VerifyPassword(resetRepository.passwordHash, "new-strong-password") {
		t.Fatal("new password hash does not verify")
	}

	if err := service.ResetPassword(context.Background(), "invalid", "new-strong-password"); !errors.Is(err, ErrInvalidPasswordReset) {
		t.Fatalf("invalid token error = %v", err)
	}
	var fieldError *FieldError
	if err := service.ResetPassword(context.Background(), plain, "short"); !errors.As(err, &fieldError) || fieldError.Code != "password_too_short" {
		t.Fatalf("short password error = %#v", err)
	}
}

func TestCredentialValidationUsesStableFieldCodes(t *testing.T) {
	tests := []struct {
		name      string
		operation func() error
		field     string
		code      string
	}{
		{name: "email", operation: func() error { _, err := normalizeEmail("broken"); return err }, field: "email", code: "email_invalid"},
		{name: "name required", operation: func() error { _, err := normalizeDisplayName("  "); return err }, field: "displayName", code: "display_name_required"},
		{name: "name short", operation: func() error { _, err := normalizeDisplayName("A"); return err }, field: "displayName", code: "display_name_too_short"},
		{name: "password short", operation: func() error { return validatePassword("short") }, field: "password", code: "password_too_short"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var fieldError *FieldError
			if err := test.operation(); !errors.As(err, &fieldError) {
				t.Fatalf("error = %#v", err)
			}
			if fieldError.Field != test.field || fieldError.Code != test.code {
				t.Fatalf("field error = %+v", fieldError)
			}
		})
	}
}
