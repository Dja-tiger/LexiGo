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
	Subject   string `json:"sub"`
	Email     string `json:"email"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
	Issuer    string `json:"iss"`
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
	now := m.now().UTC()
	expiresAt := now.Add(m.ttl)
	header, _ := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	claims, err := json.Marshal(accessClaims{
		Subject: user.ID, Email: user.Email, IssuedAt: now.Unix(), ExpiresAt: expiresAt.Unix(), Issuer: "lexigo",
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
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", ErrInvalidAccess
	}
	unsigned := parts[0] + "." + parts[1]
	provided, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return "", ErrInvalidAccess
	}
	mac := hmac.New(sha256.New, m.secret)
	_, _ = mac.Write([]byte(unsigned))
	if !hmac.Equal(provided, mac.Sum(nil)) {
		return "", ErrInvalidAccess
	}

	headerPayload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", ErrInvalidAccess
	}
	var header map[string]string
	if err := json.Unmarshal(headerPayload, &header); err != nil || header["alg"] != "HS256" || header["typ"] != "JWT" {
		return "", ErrInvalidAccess
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", ErrInvalidAccess
	}
	var claims accessClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", ErrInvalidAccess
	}
	if claims.Issuer != "lexigo" || claims.Subject == "" || m.now().Unix() >= claims.ExpiresAt {
		return "", ErrInvalidAccess
	}
	return claims.Subject, nil
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
