package learning

import (
	"os"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestOpenAPILessonSessionKindContract(t *testing.T) {
	t.Parallel()

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
	sessionKind := learningOpenAPIBlock(t, content, "    LessonSessionKind:\n", "    LessonCreateRequest:\n")
	for _, fragment := range []string{
		"enum: [study, review, remediation]",
		"orthogonal to studyMode/answerMode",
		"Omission means legacy/unspecified",
		"must not be inferred as study",
	} {
		if !strings.Contains(sessionKind, fragment) {
			t.Errorf("LessonSessionKind contract is missing %q", fragment)
		}
	}

	createRequest := learningOpenAPIBlock(t, content, "    LessonCreateRequest:\n", "    LessonPreviewRequest:\n")
	if !strings.Contains(createRequest, "        sessionKind:\n          $ref: \"#/components/schemas/LessonSessionKind\"") {
		t.Error("LessonCreateRequest must expose the optional LessonSessionKind reference")
	}
	if !strings.Contains(createRequest, "      required: [source, studyMode, lessonSize]") {
		t.Error("LessonCreateRequest must preserve the legacy required-field set")
	}
	if strings.Contains(createRequest, "required: [source, studyMode, sessionKind") {
		t.Error("sessionKind must remain optional during staged rollout")
	}

	lessonItem := learningOpenAPIBlock(t, content, "    LessonItem:\n", "    LessonSession:\n")
	if !strings.Contains(lessonItem, "enum: [recent_failure, due, overdue, relearning_due, repeated_again, repeated_almost, weak_topic, new, scheduled, manual]") {
		t.Error("LessonItem.reason must document the complete durable selection-reason vocabulary")
	}

	lessonSession := learningOpenAPIBlock(t, content, "    LessonSession:\n", "    LessonReviewRequest:\n")
	if !strings.Contains(lessonSession, "        sessionKind:\n          $ref: \"#/components/schemas/LessonSessionKind\"") {
		t.Error("LessonSession must expose the optional LessonSessionKind reference")
	}
	if !strings.Contains(lessonSession, "      required: [id, source, studyMode, lessonSize, currentIndex, version, status, items, createdAt, updatedAt]") {
		t.Error("LessonSession must preserve the legacy required-field set")
	}
	if strings.Contains(lessonSession, "required: [id, source, studyMode, sessionKind") {
		t.Error("legacy LessonSession payloads must remain valid without sessionKind")
	}
}

func learningOpenAPIBlock(t *testing.T, specification, start, end string) string {
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
