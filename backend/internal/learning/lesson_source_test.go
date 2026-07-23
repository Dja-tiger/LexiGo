package learning

import "testing"

func TestValidLessonSource(t *testing.T) {
	t.Parallel()

	valid := []string{
		"mixed",
		"noun",
		"verb",
		"adjective",
		"phrases",
		"daily-life",
		"travel",
		"data-engineering",
		"backend",
		"academic-technical-english",
	}
	for _, source := range valid {
		if !validLessonSource(source) {
			t.Errorf("validLessonSource(%q) = false, want true", source)
		}
	}

	for _, source := range []string{"", "general", "frontend", "adverb", "data_engineering"} {
		if validLessonSource(source) {
			t.Errorf("validLessonSource(%q) = true, want false", source)
		}
	}
}
