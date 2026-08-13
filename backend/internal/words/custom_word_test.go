package words

import (
	"errors"
	"strings"
	"testing"
)

func TestNormalizeCustomWordRequest(t *testing.T) {
	request, err := NormalizeCustomWordRequest(CreateCustomWordRequest{
		Lemma:        "  event   time  ",
		Translation:  "  время   события  ",
		Phonetic:     "  /ɪˈvent   taɪm/  ",
		PartOfSpeech: "  noun   phrase  ",
		Note:         "  used   in   stream processing  ",
	})
	if err != nil {
		t.Fatalf("NormalizeCustomWordRequest() error = %v", err)
	}
	if request.Lemma != "event time" {
		t.Fatalf("lemma = %q, want %q", request.Lemma, "event time")
	}
	if request.Translation != "время события" {
		t.Fatalf("translation = %q, want %q", request.Translation, "время события")
	}
	if request.Phonetic != "/ɪˈvent taɪm/" {
		t.Fatalf("phonetic = %q", request.Phonetic)
	}
	if request.PartOfSpeech != "noun phrase" {
		t.Fatalf("partOfSpeech = %q", request.PartOfSpeech)
	}
	if request.Topic != customWordDefaultTopic {
		t.Fatalf("topic = %q, want %q", request.Topic, customWordDefaultTopic)
	}
	if request.Note != "used in stream processing" {
		t.Fatalf("note = %q", request.Note)
	}
}

func TestNormalizeCustomWordRequestRejectsRequiredAndOversizedFields(t *testing.T) {
	tests := []struct {
		name    string
		request CreateCustomWordRequest
		field   string
	}{
		{name: "blank lemma", request: CreateCustomWordRequest{Translation: "перевод"}, field: "lemma"},
		{name: "blank translation", request: CreateCustomWordRequest{Lemma: "term"}, field: "translation"},
		{
			name: "oversized lemma",
			request: CreateCustomWordRequest{
				Lemma:       strings.Repeat("x", maxCustomWordLemmaRunes+1),
				Translation: "перевод",
			},
			field: "lemma",
		},
		{
			name: "oversized note",
			request: CreateCustomWordRequest{
				Lemma:       "term",
				Translation: "перевод",
				Note:        strings.Repeat("я", maxCustomWordNoteRunes+1),
			},
			field: "note",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := NormalizeCustomWordRequest(test.request)
			if err == nil {
				t.Fatal("NormalizeCustomWordRequest() error = nil, want validation error")
			}
			var validationError *CustomWordValidationError
			if !errors.As(err, &validationError) {
				t.Fatalf("error = %T %v, want *CustomWordValidationError", err, err)
			}
			if validationError.Field != test.field {
				t.Fatalf("field = %q, want %q", validationError.Field, test.field)
			}
		})
	}
}
