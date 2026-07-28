package moderation

import (
	"strings"
	"testing"
	"time"
)

func TestCursorRoundTrip(t *testing.T) {
	expected := Cursor{CreatedAt: time.Date(2026, 7, 28, 6, 0, 0, 0, time.UTC), ID: 42}
	encoded, err := EncodeCursor(expected)
	if err != nil {
		t.Fatal(err)
	}
	actual, err := DecodeCursor(encoded)
	if err != nil {
		t.Fatal(err)
	}
	if actual.ID != expected.ID || !actual.CreatedAt.Equal(expected.CreatedAt) {
		t.Fatalf("cursor = %+v, want %+v", actual, expected)
	}
	if _, err := DecodeCursor("not-a-cursor"); err == nil {
		t.Fatal("invalid cursor was accepted")
	}
}

func TestNormalizeListFilterBounds(t *testing.T) {
	filter := ListFilter{}
	if err := NormalizeListFilter(&filter); err != nil {
		t.Fatal(err)
	}
	if filter.Status != "pending" || filter.Limit != DefaultPageLimit {
		t.Fatalf("defaults = %+v", filter)
	}
	for _, invalid := range []ListFilter{
		{Status: "all"},
		{ExerciseKind: "choice"},
		{Limit: MaxPageLimit + 1},
		{ItemQuery: strings.Repeat("я", 121)},
	} {
		if err := NormalizeListFilter(&invalid); err == nil {
			t.Fatalf("invalid filter accepted: %+v", invalid)
		}
	}
}

func TestValidateDecisionRequiresControlledReasonAndVersion(t *testing.T) {
	valid := []DecisionRequest{
		{Decision: "accepted", ExpectedVersion: 1, Reason: "valid_variant"},
		{Decision: "rejected", ExpectedVersion: 2, Reason: "incorrect", Comment: "Not a semantic match."},
	}
	for _, request := range valid {
		if err := ValidateDecision(&request); err != nil {
			t.Fatalf("valid request rejected: %v", err)
		}
	}
	invalid := []DecisionRequest{
		{Decision: "accepted", ExpectedVersion: 1, Reason: "incorrect"},
		{Decision: "rejected", ExpectedVersion: 1, Reason: "valid_variant"},
		{Decision: "rejected", ExpectedVersion: 0, Reason: "incorrect"},
		{Decision: "rejected", ExpectedVersion: 1, Reason: "incorrect", Comment: strings.Repeat("x", MaxCommentRunes+1)},
	}
	for _, request := range invalid {
		if err := ValidateDecision(&request); err == nil {
			t.Fatalf("invalid decision accepted: %+v", request)
		}
	}
}
