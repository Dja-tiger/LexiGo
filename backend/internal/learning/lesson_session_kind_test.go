package learning

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestValidLessonSessionKind(t *testing.T) {
	t.Parallel()

	valid := []LessonSessionKind{
		"",
		LessonSessionKindStudy,
		LessonSessionKindReview,
		LessonSessionKindRemediation,
	}
	for _, kind := range valid {
		kind := kind
		t.Run(string(kind), func(t *testing.T) {
			t.Parallel()
			if !validLessonSessionKind(kind) {
				t.Fatalf("validLessonSessionKind(%q) = false, want true", kind)
			}
		})
	}

	if validLessonSessionKind("future") {
		t.Fatal("validLessonSessionKind(future) = true, want false")
	}
}

func TestLessonSessionKindJSONBackwardCompatibility(t *testing.T) {
	t.Parallel()

	legacy, err := json.Marshal(LessonSession{ID: "legacy"})
	if err != nil {
		t.Fatalf("marshal legacy lesson: %v", err)
	}
	if strings.Contains(string(legacy), `"sessionKind"`) {
		t.Fatalf("legacy lesson unexpectedly serializes sessionKind: %s", legacy)
	}

	explicit, err := json.Marshal(LessonSession{ID: "review", SessionKind: LessonSessionKindReview})
	if err != nil {
		t.Fatalf("marshal explicit lesson: %v", err)
	}
	if !strings.Contains(string(explicit), `"sessionKind":"review"`) {
		t.Fatalf("explicit lesson does not serialize review sessionKind: %s", explicit)
	}
}

func TestValidLessonSelectionReasonIncludesSessionArchitectureReasons(t *testing.T) {
	t.Parallel()

	valid := []LessonSelectionReason{
		LessonReasonRecentFailure,
		LessonReasonDue,
		LessonReasonOverdue,
		LessonReasonRelearningDue,
		LessonReasonRepeatedAgain,
		LessonReasonRepeatedAlmost,
		LessonReasonWeakTopic,
		LessonReasonNew,
		LessonReasonScheduled,
		LessonReasonManual,
	}
	for _, reason := range valid {
		reason := reason
		t.Run(string(reason), func(t *testing.T) {
			t.Parallel()
			if !validLessonSelectionReason(reason) {
				t.Fatalf("validLessonSelectionReason(%q) = false, want true", reason)
			}
		})
	}

	if validLessonSelectionReason("future_reason") {
		t.Fatal("validLessonSelectionReason(future_reason) = true, want false")
	}
}
