package auth

import (
	"net/mail"
	"strings"
	"testing"
	"time"
)

func TestPasswordResetMessageUsesEncodedHeadersAndPlainTextBody(t *testing.T) {
	from := mail.Address{Name: "LexiGo", Address: "noreply@example.com"}
	recipient := mail.Address{Name: "Пользователь", Address: "user@example.com"}
	message := passwordResetMessage(from, recipient, "Пользователь", "https://lexigo.example/?view=profile#reset_token=secret")

	if !strings.Contains(message, "Subject: =?UTF-8?") {
		t.Fatalf("subject is not RFC 2047 encoded: %q", message)
	}
	if !strings.Contains(message, "Content-Type: text/plain; charset=UTF-8") {
		t.Fatal("message must declare UTF-8 plain text")
	}
	if !strings.Contains(message, "#reset_token=secret") {
		t.Fatal("message does not contain the reset URL")
	}
	if strings.Contains(message, "\n\n") {
		t.Fatal("SMTP message must use CRLF line endings")
	}
}

func TestNewSMTPPasswordResetSenderValidatesConfiguration(t *testing.T) {
	valid := SMTPPasswordResetConfig{
		Host: "smtp.example.com", Port: 587,
		Username: "lexigo", Password: "secret",
		From: "LexiGo <noreply@example.com>", Timeout: 10 * time.Second,
	}
	if _, err := NewSMTPPasswordResetSender(valid); err != nil {
		t.Fatalf("valid SMTP config error = %v", err)
	}

	invalid := []SMTPPasswordResetConfig{
		{},
		{Host: "smtp.example.com", Port: 70000, From: "noreply@example.com"},
		{Host: "smtp.example.com", Port: 587, From: "invalid"},
		{Host: "smtp.example.com", Port: 587, From: "noreply@example.com", Username: "bad\r\nname"},
	}
	for _, config := range invalid {
		if _, err := NewSMTPPasswordResetSender(config); err == nil {
			t.Fatalf("expected invalid SMTP config error for %+v", config)
		}
	}
}
