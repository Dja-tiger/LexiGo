package account

import (
	"context"
	"crypto/tls"
	"fmt"
	"log/slog"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

type SMTPEmailChangeConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	Timeout  time.Duration
}

type SMTPEmailChangeSender struct {
	config SMTPEmailChangeConfig
	from   mail.Address
}

func NewSMTPEmailChangeSender(config SMTPEmailChangeConfig) (*SMTPEmailChangeSender, error) {
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
	return &SMTPEmailChangeSender{config: config, from: *from}, nil
}

func (s *SMTPEmailChangeSender) SendEmailChangeVerification(
	ctx context.Context,
	recipientEmail,
	displayName,
	verificationURL string,
) error {
	recipient, err := emailChangeRecipient(recipientEmail)
	if err != nil {
		return fmt.Errorf("invalid email change recipient")
	}
	if strings.ContainsAny(displayName, "\r\n") || strings.ContainsAny(verificationURL, "\r\n") {
		return fmt.Errorf("email change verification contains unsupported characters")
	}
	message := emailChangeVerificationMessage(s.from, recipient, displayName, verificationURL)
	return s.send(ctx, recipient, message)
}

func (s *SMTPEmailChangeSender) SendEmailChangedNotification(
	ctx context.Context,
	recipientEmail,
	displayName,
	newEmail string,
) error {
	recipient, err := emailChangeRecipient(recipientEmail)
	if err != nil {
		return fmt.Errorf("invalid email change notification recipient")
	}
	newAddress, err := emailChangeRecipient(newEmail)
	if err != nil {
		return fmt.Errorf("invalid new email address")
	}
	if strings.ContainsAny(displayName, "\r\n") {
		return fmt.Errorf("email change notification contains unsupported characters")
	}
	message := emailChangedNotificationMessage(s.from, recipient, displayName, newAddress.Address)
	return s.send(ctx, recipient, message)
}

func (s *SMTPEmailChangeSender) send(
	ctx context.Context,
	recipient mail.Address,
	message string,
) error {
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
	if err := connection.SetDeadline(deadline); err != nil {
		return fmt.Errorf("set SMTP deadline: %w", err)
	}

	client, err := smtp.NewClient(connection, s.config.Host)
	if err != nil {
		return fmt.Errorf("create SMTP client: %w", err)
	}
	defer client.Close()

	startTLS, _ := client.Extension("STARTTLS")
	if !startTLS {
		return fmt.Errorf("SMTP server does not support STARTTLS")
	}
	if err := client.StartTLS(&tls.Config{
		MinVersion: tls.VersionTLS12,
		ServerName: s.config.Host,
	}); err != nil {
		return fmt.Errorf("start SMTP TLS: %w", err)
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

func emailChangeVerificationMessage(
	from,
	recipient mail.Address,
	displayName,
	verificationURL string,
) string {
	return accountPlainTextMessage(
		from,
		recipient,
		"Подтверждение нового email LexiGo",
		displayName,
		[]string{
			"Для подтверждения нового email откройте одноразовую ссылку:",
			verificationURL,
			"",
			"Ссылка действует ограниченное время и перестанет работать после использования.",
			"Если вы не запрашивали изменение email, не открывайте ссылку.",
		},
	)
}

func emailChangedNotificationMessage(
	from,
	recipient mail.Address,
	displayName,
	newEmail string,
) string {
	return accountPlainTextMessage(
		from,
		recipient,
		"Email аккаунта LexiGo изменён",
		displayName,
		[]string{
			"Email вашего аккаунта LexiGo был изменён на:",
			newEmail,
			"",
			"Все активные сессии завершены. Для продолжения войдите с новым email.",
			"Если это изменение выполнили не вы, немедленно обратитесь в поддержку LexiGo.",
		},
	)
}

func accountPlainTextMessage(
	from,
	recipient mail.Address,
	subject,
	displayName string,
	body []string,
) string {
	name := strings.TrimSpace(displayName)
	if name == "" {
		name = "пользователь LexiGo"
	}
	lines := []string{
		"From: " + from.String(),
		"To: " + recipient.String(),
		"Subject: " + mime.BEncoding.Encode("UTF-8", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: 8bit",
		"",
		"Здравствуйте, " + name + ".",
		"",
	}
	lines = append(lines, body...)
	lines = append(lines, "")
	return strings.Join(lines, "\r\n")
}

func emailChangeRecipient(value string) (mail.Address, error) {
	recipient, err := mail.ParseAddress(strings.TrimSpace(value))
	if err != nil || recipient.Address == "" || strings.ContainsAny(recipient.Address, "\r\n") {
		return mail.Address{}, fmt.Errorf("invalid email address")
	}
	return *recipient, nil
}

type LogEmailChangeSender struct {
	logger *slog.Logger
}

func NewLogEmailChangeSender(logger *slog.Logger) *LogEmailChangeSender {
	if logger == nil {
		logger = slog.Default()
	}
	return &LogEmailChangeSender{logger: logger}
}

func (s *LogEmailChangeSender) SendEmailChangeVerification(
	_ context.Context,
	recipientEmail,
	_ string,
	verificationURL string,
) error {
	s.logger.Warn("local email change verification link", "recipient", recipientEmail, "url", verificationURL)
	return nil
}

func (s *LogEmailChangeSender) SendEmailChangedNotification(
	_ context.Context,
	recipientEmail,
	_ string,
	newEmail string,
) error {
	s.logger.Warn("local email changed notification", "recipient", recipientEmail, "new_email", newEmail)
	return nil
}
