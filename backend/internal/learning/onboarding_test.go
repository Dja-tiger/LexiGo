package learning

import (
	"reflect"
	"testing"
	"time"
)

func TestSelectDiagnosticCandidatesBalancesRepresentativeCoverage(t *testing.T) {
	candidates := []diagnosticCandidate{
		{WordID: 1, Kind: "phrase", Topic: "Travel"},
		{WordID: 2, Kind: "phrase", Topic: "Daily Life"},
		{WordID: 3, Kind: "word", Topic: "Data Engineering", PartOfSpeech: "noun"},
		{WordID: 4, Kind: "word", Topic: "Backend Development", PartOfSpeech: "verb"},
		{WordID: 5, Kind: "word", Topic: "Travel", PartOfSpeech: "noun"},
		{WordID: 6, Kind: "word", Topic: "Daily Life", PartOfSpeech: "noun"},
		{WordID: 7, Kind: "word", Topic: "Travel", PartOfSpeech: "verb"},
		{WordID: 8, Kind: "word", Topic: "Daily Life", PartOfSpeech: "verb"},
		{WordID: 9, Kind: "word", Topic: "Travel", PartOfSpeech: "adjective"},
		{WordID: 10, Kind: "word", Topic: "Daily Life", PartOfSpeech: "adjective"},
		{WordID: 11, Kind: "word", Topic: "General", PartOfSpeech: "adverb"},
		{WordID: 12, Kind: "word", Topic: "General", PartOfSpeech: "preposition"},
	}

	selected := selectDiagnosticCandidates(candidates, 12)
	if len(selected) != 12 {
		t.Fatalf("selected = %d, want 12", len(selected))
	}
	seen := make(map[int64]struct{}, len(selected))
	phrases, technical, nouns, verbs, adjectives := 0, 0, 0, 0, 0
	for _, item := range selected {
		if _, exists := seen[item.WordID]; exists {
			t.Fatalf("duplicate diagnostic word id %d", item.WordID)
		}
		seen[item.WordID] = struct{}{}
		if item.Kind == "phrase" {
			phrases++
		}
		if isTechnicalDiagnosticTopic(item.Topic) {
			technical++
		}
		switch item.PartOfSpeech {
		case "noun":
			nouns++
		case "verb":
			verbs++
		case "adjective":
			adjectives++
		}
	}
	if phrases < 2 || technical < 2 || nouns < 2 || verbs < 2 || adjectives < 2 {
		t.Fatalf("coverage phrases=%d technical=%d nouns=%d verbs=%d adjectives=%d", phrases, technical, nouns, verbs, adjectives)
	}
}

func TestSelectDiagnosticCandidatesIsDeterministicAndBounded(t *testing.T) {
	candidates := []diagnosticCandidate{
		{WordID: 1, Kind: "word", PartOfSpeech: "noun"},
		{WordID: 2, Kind: "word", PartOfSpeech: "verb"},
		{WordID: 3, Kind: "phrase"},
		{WordID: 4, Kind: "word", PartOfSpeech: "adjective"},
	}
	first := selectDiagnosticCandidates(candidates, 3)
	second := selectDiagnosticCandidates(candidates, 3)
	if !reflect.DeepEqual(first, second) {
		t.Fatalf("selection is not deterministic: first=%v second=%v", first, second)
	}
	if len(first) != 3 {
		t.Fatalf("selected = %d, want 3", len(first))
	}
}

func TestDiagnosticInitializationSeparatesSelfMarkFromReviewTruth(t *testing.T) {
	known := diagnosticInitializationForMark(DiagnosticSelfMarkKnown)
	if !known.Apply || known.Status != "review" || known.IntervalDays != 7 || known.Repetitions != 1 || known.DueAfter != 7*24*time.Hour {
		t.Fatalf("unexpected known policy: %+v", known)
	}
	unsure := diagnosticInitializationForMark(DiagnosticSelfMarkUnsure)
	if !unsure.Apply || unsure.Status != "learning" || unsure.IntervalDays != 1 || unsure.Repetitions != 0 || unsure.DueAfter != 24*time.Hour {
		t.Fatalf("unexpected unsure policy: %+v", unsure)
	}
	fresh := diagnosticInitializationForMark(DiagnosticSelfMarkNew)
	if fresh.Apply {
		t.Fatalf("new self-mark must preserve the existing new scheduler state: %+v", fresh)
	}
}

func TestValidDiagnosticSelfMark(t *testing.T) {
	for _, mark := range []DiagnosticSelfMark{DiagnosticSelfMarkKnown, DiagnosticSelfMarkUnsure, DiagnosticSelfMarkNew} {
		if !validDiagnosticSelfMark(mark) {
			t.Fatalf("expected valid mark %q", mark)
		}
	}
	if validDiagnosticSelfMark("almost") {
		t.Fatal("scheduler rating must not be accepted as an onboarding self-mark")
	}
}
