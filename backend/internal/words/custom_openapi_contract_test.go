package words

import (
	"os"
	"strings"
	"testing"
)

func TestOpenAPIDocumentsOwnerScopedCustomWords(t *testing.T) {
	contract, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read OpenAPI contract: %v", err)
	}
	content := string(contract)

	required := []string{
		"  /api/v1/words/custom:\n",
		"      operationId: createCustomWord",
		"  /api/v1/words/custom/{wordID}:\n",
		"      operationId: deleteCustomWord",
		"    CreateCustomWordRequest:\n",
		"      additionalProperties: false",
		"      required: [lemma, translation]",
		"        lemma:\n          type: string\n          minLength: 1\n          maxLength: 160",
		"        translation:\n          type: string\n          minLength: 1\n          maxLength: 500",
		"        note:\n          type: string\n          maxLength: 1000",
		"#/components/schemas/CreateCustomWordRequest",
		"#/components/schemas/UserWord",
		"custom_word_duplicate",
	}
	for _, fragment := range required {
		if !strings.Contains(content, fragment) {
			t.Errorf("OpenAPI custom-word contract is missing %q", fragment)
		}
	}

	createBlock := openAPIBlock(
		t,
		content,
		"  /api/v1/words/custom:\n",
		"  /api/v1/words/custom/{wordID}:\n",
	)
	for _, fragment := range []string{"security:", "bearerAuth", "\"201\":", "\"409\":", "\"422\":"} {
		if !strings.Contains(createBlock, fragment) {
			t.Errorf("custom-word create contract is missing %q", fragment)
		}
	}

	deleteBlock := openAPIBlock(
		t,
		content,
		"  /api/v1/words/custom/{wordID}:\n",
		"  /api/v1/words/{wordID}:\n",
	)
	for _, fragment := range []string{"security:", "bearerAuth", "\"204\":", "\"404\":"} {
		if !strings.Contains(deleteBlock, fragment) {
			t.Errorf("custom-word delete contract is missing %q", fragment)
		}
	}
	for _, forbidden := range []string{"owner_user_id", "ownerUserId", "source: user-custom-v1"} {
		if strings.Contains(createBlock, forbidden) || strings.Contains(deleteBlock, forbidden) {
			t.Errorf("public API must not expose internal ownership/storage field %q", forbidden)
		}
	}
}
