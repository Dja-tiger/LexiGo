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
