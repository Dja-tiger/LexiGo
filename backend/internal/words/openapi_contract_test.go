package words

import (
	"os"
	"strings"
	"testing"
)

func TestOpenAPICatalogPaginationResponsesRemainNested(t *testing.T) {
	contract, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read OpenAPI contract: %v", err)
	}
	content := string(contract)
	required := []string{
		"  /api/v1/words:\n",
		"  /api/v1/words/due:\n",
		"  /api/v1/words/{wordID}:\n",
		"      operationId: getWord",
		"        - { name: status, in: query, schema: { type: string, enum: [new, learning, review, mastered] } }",
		"          description: One bounded catalog page.\n          content:\n            application/json:\n              schema:\n                $ref: \"#/components/schemas/CatalogPage\"",
		"          description: One bounded due page.\n          content:\n            application/json:\n              schema:\n                $ref: \"#/components/schemas/CatalogPage\"",
		"          description: Full word or term card with the current learning status.",
		"        aliases:\n          type: array",
		"        \"422\":\n          $ref: \"#/components/responses/ValidationError\"",
	}
	for _, fragment := range required {
		if !strings.Contains(content, fragment) {
			t.Errorf("OpenAPI catalog contract is missing correctly nested fragment %q", fragment)
		}
	}
	for _, malformed := range []string{"\ndescription: One bounded", "\ncontent:\n  application/json:", "\n$ref: \"#/components/responses/"} {
		if strings.Contains(content, malformed) {
			t.Errorf("OpenAPI catalog contract contains malformed top-level fragment %q", malformed)
		}
	}
}
