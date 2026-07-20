package auth

import (
	"net/http"
	"time"
)

// ValidCSRFRequest exposes the same double-submit protection used by auth
// mutations to adjacent authenticated account modules.
func ValidCSRFRequest(r *http.Request) bool {
	return validCSRF(r)
}

// ClearSessionCookies expires both the HttpOnly refresh cookie and the readable
// CSRF cookie. Account deletion uses this after the user row and all refresh
// families have been removed transactionally.
func ClearSessionCookies(w http.ResponseWriter, secure bool) {
	expiresAt := time.Unix(1, 0).UTC()
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Path:     "/api/v1/auth",
		Expires:  expiresAt,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     csrfCookieName,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   -1,
		HttpOnly: false,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}
