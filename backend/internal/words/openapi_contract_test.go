package words

import (
	"os"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestOpenAPICatalogPaginationResponsesRemainNested(t *testing.T) {
	contract, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read OpenAPI contract: %v", err)
	}

	var document yaml.Node
	if err := yaml.Unmarshal(contract, &document); err != nil {
		t.Fatalf("parse complete OpenAPI YAML: %v", err)
	}
	if len(document.Content) == 0 {
		t.Fatal("parsed OpenAPI document is empty")
	}

	content := string(contract)
	required := []string{
		"  /api/v1/catalog/words:\n",
		"      operationId: listPublicCatalogWords",
		"  /api/v1/catalog/words/{wordID}:\n",
		"      operationId: getPublicCatalogWord",
		"    PublicCatalogPage:\n",
		"    PublicCatalogWord:\n",
		"  /api/v1/words:\n",
		"  /api/v1/words/due:\n",
		"  /api/v1/words/{wordID}:\n",
		"      operationId: getWord",
		"  /api/v1/phrases/{slug}:\n",
		"      operationId: getPhraseBySlug",
		"            pattern: \"^[a-z0-9]+(-[a-z0-9]+)*$\"",
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

	publicList := openAPIBlock(
		t,
		content,
		"  /api/v1/catalog/words:\n",
		"  /api/v1/catalog/words/{wordID}:\n",
	)
	for _, fragment := range []string{
		"#/components/schemas/PublicCatalogPage",
		"name: source",
		"name: topic",
		"name: query",
		"name: sort",
		"name: page",
		"name: limit",
	} {
		if !strings.Contains(publicList, fragment) {
			t.Errorf("public catalog list contract is missing %q", fragment)
		}
	}
	for _, forbidden := range []string{"name: status", "security:", "bearerAuth"} {
		if strings.Contains(publicList, forbidden) {
			t.Errorf("public catalog list contract must not contain personalized/auth fragment %q", forbidden)
		}
	}

	publicDetail := openAPIBlock(
		t,
		content,
		"  /api/v1/catalog/words/{wordID}:\n",
		"  /api/v1/performance/rum:\n",
	)
	if !strings.Contains(publicDetail, "#/components/schemas/PublicCatalogWord") {
		t.Error("public catalog detail must reference PublicCatalogWord")
	}
	for _, forbidden := range []string{"security:", "bearerAuth"} {
		if strings.Contains(publicDetail, forbidden) {
			t.Errorf("public catalog detail contract must not contain auth fragment %q", forbidden)
		}
	}

	publicWord := openAPIBlock(
		t,
		content,
		"    PublicCatalogWord:\n",
		"    CatalogPage:\n",
	)
	if !strings.Contains(publicWord, "      additionalProperties: false") {
		t.Error("PublicCatalogWord must remain a closed content-only schema")
	}
	for _, personalizedField := range []string{
		"        status:",
		"        easiness:",
		"        intervalDays:",
		"        repetitions:",
		"        dueAt:",
		"        lastReviewedAt:",
	} {
		if strings.Contains(publicWord, personalizedField) {
			t.Errorf("PublicCatalogWord leaks personalized SRS field %q", strings.TrimSpace(personalizedField))
		}
	}
}

func openAPIBlock(t *testing.T, specification, start, end string) string {
	t.Helper()

	startIndex := strings.Index(specification, start)
	if startIndex < 0 {
		t.Fatalf("OpenAPI contract is missing block start %q", strings.TrimSpace(start))
	}
	tail := specification[startIndex+len(start):]
	endIndex := strings.Index(tail, end)
	if endIndex < 0 {
		t.Fatalf("OpenAPI contract is missing block end %q", strings.TrimSpace(end))
	}
	return tail[:endIndex]
}
