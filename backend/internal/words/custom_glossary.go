package words

import (
	"fmt"
	"strings"
)

const (
	customGlossarySchemaVersion   = "lexigo-custom-glossary-v1"
	maxCustomGlossaryItems        = 100
	maxCustomGlossaryRequestBytes = 256 << 10
)

// CustomGlossaryDocument is intentionally content-only. Scheduler/history
// fields are excluded so an exported glossary can be moved or restored without
// cloning stale learning state into a new enrollment.
type CustomGlossaryDocument struct {
	SchemaVersion string                    `json:"schemaVersion"`
	Items         []CreateCustomWordRequest `json:"items"`
}

// CustomGlossaryImportResult reports deterministic merge semantics. Items are
// the canonical, normalized and payload-deduplicated entries considered by the
// repository; database duplicates are reflected only in Skipped.
type CustomGlossaryImportResult struct {
	SchemaVersion string                    `json:"schemaVersion"`
	Created       int                       `json:"created"`
	Skipped       int                       `json:"skipped"`
	Items         []CreateCustomWordRequest `json:"items"`
}

type CustomGlossaryValidationError struct {
	Field   string
	Message string
}

func (e *CustomGlossaryValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NormalizeCustomGlossaryDocument validates the transport contract before any
// persistence work. It reuses single-word normalization/limits and keeps the
// first equivalent entry when a payload repeats the same lemma/translation.
func NormalizeCustomGlossaryDocument(
	document CustomGlossaryDocument,
) (CustomGlossaryDocument, int, error) {
	if document.SchemaVersion != customGlossarySchemaVersion {
		return CustomGlossaryDocument{}, 0, &CustomGlossaryValidationError{
			Field:   "schemaVersion",
			Message: "schemaVersion must be lexigo-custom-glossary-v1",
		}
	}
	if len(document.Items) > maxCustomGlossaryItems {
		return CustomGlossaryDocument{}, 0, &CustomGlossaryValidationError{
			Field:   "items",
			Message: fmt.Sprintf("items must contain at most %d entries", maxCustomGlossaryItems),
		}
	}

	items := make([]CreateCustomWordRequest, 0, len(document.Items))
	seen := make(map[string]struct{}, len(document.Items))
	skipped := 0
	for index, item := range document.Items {
		normalized, err := NormalizeCustomWordRequest(item)
		if err != nil {
			if validationError, ok := err.(*CustomWordValidationError); ok {
				return CustomGlossaryDocument{}, 0, &CustomGlossaryValidationError{
					Field:   fmt.Sprintf("items[%d].%s", index, validationError.Field),
					Message: validationError.Message,
				}
			}
			return CustomGlossaryDocument{}, 0, err
		}

		key := customGlossaryDuplicateKey(normalized)
		if _, exists := seen[key]; exists {
			skipped++
			continue
		}
		seen[key] = struct{}{}
		items = append(items, normalized)
	}

	return CustomGlossaryDocument{
		SchemaVersion: customGlossarySchemaVersion,
		Items:         items,
	}, skipped, nil
}

func customGlossaryDuplicateKey(item CreateCustomWordRequest) string {
	return strings.ToLower(item.Lemma) + "\x00" + strings.ToLower(item.Translation)
}
