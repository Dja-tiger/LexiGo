package words

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

const (
	customWordSource       = "user-custom-v1"
	customWordDefaultTopic = "Personal"

	maxCustomWordLemmaRunes        = 160
	maxCustomWordTranslationRunes  = 500
	maxCustomWordPhoneticRunes     = 120
	maxCustomWordPartOfSpeechRunes = 80
	maxCustomWordTopicRunes        = 120
	maxCustomWordNoteRunes         = 1_000
	maxCustomWordRequestBytes      = 16 << 10
)

type CreateCustomWordRequest struct {
	Lemma        string `json:"lemma"`
	Translation  string `json:"translation"`
	Phonetic     string `json:"phonetic,omitempty"`
	PartOfSpeech string `json:"partOfSpeech,omitempty"`
	Topic        string `json:"topic,omitempty"`
	Note         string `json:"note,omitempty"`
}

type CustomWordValidationError struct {
	Field   string
	Message string
}

func (e *CustomWordValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NormalizeCustomWordRequest canonicalizes only whitespace. Case and
// punctuation remain content-owned so the learner sees exactly the intended
// technical spelling, while the database's lower(...) unique index provides
// deterministic case-insensitive duplicate detection per owner.
func NormalizeCustomWordRequest(request CreateCustomWordRequest) (CreateCustomWordRequest, error) {
	request.Lemma = normalizeCustomWordText(request.Lemma)
	request.Translation = normalizeCustomWordText(request.Translation)
	request.Phonetic = normalizeCustomWordText(request.Phonetic)
	request.PartOfSpeech = normalizeCustomWordText(request.PartOfSpeech)
	request.Topic = normalizeCustomWordText(request.Topic)
	request.Note = normalizeCustomWordText(request.Note)

	if request.Lemma == "" {
		return CreateCustomWordRequest{}, customWordValidationError("lemma", "lemma is required")
	}
	if request.Translation == "" {
		return CreateCustomWordRequest{}, customWordValidationError("translation", "translation is required")
	}
	if request.Topic == "" {
		request.Topic = customWordDefaultTopic
	}

	if err := validateCustomWordField("lemma", request.Lemma, maxCustomWordLemmaRunes); err != nil {
		return CreateCustomWordRequest{}, err
	}
	if err := validateCustomWordField("translation", request.Translation, maxCustomWordTranslationRunes); err != nil {
		return CreateCustomWordRequest{}, err
	}
	if err := validateCustomWordField("phonetic", request.Phonetic, maxCustomWordPhoneticRunes); err != nil {
		return CreateCustomWordRequest{}, err
	}
	if err := validateCustomWordField("partOfSpeech", request.PartOfSpeech, maxCustomWordPartOfSpeechRunes); err != nil {
		return CreateCustomWordRequest{}, err
	}
	if err := validateCustomWordField("topic", request.Topic, maxCustomWordTopicRunes); err != nil {
		return CreateCustomWordRequest{}, err
	}
	if err := validateCustomWordField("note", request.Note, maxCustomWordNoteRunes); err != nil {
		return CreateCustomWordRequest{}, err
	}

	return request, nil
}

func normalizeCustomWordText(value string) string {
	return strings.Join(strings.Fields(value), " ")
}

func validateCustomWordField(field, value string, maximum int) error {
	if utf8.RuneCountInString(value) <= maximum {
		return nil
	}
	return customWordValidationError(field, fmt.Sprintf("must contain at most %d characters", maximum))
}

func customWordValidationError(field, message string) *CustomWordValidationError {
	return &CustomWordValidationError{Field: field, Message: message}
}
