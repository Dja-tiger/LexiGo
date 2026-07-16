package auth

import (
	"os"
	"strings"
	"testing"
)

func TestOpenAPIUsesCookieBackedRefreshSessions(t *testing.T) {
	contract, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read OpenAPI contract: %v", err)
	}
	content := string(contract)

	requiredFragments := []string{
		"/api/v1/auth/refresh:",
		"/api/v1/auth/logout:",
		"refreshCookie:",
		"csrfHeader:",
		"name: lexigo_refresh",
		"name: X-CSRF-Token",
		"$ref: \"#/components/schemas/AuthResponse\"",
		"ProgressSummary:",
		"Error:",
	}
	for _, fragment := range requiredFragments {
		if !strings.Contains(content, fragment) {
			t.Errorf("OpenAPI contract is missing %q", fragment)
		}
	}

	forbiddenFragments := []string{
		"RefreshRequest:",
		"refreshToken:",
		"required: [accessToken, refreshToken, tokenType, expiresIn]",
	}
	for _, fragment := range forbiddenFragments {
		if strings.Contains(content, fragment) {
			t.Errorf("OpenAPI contract still exposes legacy refresh-token JSON field %q", fragment)
		}
	}
}
