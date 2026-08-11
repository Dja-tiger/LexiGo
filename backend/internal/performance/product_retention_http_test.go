package performance

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandlerProductRetentionAcceptsAnonymousEvent(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/product/retention", strings.NewReader(`{
		"appVersion":"release-2026.08.11",
		"event":"completion_to_next_action",
		"action":"review_due",
		"delayBucket":"under_5m",
		"deviceClass":"mobile",
		"browserFamily":"webkit",
		"displayMode":"standalone"
	}`))
	response := httptest.NewRecorder()

	handler.ProductRetention(response, request)

	if response.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusAccepted, response.Body.String())
	}
	if response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", response.Header().Get("Cache-Control"))
	}
	if len(store.productRetention) != 1 {
		t.Fatalf("stored retention events = %+v", store.productRetention)
	}
	if stored := store.productRetention[0]; stored.Event != ProductRetentionEventNextAction || stored.Action != ProductRetentionActionReviewDue {
		t.Fatalf("stored retention event = %+v", stored)
	}
}

func TestHandlerProductRetentionRejectsPrivacySensitiveUnknownFields(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/product/retention", strings.NewReader(`{
		"appVersion":"release-2026.08.11",
		"event":"lesson_completed",
		"action":"next_lesson",
		"delayBucket":"none",
		"deviceClass":"desktop",
		"browserFamily":"chromium",
		"displayMode":"browser",
		"userId":"00000000-0000-0000-0000-000000000001"
	}`))
	response := httptest.NewRecorder()

	handler.ProductRetention(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusBadRequest, response.Body.String())
	}
	if len(store.productRetention) != 0 {
		t.Fatalf("unexpected stored retention events = %+v", store.productRetention)
	}
}

func TestHandlerProductRetentionRejectsInvalidCrossEventCombination(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/product/retention", strings.NewReader(`{
		"appVersion":"release-2026.08.11",
		"event":"return_to_next_session",
		"action":"home",
		"delayBucket":"under_24h",
		"deviceClass":"desktop",
		"browserFamily":"firefox",
		"displayMode":"browser"
	}`))
	response := httptest.NewRecorder()

	handler.ProductRetention(response, request)

	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusUnprocessableEntity, response.Body.String())
	}
	if len(store.productRetention) != 0 {
		t.Fatalf("unexpected stored retention events = %+v", store.productRetention)
	}
}

func TestHandlerProductRetentionReturnsInternalErrorWithoutLeakingStorageFailure(t *testing.T) {
	store := &recordingStore{productRetentionErr: errors.New("database credentials and internal details")}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/product/retention", strings.NewReader(`{
		"appVersion":"release-2026.08.11",
		"event":"lesson_completed",
		"action":"home",
		"delayBucket":"none",
		"deviceClass":"desktop",
		"browserFamily":"chromium",
		"displayMode":"browser"
	}`))
	response := httptest.NewRecorder()

	handler.ProductRetention(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusInternalServerError, response.Body.String())
	}
	if strings.Contains(response.Body.String(), "credentials") {
		t.Fatalf("storage error leaked in response: %s", response.Body.String())
	}
}

func TestHandlerProductRetentionRejectsOversizedBody(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/product/retention",
		strings.NewReader(`{"payload":"`+strings.Repeat("x", MaxProductRetentionEventBytes)+`"}`),
	)
	response := httptest.NewRecorder()

	handler.ProductRetention(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
	}
}
