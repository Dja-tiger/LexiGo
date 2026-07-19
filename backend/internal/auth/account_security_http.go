package auth

import (
	"net/http"

	"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type reauthenticateRequest struct {
	CurrentPassword string `json:"currentPassword"`
}

type accountSessionsResponse struct {
	Sessions []AccountSession `json:"sessions"`
}

type accountAuditResponse struct {
	Events []AccountAuditEvent `json:"events"`
}

func (h *Handler) AccountSessions(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	refreshToken, err := h.refreshToken(r)
	if err != nil {
		h.clearSessionCookies(w)
		h.writeServiceError(w, ErrCurrentSessionNotFound)
		return
	}
	sessions, err := h.service.AccountSessions(r.Context(), userID, refreshToken)
	if err != nil {
		if err == ErrCurrentSessionNotFound {
			h.clearSessionCookies(w)
		}
		h.writeServiceError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, accountSessionsResponse{Sessions: sessions})
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	if !validCSRF(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	refreshToken, err := h.refreshToken(r)
	if err != nil {
		h.clearSessionCookies(w)
		h.writeServiceError(w, ErrCurrentSessionNotFound)
		return
	}
	var request changePasswordRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		h.writeInvalidRequest(w)
		return
	}
	if err := h.service.ChangePassword(
		r.Context(),
		userID,
		refreshToken,
		request.CurrentPassword,
		request.NewPassword,
		r.UserAgent(),
		clientIP(r),
	); err != nil {
		if err == ErrCurrentSessionNotFound {
			h.clearSessionCookies(w)
		}
		h.writeServiceError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RevokeOtherSessions(w http.ResponseWriter, r *http.Request) {
	if !validCSRF(r) {
		httpx.WriteError(w, http.StatusForbidden, "csrf_failed", "CSRF validation failed")
		return
	}
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	refreshToken, err := h.refreshToken(r)
	if err != nil {
		h.clearSessionCookies(w)
		h.writeServiceError(w, ErrCurrentSessionNotFound)
		return
	}
	var request reauthenticateRequest
	if err := httpx.DecodeJSON(w, r, &request); err != nil {
		h.writeInvalidRequest(w)
		return
	}
	if err := h.service.RevokeOtherSessions(
		r.Context(),
		userID,
		refreshToken,
		request.CurrentPassword,
		r.UserAgent(),
		clientIP(r),
	); err != nil {
		if err == ErrCurrentSessionNotFound {
			h.clearSessionCookies(w)
		}
		h.writeServiceError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AccountAudit(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UserID(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
		return
	}
	events, err := h.service.RecentAccountAudit(r.Context(), userID, 50)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.WriteJSON(w, http.StatusOK, accountAuditResponse{Events: events})
}
