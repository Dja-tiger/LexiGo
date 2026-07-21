package performance

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandlerJourneyAcceptsValidAnonymousTransition(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/product/journey", strings.NewReader(`{
		"appVersion":"release-2026.07.21",
		"fromRoute":"/dictionary",
		"toRoute":"/learn",
		"intent":"catalog_configure_lesson",
		"backtrack":false,
		"deviceClass":"tablet",
		"browserFamily":"webkit",
		"displayMode":"standalone"
	}`))
	response := httptest.NewRecorder()

	handler.Journey(response, request)

	if response.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusAccepted, response.Body.String())
	}
	if response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", response.Header().Get("Cache-Control"))
	}
	if len(store.journeys) != 1 || store.journeys[0].Intent != "catalog_configure_lesson" {
		t.Fatalf("stored journeys = %+v", store.journeys)
	}
}

func TestHandlerJourneyRejectsUnknownPrivacySensitiveFields(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/product/journey", strings.NewReader(`{
		"appVersion":"release-2026.07.21",
		"fromRoute":"/",
		"toRoute":"/dictionary",
		"intent":"home_find_material",
		"backtrack":false,
		"deviceClass":"mobile",
		"browserFamily":"webkit",
		"displayMode":"standalone",
		"sessionId":"private-session-value"
	}`))
	response := httptest.NewRecorder()

	handler.Journey(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusBadRequest, response.Body.String())
	}
	if len(store.journeys) != 0 {
		t.Fatalf("unexpected stored journeys = %+v", store.journeys)
	}
}

func TestHandlerJourneyReturnsInternalErrorWithoutLeakingStorageFailure(t *testing.T) {
	store := &recordingStore{journeyErr: errors.New("database credentials and internal details")}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/product/journey", strings.NewReader(`{
		"appVersion":"release-2026.07.21",
		"fromRoute":"/",
		"toRoute":"/learn",
		"intent":"home_configure_lesson",
		"backtrack":false,
		"deviceClass":"desktop",
		"browserFamily":"chromium",
		"displayMode":"browser"
	}`))
	response := httptest.NewRecorder()

	handler.Journey(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if strings.Contains(response.Body.String(), "credentials") {
		t.Fatalf("storage error leaked in response: %s", response.Body.String())
	}
}
