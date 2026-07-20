package account

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/auth"
	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

type Handler struct {
	service      *Service
	cookieSecure bool
}

func NewHandler(service *Service, cookieSecure bool) *Handler {
	return &Handler{service: service, cookieSecure: cookieSecure}
}

type exportRequest struct {
	CurrentPassword string `json:"currentPassword"`
}

type deleteRequest struct {
	CurrentPassword   string `json:"currentPassword"`
	ConfirmationEmail string `json:"confirmationEmail"`
}

type emailChangeRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewEmail        string `json:"newEmail"`
}

type emailChangeConfirmRequest struct {
	Token string `json:"token"`
}

type acceptedResponse struct {
	Accepted bool `json:"accepted"`
}

func (h *Handler) Export(w http.ResponseWriter, r *http.Request) {
	if !auth.ValidCSRFRequest(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	var request exportRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "request body must contain valid JSON fields")
		return
	}
	export, err := h.service.Export(r.Context(), userID, request.CurrentPassword)
	if err != nil {
		h.writeError(w, err)
		return
	}
	filename := fmt.Sprintf("lexigo-export-%s.json", time.Now().UTC().Format("20060102"))
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	httpx.WriteJSON(w, http.StatusOK, export)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !auth.ValidCSRFRequest(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	var request deleteRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "request body must contain valid JSON fields")
		return
	}
	if err := h.service.Delete(
		r.Context(),
		userID,
		request.CurrentPassword,
		request.ConfirmationEmail,
	); err != nil {
		h.writeError(w, err)
		return
	}
	auth.ClearSessionCookies(w, h.cookieSecure)
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Clear-Site-Data", `"cache", "storage"`)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RequestEmailChange(w http.ResponseWriter, r *http.Request) {
	if !auth.ValidCSRFRequest(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	var request emailChangeRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "request body must contain valid JSON fields")
		return
	}
	if err := h.service.RequestEmailChange(
		r.Context(),
		userID,
		request.CurrentPassword,
		request.NewEmail,
		r.UserAgent(),
		requestIP(r),
	); err != nil {
		h.writeError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusAccepted, acceptedResponse{Accepted: true})
}

func (h *Handler) ConfirmEmailChange(w http.ResponseWriter, r *http.Request) {
	var request emailChangeConfirmRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "request body must contain valid JSON fields")
		return
	}
	if _, err := h.service.ConfirmEmailChange(
		r.Context(),
		request.Token,
		r.UserAgent(),
		requestIP(r),
	); err != nil {
		h.writeError(w, err)
		return
	}
	auth.ClearSessionCookies(w, h.cookieSecure)
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrReauthenticationFailed):
		httpx.WriteFieldError(w, http.StatusUnauthorized, "reauthentication_failed", "current password is invalid", "currentPassword")
	case errors.Is(err, ErrEmailConfirmationFailed):
		httpx.WriteFieldError(w, http.StatusUnprocessableEntity, "email_confirmation_mismatch", "confirmation email does not match the account email", "confirmationEmail")
	case errors.Is(err, ErrEmailInvalid):
		httpx.WriteFieldError(w, http.StatusUnprocessableEntity, "email_invalid", "new email must contain a valid address", "newEmail")
	case errors.Is(err, ErrEmailUnchanged):
		httpx.WriteFieldError(w, http.StatusUnprocessableEntity, "email_unchanged", "new email must differ from the current email", "newEmail")
	case errors.Is(err, ErrEmailTaken):
		httpx.WriteFieldError(w, http.StatusConflict, "email_taken", "email is already registered", "newEmail")
	case errors.Is(err, ErrInvalidEmailChange):
		httpx.WriteFieldError(w, http.StatusBadRequest, "email_change_invalid", "email change token is invalid or expired", "token")
	case errors.Is(err, ErrEmailChangeDisabled):
		httpx.WriteError(w, http.StatusServiceUnavailable, "email_change_unavailable", "email change is temporarily unavailable")
	case errors.Is(err, ErrAccountChanged):
		httpx.WriteError(w, http.StatusConflict, "account_changed", "account credentials changed; repeat the operation")
	case errors.Is(err, ErrAccountNotFound):
		httpx.WriteError(w, http.StatusNotFound, "not_found", "account not found")
	default:
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

func requestIP(r *http.Request) string {
	if forwarded := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-For"), ",")[0]); net.ParseIP(forwarded) != nil {
		return forwarded
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && net.ParseIP(host) != nil {
		return host
	}
	return ""
}
