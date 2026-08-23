package learning

import "testing"

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
