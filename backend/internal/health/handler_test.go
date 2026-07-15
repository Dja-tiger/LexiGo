package health

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLive(t *testing.T) {
	handler := &Handler{}
	recorder := httptest.NewRecorder()
	handler.Live(recorder, httptest.NewRequest(http.MethodGet, "/health/live", nil))
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d", recorder.Code)
	}
}
