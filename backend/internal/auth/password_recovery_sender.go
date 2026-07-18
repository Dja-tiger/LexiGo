package auth

import (
	"context"
	"crypto/tls"
	"fmt"
	"log/slog"
	"net"
	"net/mail"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

type SMTPPasswordResetConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	Timeout  time.Duration
}

type SMTPPasswordResetSender struct {
	config SMTPPasswordResetConfig
	from   mail.Address
}

func NewSMTPPasswordResetSender(config SMTPPasswordResetConfig) (*SMTPPasswordResetSender, error) {
	config.Host = strings.TrimSpace(config.Host)
	config.From = strings.TrimSpace(config.From)
	if config.Host == "" || config.Port <= 0 || config.Port > 65535 {
		return nil, fmt.Errorf("SMTP host and port are required")
	}
	from, err := mail.ParseAddress(config.From)
	if err != nil || from.Address == "" {
		return nil, fmt.Errorf("SMTP_FROM must contain a valid address")
	}
	if strings.ContainsAny(config.Username, "\r\n") || strings.ContainsAny(config.Password, "\r\n") {
		return nil, fmt.Errorf("SMTP credentials contain unsupported characters")
	}
	if config.Timeout <= 0 {
		config.Timeout = 10 * time.Second
	}
	return &SMTPPasswordResetSender{config: config, from: *from}, nil
}

func (s *SMTPPasswordResetSender) SendPasswordReset(ctx context.Context, recipientEmail, displayName, resetURL string) error {
	recipient, err := mail.ParseAddress(strings.TrimSpace(recipientEmail))
	if err != nil || recipient.Address == "" {
		return fmt.Errorf("invalid password reset recipient")
	}
	if strings.ContainsAny(displayName, "\r\n") || strings.ContainsAny(resetURL, "\r\n") {
		return fmt.Errorf("password reset message contains unsupported characters")
	}

	deadline := time.Now().Add(s.config.Timeout)
	if contextDeadline, ok := ctx.Deadline(); ok && contextDeadline.Before(deadline) {
		deadline = contextDeadline
	}
	address := net.JoinHostPort(s.config.Host, strconv.Itoa(s.config.Port))
	dialer := net.Dialer{Deadline: deadline}
	connection, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		return fmt.Errorf("connect SMTP: %w", err)
	}
	defer connection.Close()

	client, err := smtp.NewClient(connection, s.config.Host)
	if err != nil {
		return fmt.Errorf("create SMTP client: %w", err)
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{
			MinVersion: tls.VersionTLS12,
			ServerName: s.config.Host,
		}); err != nil {
			return fmt.Errorf("start SMTP TLS: %w", err)
		}
	}
	if s.config.Username != "" {
		if err := client.Auth(smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)); err != nil {
			return fmt.Errorf("authenticate SMTP: %w", err)
		}
	}
	if err := client.Mail(s.from.Address); err != nil {
		return fmt.Errorf("set SMTP sender: %w", err)
	}
	if err := client.Rcpt(recipient.Address); err != nil {
		return fmt.Errorf("set SMTP recipient: %w", err)
	}
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("open SMTP body: %w", err)
	}
	message := passwordResetMessage(s.from, *recipient, displayName, resetURL)
	if _, err := writer.Write([]byte(message)); err != nil {
		_ = writer.Close()
		return fmt.Errorf("write SMTP body: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("close SMTP body: %w", err)
	}
	if err := client.Quit(); err != nil {
		return fmt.Errorf("quit SMTP session: %w", err)
	}
	return nil
}

func passwordResetMessage(from, recipient mail.Address, displayName, resetURL string) string {
	name := strings.TrimSpace(displayName)
	if name == "" {
		name = "пользователь LexiGo"
	}
	return strings.Join([]string{
		"From: " + from.String(),
		"To: " + recipient.String(),
		"Subject: Восстановление пароля LexiGo",
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: 8bit",
		"",
		"Здравствуйте, " + name + ".",
		"",
		"Для создания нового пароля откройте одноразовую ссылку:",
		resetURL,
		"",
		"Ссылка действует ограниченное время и перестанет работать после использования.",
		"Если вы не запрашивали восстановление, проигнорируйте это письмо.",
		"",
	}, "\r\n")
}

type LogPasswordResetSender struct {
	logger *slog.Logger
}

func NewLogPasswordResetSender(logger *slog.Logger) *LogPasswordResetSender {
	return &LogPasswordResetSender{logger: logger}
}

func (s *LogPasswordResetSender) SendPasswordReset(_ context.Context, recipientEmail, _ string, resetURL string) error {
	// This sender is permitted only in local/test environments. Production
	// configuration rejects it because the URL contains a bearer credential.
	s.logger.Warn("local password reset link", "recipient", recipientEmail, "url", resetURL)
	return nil
}
