package auth

import (
	"fmt"
	"net/mail"
	"strings"
	"unicode"
	"unicode/utf8"
)

const (
	minimumPasswordRunes = 10
	maximumPasswordBytes = 72
	minimumDisplayRunes  = 2
	maximumDisplayRunes  = 80
)

// FieldError is a stable API-facing validation contract. Callers must branch on
// Code and Field instead of parsing the human-readable Message.
type FieldError struct {
	Field   string
	Code    string
	Message string
}

func (e *FieldError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

func normalizeEmail(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	parsed, err := mail.ParseAddress(value)
	if err != nil || parsed.Address != value {
		return "", &FieldError{
			Field:   "email",
			Code:    "email_invalid",
			Message: "email must contain a valid address",
		}
	}
	return value, nil
}

func normalizeDisplayName(value string) (string, error) {
	value = strings.TrimSpace(value)
	runeCount := utf8.RuneCountInString(value)
	switch {
	case runeCount == 0:
		return "", &FieldError{
			Field:   "displayName",
			Code:    "display_name_required",
			Message: "display name is required",
		}
	case runeCount < minimumDisplayRunes:
		return "", &FieldError{
			Field:   "displayName",
			Code:    "display_name_too_short",
			Message: "display name must contain at least 2 characters",
		}
	case runeCount > maximumDisplayRunes:
		return "", &FieldError{
			Field:   "displayName",
			Code:    "display_name_too_long",
			Message: "display name must contain at most 80 characters",
		}
	}
	for _, current := range value {
		if unicode.IsControl(current) {
			return "", &FieldError{
				Field:   "displayName",
				Code:    "display_name_invalid",
				Message: "display name contains unsupported characters",
			}
		}
	}
	return value, nil
}

func validatePassword(value string) error {
	if utf8.RuneCountInString(value) < minimumPasswordRunes {
		return &FieldError{
			Field:   "password",
			Code:    "password_too_short",
			Message: "password must contain at least 10 characters",
		}
	}
	if len([]byte(value)) > maximumPasswordBytes {
		return &FieldError{
			Field:   "password",
			Code:    "password_too_long",
			Message: "password must contain at most 72 bytes",
		}
	}
	for _, current := range value {
		if unicode.IsControl(current) {
			return &FieldError{
				Field:   "password",
				Code:    "password_invalid",
				Message: "password contains unsupported control characters",
			}
		}
	}
	return nil
}
