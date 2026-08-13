package words

import (
	"fmt"
	"strings"
)

const (
	customGlossaryVersion         = 1
	maxCustomGlossaryItems        = 100
	maxCustomGlossaryRequestBytes = 256 << 10
)

// CustomGlossaryEnvelope is intentionally content-only. Database identifiers,
// owner identity, scheduler state, due timestamps and review history are not
// portable glossary data and therefore never cross this boundary.
type CustomGlossaryEnvelope struct {
	Version int                       `json:"version"`
	Items   []CreateCustomWordRequest `json:"items"`
}

type CustomGlossaryImportResult struct {
	Version  int `json:"version"`
	Imported int `json:"imported"`
}

type CustomGlossaryDuplicateError struct {
	Field string
}

func (e *CustomGlossaryDuplicateError) Error() string {
	return fmt.Sprintf("duplicate custom glossary item at %s", e.Field)
}

// NormalizeCustomGlossaryImport validates the complete envelope before any
// persistence starts. That keeps structural/field/intra-payload failures out
// of the transaction and guarantees that a later database conflict is the
// only remaining reason a normalized batch can roll back.
func NormalizeCustomGlossaryImport(request CustomGlossaryEnvelope) (CustomGlossaryEnvelope, error) {
	if request.Version != customGlossaryVersion {
		return CustomGlossaryEnvelope{}, customWordValidationError(
			"version",
			fmt.Sprintf("must equal %d", customGlossaryVersion),
		)
	}
	if len(request.Items) == 0 {
		return CustomGlossaryEnvelope{}, customWordValidationError("items", "must contain at least one item")
	}
	if len(request.Items) > maxCustomGlossaryItems {
		return CustomGlossaryEnvelope{}, customWordValidationError(
			"items",
			fmt.Sprintf("must contain at most %d items", maxCustomGlossaryItems),
		)
	}

	normalized := CustomGlossaryEnvelope{
		Version: customGlossaryVersion,
		Items:   make([]CreateCustomWordRequest, 0, len(request.Items)),
	}
	seen := make(map[string]struct{}, len(request.Items))

	for index, item := range request.Items {
		normalizedItem, err := NormalizeCustomWordRequest(item)
		if err != nil {
			if validationError, ok := err.(*CustomWordValidationError); ok {
				return CustomGlossaryEnvelope{}, &CustomWordValidationError{
					Field:   fmt.Sprintf("items[%d].%s", index, validationError.Field),
					Message: validationError.Message,
				}
			}
			return CustomGlossaryEnvelope{}, err
		}

		identity := strings.ToLower(normalizedItem.Lemma) + "\x00" + strings.ToLower(normalizedItem.Translation)
		if _, exists := seen[identity]; exists {
			return CustomGlossaryEnvelope{}, &CustomGlossaryDuplicateError{
				Field: fmt.Sprintf("items[%d].lemma", index),
			}
		}
		seen[identity] = struct{}{}
		normalized.Items = append(normalized.Items, normalizedItem)
	}

	return normalized, nil
}

func newCustomGlossaryExport(items []CreateCustomWordRequest) CustomGlossaryEnvelope {
	if items == nil {
		items = make([]CreateCustomWordRequest, 0)
	}
	return CustomGlossaryEnvelope{Version: customGlossaryVersion, Items: items}
}
