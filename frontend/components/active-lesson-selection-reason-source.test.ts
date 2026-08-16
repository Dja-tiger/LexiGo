import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const activeLessonApp = readFileSync(new URL("./lexigo-active-lesson-app.tsx", import.meta.url), "utf8");
const activeLessonPresentation = readFileSync(new URL("./active-lesson-presentation.tsx", import.meta.url), "utf8");
const learnApp = readFileSync(new URL("./lexigo-learn-app.tsx", import.meta.url), "utf8");

describe("Issue #18 Active Lesson selection reason source contract", () => {
  it("preserves the validated server reason through the API-to-learning-item mapping", () => {
    expect(activeLessonApp).toContain("type LessonSelectionReason");
    expect(activeLessonApp).toContain("reason?: LessonSelectionReason;");
    expect(activeLessonApp).toContain("selectionReason: item.reason");
  });

  it("shows a reason only when the current learning item carries one", () => {
    expect(activeLessonPresentation).toContain("activeLessonSelectionReasonText(item.selectionReason)");
    expect(activeLessonPresentation).toContain('{selectionReasonText ? ` · ${selectionReasonText}` : ""}');
  });

  it("keeps manual source, mode and size ownership in the lesson composer", () => {
    expect(learnApp).toContain('"/api/v1/lessons/preview"');
    expect(learnApp).toContain('"/api/v1/lessons"');
    expect(learnApp.match(/lessonSize: String\(lessonSize\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(learnApp.match(/\n\s+source,\n\s+studyMode,/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
