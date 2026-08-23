package learning

import "time"

type LessonSessionKind string

const (
	LessonSessionKindStudy       LessonSessionKind = "study"
	LessonSessionKindReview      LessonSessionKind = "review"
	LessonSessionKindRemediation LessonSessionKind = "remediation"
)

func validLessonSessionKind(kind LessonSessionKind) bool {
	switch kind {
	case "", LessonSessionKindStudy, LessonSessionKindReview, LessonSessionKindRemediation:
		return true
	default:
		return false
	}
}

type LessonSelectionReason string

const (
	LessonReasonRecentFailure  LessonSelectionReason = "recent_failure"
	LessonReasonDue            LessonSelectionReason = "due"
	LessonReasonOverdue        LessonSelectionReason = "overdue"
	LessonReasonRelearningDue  LessonSelectionReason = "relearning_due"
	LessonReasonRepeatedAgain  LessonSelectionReason = "repeated_again"
	LessonReasonRepeatedAlmost LessonSelectionReason = "repeated_almost"
	LessonReasonWeakTopic      LessonSelectionReason = "weak_topic"
	LessonReasonNew            LessonSelectionReason = "new"
	LessonReasonScheduled      LessonSelectionReason = "scheduled"
	LessonReasonManual         LessonSelectionReason = "manual"
)

type LessonCreateRequest struct {
	Source      string            `json:"source"`
	StudyMode   AnswerMode        `json:"studyMode"`
	SessionKind LessonSessionKind `json:"sessionKind,omitempty"`
	LessonSize  string            `json:"lessonSize"`
	Topic       string            `json:"topic,omitempty"`
	WordIDs     []int64           `json:"wordIds,omitempty"`
	ReviewRatio *int              `json:"reviewRatio,omitempty"`
}

type LessonPreviewRequest struct {
	Source      string            `json:"source"`
	StudyMode   AnswerMode        `json:"studyMode"`
	SessionKind LessonSessionKind `json:"sessionKind,omitempty"`
	LessonSize  string            `json:"lessonSize"`
	Topic       string            `json:"topic,omitempty"`
	ReviewRatio *int              `json:"reviewRatio,omitempty"`
}

type LessonComposition struct {
	Total            int    `json:"total"`
	Words            int    `json:"words"`
	Phrases          int    `json:"phrases"`
	Due              int    `json:"due"`
	New              int    `json:"new"`
	Scheduled        int    `json:"scheduled"`
	RecentFailures   int    `json:"recentFailures"`
	WeakTopics       int    `json:"weakTopics"`
	ReviewRatio      int    `json:"reviewRatio"`
	AvailableWords   int    `json:"availableWords"`
	AvailablePhrases int    `json:"availablePhrases"`
	Fallback         string `json:"fallback,omitempty"`
}

type LessonPreview struct {
	Source      string            `json:"source"`
	StudyMode   AnswerMode        `json:"studyMode"`
	SessionKind LessonSessionKind `json:"sessionKind,omitempty"`
	LessonSize  string            `json:"lessonSize"`
	Composition LessonComposition `json:"composition"`
}

type LessonReviewRequest struct {
	ReviewRequest
	LessonVersion int64 `json:"lessonVersion"`
}

type LessonItem struct {
	Position        int                   `json:"position"`
	WordID          int64                 `json:"id"`
	Kind            string                `json:"kind"`
	Slug            string                `json:"slug,omitempty"`
	Lemma           string                `json:"lemma"`
	Translation     string                `json:"translation"`
	Phonetic        string                `json:"phonetic"`
	PartOfSpeech    string                `json:"partOfSpeech"`
	Topic           string                `json:"topic"`
	Aliases         []string              `json:"aliases,omitempty"`
	AcceptedAnswers []string              `json:"acceptedAnswers"`
	Examples        []string              `json:"examples"`
	Note            string                `json:"note"`
	Cloze           string                `json:"cloze,omitempty"`
	ClozeAnswer     string                `json:"clozeAnswer,omitempty"`
	Status          string                `json:"status"`
	Reason          LessonSelectionReason `json:"reason,omitempty"`
	Rating          *Rating               `json:"rating,omitempty"`
	ReviewedAt      *time.Time            `json:"reviewedAt,omitempty"`
}

type LessonSession struct {
	ID           string            `json:"id"`
	Source       string            `json:"source"`
	StudyMode    AnswerMode        `json:"studyMode"`
	SessionKind  LessonSessionKind `json:"sessionKind,omitempty"`
	LessonSize   string            `json:"lessonSize"`
	CurrentIndex int               `json:"currentIndex"`
	Version      int64             `json:"version"`
	Status       string            `json:"status"`
	Items        []LessonItem      `json:"items"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}

type LessonReviewResult struct {
	ReviewResult
	LessonID            string `json:"lessonId"`
	LessonCurrentIndex  int    `json:"lessonCurrentIndex"`
	LessonVersion       int64  `json:"lessonVersion"`
	LessonCompleted     bool   `json:"lessonCompleted"`
	LessonReviewedItems int    `json:"lessonReviewedItems"`
	LessonSkippedItems  int    `json:"lessonSkippedItems"`
	LessonTotalItems    int    `json:"lessonTotalItems"`
}
