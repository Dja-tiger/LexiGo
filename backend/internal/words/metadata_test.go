package words

import (
	"testing"
	"time"
)

func TestCatalogMetadataVersionIsStableAndContentSensitive(t *testing.T) {
	updatedAt := time.Date(2026, 7, 17, 12, 0, 0, 123, time.UTC)
	metadata := CatalogMetadata{
		UpdatedAt: updatedAt,
		Totals:    CatalogTotals{Items: 10, Words: 8, Phrases: 2},
		Sources: CatalogSourceTotals{
			Mixed: 10, Noun: 3, Verb: 2, Adjective: 2, Phrases: 2,
			DailyLife: 1, Travel: 1, DataEngineering: 1, Backend: 1,
		},
		Topics: []CatalogTopicTotal{{Topic: "Backend Development", Count: 1}, {Topic: "Data Engineering", Count: 2}},
	}

	first := catalogMetadataVersion(metadata)
	second := catalogMetadataVersion(metadata)
	if first == "" || first != second {
		t.Fatalf("catalog version must be stable: first=%q second=%q", first, second)
	}

	changedCount := metadata
	changedCount.Totals.Items++
	if catalogMetadataVersion(changedCount) == first {
		t.Fatal("catalog version did not change after totals changed")
	}

	changedTopic := metadata
	changedTopic.Topics = append([]CatalogTopicTotal(nil), metadata.Topics...)
	changedTopic.Topics[0].Count++
	if catalogMetadataVersion(changedTopic) == first {
		t.Fatal("catalog version did not change after topic totals changed")
	}

	changedTimestamp := metadata
	changedTimestamp.UpdatedAt = updatedAt.Add(time.Nanosecond)
	if catalogMetadataVersion(changedTimestamp) == first {
		t.Fatal("catalog version did not change after updatedAt changed")
	}
}

func TestMatchesETag(t *testing.T) {
	const expected = `"sha256:abc123"`
	tests := []struct {
		name   string
		header string
		want   bool
	}{
		{name: "exact", header: expected, want: true},
		{name: "weak", header: `W/"sha256:abc123"`, want: true},
		{name: "list", header: `"other", W/"sha256:abc123"`, want: true},
		{name: "wildcard", header: `*`, want: true},
		{name: "different", header: `"sha256:different"`, want: false},
		{name: "empty", header: ``, want: false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := matchesETag(test.header, expected); got != test.want {
				t.Fatalf("matchesETag(%q, %q) = %v, want %v", test.header, expected, got, test.want)
			}
		})
	}
}
