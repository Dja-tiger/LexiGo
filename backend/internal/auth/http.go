package auth

import (
	"errors"
	"net"
	"net/http"
	"strings"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler { return &Handler{service: service} }

type credentialsRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName,omitempty"`
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type authResponse struct {
	User   User      `json:"user"`
	Tokens TokenPair `json:"tokens"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var request credentialsRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON request")
		return
	}
	user, pair, err := h.service.Register(r.Context(), request.Email, request.Password, request.DisplayName, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, authResponse{User: user, Tokens: pair})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var request credentialsRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON request")
		return
	}
	user, pair, err := h.service.Login(r.Context(), request.Email, request.Password, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, authResponse{User: user, Tokens: pair})
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var request refreshRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON request")
		return
	}
	pair, err := h.service.Refresh(r.Context(), request.RefreshToken, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, pair)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var request refreshRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON request")
		return
	}
	if err := h.service.Logout(r.Context(), request.RefreshToken); err != nil && !errors.Is(err, ErrInvalidRefresh) {
		h.writeServiceError(w, err)
		return
	}
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

func (h *Handler) writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrEmailTaken):
		httpx.WriteError(w, http.StatusConflict, "email_taken", "email is already registered")
	case errors.Is(err, ErrInvalidLogin), errors.Is(err, ErrInvalidRefresh), errors.Is(err, ErrInvalidAccess):
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "invalid credentials or token")
	case errors.Is(err, ErrUserNotFound):
		httpx.WriteError(w, http.StatusNotFound, "not_found", "user not found")
	case strings.Contains(err.Error(), "invalid email"), strings.Contains(err.Error(), "password must"):
		httpx.WriteError(w, http.StatusUnprocessableEntity, "validation_error", err.Error())
	default:
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
