package learning

import (
	"reflect"
	"testing"
	"time"
)

func TestFilterLessonCandidatesForStudySelectsOnlyNew(t *testing.T) {
	now := time.Date(2026, 8, 22, 18, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "new", DueAt: now.Add(24 * time.Hour)},
		{WordID: 2, Kind: "word", Status: "learning", DueAt: now.Add(-time.Minute), Due: true, RecentFailure: true},
		{WordID: 3, Kind: "phrase", Status: "review", DueAt: now.Add(48 * time.Hour), WeakTopic: true},
	}

	filtered := filterLessonCandidatesForSession(candidates, LessonSessionKindStudy)
	if len(filtered) != 1 || filtered[0].WordID != 1 {
		t.Fatalf("study candidates = %+v, want only new word 1", filtered)
	}
	if reason := lessonCandidateReason(filtered[0]); reason != LessonReasonNew {
		t.Fatalf("study reason = %q, want %q", reason, LessonReasonNew)
	}
}

func TestFilterLessonCandidatesForReviewNeverUsesScheduledNotDue(t *testing.T) {
	now := time.Date(2026, 8, 22, 18, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "learning", DueAt: now.Add(-10 * time.Minute), Due: true, RecentFailure: true},
		{WordID: 2, Kind: "word", Status: "review", DueAt: now.Add(-3 * time.Hour), Due: true, RepeatedAgain: true},
		{WordID: 3, Kind: "word", Status: "review", DueAt: now.Add(-2 * time.Hour), Due: true, RecentFailure: true},
		{WordID: 4, Kind: "phrase", Status: "review", DueAt: now.Add(-48 * time.Hour), Due: true, Overdue: true},
		{WordID: 5, Kind: "phrase", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
		{WordID: 6, Kind: "word", Status: "review", DueAt: now.Add(24 * time.Hour), RepeatedAgain: true, WeakTopic: true},
		{WordID: 7, Kind: "word", Status: "new", DueAt: now.Add(-time.Hour), Due: false},
	}

	filtered := filterLessonCandidatesForSession(candidates, LessonSessionKindReview)
	ids := make([]int64, 0, len(filtered))
	reasons := make([]LessonSelectionReason, 0, len(filtered))
	for _, candidate := range filtered {
		ids = append(ids, candidate.WordID)
		reasons = append(reasons, lessonCandidateReason(candidate))
	}
	if want := []int64{1, 2, 3, 4, 5}; !reflect.DeepEqual(ids, want) {
		t.Fatalf("review ids = %v, want %v", ids, want)
	}
	if want := []LessonSelectionReason{
		LessonReasonRelearningDue,
		LessonReasonRepeatedAgain,
		LessonReasonRecentFailure,
		LessonReasonOverdue,
		LessonReasonDue,
	}; !reflect.DeepEqual(reasons, want) {
		t.Fatalf("review reasons = %v, want %v", reasons, want)
	}

	selected, composition := composeLessonCandidates(filtered, "mixed", 15, 100)
	if len(selected) != 5 {
		t.Fatalf("review selected = %d, want exact due backlog 5", len(selected))
	}
	if composition.Scheduled != 0 {
		t.Fatalf("explicit review scheduled count = %d, want 0", composition.Scheduled)
	}
	for _, candidate := range selected {
		if !candidate.Due {
			t.Fatalf("explicit review selected not-due candidate: %+v", candidate)
		}
	}
}

