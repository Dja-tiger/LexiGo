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
	AnswerModeStudy     AnswerMode = "study"
	AnswerModeRecall    AnswerMode = "recall"
	AnswerModeChoice    AnswerMode = "choice"
	AnswerModeListening AnswerMode = "listening"
)

func (mode AnswerMode) Objective() bool {
	return mode == AnswerModeRecall || mode == AnswerModeChoice || mode == AnswerModeListening
}

type ReviewRequest struct {
	Rating                Rating     `json:"rating"`
	ResponseMS            *int       `json:"responseMs,omitempty"`
	AnswerMode            AnswerMode `json:"answerMode,omitempty"`
	SubmittedAnswer       *string    `json:"submittedAnswer,omitempty"`
	Correct               *bool      `json:"correct,omitempty"`
	AnswerRevealed        *bool      `json:"answerRevealed,omitempty"`
	TimezoneOffsetMinutes int        `json:"timezoneOffsetMinutes"`
}

type ReviewResult struct {
	WordID              int64     `json:"wordId"`
	Status              string    `json:"status"`
	Easiness            float64   `json:"easiness"`
	IntervalDays        int       `json:"intervalDays"`
	Repetitions         int       `json:"repetitions"`
	DueAt               time.Time `json:"dueAt"`
	LastReviewedAt      time.Time `json:"lastReviewedAt"`
	RequestedRating     Rating    `json:"requestedRating"`
	EffectiveRating     Rating    `json:"effectiveRating"`
	Correct             *bool     `json:"correct,omitempty"`
	JudgementSource     string    `json:"judgementSource"`
	JudgementReason     string    `json:"judgementReason"`
	MatchedAnswer       string    `json:"matchedAnswer,omitempty"`
	ReviewEventID       int64     `json:"reviewEventId"`
	SuggestionAvailable bool      `json:"suggestionAvailable"`
}

type ModeProgress struct {
	AttemptsToday   int `json:"attemptsToday"`
	SuccessfulToday int `json:"successfulToday"`
	AttemptsTotal   int `json:"attemptsTotal"`
	SuccessfulTotal int `json:"successfulTotal"`
}

type ProgressModes struct {
	Study     ModeProgress `json:"study"`
	Recall    ModeProgress `json:"recall"`
	Choice    ModeProgress `json:"choice"`
	Listening ModeProgress `json:"listening"`
	Legacy    ModeProgress `json:"legacy"`
}

type DailyRecallEvidence struct {
	Date       string `json:"date"`
	Attempts   int    `json:"attempts"`
	Successful int    `json:"successful"`
	Rate       int    `json:"rate"`
}

type TopicEvidence struct {
	Topic      string `json:"topic"`
	Attempts   int    `json:"attempts"`
	Successful int    `json:"successful"`
	Errors     int    `json:"errors"`
	Rate       int    `json:"rate"`
}

type PartOfSpeechEvidence struct {
	PartOfSpeech string `json:"partOfSpeech"`
	Attempts     int    `json:"attempts"`
	Successful   int    `json:"successful"`
	Errors       int    `json:"errors"`
	Rate         int    `json:"rate"`
}

type WeeklyProgressEvidence struct {
	WeekStart                string                 `json:"weekStart"`
	WeekEnd                  string                 `json:"weekEnd"`
	RecallAttempts           int                    `json:"recallAttempts"`
	RecallSuccessful         int                    `json:"recallSuccessful"`
	RecallRate               int                    `json:"recallRate"`
	PreviousRecallAttempts   int                    `json:"previousRecallAttempts"`
	PreviousRecallSuccessful int                    `json:"previousRecallSuccessful"`
	PreviousRecallRate       int                    `json:"previousRecallRate"`
	ChoiceAttempts           int                    `json:"choiceAttempts"`
	ChoiceSuccessful         int                    `json:"choiceSuccessful"`
	ChoiceRate               int                    `json:"choiceRate"`
	Reviews                  int                    `json:"reviews"`
	Lessons                  int                    `json:"lessons"`
	ActiveMinutes            int                    `json:"activeMinutes"`
	Trend                    []DailyRecallEvidence  `json:"trend"`
	WeakTopics               []TopicEvidence        `json:"weakTopics"`
	WeakPartsOfSpeech        []PartOfSpeechEvidence `json:"weakPartsOfSpeech"`
	StrongTopic              *TopicEvidence         `json:"strongTopic,omitempty"`
}

