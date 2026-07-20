//go:build integration

package integration

import (
	"net/http"
	"testing"
)

// getWithToken keeps the account privacy scenario explicit while delegating to
// the shared authenticated GET helper used by the rest of the integration suite.
func getWithToken(
	t *testing.T,
	client *http.Client,
	endpoint,
	accessToken string,
	expectedStatus int,
) {
	t.Helper()
	getWithBearer(t, client, endpoint, accessToken, expectedStatus)
}
