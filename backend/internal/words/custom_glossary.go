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

type CustomGlossaryDocument struct {
	SchemaVersion string                    `json:"schemaVersion"`
	Items         []CreateCustomWordRequest `json:"items"`
}

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

func NormalizeCustomGlossaryDocument(document CustomGlossaryDocument) (CustomGlossaryDocument, int, error) {
	if document.SchemaVersion != customGlossarySchemaVersion {
		return CustomGlossaryDocument{}, 0, &CustomGlossaryValidationError{
			Field: "schemaVersion", Message: "schemaVersion must be lexigo-custom-glossary-v1",
		}
	}
	if len(document.Items) > maxCustomGlossaryItems {
		return CustomGlossaryDocument{}, 0, &CustomGlossaryValidationError{
			Field: "items", Message: fmt.Sprintf("items must contain at most %d entries", maxCustomGlossaryItems),
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
					Field: "items",
					Message: fmt.Sprintf("items[%d].%s: %s", index, validationError.Field, validationError.Message),
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

	return CustomGlossaryDocument{SchemaVersion: customGlossarySchemaVersion, Items: items}, skipped, nil
}

func customGlossaryDuplicateKey(item CreateCustomWordRequest) string {
	return strings.ToLower(item.Lemma) + "\x00" + strings.ToLower(item.Translation)
}
