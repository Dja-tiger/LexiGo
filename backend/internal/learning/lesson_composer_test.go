package learning

import (
	"reflect"
	"testing"
	"time"
)

func TestComposeMixedLessonAlternatesWithinPriorityTiers(t *testing.T) {
	now := time.Date(2026, 7, 17, 10, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 6, Kind: "phrase", Status: "review", DueAt: now.Add(3 * time.Hour)},
		{WordID: 2, Kind: "word", Status: "new", DueAt: now.Add(2 * time.Hour)},
		{WordID: 4, Kind: "phrase", Status: "new", DueAt: now.Add(2 * time.Hour)},
		{WordID: 1, Kind: "word", Status: "review", DueAt: now.Add(-2 * time.Hour), Due: true},
		{WordID: 3, Kind: "phrase", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
		{WordID: 5, Kind: "word", Status: "review", DueAt: now.Add(4 * time.Hour)},
	}

	selected, composition := composeLessonCandidates(candidates, "mixed", 6)
	ids := make([]int64, 0, len(selected))
	for _, candidate := range selected {
		ids = append(ids, candidate.WordID)
	}
	want := []int64{1, 3, 2, 4, 5, 6}
	if !reflect.DeepEqual(ids, want) {
		t.Fatalf("selected ids = %v, want %v", ids, want)
	}
	if composition.Total != 6 || composition.Words != 3 || composition.Phrases != 3 || composition.Due != 2 || composition.New != 2 || composition.Scheduled != 2 || composition.Fallback != "" {
		t.Fatalf("unexpected composition: %+v", composition)
	}
}

func TestComposeMixedLessonNeverSelectsNewBeforeRemainingDue(t *testing.T) {
	now := time.Date(2026, 7, 17, 10, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "new", DueAt: now.Add(time.Hour)},
		{WordID: 2, Kind: "phrase", Status: "review", DueAt: now.Add(-2 * time.Hour), Due: true},
		{WordID: 3, Kind: "phrase", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
	}

	selected, composition := composeLessonCandidates(candidates, "mixed", 3)
	ids := make([]int64, 0, len(selected))
	for _, candidate := range selected {
		ids = append(ids, candidate.WordID)
	}
	want := []int64{2, 3, 1}
	if !reflect.DeepEqual(ids, want) {
		t.Fatalf("selected ids = %v, want %v", ids, want)
	}
	if composition.Due != 2 || composition.New != 1 {
		t.Fatalf("unexpected composition: %+v", composition)
	}
}

func TestComposeMixedLessonContinuesAlternationAcrossTierBoundary(t *testing.T) {
	now := time.Date(2026, 7, 17, 10, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
		{WordID: 2, Kind: "phrase", Status: "new", DueAt: now.Add(time.Hour)},
		{WordID: 3, Kind: "word", Status: "new", DueAt: now.Add(2 * time.Hour)},
	}

	selected, _ := composeLessonCandidates(candidates, "mixed", 3)
	ids := []int64{selected[0].WordID, selected[1].WordID, selected[2].WordID}
	want := []int64{1, 2, 3}
	if !reflect.DeepEqual(ids, want) {
		t.Fatalf("selected ids = %v, want %v", ids, want)
	}
}

func TestComposeMixedLessonFallsBackWithoutStopping(t *testing.T) {
	now := time.Now().UTC()
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
		{WordID: 2, Kind: "word", Status: "new", DueAt: now.Add(time.Hour)},
	}
	selected, composition := composeLessonCandidates(candidates, "mixed", 15)
	if len(selected) != 2 || composition.Words != 2 || composition.Phrases != 0 || composition.Fallback != lessonFallbackWordsOnly {
		t.Fatalf("unexpected fallback composition: %+v", composition)
	}
}

func TestComposeEmptyLessonReportsEmptyFallback(t *testing.T) {
	selected, composition := composeLessonCandidates(nil, "mixed", 15)
	if len(selected) != 0 || composition.Total != 0 || composition.Fallback != lessonFallbackEmpty {
		t.Fatalf("unexpected empty composition: %+v", composition)
	}
}
