package words

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

const maxPhraseSlugRunes = 120

var canonicalPhraseSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// ValidPhraseSlug accepts only the canonical form persisted by the catalog.
// The handler deliberately does not normalize arbitrary input: an invalid URL
// must not resolve to a different resource or create ambiguous cache keys.
func ValidPhraseSlug(value string) bool {
	if value == "" || value != strings.TrimSpace(value) || !utf8.ValidString(value) {
		return false
	}
	if utf8.RuneCountInString(value) > maxPhraseSlugRunes {
		return false
	}
	return canonicalPhraseSlugPattern.MatchString(value)
}
