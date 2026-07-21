package words

import (
	"strings"
	"testing"
)

func TestValidPhraseSlug(t *testing.T) {
	t.Parallel()

	valid := []string{
		"route-contract",
		"phrase-root-cause",
		"eta-2-release",
		"a",
	}
	for _, value := range valid {
		value := value
		t.Run("valid_"+value, func(t *testing.T) {
			t.Parallel()
			if !ValidPhraseSlug(value) {
				t.Fatalf("ValidPhraseSlug(%q) = false", value)
			}
		})
	}

	invalid := []string{
		"",
		" Route-contract",
		"route-contract ",
		"Route-contract",
		"route_contract",
		"route--contract",
		"-route-contract",
		"route-contract-",
		"маршрут",
		strings.Repeat("a", maxPhraseSlugRunes+1),
	}
	for _, value := range invalid {
		value := value
		t.Run("invalid", func(t *testing.T) {
			t.Parallel()
			if ValidPhraseSlug(value) {
				t.Fatalf("ValidPhraseSlug(%q) = true", value)
			}
		})
	}
}
