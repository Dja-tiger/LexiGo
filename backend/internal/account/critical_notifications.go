package account

import (
	"context"
	"fmt"
)

type CriticalNotificationSender interface {
	SendAccountDeletedNotification(ctx context.Context, recipientEmail, displayName string) error
}

func WithCriticalNotifications(sender CriticalNotificationSender) ServiceOption {
	return func(service *Service) {
		service.criticalNotifications = sender
	}
}

func (s *Service) notifyAccountDeleted(
	ctx context.Context,
	identity Identity,
) {
	if s.criticalNotifications == nil {
		return
	}
	if err := s.criticalNotifications.SendAccountDeletedNotification(
		ctx,
		identity.Email,
		identity.DisplayName,
	); err != nil {
		s.logger.ErrorContext(ctx, "account deleted notification failed",
			"user_id", identity.ID,
			"error", fmt.Errorf("deliver notification: %w", err),
		)
	}
}
