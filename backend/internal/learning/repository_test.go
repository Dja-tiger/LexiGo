package learning

import (
	"testing"
	"time"
)

func TestCalculateStreaksIncludesYesterdayUntilTodayIsCompleted(t *testing.T) {
	today := time.Date(2026, time.July, 16, 0, 0, 0, 0, time.UTC)
	days := []time.Time{
		today.AddDate(0, 0, -1),
		today.AddDate(0, 0, -2),
		today.AddDate(0, 0, -3),
		today.AddDate(0, 0, -5),
	}
	current, longest := calculateStreaks(days, today)
	if current != 3 || longest != 3 {
		t.Fatalf("current=%d longest=%d, want 3 and 3", current, longest)
	}
}

func TestCalculateStreaksResetsAfterMissedDay(t *testing.T) {
	today := time.Date(2026, time.July, 16, 0, 0, 0, 0, time.UTC)
	days := []time.Time{today.AddDate(0, 0, -2), today.AddDate(0, 0, -3)}
	current, longest := calculateStreaks(days, today)
	if current != 0 || longest != 2 {
		t.Fatalf("current=%d longest=%d, want 0 and 2", current, longest)
	}
}

func TestStartOfWeekUsesMondayBoundary(t *testing.T) {
	sunday := time.Date(2026, time.July, 26, 0, 0, 0, 0, time.UTC)
	got := startOfWeek(sunday)
	want := time.Date(2026, time.July, 20, 0, 0, 0, 0, time.UTC)
	if !got.Equal(want) {
		t.Fatalf("startOfWeek(%s) = %s, want %s", sunday, got, want)
	}
}

func TestPercentageHandlesEmptyAndRoundedEvidence(t *testing.T) {
	if got := percentage(0, 0); got != 0 {
		t.Fatalf("percentage(0, 0) = %d, want 0", got)
	}
	if got := percentage(2, 3); got != 67 {
		t.Fatalf("percentage(2, 3) = %d, want 67", got)
	}
}
