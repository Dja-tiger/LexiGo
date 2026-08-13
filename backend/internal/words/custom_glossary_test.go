package words

import (
	"errors"
	"strings"
	"testing"
)

func TestNormalizeCustomGlossaryDocument(t *testing.T) {
	document, skipped, err := NormalizeCustomGlossaryDocument(CustomGlossaryDocument{
		SchemaVersion: customGlossarySchemaVersion,
		Items: []CreateCustomWordRequest{
			{Lemma: "  query   planner  ", Translation: "  планировщик   запросов ", Note: "  first   copy "},
			{Lemma: "QUERY PLANNER", Translation: "ПЛАНИРОВЩИК ЗАПРОСОВ", Note: "duplicate"},
			{Lemma: "backpressure", Translation: "обратное давление", Topic: "Data Engineering"},
		},
	})
	if err != nil {
		t.Fatalf("NormalizeCustomGlossaryDocument() error = %v", err)
	}
	if skipped != 1 || len(document.Items) != 2 {
		t.Fatalf("document=%+v skipped=%d", document, skipped)
	}
	if got := document.Items[0]; got.Lemma != "query planner" || got.Translation != "планировщик запросов" || got.Topic != customWordDefaultTopic || got.Note != "first copy" {
		t.Fatalf("first item = %+v", got)
	}
}

func TestNormalizeCustomGlossaryDocumentValidation(t *testing.T) {
	t.Run("version", func(t *testing.T) {
		_, _, err := NormalizeCustomGlossaryDocument(CustomGlossaryDocument{SchemaVersion: "future-v2"})
		var validationError *CustomGlossaryValidationError
		if !errors.As(err, &validationError) || validationError.Field != "schemaVersion" {
			t.Fatalf("error = %v", err)
		}
	})

	t.Run("limit", func(t *testing.T) {
		_, _, err := NormalizeCustomGlossaryDocument(CustomGlossaryDocument{
			SchemaVersion: customGlossarySchemaVersion,
			Items:         make([]CreateCustomWordRequest, maxCustomGlossaryItems+1),
		})
		var validationError *CustomGlossaryValidationError
		if !errors.As(err, &validationError) || validationError.Field != "items" {
			t.Fatalf("error = %v", err)
		}
	})

	t.Run("indexed item message with stable field", func(t *testing.T) {
		_, _, err := NormalizeCustomGlossaryDocument(CustomGlossaryDocument{
			SchemaVersion: customGlossarySchemaVersion,
			Items: []CreateCustomWordRequest{
				{Lemma: "valid", Translation: "валидный"},
				{Lemma: strings.Repeat("x", maxCustomWordLemmaRunes+1), Translation: "длинный"},
			},
		})
		var validationError *CustomGlossaryValidationError
		if !errors.As(err, &validationError) {
			t.Fatalf("error = %v", err)
		}
		if validationError.Field != "items" || !strings.Contains(validationError.Message, "items[1].lemma") {
			t.Fatalf("validation error = %+v", validationError)
		}
	})
}
