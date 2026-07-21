package account

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/auth"
)

type fakeEmailChangeRepository struct {
	replacedUserID   string
	replacedOldEmail string
	replacedNewEmail string
	replacedHash     []byte
	cancelledHash    []byte
	consumeHash      []byte
	result           EmailChangeResult
	err              error
}

func (f *fakeEmailChangeRepository) ReplaceEmailChange(
	_ context.Context,
	userID,
	oldEmail,
	newEmail string,
	tokenHash []byte,
	_, _ time.Time,
	_, _ string,
) error {
	f.replacedUserID = userID
	f.replacedOldEmail = oldEmail
	f.replacedNewEmail = newEmail
	f.replacedHash = append([]byte(nil), tokenHash...)
	return f.err
}

func (f *fakeEmailChangeRepository) CancelEmailChange(
	_ context.Context,
	tokenHash []byte,
	_ time.Time,
) error {
	f.cancelledHash = append([]byte(nil), tokenHash...)
	return nil
}

func (f *fakeEmailChangeRepository) ConsumeEmailChange(
	_ context.Context,
	tokenHash []byte,
	_ time.Time,
	_, _ string,
) (EmailChangeResult, error) {
	f.consumeHash = append([]byte(nil), tokenHash...)
	return f.result, f.err
}

type fakeEmailChangeSender struct {
	verificationRecipient string
	verificationURL       string
	notificationRecipient string
	notificationNewEmail  string
	verificationErr       error
	notificationErr       error
}

func (f *fakeEmailChangeSender) SendEmailChangeVerification(
	_ context.Context,
	recipientEmail,
	_ string,
	verificationURL string,
) error {
	f.verificationRecipient = recipientEmail
	f.verificationURL = verificationURL
	return f.verificationErr
}

func (f *fakeEmailChangeSender) SendEmailChangedNotification(
	_ context.Context,
	recipientEmail,
	_ string,
	newEmail string,
) error {
	f.notificationRecipient = recipientEmail
	f.notificationNewEmail = newEmail
	return f.notificationErr
}

func TestRequestEmailChangeRequiresReauthenticationAndStoresOnlyHash(t *testing.T) {
	passwordHash, err := auth.HashPassword("current-password")
	if err != nil {
		t.Fatal(err)
	}
	privacy := &fakeRepository{identity: Identity{
		ID:           "user-1",
		Email:        "old@example.com",
		DisplayName:  "Email User",
		PasswordHash: passwordHash,
	}}
	emailRepository := &fakeEmailChangeRepository{}
	sender := &fakeEmailChangeSender{}
	service := NewService(privacy, WithEmailChange(
		emailRepository,
		sender,
		"https://lexigo.example",
		30*time.Minute,
	))

	err = service.RequestEmailChange(
		context.Background(),
		"user-1",
		"wrong-password",
		"new@example.com",
		"browser",
		"203.0.113.10",
	)
	if !errors.Is(err, ErrReauthenticationFailed) {
		t.Fatalf("expected ErrReauthenticationFailed, got %v", err)
	}
	if emailRepository.replacedUserID != "" {
		t.Fatal("email token must not be stored after failed reauthentication")
	}

	err = service.RequestEmailChange(
		context.Background(),
		"user-1",
		"current-password",
		" NEW@example.com ",
		"browser",
		"203.0.113.10",
	)
	if err != nil {
		t.Fatal(err)
	}
	if emailRepository.replacedUserID != "user-1" ||
		emailRepository.replacedOldEmail != "old@example.com" ||
		emailRepository.replacedNewEmail != "new@example.com" ||
		len(emailRepository.replacedHash) != 32 {
		t.Fatalf("unexpected email change repository call: %+v", emailRepository)
	}
	if sender.verificationRecipient != "new@example.com" {
		t.Fatalf("verification recipient = %q", sender.verificationRecipient)
	}
	parsed, err := url.Parse(sender.verificationURL)
	if err != nil {
		t.Fatal(err)
	}
	fragment, err := url.ParseQuery(parsed.Fragment)
	if err != nil {
		t.Fatal(err)
	}
	rawToken := fragment.Get("email_change_token")
	if parsed.Path != "/profile" || rawToken == "" || strings.Contains(sender.verificationURL, "?") {
		t.Fatalf("unexpected verification URL %q", sender.verificationURL)
	}
	hash, err := hashEmailChangeToken(rawToken)
	if err != nil {
		t.Fatal(err)
	}
	if string(hash) != string(emailRepository.replacedHash) {
		t.Fatal("stored digest does not match the verification token")
	}
	if strings.Contains(string(emailRepository.replacedHash), rawToken) {
		t.Fatal("repository stored the raw verification token")
	}
}

func TestRequestEmailChangeCancelsTokenWhenDeliveryFails(t *testing.T) {
	passwordHash, err := auth.HashPassword("current-password")
	if err != nil {
		t.Fatal(err)
	}
	privacy := &fakeRepository{identity: Identity{
		ID: "user-1", Email: "old@example.com", PasswordHash: passwordHash,
	}}
	emailRepository := &fakeEmailChangeRepository{}
	sender := &fakeEmailChangeSender{verificationErr: errors.New("smtp unavailable")}
	service := NewService(privacy, WithEmailChange(
		emailRepository,
		sender,
		"https://lexigo.example",
		30*time.Minute,
	))

	err = service.RequestEmailChange(
		context.Background(),
		"user-1",
		"current-password",
		"new@example.com",
		"",
		"",
	)
	if err == nil || !strings.Contains(err.Error(), "smtp unavailable") {
		t.Fatalf("unexpected delivery error: %v", err)
	}
	if string(emailRepository.cancelledHash) != string(emailRepository.replacedHash) {
		t.Fatal("failed delivery did not cancel the stored token")
	}
}

func TestConfirmEmailChangeConsumesTokenAndNotifiesOldAddress(t *testing.T) {
	plain, _, err := newEmailChangeToken()
	if err != nil {
		t.Fatal(err)
	}
	emailRepository := &fakeEmailChangeRepository{result: EmailChangeResult{
		UserID:      "user-1",
		OldEmail:    "old@example.com",
		NewEmail:    "new@example.com",
		DisplayName: "Email User",
	}}
	sender := &fakeEmailChangeSender{notificationErr: errors.New("temporary notification failure")}
	service := NewService(&fakeRepository{}, WithEmailChange(
		emailRepository,
		sender,
		"https://lexigo.example",
		30*time.Minute,
	))

	result, err := service.ConfirmEmailChange(
		context.Background(),
		plain,
		"browser",
		"203.0.113.11",
	)
	if err != nil {
		t.Fatal(err)
	}
	if result.NewEmail != "new@example.com" || len(emailRepository.consumeHash) != 32 {
		t.Fatalf("unexpected confirmation result: %+v", result)
	}
	if sender.notificationRecipient != "old@example.com" || sender.notificationNewEmail != "new@example.com" {
		t.Fatalf("unexpected security notification: %+v", sender)
	}
}
