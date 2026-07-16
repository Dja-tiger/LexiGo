package auth

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestTokenPairNeverSerializesRefreshToken(t *testing.T) {
	payload, err := json.Marshal(TokenPair{
		AccessToken:  "short-lived-access-token",
		RefreshToken: "long-lived-refresh-secret",
		TokenType:    "Bearer",
		ExpiresIn:    900,
	})
	if err != nil {
		t.Fatalf("marshal token pair: %v", err)
	}

	serialized := string(payload)
	if strings.Contains(serialized, "refreshToken") || strings.Contains(serialized, "long-lived-refresh-secret") {
		t.Fatalf("refresh token leaked into JSON: %s", serialized)
	}
	if !strings.Contains(serialized, "short-lived-access-token") {
		t.Fatalf("access token is missing from JSON: %s", serialized)
	}
}
