package learning

import "time"

type LessonCreateRequest struct {
	Source     string  `json:"source"`
	StudyMode  string  `json:"studyMode"`
	LessonSize string  `json:"lessonSize"`
	WordIDs    []int64 `json:"wordIds"`
}

type LessonItem struct {
	Position     int        `json:"position"`
	WordID       int64      `json:"id"`
	Kind         string     `json:"kind"`
	Slug         string     `json:"slug,omitempty"`
	Lemma        string     `json:"lemma"`
	Translation  string     `json:"translation"`
	Phonetic     string     `json:"phonetic"`
	PartOfSpeech string     `json:"partOfSpeech"`
	Topic        string     `json:"topic"`
	Examples     []string   `json:"examples"`
	Note         string     `json:"note"`
	Cloze        string     `json:"cloze,omitempty"`
	ClozeAnswer  string     `json:"clozeAnswer,omitempty"`
	Status       string     `json:"status"`
	Rating       *Rating    `json:"rating,omitempty"`
	ReviewedAt   *time.Time `json:"reviewedAt,omitempty"`
}

type LessonSession struct {
	ID           string       `json:"id"`
	Source       string       `json:"source"`
	StudyMode    string       `json:"studyMode"`
	LessonSize   string       `json:"lessonSize"`
	CurrentIndex int          `json:"currentIndex"`
	Status       string       `json:"status"`
	Items        []LessonItem `json:"items"`
	CreatedAt    time.Time    `json:"createdAt"`
	UpdatedAt    time.Time    `json:"updatedAt"`
}

type LessonReviewResult struct {
	ReviewResult
	LessonID            string `json:"lessonId"`
	LessonCurrentIndex  int    `json:"lessonCurrentIndex"`
	LessonCompleted     bool   `json:"lessonCompleted"`
	LessonReviewedItems int    `json:"lessonReviewedItems"`
	LessonSkippedItems  int    `json:"lessonSkippedItems"`
	LessonTotalItems    int    `json:"lessonTotalItems"`
}
