package learning

import "time"

type Rating string

const (
	RatingAgain  Rating = "again"
	RatingAlmost Rating = "almost"
	RatingKnown  Rating = "known"
)

type AnswerMode string

const (
	AnswerModeStudy  AnswerMode = "study"
	AnswerModeRecall AnswerMode = "recall"
	AnswerModeChoice AnswerMode = "choice"
)

func (mode AnswerMode) Objective() bool {
	return mode == AnswerModeRecall || mode == AnswerModeChoice
}

type ReviewRequest struct {
	Rating                Rating     `json:"rating"`
	ResponseMS            *int       `json:"responseMs,omitempty"`
	AnswerMode            AnswerMode `json:"answerMode,omitempty"`
	Correct               *bool      `json:"correct,omitempty"`
	AnswerRevealed        *bool      `json:"answerRevealed,omitempty"`
	TimezoneOffsetMinutes int        `json:"timezoneOffsetMinutes"`
}

type ReviewResult struct {
	WordID         int64     `json:"wordId"`
	Status         string    `json:"status"`
	Easiness       float64   `json:"easiness"`
	IntervalDays   int       `json:"intervalDays"`
	Repetitions    int       `json:"repetitions"`
	DueAt          time.Time `json:"dueAt"`
	LastReviewedAt time.Time `json:"lastReviewedAt"`
}

type ModeProgress struct {
	AttemptsToday   int `json:"attemptsToday"`
	SuccessfulToday int `json:"successfulToday"`
	AttemptsTotal   int `json:"attemptsTotal"`
	SuccessfulTotal int `json:"successfulTotal"`
}

type ProgressModes struct {
	Study  ModeProgress `json:"study"`
	Recall ModeProgress `json:"recall"`
	Choice ModeProgress `json:"choice"`
	Legacy ModeProgress `json:"legacy"`
}

type ProgressSummary struct {
	DueNow                   int           `json:"dueNow"`
	DueWords                 int           `json:"dueWords"`
	DuePhrases               int           `json:"duePhrases"`
	TotalWords               int           `json:"totalWords"`
	TotalPhrases             int           `json:"totalPhrases"`
	NewWords                 int           `json:"newWords"`
	LearningWords            int           `json:"learningWords"`
	ReviewWords              int           `json:"reviewWords"`
	MasteredWords            int           `json:"masteredWords"`
	MasteredPhrases          int           `json:"masteredPhrases"`
	ReviewsToday             int           `json:"reviewsToday"`
	SuccessfulToday          int           `json:"successfulToday"`
	ObjectiveReviewsToday    int           `json:"objectiveReviewsToday"`
	ObjectiveSuccessfulToday int           `json:"objectiveSuccessfulToday"`
	ReviewsTotal             int           `json:"reviewsTotal"`
	DailyGoal                int           `json:"dailyGoal"`
	CurrentStreak            int           `json:"currentStreak"`
	LongestStreak            int           `json:"longestStreak"`
	RetainedItemsWeek        int           `json:"retainedItemsWeek"`
	RetainedWordsWeek        int           `json:"retainedWordsWeek"`
	RetainedPhrasesWeek      int           `json:"retainedPhrasesWeek"`
	EventSchemaVersion       int           `json:"eventSchemaVersion"`
	Modes                    ProgressModes `json:"modes"`
	NextDueAt                *time.Time    `json:"nextDueAt,omitempty"`
}

type GoalRequest struct {
	DailyGoal int `json:"dailyGoal"`
}
