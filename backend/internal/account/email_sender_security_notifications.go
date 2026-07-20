package account

import (
	"context"
	"fmt"
)

func (s *SMTPEmailChangeSender) SendPasswordChangedNotification(
	ctx context.Context,
	recipientEmail,
	displayName string,
) error {
	recipient, err := emailChangeRecipient(recipientEmail)
	if err != nil {
		return fmt.Errorf("invalid password changed notification recipient")
	}
	message := accountPlainTextMessage(
		s.from,
		recipient,
		"Пароль аккаунта LexiGo изменён",
		displayName,
		[]string{
			"Пароль вашего аккаунта LexiGo был изменён.",
			"",
			"Другие активные сессии завершены.",
			"Если это изменение выполнили не вы, немедленно восстановите пароль и обратитесь в поддержку LexiGo.",
		},
	)
	return s.send(ctx, recipient, message)
}

func (s *SMTPEmailChangeSender) SendAccountDeletedNotification(
	ctx context.Context,
	recipientEmail,
	displayName string,
) error {
	recipient, err := emailChangeRecipient(recipientEmail)
	if err != nil {
		return fmt.Errorf("invalid account deleted notification recipient")
	}
	message := accountPlainTextMessage(
		s.from,
		recipient,
		"Аккаунт LexiGo удалён",
		displayName,
		[]string{
			"Ваш аккаунт LexiGo и связанные учебные данные были удалены.",
			"",
			"Все активные сессии завершены. Это действие нельзя отменить через приложение.",
			"Если удаление выполнили не вы, обратитесь в поддержку LexiGo.",
		},
	)
	return s.send(ctx, recipient, message)
}

func (s *LogEmailChangeSender) SendPasswordChangedNotification(
	_ context.Context,
	recipientEmail,
	_ string,
) error {
	s.logger.Warn("local password changed notification", "recipient", recipientEmail)
	return nil
}

func (s *LogEmailChangeSender) SendAccountDeletedNotification(
	_ context.Context,
	recipientEmail,
	_ string,
) error {
	s.logger.Warn("local account deleted notification", "recipient", recipientEmail)
	return nil
}
