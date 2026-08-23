package learning

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidLessonSizeAcceptsOnlyBoundedManualVocabulary(t *testing.T) {
	valid := []string{"15", "30", "50", "all"}
	for _, value := range valid {
		if !validLessonSize(value) {
			t.Fatalf("validLessonSize(%q) = false, want true", value)
		}
	}

	invalid := []string{"", "0", "14", "31", "60", "51", "All", "ALL", "all ", "100"}
	for _, value := range invalid {
		if validLessonSize(value) {
			t.Fatalf("validLessonSize(%q) = true, want false", value)
		}
	}
}

func TestValidateLessonConfigurationEnforcesLessonSizeHTTPContract(t *testing.T) {
	for _, value := range []string{"15", "30", "50", "all"} {
		t.Run("accept_"+value, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			if ok := validateLessonConfiguration(recorder, "mixed", AnswerModeRecall, value, "", nil); !ok {
				t.Fatalf("validateLessonConfiguration lessonSize=%q = false, want true; body=%s", value, recorder.Body.String())
			}
			if recorder.Body.Len() != 0 {
				t.Fatalf("valid lessonSize=%q unexpectedly wrote response body %q", value, recorder.Body.String())
			}
		})
	}

	for _, value := range []string{"60", "51", "All", ""} {
		t.Run("reject_"+value, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			if ok := validateLessonConfiguration(recorder, "mixed", AnswerModeRecall, value, "", nil); ok {
				t.Fatalf("validateLessonConfiguration lessonSize=%q = true, want false", value)
			}
			if recorder.Code != http.StatusUnprocessableEntity {
				t.Fatalf("lessonSize=%q status=%d, want %d", value, recorder.Code, http.StatusUnprocessableEntity)
			}
			if body := recorder.Body.String(); !strings.Contains(body, `"code":"invalid_lesson_size"`) {
				t.Fatalf("lessonSize=%q body=%q, want invalid_lesson_size error", value, body)
			}
		})
	}
}
