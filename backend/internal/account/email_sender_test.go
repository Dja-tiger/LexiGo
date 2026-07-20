package account

import (
	"net/mail"
	"strings"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
)

var (
	_ EmailChangeSender                 = (*SMTPEmailChangeSender)(nil)
	_ CriticalNotificationSender       = (*SMTPEmailChangeSender)(nil)
	_ auth.SecurityNotificationSender = (*SMTPEmailChangeSender)(nil)
)

func TestEmailChangeMessagesUseEncodedHeadersAndPlainTextBody(t *testing.T) {
	from := mail.Address{Name: "LexiGo", Address: "noreply@example.com"}
	recipient := mail.Address{Name: "Пользователь", Address: "user@example.com"}
	verificationURL := "https://lexigo.example/profile#email_change_token=secret"
	message := emailChangeVerificationMessage(from, recipient, "Пользователь", verificationURL)

	if !strings.Contains(message, "Subject: =?UTF-8?") {
		t.Fatalf("subject is not RFC 2047 encoded: %q", message)
	}
	if !strings.Contains(message, "Content-Type: text/plain; charset=UTF-8") {
		t.Fatal("message must declare UTF-8 plain text")
	}
	if !strings.Contains(message, "#email_change_token=secret") {
		t.Fatal("message does not contain the verification fragment")
	}
	if strings.Contains(message, "?email_change_token=") {
		t.Fatal("verification token must not be placed in the query string")
	}
	if strings.Contains(message, "\n\n") {
		t.Fatal("SMTP message must use CRLF line endings")
	}
}

func TestNewSMTPEmailChangeSenderValidatesConfiguration(t *testing.T) {
	valid := SMTPEmailChangeConfig{
		Host: "smtp.example.com", Port: 587,
		Username: "lexigo", Password: "secret",
		From: "LexiGo <noreply@example.com>", Timeout: 10 * time.Second,
	}
	if _, err := NewSMTPEmailChangeSender(valid); err != nil {
		t.Fatalf("valid SMTP config error = %v", err)
	}

	invalid := []SMTPEmailChangeConfig{
		{},
		{Host: "smtp.example.com", Port: 70000, From: "noreply@example.com"},
		{Host: "smtp.example.com", Port: 587, From: "invalid"},
		{Host: "smtp.example.com", Port: 587, From: "noreply@example.com", Username: "bad\r\nname"},
	}
	for _, configuration := range invalid {
		if _, err := NewSMTPEmailChangeSender(configuration); err == nil {
			t.Fatalf("expected invalid SMTP config error for %+v", configuration)
		}
	}
}
