package learning

import (
	"errors"
	"math"
	"time"
)

var (
	ErrInvalidRating     = errors.New("invalid rating")
	ErrInvalidAnswerMode = errors.New("invalid answer mode")
)

type ReviewState struct {
	Status       string
	Easiness     float64
	IntervalDays int
	Repetitions  int
	DueAt        time.Time
}

type Schedule struct {
	Grade        int
	Status       string
	Easiness     float64
	IntervalDays int
	Repetitions  int
	DueAfter     time.Duration
	PreserveDue  bool
}

func ScheduleAttempt(state ReviewState, rating Rating, mode AnswerMode) (Schedule, error) {
	switch mode {
	case AnswerModeStudy:
		return scheduleStudy(state, rating)
	case AnswerModeRecall, AnswerModeChoice:
		return ScheduleReview(state, rating)
	default:
		return Schedule{}, ErrInvalidAnswerMode
	}
}

func scheduleStudy(state ReviewState, rating Rating) (Schedule, error) {
	easiness := state.Easiness
	if easiness < 1.3 {
		easiness = 2.5
	}
	status := state.Status
	preserveDue := status != "" && status != "new"
	if !preserveDue {
		status = "learning"
	}

	grade := 0
	dueAfter := time.Duration(0)
	switch rating {
	case RatingAgain:
		grade = 1
		dueAfter = 10 * time.Minute
	case RatingAlmost:
		grade = 3
		dueAfter = 12 * time.Hour
	case RatingKnown:
		grade = 5
		dueAfter = 24 * time.Hour
	default:
		return Schedule{}, ErrInvalidRating
	}

	return Schedule{
		Grade:        grade,
		Status:       status,
		Easiness:     round2(easiness),
		IntervalDays: state.IntervalDays,
		Repetitions:  state.Repetitions,
		DueAfter:     dueAfter,
		PreserveDue:  preserveDue,
	}, nil
}

func ScheduleReview(state ReviewState, rating Rating) (Schedule, error) {
	easiness := state.Easiness
	if easiness < 1.3 {
		easiness = 2.5
	}

	switch rating {
	case RatingAgain:
		easiness = math.Max(1.3, easiness-0.2)
		return Schedule{
			Grade:        1,
			Status:       "learning",
			Easiness:     round2(easiness),
			IntervalDays: 0,
			Repetitions:  0,
			DueAfter:     10 * time.Minute,
		}, nil
	case RatingAlmost:
		repetitions := state.Repetitions + 1
		interval := 1
		if state.Repetitions > 0 {
			interval = maxInt(1, int(math.Round(float64(maxInt(1, state.IntervalDays))*1.5)))
		}
		easiness = math.Max(1.3, easiness-0.05)
		status := "learning"
		if repetitions >= 2 {
			status = "review"
		}
		return Schedule{
			Grade:        3,
			Status:       status,
			Easiness:     round2(easiness),
			IntervalDays: interval,
			Repetitions:  repetitions,
			DueAfter:     time.Duration(interval) * 24 * time.Hour,
		}, nil
	case RatingKnown:
		repetitions := state.Repetitions + 1
		easiness = math.Min(3.0, easiness+0.1)
		interval := 2
		switch state.Repetitions {
		case 0:
			interval = 2
		case 1:
			interval = 6
		default:
			interval = maxInt(state.IntervalDays+1, int(math.Round(float64(maxInt(1, state.IntervalDays))*easiness)))
		}
		status := "review"
		if repetitions >= 5 && interval >= 30 {
			status = "mastered"
		}
		return Schedule{
			Grade:        5,
			Status:       status,
			Easiness:     round2(easiness),
			IntervalDays: interval,
			Repetitions:  repetitions,
			DueAfter:     time.Duration(interval) * 24 * time.Hour,
		}, nil
	default:
		return Schedule{}, ErrInvalidRating
	}
}

func round2(value float64) float64 { return math.Round(value*100) / 100 }

func maxInt(left, right int) int {
	if left > right {
		return left
	}
	return right
}
