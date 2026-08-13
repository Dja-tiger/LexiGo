package words

import (
	"os"
	"strings"
	"testing"
)

func TestCustomGlossaryOpenAPIContract(t *testing.T) {
	data, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatal(err)
	}
	spec := string(data)

	exportBlock := openAPIBlock(t, spec, "  /api/v1/words/custom/export:\n", "  /api/v1/words/custom/import:\n")
	if !strings.Contains(exportBlock, "operationId: exportCustomGlossary") || !strings.Contains(exportBlock, "CustomGlossaryDocument") {
		t.Fatal("custom glossary export contract is missing")
	}

	importBlock := openAPIBlock(t, spec, "  /api/v1/words/custom/import:\n", "  /api/v1/words/custom/{wordID}:\n")
	if !strings.Contains(importBlock, "operationId: importCustomGlossary") || !strings.Contains(importBlock, "CustomGlossaryImportRequest") || !strings.Contains(importBlock, "CustomGlossaryImportResult") {
		t.Fatal("custom glossary import contract is missing")
	}

	documentBlock := openAPIBlock(t, spec, "    CustomGlossaryDocument:\n", "    CustomGlossaryImportRequest:\n")
	if !strings.Contains(documentBlock, "const: lexigo-custom-glossary-v1") || strings.Contains(documentBlock, "dueAt:") || strings.Contains(documentBlock, "repetitions:") {
		t.Fatal("portable glossary must stay versioned and content-only")
	}

	requestBlock := openAPIBlock(t, spec, "    CustomGlossaryImportRequest:\n", "    CustomGlossaryImportResult:\n")
	if !strings.Contains(requestBlock, "maxItems: 100") {
		t.Fatal("custom glossary import must stay bounded")
	}
}
