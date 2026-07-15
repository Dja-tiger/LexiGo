package words

import "time"

type Word struct {
	ID           int64    `json:"id"`
	Lemma        string   `json:"lemma"`
	Translation  string   `json:"translation"`
	Phonetic     string   `json:"phonetic"`
	PartOfSpeech string   `json:"partOfSpeech"`
	Topic        string   `json:"topic"`
	Examples     []string `json:"examples"`
}

type UserWord struct {
	Word
	Status         string     `json:"status"`
	Easiness       float64    `json:"easiness"`
	IntervalDays   int        `json:"intervalDays"`
	Repetitions    int        `json:"repetitions"`
	DueAt          time.Time  `json:"dueAt"`
	LastReviewedAt *time.Time `json:"lastReviewedAt,omitempty"`
}
