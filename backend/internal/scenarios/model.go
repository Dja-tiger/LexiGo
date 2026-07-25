package scenarios

import (
	"errors"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/learning"
)

var (
	ErrScenarioNotFound       = errors.New("scenario not found")
	ErrAttemptNotFound        = errors.New("scenario attempt not found")
	ErrAttemptConflict        = errors.New("scenario attempt version conflict")
	ErrAttemptPaused          = errors.New("scenario attempt is paused")
	ErrAttemptCompleted       = errors.New("scenario attempt is completed")
	ErrStepOutOfOrder         = errors.New("scenario step is out of order")
	ErrResponseTooShort       = errors.New("scenario response is too short")
	ErrFactHypothesisRequired = errors.New("facts and hypotheses are required")
	ErrFactHypothesisOverlap  = errors.New("facts and hypotheses overlap")
	ErrInvalidSubmissionID    = errors.New("invalid scenario submission id")
)

type Scenario struct {
	Slug                   string         `json:"slug"`
	Type                   string         `json:"type"`
	Title                  string         `json:"title"`
	Summary                string         `json:"summary"`
	UserRole               string         `json:"userRole"`
	WorkplaceGoal          string         `json:"workplaceGoal"`
	CompletionCriterion    string         `json:"completionCriterion"`
	Constraints            []string       `json:"constraints"`
	RequiresFactHypothesis bool           `json:"requiresFactHypothesis"`
	EstimatedMinutes       int            `json:"estimatedMinutes"`
	Version                int            `json:"version"`
	StepCount              int            `json:"stepCount"`
	Steps                  []ScenarioStep `json:"steps,omitempty"`
}

type ScenarioReviewTarget struct {
	Term string `json:"term"`
}

type ScenarioStep struct {
	Position               int                  `json:"position"`
	Kind                   string               `json:"kind"`
	Title                  string               `json:"title"`
	Prompt                 string               `json:"prompt"`
	ProductionOutcome      string               `json:"productionOutcome"`
	Vocabulary             []string             `json:"vocabulary"`
	ReviewTarget           ScenarioReviewTarget `json:"reviewTarget"`
	RequiresFactHypothesis bool                 `json:"requiresFactHypothesis"`
	MinResponseCharacters  int                  `json:"minResponseCharacters"`
}

type Attempt struct {
	ID                 string          `json:"id"`
	Scenario           Scenario        `json:"scenario"`
	CurrentPosition    int             `json:"currentPosition"`
	Status             string          `json:"status"`
	Version            int64           `json:"version"`
	CompletedPositions []int           `json:"completedPositions"`
	CurrentStep        *ScenarioStep   `json:"currentStep,omitempty"`
	StartedAt          time.Time       `json:"startedAt"`
	UpdatedAt          time.Time       `json:"updatedAt"`
	CompletedAt        *time.Time      `json:"completedAt,omitempty"`
	LastSubmission     *StepSubmission `json:"lastSubmission,omitempty"`
}

type StepSubmission struct {
	Position      int       `json:"position"`
	SubmissionID  string    `json:"submissionId"`
	Response      string    `json:"response"`
	Facts         []string  `json:"facts"`
	Hypotheses    []string  `json:"hypotheses"`
	ReviewEventID int64     `json:"reviewEventId"`
	AcceptedAt    time.Time `json:"acceptedAt"`
}

type StartAttemptResponse struct {
	Attempt Attempt `json:"attempt"`
	Resumed bool    `json:"resumed"`
}

type AttemptVersionRequest struct {
	AttemptVersion int64 `json:"attemptVersion"`
}

type StepReviewRequest struct {
	ResponseMS            *int `json:"responseMs,omitempty"`
	TimezoneOffsetMinutes int  `json:"timezoneOffsetMinutes"`
}

type SubmitStepRequest struct {
	SubmissionID   string             `json:"submissionId"`
	AttemptVersion int64              `json:"attemptVersion"`
	Response       string             `json:"response"`
	Facts          []string           `json:"facts,omitempty"`
	Hypotheses     []string           `json:"hypotheses,omitempty"`
	Review         *StepReviewRequest `json:"review"`
}

type SubmitStepResponse struct {
	Attempt          Attempt               `json:"attempt"`
	Review           learning.ReviewResult `json:"review"`
	IdempotentReplay bool                  `json:"idempotentReplay"`
}
