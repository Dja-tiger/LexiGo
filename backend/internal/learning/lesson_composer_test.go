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
	if composition.ReviewRatio != defaultLessonReviewRatio {
		t.Fatalf("review ratio = %d, want %d", composition.ReviewRatio, defaultLessonReviewRatio)
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

func TestExcludeLessonCandidatesPreservesQueueOrderAndMetadata(t *testing.T) {
	now := time.Date(2026, 7, 23, 9, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 10, Kind: "word", Status: "learning", DueAt: now, Due: true},
		{WordID: 11, Kind: "phrase", Status: "new", DueAt: now.Add(time.Hour)},
		{WordID: 12, Kind: "word", Status: "review", DueAt: now.Add(2 * time.Hour)},
	}

	filtered := excludeLessonCandidates(candidates, map[int64]struct{}{10: {}, 12: {}})
	if len(filtered) != 1 {
		t.Fatalf("filtered candidates = %d, want 1", len(filtered))
	}
	if !reflect.DeepEqual(filtered[0], candidates[1]) {
		t.Fatalf("filtered candidate = %+v, want %+v", filtered[0], candidates[1])
	}
}

func TestExcludeLessonCandidatesWithoutPreviousLessonReturnsOriginalQueue(t *testing.T) {
	candidates := []lessonCandidate{{WordID: 1}, {WordID: 2}}
	filtered := excludeLessonCandidates(candidates, nil)
	if len(filtered) != 2 || &filtered[0] != &candidates[0] {
		t.Fatal("queue without exclusions should be returned unchanged")
	}
}

func TestAdaptivePriorityExplainsRecentFailureBeforeDueAndWeakTopic(t *testing.T) {
	now := time.Date(2026, 8, 10, 8, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 4, Kind: "word", Status: "review", DueAt: now.Add(4 * time.Hour)},
		{WordID: 2, Kind: "word", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
		{WordID: 3, Kind: "word", Status: "review", DueAt: now.Add(2 * time.Hour), WeakTopic: true},
		{WordID: 1, Kind: "word", Status: "learning", DueAt: now.Add(time.Hour), RecentFailure: true},
	}

	selected, _ := composeLessonCandidates(candidates, "noun", 4, 100)
	ids := []int64{selected[0].WordID, selected[1].WordID, selected[2].WordID, selected[3].WordID}
	want := []int64{1, 2, 3, 4}
	if !reflect.DeepEqual(ids, want) {
		t.Fatalf("selected ids = %v, want %v", ids, want)
	}
	reasons := []LessonSelectionReason{
		lessonCandidateReason(selected[0]),
		lessonCandidateReason(selected[1]),
		lessonCandidateReason(selected[2]),
		lessonCandidateReason(selected[3]),
	}
	wantReasons := []LessonSelectionReason{LessonReasonRecentFailure, LessonReasonDue, LessonReasonWeakTopic, LessonReasonScheduled}
	if !reflect.DeepEqual(reasons, wantReasons) {
		t.Fatalf("reasons = %v, want %v", reasons, wantReasons)
	}
}

func TestAdaptiveReviewRatioIsControlledAndFillsShortages(t *testing.T) {
	now := time.Date(2026, 8, 10, 8, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "review", DueAt: now.Add(-4 * time.Hour), Due: true},
		{WordID: 2, Kind: "word", Status: "review", DueAt: now.Add(-3 * time.Hour), Due: true},
		{WordID: 3, Kind: "word", Status: "review", DueAt: now.Add(time.Hour)},
		{WordID: 4, Kind: "word", Status: "review", DueAt: now.Add(2 * time.Hour)},
		{WordID: 5, Kind: "word", Status: "new", DueAt: now.Add(3 * time.Hour)},
		{WordID: 6, Kind: "word", Status: "new", DueAt: now.Add(4 * time.Hour)},
		{WordID: 7, Kind: "word", Status: "new", DueAt: now.Add(5 * time.Hour)},
		{WordID: 8, Kind: "word", Status: "new", DueAt: now.Add(6 * time.Hour)},
	}

	selected, composition := composeLessonCandidates(candidates, "noun", 6, 50)
	if len(selected) != 6 || composition.ReviewRatio != 50 || composition.New != 3 {
		t.Fatalf("unexpected 50/50 composition: %+v", composition)
	}
	reviews := 0
	for _, candidate := range selected {
		if candidate.Status != "new" {
			reviews++
		}
	}
	if reviews != 3 {
		t.Fatalf("review items = %d, want 3", reviews)
	}

	selected, composition = composeLessonCandidates(candidates[:5], "noun", 5, 20)
	if len(selected) != 5 || composition.New != 1 {
		t.Fatalf("short new queue must be filled by review items: %+v", composition)
	}
}