type ProcessRetentionEvidence struct {
	Attempts   int `json:"attempts"`
	Successful int `json:"successful"`
	Rate       int `json:"rate"`
}

type LearningProcessEvidence struct {
	WeekStart           string                   `json:"weekStart"`
	WeekEnd             string                   `json:"weekEnd"`
	NewLearned          int                      `json:"newLearned"`
	DueReviewed         int                      `json:"dueReviewed"`
	RemediationReviewed int                      `json:"remediationReviewed"`
	ReviewBacklog       int                      `json:"reviewBacklog"`
	Lapses              int                      `json:"lapses"`
	Retention           ProcessRetentionEvidence `json:"retention"`
}

type ScenarioRecommendationReason string

const (
	ScenarioRecommendationResumeInProgress       ScenarioRecommendationReason = "resume_in_progress"
	ScenarioRecommendationFirstUncompleted       ScenarioRecommendationReason = "first_uncompleted"
	ScenarioRecommendationLeastRecentlyCompleted ScenarioRecommendationReason = "least_recently_completed"
)

type ScenarioRecommendationAction string

const (
	ScenarioRecommendationActionStart  ScenarioRecommendationAction = "start"
	ScenarioRecommendationActionResume ScenarioRecommendationAction = "resume"
)

type ScenarioRecommendation struct {
	Slug             string                       `json:"slug"`
	Type             string                       `json:"type"`
	Title            string                       `json:"title"`
	EstimatedMinutes int                          `json:"estimatedMinutes"`
	Reason           ScenarioRecommendationReason `json:"reason"`
	Action           ScenarioRecommendationAction `json:"action"`
	CompletedCount   int                          `json:"completedCount"`
	LastCompletedAt  *time.Time                   `json:"lastCompletedAt,omitempty"`
}

type ScenarioProgressEvidence struct {
	CompletedThisWeek int                     `json:"completedThisWeek"`
	CompletedTotal    int                     `json:"completedTotal"`
	Recommendation    *ScenarioRecommendation `json:"recommendation,omitempty"`
}

type ProgressSummary struct {
	DueNow                   int                      `json:"dueNow"`
	DueWords                 int                      `json:"dueWords"`
	DuePhrases               int                      `json:"duePhrases"`
	TotalWords               int                      `json:"totalWords"`
	TotalPhrases             int                      `json:"totalPhrases"`
	NewWords                 int                      `json:"newWords"`
	LearningWords            int                      `json:"learningWords"`
	ReviewWords              int                      `json:"reviewWords"`
	MasteredWords            int                      `json:"masteredWords"`
	MasteredPhrases          int                      `json:"masteredPhrases"`
	ReviewsToday             int                      `json:"reviewsToday"`
	SuccessfulToday          int                      `json:"successfulToday"`
	ObjectiveReviewsToday    int                      `json:"objectiveReviewsToday"`
	ObjectiveSuccessfulToday int                      `json:"objectiveSuccessfulToday"`
	ReviewsTotal             int                      `json:"reviewsTotal"`
	DailyGoal                int                      `json:"dailyGoal"`
	CurrentStreak            int                      `json:"currentStreak"`
	LongestStreak            int                      `json:"longestStreak"`
	RetainedItemsWeek        int                      `json:"retainedItemsWeek"`
	RetainedWordsWeek        int                      `json:"retainedWordsWeek"`
	RetainedPhrasesWeek      int                      `json:"retainedPhrasesWeek"`
	EventSchemaVersion       int                      `json:"eventSchemaVersion"`
	Modes                    ProgressModes            `json:"modes"`
	Weekly                   WeeklyProgressEvidence   `json:"weekly"`
	Processes                LearningProcessEvidence  `json:"processes"`
	Scenarios                ScenarioProgressEvidence `json:"scenarios"`
	NextDueAt                *time.Time               `json:"nextDueAt,omitempty"`
}

type GoalRequest struct {
	DailyGoal int `json:"dailyGoal"`
}
