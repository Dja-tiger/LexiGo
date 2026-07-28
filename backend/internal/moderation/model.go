package moderation

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	DefaultPageLimit = 50
	MaxPageLimit     = 100
	MaxCommentRunes  = 1000
)

var (
	ErrNotFound        = errors.New("answer suggestion was not found")
	ErrVersionConflict = errors.New("answer suggestion version conflict")
)

type ListFilter struct {
	Status        string
	ExerciseKind  string
	ItemQuery     string
	CreatedBefore *time.Time
	Limit         int
	Cursor        *Cursor
}

type Cursor struct {
	CreatedAt time.Time `json:"createdAt"`
	ID        int64     `json:"id"`
}

type SuggestionContext struct {
	ID               int64         `json:"id"`
	Version          int64         `json:"version"`
	Status           string        `json:"status"`
	ExerciseKind     string        `json:"exerciseKind"`
	SubmittedAnswer  string        `json:"submittedAnswer"`
	NormalizedAnswer string        `json:"normalizedAnswer"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
	DecidedAt        *time.Time    `json:"decidedAt,omitempty"`
	DecisionReason   string        `json:"decisionReason,omitempty"`
	DecisionComment  string        `json:"decisionComment,omitempty"`
	Item             ItemContext   `json:"item"`
	Review           ReviewContext `json:"review"`
}

type ItemContext struct {
	ID              int64    `json:"id"`
	Kind            string   `json:"kind"`
	Lemma           string   `json:"lemma"`
	Translation     string   `json:"translation"`
	ClozeAnswer     string   `json:"clozeAnswer,omitempty"`
	AcceptedAnswers []string `json:"acceptedAnswers"`
}

type ReviewContext struct {
	ID              int64     `json:"id"`
	AnswerMode      string    `json:"answerMode"`
	Rating          string    `json:"rating"`
	EffectiveRating string    `json:"effectiveRating"`
	Correct         bool      `json:"correct"`
	JudgementReason string    `json:"judgementReason"`
	ReviewedAt      time.Time `json:"reviewedAt"`
}

type ListResponse struct {
	Items      []SuggestionContext `json:"items"`
	NextCursor string              `json:"nextCursor,omitempty"`
}

type Metrics struct {
	PendingCount          int64      `json:"pendingCount"`
	OldestPendingAt       *time.Time `json:"oldestPendingAt,omitempty"`
	OldestPendingAgeSecs  int64      `json:"oldestPendingAgeSeconds"`
	AcceptedCount         int64      `json:"acceptedCount"`
	RejectedCount         int64      `json:"rejectedCount"`
	AcceptanceRatePercent float64    `json:"acceptanceRatePercent"`
	ExpiredPendingCount   int64      `json:"expiredPendingCount"`
	ExpiredDecidedCount   int64      `json:"expiredDecidedCount"`
}

type DecisionRequest struct {
	Decision        string `json:"decision"`
	ExpectedVersion int64  `json:"expectedVersion"`
	Reason          string `json:"reason"`
	Comment         string `json:"comment,omitempty"`
}

type DecisionResult struct {
	ID              int64     `json:"id"`
	Status          string    `json:"status"`
	Version         int64     `json:"version"`
	DecisionReason  string    `json:"decisionReason"`
	DecisionComment string    `json:"decisionComment,omitempty"`
	DecidedAt       time.Time `json:"decidedAt"`
	AnswerAdded     bool      `json:"answerAdded"`
}

func EncodeCursor(cursor Cursor) (string, error) {
	value, err := json.Marshal(cursor)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}

func DecodeCursor(value string) (Cursor, error) {
	raw, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return Cursor{}, errors.New("invalid cursor")
	}
	var cursor Cursor
	if err := json.Unmarshal(raw, &cursor); err != nil || cursor.ID <= 0 || cursor.CreatedAt.IsZero() {
		return Cursor{}, errors.New("invalid cursor")
	}
	return cursor, nil
}

func NormalizeListFilter(filter *ListFilter) error {
	if filter.Status == "" {
		filter.Status = "pending"
	}
	if filter.Status != "pending" && filter.Status != "accepted" && filter.Status != "rejected" {
		return errors.New("invalid status")
	}
	if filter.ExerciseKind != "" && filter.ExerciseKind != "translation" && filter.ExerciseKind != "cloze" {
		return errors.New("invalid exercise kind")
	}
	filter.ItemQuery = strings.TrimSpace(filter.ItemQuery)
	if utf8.RuneCountInString(filter.ItemQuery) > 120 {
		return errors.New("item query is too long")
	}
	if filter.Limit == 0 {
		filter.Limit = DefaultPageLimit
	}
	if filter.Limit < 1 || filter.Limit > MaxPageLimit {
		return errors.New("invalid limit")
	}
	return nil
}

func ValidateDecision(request *DecisionRequest) error {
	request.Decision = strings.TrimSpace(request.Decision)
	request.Reason = strings.TrimSpace(request.Reason)
	request.Comment = strings.TrimSpace(request.Comment)
	if request.ExpectedVersion <= 0 {
		return errors.New("expectedVersion must be positive")
	}
	if utf8.RuneCountInString(request.Comment) > MaxCommentRunes {
		return errors.New("comment is too long")
	}
	switch request.Decision {
	case "accepted":
		if request.Reason != "valid_variant" {
			return errors.New("accepted decisions require valid_variant")
		}
	case "rejected":
		switch request.Reason {
		case "incorrect", "duplicate", "unsafe", "irrelevant", "insufficient_context":
		default:
			return errors.New("invalid rejection reason")
		}
	default:
		return errors.New("decision must be accepted or rejected")
	}
	return nil
}