func TestAdaptiveQueueAvoidsThirdSameTopicAndPartOfSpeechWhenAlternativeExists(t *testing.T) {
	now := time.Date(2026, 8, 10, 8, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "review", DueAt: now, Topic: "Data Engineering", PartOfSpeech: "noun"},
		{WordID: 2, Kind: "word", Status: "review", DueAt: now.Add(time.Minute), Topic: "Data Engineering", PartOfSpeech: "noun"},
		{WordID: 3, Kind: "word", Status: "review", DueAt: now.Add(2 * time.Minute), Topic: "Data Engineering", PartOfSpeech: "noun"},
		{WordID: 4, Kind: "word", Status: "review", DueAt: now.Add(3 * time.Minute), Topic: "Backend Development", PartOfSpeech: "verb"},
	}

	selected, _ := composeLessonCandidates(candidates, "mixed", 4, 100)
	ids := []int64{selected[0].WordID, selected[1].WordID, selected[2].WordID, selected[3].WordID}
	want := []int64{1, 2, 4, 3}
	if !reflect.DeepEqual(ids, want) {
		t.Fatalf("diversified ids = %v, want %v", ids, want)
	}
}

func TestResolveLessonReviewRatioDefaultsAndClamps(t *testing.T) {
	if got := resolveLessonReviewRatio(nil); got != defaultLessonReviewRatio {
		t.Fatalf("default ratio = %d, want %d", got, defaultLessonReviewRatio)
	}
	negative := -10
	if got := resolveLessonReviewRatio(&negative); got != 0 {
		t.Fatalf("negative ratio = %d, want 0", got)
	}
	tooHigh := 150
	if got := resolveLessonReviewRatio(&tooHigh); got != 100 {
		t.Fatalf("high ratio = %d, want 100", got)
	}
}

func TestLessonSizeLimitSupportsBoundedPresetsAndExplicitAll(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  int
	}{
		{name: "15", value: "15", want: 15},
		{name: "30", value: "30", want: 30},
		{name: "50", value: "50", want: 50},
		{name: "all", value: "all", want: 0},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := lessonSizeLimit(test.value); got != test.want {
				t.Fatalf("lessonSizeLimit(%q) = %d, want %d", test.value, got, test.want)
			}
		})
	}
}

func TestManualLessonSizeFiftyCapsWhileExplicitAllKeepsEntireCandidateSet(t *testing.T) {
	candidates := make([]lessonCandidate, 0, 55)
	baseDueAt := time.Date(2026, 8, 23, 8, 0, 0, 0, time.UTC)
	for index := 0; index < 55; index++ {
		candidates = append(candidates, lessonCandidate{
			WordID:       int64(index + 1),
			Kind:         "word",
			Status:       "new",
			DueAt:        baseDueAt.Add(time.Duration(index) * time.Minute),
			Topic:        "Manual workload",
			PartOfSpeech: "noun",
		})
	}

	bounded, boundedComposition := composeLessonCandidates(candidates, "noun", lessonSizeLimit("50"), 0)
	if len(bounded) != 50 || boundedComposition.Total != 50 {
		t.Fatalf("50-item manual lesson selected=%d composition=%+v, want exactly 50", len(bounded), boundedComposition)
	}

	all, allComposition := composeLessonCandidates(candidates, "noun", lessonSizeLimit("all"), 0)
	if len(all) != 55 || allComposition.Total != 55 {
		t.Fatalf("all-item manual lesson selected=%d composition=%+v, want entire 55-item candidate set", len(all), allComposition)
	}
}
