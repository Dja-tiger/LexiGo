package catalog

import "testing"

func TestEntries(t *testing.T) {
	entries, err := Entries()
	if err != nil {
		t.Fatalf("Entries() error = %v", err)
	}
	if len(entries) != ExpectedCount {
		t.Fatalf("Entries() count = %d, want %d", len(entries), ExpectedCount)
	}

	seen := make(map[string]struct{}, len(entries))
	for _, entry := range entries {
		if entry.Lemma == "" || entry.Translation == "" {
			t.Fatalf("empty required field: %+v", entry)
		}
		if _, exists := seen[entry.Lemma]; exists {
			t.Fatalf("duplicate lemma: %s", entry.Lemma)
		}
		seen[entry.Lemma] = struct{}{}
	}

	assertEntry(t, entries, 0, "absolute", "adjective", "абсолютный")
	assertEntry(t, entries, 422, "quality", "noun", "качество")
	assertEntry(t, entries, len(entries)-1, "yield", "verb", "склоняться, уступать")
}

func assertEntry(t *testing.T, entries []Entry, index int, lemma, partOfSpeech, translation string) {
	t.Helper()
	entry := entries[index]
	if entry.Lemma != lemma || entry.PartOfSpeech != partOfSpeech || entry.Translation != translation {
		t.Fatalf("entries[%d] = %+v", index, entry)
	}
}
