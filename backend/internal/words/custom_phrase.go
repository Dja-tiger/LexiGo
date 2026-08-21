package words

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"unicode/utf8"
)

const (
	customPhrasePartOfSpeech = "phrase"
	customPhraseSlugPrefix   = "custom-phrase-"
	customPhraseBlankMarker  = "_____"

	maxCustomPhraseClozeRunes       = 500
	maxCustomPhraseClozeAnswerRunes = 160
	maxCustomPhraseRequestBytes     = 16 << 10
	customPhraseSlugRandomBytes     = 16
)

type CreateCustomPhraseRequest struct {
	Lemma       string `json:"lemma"`
	Translation string `json:"translation"`
	Phonetic    string `json:"phonetic,omitempty"`
	Topic       string `json:"topic,omitempty"`
	Note        string `json:"note,omitempty"`
	Cloze       string `json:"cloze"`
	ClozeAnswer string `json:"clozeAnswer"`
}

type CustomPhraseValidationError struct {
	Field   string
	Message string
}

func (e *CustomPhraseValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NormalizeCustomPhraseRequest follows the same whitespace and content limits
// as custom words while preserving punctuation/case chosen by the learner.
// Exactly one blank marker keeps the existing phrase exercise single-answer
// contract deterministic.
func NormalizeCustomPhraseRequest(request CreateCustomPhraseRequest) (CreateCustomPhraseRequest, error) {
	request.Lemma = normalizeCustomWordText(request.Lemma)
	request.Translation = normalizeCustomWordText(request.Translation)
	request.Phonetic = normalizeCustomWordText(request.Phonetic)
	request.Topic = normalizeCustomWordText(request.Topic)
	request.Note = normalizeCustomWordText(request.Note)
	request.Cloze = normalizeCustomWordText(request.Cloze)
	request.ClozeAnswer = normalizeCustomWordText(request.ClozeAnswer)

	if request.Lemma == "" {
		return CreateCustomPhraseRequest{}, customPhraseValidationError("lemma", "lemma is required")
	}
	if request.Translation == "" {
		return CreateCustomPhraseRequest{}, customPhraseValidationError("translation", "translation is required")
	}
	if request.Cloze == "" {
		return CreateCustomPhraseRequest{}, customPhraseValidationError("cloze", "cloze is required")
	}
	if request.ClozeAnswer == "" {
		return CreateCustomPhraseRequest{}, customPhraseValidationError("clozeAnswer", "cloze answer is required")
	}
	if strings.Count(request.Cloze, customPhraseBlankMarker) != 1 {
		return CreateCustomPhraseRequest{}, customPhraseValidationError("cloze", "cloze must contain exactly one _____ marker")
	}
	if request.Topic == "" {
		request.Topic = customWordDefaultTopic
	}

	for _, field := range []struct {
		name    string
		value   string
		maximum int
	}{
		{name: "lemma", value: request.Lemma, maximum: maxCustomWordLemmaRunes},
		{name: "translation", value: request.Translation, maximum: maxCustomWordTranslationRunes},
		{name: "phonetic", value: request.Phonetic, maximum: maxCustomWordPhoneticRunes},
		{name: "topic", value: request.Topic, maximum: maxCustomWordTopicRunes},
		{name: "note", value: request.Note, maximum: maxCustomWordNoteRunes},
		{name: "cloze", value: request.Cloze, maximum: maxCustomPhraseClozeRunes},
		{name: "clozeAnswer", value: request.ClozeAnswer, maximum: maxCustomPhraseClozeAnswerRunes},
	} {
		if utf8.RuneCountInString(field.value) > field.maximum {
			return CreateCustomPhraseRequest{}, customPhraseValidationError(
				field.name,
				fmt.Sprintf("must contain at most %d characters", field.maximum),
			)
		}
	}

	return request, nil
}

// newCustomPhraseSlug deliberately avoids content-derived or owner-derived
// identifiers. A 128-bit random suffix keeps the existing global phrase slug
// uniqueness contract, prevents private content from shadowing shared phrases,
// and does not expose account identity in URLs.
func newCustomPhraseSlug() (string, error) {
	var random [customPhraseSlugRandomBytes]byte
	if _, err := rand.Read(random[:]); err != nil {
		return "", fmt.Errorf("generate custom phrase slug entropy: %w", err)
	}
	return customPhraseSlugPrefix + hex.EncodeToString(random[:]), nil
}

func customPhraseValidationError(field, message string) *CustomPhraseValidationError {
	return &CustomPhraseValidationError{Field: field, Message: message}
}
