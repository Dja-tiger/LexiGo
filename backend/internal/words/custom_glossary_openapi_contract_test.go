package words

import (
	"os"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestOpenAPICustomGlossaryContractIsPortableBoundedAndPrivate(t *testing.T) {
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
	for _, fragment := range []string{
		"  version: 0.18.0\n",
		"  /api/v1/words/custom/export:\n",
		"      operationId: exportCustomGlossary",
		"  /api/v1/words/custom/import:\n",
		"      operationId: importCustomGlossary",
		"    CustomGlossaryExport:\n",
		"    CustomGlossaryImportRequest:\n",
		"    CustomGlossaryImportResult:\n",
		"              enum: [email, password, displayName, passwordConfirmation, token, lemma, translation, phonetic, partOfSpeech, topic, note, cloze, clozeAnswer, version, items]",
	} {
		if !strings.Contains(content, fragment) {
			t.Errorf("OpenAPI custom glossary contract is missing %q", fragment)
		}
	}

	exportPath := openAPIBlock(t, content, "  /api/v1/words/custom/export:\n", "  /api/v1/words/custom/import:\n")
	for _, fragment := range []string{"operationId: exportCustomGlossary", "bearerAuth", "#/components/schemas/CustomGlossaryExport", "Cache-Control:", "const: no-store", "Database IDs, owner identity, scheduler state, due timestamps and review history are intentionally excluded"} {
		if !strings.Contains(exportPath, fragment) {
			t.Errorf("custom glossary export path is missing %q", fragment)
		}
	}

	importPath := openAPIBlock(t, content, "  /api/v1/words/custom/import:\n", "  /api/v1/words/custom:\n")
	for _, fragment := range []string{"operationId: importCustomGlossary", "bearerAuth", "#/components/schemas/CustomGlossaryImportRequest", "#/components/schemas/CustomGlossaryImportResult", "1-100 content items in at most 256 KiB of JSON", "one PostgreSQL transaction", "No items are imported", "Cache-Control:", "const: no-store"} {
		if !strings.Contains(importPath, fragment) {
			t.Errorf("custom glossary import path is missing %q", fragment)
		}
	}

	exportSchema := openAPIBlock(t, content, "    CustomGlossaryExport:\n", "    CustomGlossaryImportRequest:\n")
	for _, fragment := range []string{"required: [version, items]", "const: 1", "#/components/schemas/CreateCustomWordRequest"} {
		if !strings.Contains(exportSchema, fragment) {
			t.Errorf("CustomGlossaryExport is missing %q", fragment)
		}
	}
	if strings.Contains(exportSchema, "maxItems:") {
		t.Error("CustomGlossaryExport must not truncate an owner glossary to the 100-item import limit")
	}
	for _, personalized := range []string{"        id:", "        ownerUserId:", "        status:", "        easiness:", "        intervalDays:", "        repetitions:", "        dueAt:", "        lastReviewedAt:", "        source:"} {
		if strings.Contains(exportSchema, personalized) {
			t.Errorf("CustomGlossaryExport leaks non-portable field %q", strings.TrimSpace(personalized))
		}
	}

	importSchema := openAPIBlock(t, content, "    CustomGlossaryImportRequest:\n", "    CustomGlossaryImportResult:\n")
	for _, fragment := range []string{"const: 1", "minItems: 1", "maxItems: 100", "#/components/schemas/CreateCustomWordRequest"} {
		if !strings.Contains(importSchema, fragment) {
			t.Errorf("CustomGlossaryImportRequest is missing %q", fragment)
		}
	}

	resultSchema := openAPIBlock(t, content, "    CustomGlossaryImportResult:\n", "    UserWord:\n")
	for _, fragment := range []string{"required: [version, imported]", "const: 1", "minimum: 1", "maximum: 100"} {
		if !strings.Contains(resultSchema, fragment) {
			t.Errorf("CustomGlossaryImportResult is missing %q", fragment)
		}
	}
}