func TestFilterLessonCandidatesForRemediationRequiresWeaknessSignal(t *testing.T) {
	now := time.Date(2026, 8, 22, 18, 0, 0, 0, time.UTC)
	candidates := []lessonCandidate{
		{WordID: 1, Kind: "word", Status: "learning", DueAt: now.Add(time.Hour), RepeatedAgain: true, RecentFailure: true},
		{WordID: 2, Kind: "word", Status: "review", DueAt: now.Add(2 * time.Hour), RecentFailure: true},
		{WordID: 3, Kind: "phrase", Status: "review", DueAt: now.Add(3 * time.Hour), RepeatedAlmost: true},
		{WordID: 4, Kind: "word", Status: "review", DueAt: now.Add(4 * time.Hour), WeakTopic: true},
		{WordID: 5, Kind: "word", Status: "review", DueAt: now.Add(-time.Hour), Due: true, RepeatedAgain: true, RecentFailure: true, WeakTopic: true},
		{WordID: 6, Kind: "word", Status: "new", DueAt: now, WeakTopic: true, RepeatedAlmost: true},
	}

	filtered := filterLessonCandidatesForSession(candidates, LessonSessionKindRemediation)
	ids := make([]int64, 0, len(filtered))
	reasons := make([]LessonSelectionReason, 0, len(filtered))
	for _, candidate := range filtered {
		ids = append(ids, candidate.WordID)
		reasons = append(reasons, lessonCandidateReason(candidate))
	}
	if want := []int64{1, 2, 3, 4}; !reflect.DeepEqual(ids, want) {
		t.Fatalf("remediation ids = %v, want %v", ids, want)
	}
	if want := []LessonSelectionReason{
		LessonReasonRepeatedAgain,
		LessonReasonRecentFailure,
		LessonReasonRepeatedAlmost,
		LessonReasonWeakTopic,
	}; !reflect.DeepEqual(reasons, want) {
		t.Fatalf("remediation reasons = %v, want %v", reasons, want)
	}
}

func TestDueWeakCandidateOwnedByReviewNotRemediation(t *testing.T) {
	candidate := lessonCandidate{
		WordID:         42,
		Kind:           "word",
		Status:         "review",
		Due:            true,
		RepeatedAgain:  true,
		RecentFailure:  true,
		RepeatedAlmost: true,
		WeakTopic:      true,
	}

	review := filterLessonCandidatesForSession([]lessonCandidate{candidate}, LessonSessionKindReview)
	if len(review) != 1 || review[0].WordID != candidate.WordID {
		t.Fatalf("review ownership = %+v, want due candidate %d", review, candidate.WordID)
	}
	if reason := lessonCandidateReason(review[0]); reason != LessonReasonRepeatedAgain {
		t.Fatalf("review reason = %q, want %q", reason, LessonReasonRepeatedAgain)
	}

	remediation := filterLessonCandidatesForSession([]lessonCandidate{candidate}, LessonSessionKindRemediation)
	if len(remediation) != 0 {
		t.Fatalf("remediation must not compete with review for due candidate: %+v", remediation)
	}
}

func TestExplicitSessionPriorityPreservesStrongFailureFirst(t *testing.T) {
	now := time.Date(2026, 8, 22, 18, 0, 0, 0, time.UTC)
	candidates := filterLessonCandidatesForSession([]lessonCandidate{
		{WordID: 4, Kind: "word", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
		{WordID: 3, Kind: "word", Status: "review", DueAt: now.Add(-48 * time.Hour), Due: true, Overdue: true},
		{WordID: 2, Kind: "word", Status: "review", DueAt: now.Add(-3 * time.Hour), Due: true, RecentFailure: true},
		{WordID: 1, Kind: "word", Status: "learning", DueAt: now.Add(-10 * time.Minute), Due: true},
	}, LessonSessionKindReview)

	selected, _ := composeLessonCandidates(candidates, "noun", 15, 100)
	ids := make([]int64, 0, len(selected))
	for _, candidate := range selected {
		ids = append(ids, candidate.WordID)
	}
	if want := []int64{2, 1, 3, 4}; !reflect.DeepEqual(ids, want) {
		t.Fatalf("review priority order = %v, want %v", ids, want)
	}
}

func TestLegacyCandidateReasonRemainsUnchangedWithoutOverride(t *testing.T) {
	candidate := lessonCandidate{
		WordID:         1,
		Status:         "review",
		Due:            false,
		RepeatedAgain:  true,
		RepeatedAlmost: true,
		Overdue:        true,
	}
	if reason := lessonCandidateReason(candidate); reason != LessonReasonScheduled {
		t.Fatalf("legacy reason = %q, want %q", reason, LessonReasonScheduled)
	}
}
