package moderation

import (
	"os"
	"strings"
	"testing"
)

func TestOpenAPIExposesFailClosedModerationContract(t *testing.T) {
	contract, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read OpenAPI contract: %v", err)
	}
	content := string(contract)
	if strings.Contains(content, "\n$ref:") {
		t.Fatal("OpenAPI contract contains a root-level $ref; nested schema references must remain indented")
	}
	required := []string{
		"  /api/v1/admin/answer-suggestions:\n",
		"  /api/v1/admin/answer-suggestions/metrics:\n",
		"  /api/v1/admin/answer-suggestions/{suggestionID}/decision:\n",
		"operationId: listAnswerSuggestionsForModeration",
		"operationId: decideAnswerSuggestion",
		"maximum: 100",
		"expectedVersion",
		"oldestPendingAgeSeconds",
		"ModerationDecisionReason:",
		"valid_variant",
		"insufficient_context",
		"Cache-Control:",
		"const: no-store",
		"never changes the referenced review event or historical scheduler state",
	}
	for _, fragment := range required {
		if !strings.Contains(content, fragment) {
			t.Errorf("OpenAPI moderation contract is missing %q", fragment)
		}
	}
}
