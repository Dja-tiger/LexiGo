package account

import "time"

const ExportSchemaVersion = 1

type Identity struct {
	ID           string
	Email        string
	DisplayName  string
	PasswordHash string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type ExportAccount struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"displayName"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ExportLearningPreferences struct {
	DailyGoal int       `json:"dailyGoal"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ExportWord struct {
	WordID         int64      `json:"wordId"`
	Lemma          string     `json:"lemma"`
	Translation    string     `json:"translation"`
	PartOfSpeech   string     `json:"partOfSpeech"`
	Topic          string     `json:"topic"`
	Status         string     `json:"status"`
	Easiness       float64    `json:"easiness"`
	IntervalDays   int        `json:"intervalDays"`
	Repetitions    int        `json:"repetitions"`
	DueAt          time.Time  `json:"dueAt"`
	LastReviewedAt *time.Time `json:"lastReviewedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type ExportReviewEvent struct {
	ID                 int64      `json:"id"`
	WordID             int64      `json:"wordId"`
	Lemma              string     `json:"lemma"`
	Translation        string     `json:"translation"`
	Grade              int16      `json:"grade"`
	Rating             *string    `json:"rating,omitempty"`
	AnswerMode         *string    `json:"answerMode,omitempty"`
	Correct            *bool      `json:"correct,omitempty"`
	AnswerRevealed     *bool      `json:"answerRevealed,omitempty"`
	EventSchemaVersion int16      `json:"eventSchemaVersion"`
	ResponseMS         *int       `json:"responseMs,omitempty"`
	ReviewedAt         time.Time  `json:"reviewedAt"`
}

type ExportAuditEvent struct {
	ID        int64             `json:"id"`
	Type      string            `json:"type"`
	UserAgent string            `json:"userAgent"`
	IPAddress string            `json:"ipAddress,omitempty"`
	Metadata  map[string]string `json:"metadata"`
	CreatedAt time.Time         `json:"createdAt"`
}

type ExportData struct {
	SchemaVersion       int                       `json:"schemaVersion"`
	GeneratedAt         time.Time                 `json:"generatedAt"`
	Account             ExportAccount             `json:"account"`
	LearningPreferences *ExportLearningPreferences `json:"learningPreferences,omitempty"`
	Words               []ExportWord              `json:"words"`
	ReviewHistory       []ExportReviewEvent        `json:"reviewHistory"`
	SecurityAudit       []ExportAuditEvent         `json:"securityAudit"`
}
