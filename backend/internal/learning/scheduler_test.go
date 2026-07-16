package learning

import (
	"testing"
	"time"
)

func TestScheduleReviewAgainReturnsSoon(t *testing.T) {
	schedule, err := ScheduleReview(ReviewState{Easiness: 2.5, IntervalDays: 6, Repetitions: 2}, RatingAgain)
	if err != nil {
		t.Fatal(err)
	}
	if schedule.Grade != 1 || schedule.Status != "learning" || schedule.Repetitions != 0 || schedule.IntervalDays != 0 {
		t.Fatalf("unexpected schedule: %+v", schedule)
	}
	if schedule.DueAfter != 10*time.Minute {
		t.Fatalf("DueAfter = %s, want 10m", schedule.DueAfter)
	}
}

func TestScheduleReviewKnownExpandsInterval(t *testing.T) {
	first, err := ScheduleReview(ReviewState{Easiness: 2.5}, RatingKnown)
	if err != nil {
		t.Fatal(err)
	}
	if first.IntervalDays != 2 || first.Repetitions != 1 {
		t.Fatalf("first known schedule = %+v", first)
	}

	second, err := ScheduleReview(ReviewState{
		Easiness: first.Easiness, IntervalDays: first.IntervalDays, Repetitions: first.Repetitions,
	}, RatingKnown)
	if err != nil {
		t.Fatal(err)
	}
	if second.IntervalDays != 6 || second.Repetitions != 2 || second.Status != "review" {
		t.Fatalf("second known schedule = %+v", second)
	}
}

func TestScheduleReviewAlmostUsesModerateInterval(t *testing.T) {
	schedule, err := ScheduleReview(ReviewState{Easiness: 2.5, IntervalDays: 6, Repetitions: 2}, RatingAlmost)
	if err != nil {
		t.Fatal(err)
	}
	if schedule.Grade != 3 || schedule.IntervalDays != 9 || schedule.Status != "review" {
		t.Fatalf("unexpected schedule: %+v", schedule)
	}
}

func TestScheduleReviewRejectsUnknownRating(t *testing.T) {
	if _, err := ScheduleReview(ReviewState{}, Rating("easy")); err == nil {
		t.Fatal("expected invalid rating error")
	}
}
