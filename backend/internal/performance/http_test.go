package performance

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type recordingStore struct {
	reports []Report
	err     error
}

func (store *recordingStore) StoreReport(_ context.Context, report Report) error {
	if store.err != nil {
		return store.err
	}
	store.reports = append(store.reports, report)
	return nil
}

func TestHandlerReportAcceptsValidAnonymousBatch(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/performance/rum", strings.NewReader(`{
		"appVersion":"release-2026.07.20",
		"route":"/learn",
		"deviceClass":"tablet",
		"browserFamily":"chromium",
		"displayMode":"browser",
		"samples":[{"name":"INP","value":145,"rating":"good","navigationType":"navigate"}]
	}`))
	response := httptest.NewRecorder()

	handler.Report(response, request)

	if response.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusAccepted, response.Body.String())
	}
	if response.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("Cache-Control = %q, want no-store", response.Header().Get("Cache-Control"))
	}
	if len(store.reports) != 1 || len(store.reports[0].Samples) != 1 {
		t.Fatalf("stored reports = %+v", store.reports)
	}
}

func TestHandlerReportRejectsUnknownPrivacySensitiveFields(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/performance/rum", strings.NewReader(`{
		"appVersion":"release-2026.07.20",
		"route":"/learn",
		"deviceClass":"tablet",
		"browserFamily":"chromium",
		"displayMode":"browser",
		"userId":"00000000-0000-0000-0000-000000000001",
		"samples":[{"name":"INP","value":145,"rating":"good","navigationType":"navigate"}]
	}`))
	response := httptest.NewRecorder()

	handler.Report(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusBadRequest, response.Body.String())
	}
	if len(store.reports) != 0 {
		t.Fatalf("unexpected stored reports = %+v", store.reports)
	}
}

func TestHandlerReportRejectsOversizedBody(t *testing.T) {
	store := &recordingStore{}
	handler := NewHandler(store)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/performance/rum",
		strings.NewReader(`{"payload":"`+strings.Repeat("x", MaxReportBytes)+`"}`),
	)
	response := httptest.NewRecorder()

	handler.Report(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
	}
}

func TestHandlerReportReturnsInternalErrorWithoutLeakingStorageFailure(t *testing.T) {
	store := &recordingStore{err: errors.New("database credentials and internal details")}
	handler := NewHandler(store)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/performance/rum", strings.NewReader(`{
		"appVersion":"release-2026.07.20",
		"route":"/progress",
		"deviceClass":"desktop",
		"browserFamily":"firefox",
		"displayMode":"browser",
		"samples":[{"name":"CLS","value":0.05,"rating":"good","navigationType":"reload"}]
	}`))
	response := httptest.NewRecorder()

	handler.Report(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if strings.Contains(response.Body.String(), "credentials") {
		t.Fatalf("storage error leaked in response: %s", response.Body.String())
	}
}
