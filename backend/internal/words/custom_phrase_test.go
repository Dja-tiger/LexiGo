package words

import (
	"errors"
	"strings"
	"testing"
)

func TestNormalizeCustomPhraseRequest(t *testing.T) {
	request, err := NormalizeCustomPhraseRequest(CreateCustomPhraseRequest{
		Lemma:       "  The   deployment   is   complete.  ",
		Translation: "  Развертывание   завершено.  ",
		Phonetic:    "  /ðə   dɪˈplɔɪmənt/  ",
		Topic:       "  Backend   Development  ",
		Note:        "  private   phrase  ",
		Cloze:       "  The deployment is   _____.  ",
		ClozeAnswer: "  complete  ",
	})
	if err != nil {
		t.Fatalf("NormalizeCustomPhraseRequest() error = %v", err)
	}
	if request.Lemma != "The deployment is complete." {
		t.Fatalf("lemma = %q", request.Lemma)
	}
	if request.Translation != "Развертывание завершено." {
		t.Fatalf("translation = %q", request.Translation)
	}
	if request.Phonetic != "/ðə dɪˈplɔɪmənt/" {
		t.Fatalf("phonetic = %q", request.Phonetic)
	}
	if request.Topic != "Backend Development" {
		t.Fatalf("topic = %q", request.Topic)
	}
	if request.Note != "private phrase" {
		t.Fatalf("note = %q", request.Note)
	}
	if request.Cloze != "The deployment is _____." || request.ClozeAnswer != "complete" {
		t.Fatalf("cloze = %q answer = %q", request.Cloze, request.ClozeAnswer)
	}
}

func TestNormalizeCustomPhraseRequestDefaultsTopic(t *testing.T) {
	request, err := NormalizeCustomPhraseRequest(CreateCustomPhraseRequest{
		Lemma:       "The request failed.",
		Translation: "Запрос завершился ошибкой.",
		Cloze:       "The request _____.",
		ClozeAnswer: "failed",
	})
	if err != nil {
		t.Fatalf("NormalizeCustomPhraseRequest() error = %v", err)
	}
	if request.Topic != customWordDefaultTopic {
		t.Fatalf("topic = %q, want %q", request.Topic, customWordDefaultTopic)
	}
}

func TestNormalizeCustomPhraseRequestRejectsInvalidFields(t *testing.T) {
	tests := []struct {
		name    string
		request CreateCustomPhraseRequest
		field   string
	}{
		{name: "blank lemma", request: CreateCustomPhraseRequest{Translation: "перевод", Cloze: "A _____.", ClozeAnswer: "test"}, field: "lemma"},
		{name: "blank translation", request: CreateCustomPhraseRequest{Lemma: "A test.", Cloze: "A _____.", ClozeAnswer: "test"}, field: "translation"},
		{name: "blank cloze", request: CreateCustomPhraseRequest{Lemma: "A test.", Translation: "Тест", ClozeAnswer: "test"}, field: "cloze"},
		{name: "blank answer", request: CreateCustomPhraseRequest{Lemma: "A test.", Translation: "Тест", Cloze: "A _____."}, field: "clozeAnswer"},
		{name: "missing marker", request: CreateCustomPhraseRequest{Lemma: "A test.", Translation: "Тест", Cloze: "A test.", ClozeAnswer: "test"}, field: "cloze"},
		{name: "multiple markers", request: CreateCustomPhraseRequest{Lemma: "A test.", Translation: "Тест", Cloze: "_____ _____.", ClozeAnswer: "a test"}, field: "cloze"},
		{name: "oversized cloze", request: CreateCustomPhraseRequest{Lemma: "A test.", Translation: "Тест", Cloze: strings.Repeat("x", maxCustomPhraseClozeRunes) + " _____", ClozeAnswer: "test"}, field: "cloze"},
		{name: "oversized answer", request: CreateCustomPhraseRequest{Lemma: "A test.", Translation: "Тест", Cloze: "A _____.", ClozeAnswer: strings.Repeat("x", maxCustomPhraseClozeAnswerRunes+1)}, field: "clozeAnswer"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := NormalizeCustomPhraseRequest(test.request)
			if err == nil {
				t.Fatal("NormalizeCustomPhraseRequest() error = nil, want validation error")
			}
			var validationError *CustomPhraseValidationError
			if !errors.As(err, &validationError) {
				t.Fatalf("error = %T %v, want *CustomPhraseValidationError", err, err)
			}
			if validationError.Field != test.field {
				t.Fatalf("field = %q, want %q", validationError.Field, test.field)
			}
		})
	}
}

func TestNewCustomPhraseSlugIsCanonicalAndDistinct(t *testing.T) {
	seen := make(map[string]struct{}, 128)
	for range 128 {
		slug, err := newCustomPhraseSlug()
		if err != nil {
			t.Fatalf("newCustomPhraseSlug() error = %v", err)
		}
		if !ValidPhraseSlug(slug) {
			t.Fatalf("slug %q is not canonical", slug)
		}
		if !strings.HasPrefix(slug, customPhraseSlugPrefix) {
			t.Fatalf("slug %q is missing prefix %q", slug, customPhraseSlugPrefix)
		}
		if _, exists := seen[slug]; exists {
			t.Fatalf("duplicate generated slug %q", slug)
		}
		seen[slug] = struct{}{}
	}
}
