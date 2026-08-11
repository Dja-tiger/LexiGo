package performance

import (
	"os"
	"strings"
	"testing"
)

func TestOpenAPIExposesProductRetentionContract(t *testing.T) {
	contract, err := os.ReadFile("../../../api/openapi.yaml")
	if err != nil {
		t.Fatalf("read OpenAPI contract: %v", err)
	}
	content := string(contract)

	// A column-zero $ref is never a valid child of the root OpenAPI document.
	// Keep this whole-document structural guard alongside the focused contract
	// checks so an unrelated indentation regression cannot hide behind fragments.
	if strings.Contains(content, "\n$ref:") {
		t.Fatal("OpenAPI contract contains a root-level $ref; schema references must remain nested")
	}

	pathStart := strings.Index(content, "  /api/v1/product/retention:\n")
	if pathStart < 0 {
		t.Fatal("OpenAPI contract does not expose /api/v1/product/retention")
	}
	pathEnd := strings.Index(content[pathStart:], "\n  /api/v1/auth/register:\n")
	if pathEnd < 0 {
		t.Fatal("cannot determine product retention path boundary")
	}
	pathSection := content[pathStart : pathStart+pathEnd]
	for _, fragment := range []string{
		"operationId: reportProductRetention",
		"$ref: \"#/components/schemas/ProductRetentionEvent\"",
		"\"202\":",
		"const: no-store",
		"\"400\":",
		"\"403\":",
		"\"422\":",
		"\"429\":",
		"\"500\":",
	} {
		if !strings.Contains(pathSection, fragment) {
			t.Errorf("OpenAPI retention path is missing %q", fragment)
		}
	}

	schemaStart := strings.Index(content, "    ProductRetentionEvent:\n")
	if schemaStart < 0 {
		t.Fatal("OpenAPI contract does not define ProductRetentionEvent")
	}
	schemaEnd := strings.Index(content[schemaStart:], "\n    PerformanceRUMReport:\n")
	if schemaEnd < 0 {
		t.Fatal("cannot determine ProductRetentionEvent schema boundary")
	}
	schemaSection := content[schemaStart : schemaStart+schemaEnd]

	for _, fragment := range []string{
		"additionalProperties: false",
		"required: [appVersion, event, action, delayBucket, deviceClass, browserFamily, displayMode]",
		"enum: [lesson_completed, completion_to_next_action, return_to_next_session]",
		"enum: [none, review_due, continue_goal, next_lesson, home]",
		"enum: [none, under_1m, under_5m, under_30m, under_4h, under_24h, under_72h, later]",
		"enum: [mobile, tablet, desktop]",
		"enum: [chromium, webkit, firefox, other]",
		"enum: [browser, standalone, fullscreen, minimal-ui, unknown]",
	} {
		if !strings.Contains(schemaSection, fragment) {
			t.Errorf("OpenAPI retention schema is missing %q", fragment)
		}
	}

	for _, property := range []string{
		"userId",
		"sessionId",
		"lessonId",
		"contentId",
		"url",
		"query",
		"referrer",
		"cookie",
		"userAgent",
	} {
		if strings.Contains(schemaSection, "        "+property+":") {
			t.Errorf("OpenAPI retention schema must not expose identifying/free-form property %q", property)
		}
	}
}
