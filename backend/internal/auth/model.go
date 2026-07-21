package auth

import "time"

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"displayName"`
	PasswordHash string    `json:"-"`
	AuthVersion  int64     `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

// TokenPair contains the short-lived access token returned to the browser and
// the refresh token consumed only by the HTTP layer when issuing an HttpOnly
// cookie. RefreshToken must never be serialized into an API response.
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"-"`
	TokenType    string `json:"tokenType"`
	ExpiresIn    int64  `json:"expiresIn"`
}
