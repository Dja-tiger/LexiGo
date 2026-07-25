package scenarios

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"testing"
)

func TestScenarioOpenAPIContract(t *testing.T) {
	path := filepath.Join("..", "..", "..", "api", "openapi-scenarios.json")
	body, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read Scenario OpenAPI contract: %v", err)
	}

	var document map[string]any
	if err := json.Unmarshal(body, &document); err != nil {
		t.Fatalf("parse Scenario OpenAPI contract: %v", err)
	}
	if got := document["openapi"]; got != "3.1.0" {
		t.Fatalf("openapi = %v, want 3.1.0", got)
	}

	paths := objectAt(t, document, "paths")
	wantPaths := []string{
		"/api/v1/scenario-attempts/{attemptID}",
		"/api/v1/scenario-attempts/{attemptID}/pause",
		"/api/v1/scenario-attempts/{attemptID}/resume",
		"/api/v1/scenario-attempts/{attemptID}/steps/{position}",
		"/api/v1/scenarios",
		"/api/v1/scenarios/{slug}",
		"/api/v1/scenarios/{slug}/attempts",
	}
	gotPaths := make([]string, 0, len(paths))
	for path := range paths {
		gotPaths = append(gotPaths, path)
	}
	sort.Strings(gotPaths)
	if !reflect.DeepEqual(gotPaths, wantPaths) {
		t.Fatalf("Scenario OpenAPI paths = %v, want %v", gotPaths, wantPaths)
	}

	security, ok := document["security"].([]any)
	if !ok || len(security) != 1 {
		t.Fatalf("global Scenario security = %#v", document["security"])
	}
	securityEntry, ok := security[0].(map[string]any)
	if !ok {
		t.Fatalf("global Scenario security entry = %#v", security[0])
	}
	if _, exists := securityEntry["bearerAuth"]; !exists {
		t.Fatalf("global Scenario security does not require bearerAuth: %#v", securityEntry)
	}

	components := objectAt(t, document, "components")
	schemas := objectAt(t, components, "schemas")

	target := objectAt(t, schemas, "ScenarioReviewTarget")
	if target["additionalProperties"] != false {
		t.Fatalf("ScenarioReviewTarget.additionalProperties = %v, want false", target["additionalProperties"])
	}
	assertExactPropertyNames(t, objectAt(t, target, "properties"), []string{"term"})

	submit := objectAt(t, schemas, "SubmitScenarioStepRequest")
	if submit["additionalProperties"] != false {
		t.Fatalf("SubmitScenarioStepRequest.additionalProperties = %v, want false", submit["additionalProperties"])
	}
	assertExactPropertyNames(t, objectAt(t, submit, "properties"), []string{
		"attemptVersion",
		"facts",
		"hypotheses",
		"response",
		"review",
		"submissionId",
	})
	assertExactStringValues(t, submit["required"], []string{
		"attemptVersion",
		"response",
		"submissionId",
	})

	reviewMetadata := objectAt(t, schemas, "ScenarioStepReviewMetadata")
	if reviewMetadata["additionalProperties"] != false {
		t.Fatalf("ScenarioStepReviewMetadata.additionalProperties = %v, want false", reviewMetadata["additionalProperties"])
	}
	assertExactPropertyNames(t, objectAt(t, reviewMetadata, "properties"), []string{
		"responseMs",
		"timezoneOffsetMinutes",
	})

	forbiddenClientEvidence := []string{
		"answerRevealed",
		"correct",
		"judgementReason",
		"judgementSource",
		"rating",
		"submittedAnswer",
		"wordId",
	}
	submitJSON, err := json.Marshal(submit)
	if err != nil {
		t.Fatalf("marshal SubmitScenarioStepRequest: %v", err)
	}
	for _, forbidden := range forbiddenClientEvidence {
		if jsonContainsKey(submitJSON, forbidden) {
			t.Fatalf("SubmitScenarioStepRequest contains server-owned field %q", forbidden)
		}
	}

	stepPath := objectAt(t, paths, "/api/v1/scenario-attempts/{attemptID}/steps/{position}")
	putOperation := objectAt(t, stepPath, "put")
	requestBody := objectAt(t, putOperation, "requestBody")
	if requestBody["required"] != true {
		t.Fatalf("submit request body required = %v, want true", requestBody["required"])
	}
	content := objectAt(t, requestBody, "content")
	applicationJSON := objectAt(t, content, "application/json")
	schema := objectAt(t, applicationJSON, "schema")
	if got := schema["$ref"]; got != "#/components/schemas/SubmitScenarioStepRequest" {
		t.Fatalf("submit request schema = %v", got)
	}
}

func objectAt(t *testing.T, object map[string]any, key string) map[string]any {
	t.Helper()
	value, ok := object[key].(map[string]any)
	if !ok {
		t.Fatalf("%q = %#v, want object", key, object[key])
	}
	return value
}

func assertExactPropertyNames(t *testing.T, properties map[string]any, want []string) {
	t.Helper()
	got := make([]string, 0, len(properties))
	for name := range properties {
		got = append(got, name)
	}
	sort.Strings(got)
	sort.Strings(want)
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("properties = %v, want %v", got, want)
	}
}

func assertExactStringValues(t *testing.T, value any, want []string) {
	t.Helper()
	values, ok := value.([]any)
	if !ok {
		t.Fatalf("string values = %#v, want array", value)
	}
	got := make([]string, 0, len(values))
	for _, value := range values {
		item, ok := value.(string)
		if !ok {
			t.Fatalf("string value = %#v", value)
		}
		got = append(got, item)
	}
	sort.Strings(got)
	sort.Strings(want)
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("string values = %v, want %v", got, want)
	}
}

func jsonContainsKey(document []byte, key string) bool {
	return bytes.Contains(document, []byte(`"`+key+`"`))
}
