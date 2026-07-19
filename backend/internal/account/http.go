package account

import (
	"crypto/subtle"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

const (
	csrfCookieName = "lexigo_csrf"
	csrfHeaderName = "X-CSRF-Token"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type exportRequest struct {
	CurrentPassword string `json:"currentPassword"`
}

func (h *Handler) Export(w http.ResponseWriter, r *http.Request) {
	if !validCSRF(r) {
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

func (h *Handler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrReauthenticationFailed):
		httpx.WriteFieldError(w, http.StatusUnauthorized, "reauthentication_failed", "current password is invalid", "currentPassword")
	case errors.Is(err, ErrAccountNotFound):
		httpx.WriteError(w, http.StatusNotFound, "not_found", "account not found")
	default:
		httpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
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
