package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

const (
	refreshCookieName = "lexigo_refresh"
	csrfCookieName    = "lexigo_csrf"
	csrfHeaderName    = "X-CSRF-Token"
)

type CookieConfig struct {
	Secure     bool
	RefreshTTL time.Duration
}

type Handler struct {
	service *Service
	cookies CookieConfig
	logger  *slog.Logger
	now     func() time.Time
}

func NewHandler(service *Service, cookies CookieConfig, loggers ...*slog.Logger) *Handler {
	logger := slog.Default()
	if len(loggers) > 0 && loggers[0] != nil {
		logger = loggers[0]
	}
	return &Handler{service: service, cookies: cookies, logger: logger, now: time.Now}
}

type credentialsRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName,omitempty"`
}

type passwordResetRequest struct {
	Email string `json:"email"`
}

type passwordResetConfirmRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

type authResponse struct {
	User   User      `json:"user"`
	Tokens TokenPair `json:"tokens"`
}

type acceptedResponse struct {
	Accepted bool `json:"accepted"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var request credentialsRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		h.writeInvalidRequest(w)
		return
	}
	csrfToken, err := newCSRFToken()
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	user, pair, err := h.service.Register(r.Context(), request.Email, request.Password, request.DisplayName, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	h.setSessionCookies(w, pair.RefreshToken, csrfToken)
	h.writeAuthJSON(w, http.StatusCreated, authResponse{User: user, Tokens: pair})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var request credentialsRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		h.writeInvalidRequest(w)
		return
	}
	csrfToken, err := newCSRFToken()
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	user, pair, err := h.service.Login(r.Context(), request.Email, request.Password, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	h.setSessionCookies(w, pair.RefreshToken, csrfToken)
	h.writeAuthJSON(w, http.StatusOK, authResponse{User: user, Tokens: pair})
}

func (h *Handler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var request passwordResetRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		h.writeInvalidRequest(w)
		return
	}
	if err := h.service.RequestPasswordReset(r.Context(), request.Email, r.UserAgent(), clientIP(r)); err != nil {
		// The public response intentionally remains identical for existing and
		// missing accounts, including delivery incidents. Operators receive the
		// diagnostic without exposing account existence to the caller.
		h.logger.ErrorContext(r.Context(), "password reset request failed", "error", err)
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusAccepted, acceptedResponse{Accepted: true})
}

func (h *Handler) ConfirmPasswordReset(w http.ResponseWriter, r *http.Request) {
	var request passwordResetConfirmRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		h.writeInvalidRequest(w)
		return
	}
	if err := h.service.ResetPassword(r.Context(), request.Token, request.NewPassword); err != nil {
		h.writeServiceError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	if !validCSRF(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	refreshToken, err := h.refreshToken(r)
	if err != nil {
		h.clearSessionCookies(w)
		h.writeServiceError(w, ErrInvalidRefresh)
		return
	}
	csrfToken, err := newCSRFToken()
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	user, pair, err := h.service.Refresh(r.Context(), refreshToken, r.UserAgent(), clientIP(r))
	if err != nil {
		if errors.Is(err, ErrInvalidRefresh) || errors.Is(err, ErrRefreshTokenReuse) {
			h.clearSessionCookies(w)
		}
		h.writeServiceError(w, err)
		return
	}
	h.setSessionCookies(w, pair.RefreshToken, csrfToken)
	h.writeAuthJSON(w, http.StatusOK, authResponse{User: user, Tokens: pair})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if !validCSRF(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	refreshToken, err := h.refreshToken(r)
	if err == nil {
		if serviceErr := h.service.Logout(r.Context(), refreshToken); serviceErr != nil && !errors.Is(serviceErr, ErrInvalidRefresh) {
			h.writeServiceError(w, serviceErr)
			return
		}
	}
	h.clearSessionCookies(w)
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	user, err := h.service.UserByID(r.Context(), userID)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, user)
}

func (h *Handler) writeAuthJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	httpx.WriteJSON(w, status, value)
}

func (h *Handler) writeInvalidRequest(w http.ResponseWriter) {
	httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "request body must contain valid JSON fields")
}

func (h *Handler) setSessionCookies(w http.ResponseWriter, refreshToken, csrfToken string) {
	expiresAt := h.now().UTC().Add(h.cookies.RefreshTTL)
	maxAge := int(h.cookies.RefreshTTL.Seconds())
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Value:    refreshToken,
		Path:     "/api/v1/auth",
		Expires:  expiresAt,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   h.cookies.Secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookieName,
		Value:    csrfToken,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   maxAge,
		HttpOnly: false,
		Secure:   h.cookies.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *Handler) clearSessionCookies(w http.ResponseWriter) {
	expiresAt := time.Unix(1, 0).UTC()
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Path:     "/api/v1/auth",
		Expires:  expiresAt,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cookies.Secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookieName,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   -1,
		HttpOnly: false,
		Secure:   h.cookies.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *Handler) refreshToken(r *http.Request) (string, error) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return "", ErrInvalidRefresh
	}
	return cookie.Value, nil
}

func validCSRF(r *http.Request) bool {
	cookie, err := r.Cookie(csrfCookieName)
	if err != nil || cookie.Value == "" {
		return false
	}
	header := strings.TrimSpace(r.Header.Get(csrfHeaderName))
	if header == "" || len(header) != len(cookie.Value) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(header), []byte(cookie.Value)) == 1
}

func newCSRFToken() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}

func (h *Handler) writeServiceError(w http.ResponseWriter, err error) {
	var fieldError *FieldError
	switch {
	case errors.As(err, &fieldError):
		httpx.WriteFieldError(w, http.StatusUnprocessableEntity, fieldError.Code, fieldError.Message, fieldError.Field)
	case errors.Is(err, ErrEmailTaken):
		httpx.WriteFieldError(w, http.StatusConflict, "email_taken", "email is already registered", "email")
	case errors.Is(err, ErrInvalidLogin):
		httpx.WriteError(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
	case errors.Is(err, ErrInvalidPasswordReset):
		httpx.WriteFieldError(w, http.StatusBadRequest, "password_reset_invalid", "password reset token is invalid or expired", "token")
	case errors.Is(err, ErrPasswordResetDisabled):
		httpx.WriteError(w, http.StatusServiceUnavailable, "password_reset_unavailable", "password reset is temporarily unavailable")
	case errors.Is(err, ErrRefreshTokenReuse):
		httpx.WriteError(w, http.StatusUnauthorized, "session_compromised", "refresh token reuse detected")
	case errors.Is(err, ErrInvalidRefresh), errors.Is(err, ErrInvalidAccess):
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "invalid or expired session")
	case errors.Is(err, ErrUserNotFound):
		httpx.WriteError(w, http.StatusNotFound, "not_found", "user not found")
	default:
		h.logger.Error("authentication service error", "error", err)
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

func clientIP(r *http.Request) string {
	if forwarded := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-For"), ",")[0]); net.ParseIP(forwarded) != nil {
		return forwarded
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && net.ParseIP(host) != nil {
		return host
	}
	return ""
}
