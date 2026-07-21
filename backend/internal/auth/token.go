package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

type TokenManager struct {
	secret []byte
	ttl    time.Duration
	now    func() time.Time
}

type accessClaims struct {
	Subject     string `json:"sub"`
	Email       string `json:"email"`
	AuthVersion int64  `json:"auth_version"`
	IssuedAt    int64  `json:"iat"`
	ExpiresAt   int64  `json:"exp"`
	Issuer      string `json:"iss"`
}

type AccessIdentity struct {
	UserID      string
	AuthVersion int64
}

func NewTokenManager(secret string, ttl time.Duration) (*TokenManager, error) {
	if len(secret) < 32 {
		return nil, fmt.Errorf("token secret must contain at least 32 characters")
	}
	if ttl <= 0 {
		return nil, fmt.Errorf("token TTL must be positive")
	}
	return &TokenManager{secret: []byte(secret), ttl: ttl, now: time.Now}, nil
}

func (m *TokenManager) IssueAccess(user User) (string, time.Time, error) {
	if user.ID == "" || user.AuthVersion <= 0 {
		return "", time.Time{}, ErrInvalidAccess
	}
	now := m.now().UTC()
	expiresAt := now.Add(m.ttl)
	header, _ := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	claims, err := json.Marshal(accessClaims{
		Subject: user.ID, Email: user.Email, AuthVersion: user.AuthVersion,
		IssuedAt: now.Unix(), ExpiresAt: expiresAt.Unix(), Issuer: "lexigo",
	})
	if err != nil {
		return "", time.Time{}, fmt.Errorf("marshal access claims: %w", err)
	}
	unsigned := encode(header) + "." + encode(claims)
	mac := hmac.New(sha256.New, m.secret)
	_, _ = mac.Write([]byte(unsigned))
	return unsigned + "." + encode(mac.Sum(nil)), expiresAt, nil
}

func (m *TokenManager) ParseAccess(token string) (string, error) {
	identity, err := m.ParseAccessIdentity(token)
	if err != nil {
		return "", err
	}
	return identity.UserID, nil
}

func (m *TokenManager) ParseAccessIdentity(token string) (AccessIdentity, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return AccessIdentity{}, ErrInvalidAccess
	}
	unsigned := parts[0] + "." + parts[1]
	provided, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return AccessIdentity{}, ErrInvalidAccess
	}
	mac := hmac.New(sha256.New, m.secret)
	_, _ = mac.Write([]byte(unsigned))
	if !hmac.Equal(provided, mac.Sum(nil)) {
		return AccessIdentity{}, ErrInvalidAccess
	}

	headerPayload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return AccessIdentity{}, ErrInvalidAccess
	}
	var header map[string]string
	if err := json.Unmarshal(headerPayload, &header); err != nil || header["alg"] != "HS256" || header["typ"] != "JWT" {
		return AccessIdentity{}, ErrInvalidAccess
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return AccessIdentity{}, ErrInvalidAccess
	}
	var claims accessClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return AccessIdentity{}, ErrInvalidAccess
	}
	if claims.Issuer != "lexigo" || claims.Subject == "" || claims.AuthVersion <= 0 || m.now().Unix() >= claims.ExpiresAt {
		return AccessIdentity{}, ErrInvalidAccess
	}
	return AccessIdentity{UserID: claims.Subject, AuthVersion: claims.AuthVersion}, nil
}

func NewRefreshToken() (plain string, hash []byte, err error) {
	raw := make([]byte, 48)
	if _, err := rand.Read(raw); err != nil {
		return "", nil, fmt.Errorf("generate refresh token: %w", err)
	}
	plain = base64.RawURLEncoding.EncodeToString(raw)
	digest := sha256.Sum256([]byte(plain))
	return plain, digest[:], nil
}

func HashRefreshToken(token string) ([]byte, error) {
	if strings.TrimSpace(token) == "" {
		return nil, errors.New("refresh token is empty")
	}
	digest := sha256.Sum256([]byte(token))
	return digest[:], nil
}

func encode(value []byte) string {
	return base64.RawURLEncoding.EncodeToString(value)
}
