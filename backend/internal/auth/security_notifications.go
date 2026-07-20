package auth

import "context"

type SecurityNotificationSender interface {
	SendPasswordChangedNotification(ctx context.Context, recipientEmail, displayName string) error
}

func WithSecurityNotifications(sender SecurityNotificationSender) ServiceOption {
	return func(service *Service) {
		service.securityNotifications = sender
	}
}
