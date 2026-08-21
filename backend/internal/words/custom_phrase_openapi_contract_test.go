package words

import (
	"os"
	"strings"
	"testing"
)

func TestOpenAPIDocumentsOwnerScopedCustomPhrases(t *testing.T) {
	contract, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read OpenAPI contract: %v", err)
	}
	content := string(contract)

	required := []string{
		"  /api/v1/phrases/custom:\n",
		"      operationId: createCustomPhrase",
		"  /api/v1/phrases/custom/{phraseID}:\n",
		"      operationId: deleteCustomPhrase",
		"    CreateCustomPhraseRequest:\n",
		"      additionalProperties: false",
		"      required: [lemma, translation, cloze, clozeAnswer]",
		"        cloze:\n          type: string\n          minLength: 1\n          maxLength: 500",
		"        clozeAnswer:\n          type: string\n          minLength: 1\n          maxLength: 160",
		"#/components/schemas/CreateCustomPhraseRequest",
		"#/components/schemas/UserWord",
		"custom_phrase_duplicate",
	}
	for _, fragment := range required {
		if !strings.Contains(content, fragment) {
			t.Errorf("OpenAPI custom-phrase contract is missing %q", fragment)
		}
	}

	createBlock := openAPIBlock(
		t,
		content,
		"  /api/v1/phrases/custom:\n",
		"  /api/v1/phrases/custom/{phraseID}:\n",
	)
	for _, fragment := range []string{"security:", "bearerAuth", "\"201\":", "\"409\":", "\"422\":"} {
		if !strings.Contains(createBlock, fragment) {
			t.Errorf("custom-phrase create contract is missing %q", fragment)
		}
	}

	deleteBlock := openAPIBlock(
		t,
		content,
		"  /api/v1/phrases/custom/{phraseID}:\n",
		"  /api/v1/phrases/{slug}:\n",
	)
	for _, fragment := range []string{"security:", "bearerAuth", "\"204\":", "\"404\":"} {
		if !strings.Contains(deleteBlock, fragment) {
			t.Errorf("custom-phrase delete contract is missing %q", fragment)
		}
	}
	for _, forbidden := range []string{"owner_user_id", "ownerUserId", "source: user-custom-v1", "slug:"} {
		if strings.Contains(createBlock, forbidden) {
			t.Errorf("custom-phrase create API must not accept/expose server-owned field %q", forbidden)
		}
	}
}
