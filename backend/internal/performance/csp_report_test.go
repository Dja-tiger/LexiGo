package performance

import (
	"bytes"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCSPReportLogsOnlySanitizedViolationMetadata(t *testing.T) {
	var logs bytes.Buffer
	handler := NewHandler(nil, slog.New(slog.NewJSONHandler(&logs, nil)))
	request := httptest.NewRequest(http.MethodPost, "/api/v1/security/csp-report", strings.NewReader(`{
		"csp-report": {
			"document-uri": "https://stage.lexigo.example/profile?email=secret@example.com#token",
			"blocked-uri": "https://tracker.example.net/script.js?identity=secret",
			"source-file": "https://stage.lexigo.example/_next/app.js?token=secret",
			"effective-directive": "script-src-elem",
			"disposition": "report",
			"status-code": 200,
			"line-number": 17,
			"column-number": 9,
			"script-sample": "secret inline source"
		}
	}`))
	request.Header.Set("Content-Type", "application/csp-report")
	response := httptest.NewRecorder()

	handler.CSPReport(response, request)

	if response.Code != http.StatusNoContent || response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("response = %d, cache-control %q", response.Code, response.Header().Get("Cache-Control"))
	}
	output := logs.String()
	for _, expected := range []string{"script-src-elem", "https://stage.lexigo.example", "https://tracker.example.net"} {
		if !strings.Contains(output, expected) {
			t.Fatalf("sanitized log is missing %q: %s", expected, output)
		}
	}
	for _, secret := range []string{"secret@example.com", "identity=secret", "token=secret", "secret inline source"} {
		if strings.Contains(output, secret) {
			t.Fatalf("CSP report leaked %q: %s", secret, output)
		}
	}
}

func TestCSPReportRejectsMissingDirective(t *testing.T) {
	handler := NewHandler(nil)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/security/csp-report", strings.NewReader(`{"csp-report":{}}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	handler.CSPReport(response, request)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnprocessableEntity)
	}
}

func TestCSPReportRejectsCrossSiteFormMediaType(t *testing.T) {
	handler := NewHandler(nil)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/security/csp-report", strings.NewReader(`{"csp-report":{"effective-directive":"script-src"}}`))
	request.Header.Set("Content-Type", "text/plain")
	response := httptest.NewRecorder()

	handler.CSPReport(response, request)

	if response.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusUnsupportedMediaType)
	}
}
