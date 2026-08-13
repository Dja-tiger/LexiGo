package words

import (
	"strings"
	"testing"
)

func TestNormalizeCustomGlossaryImport(t *testing.T) {
	t.Run("normalizes every item and preserves version", func(t *testing.T) {
		got, err := NormalizeCustomGlossaryImport(CustomGlossaryEnvelope{
			Version: 1,
			Items: []CreateCustomWordRequest{{
				Lemma:       "  incremental   backfill ",
				Translation: " историческая   дозагрузка ",
			}},
		})
		if err != nil {
			t.Fatalf("NormalizeCustomGlossaryImport() error = %v", err)
		}
		if got.Version != 1 || len(got.Items) != 1 {
			t.Fatalf("unexpected normalized envelope: %+v", got)
		}
		if got.Items[0].Lemma != "incremental backfill" || got.Items[0].Translation != "историческая дозагрузка" {
			t.Fatalf("unexpected normalized item: %+v", got.Items[0])
		}
		if got.Items[0].Topic != customWordDefaultTopic {
			t.Fatalf("default topic = %q, want %q", got.Items[0].Topic, customWordDefaultTopic)
		}
	})

	for _, test := range []struct {
		name    string
		request CustomGlossaryEnvelope
		field   string
	}{
		{name: "unsupported version", request: CustomGlossaryEnvelope{Version: 2, Items: []CreateCustomWordRequest{{Lemma: "a", Translation: "b"}}}, field: "version"},
		{name: "empty items", request: CustomGlossaryEnvelope{Version: 1}, field: "items"},
		{name: "too many items", request: CustomGlossaryEnvelope{Version: 1, Items: makeGlossaryItems(maxCustomGlossaryItems + 1)}, field: "items"},
		{name: "nested item error", request: CustomGlossaryEnvelope{Version: 1, Items: []CreateCustomWordRequest{{Lemma: " ", Translation: "b"}}}, field: "items[0].lemma"},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, err := NormalizeCustomGlossaryImport(test.request)
			validationError, ok := err.(*CustomWordValidationError)
			if !ok {
				t.Fatalf("error = %T %v, want *CustomWordValidationError", err, err)
			}
			if validationError.Field != test.field {
				t.Fatalf("field = %q, want %q", validationError.Field, test.field)
			}
		})
	}
}

func TestNormalizeCustomGlossaryImportRejectsNormalizedDuplicate(t *testing.T) {
	_, err := NormalizeCustomGlossaryImport(CustomGlossaryEnvelope{
		Version: 1,
		Items: []CreateCustomWordRequest{
			{Lemma: "Backfill", Translation: "Историческая дозагрузка"},
			{Lemma: "  BACKFILL  ", Translation: "  ИСТОРИЧЕСКАЯ   ДОЗАГРУЗКА "},
		},
	})
	duplicateError, ok := err.(*CustomGlossaryDuplicateError)
	if !ok {
		t.Fatalf("error = %T %v, want *CustomGlossaryDuplicateError", err, err)
	}
	if duplicateError.Field != "items[1].lemma" {
		t.Fatalf("duplicate field = %q", duplicateError.Field)
	}
}

func TestNewCustomGlossaryExportUsesEmptyJSONArray(t *testing.T) {
	exported := newCustomGlossaryExport(nil)
	if exported.Version != customGlossaryVersion {
		t.Fatalf("version = %d", exported.Version)
	}
	if exported.Items == nil || len(exported.Items) != 0 {
		t.Fatalf("items = %#v, want non-nil empty slice", exported.Items)
	}
}

func makeGlossaryItems(count int) []CreateCustomWordRequest {
	items := make([]CreateCustomWordRequest, 0, count)
	for index := 0; index < count; index++ {
		items = append(items, CreateCustomWordRequest{
			Lemma:       strings.Repeat("x", index%3+1) + string(rune('a'+index%26)),
			Translation: "translation",
		})
	}
	return items
}
