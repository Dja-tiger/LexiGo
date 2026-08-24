import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const presentationSource = readFileSync(
  path.join(process.cwd(), "components", "active-lesson-presentation.tsx"),
  "utf8",
);

describe("Active Lesson reveal-answer input contract", () => {
  it("keeps Recall input editable after reveal until the review becomes immutable", () => {
    expect(presentationSource).toContain(
      "readOnly={Boolean(currentRating) || reviewing || queuedReview}",
    );
    expect(presentationSource).not.toContain("readOnly={revealed");
    expect(presentationSource).toContain(
      "onInput={(event) => onTypedAnswerChange(event.currentTarget.value)}",
    );
  });

  it("keeps reveal feedback focus separate from later user-driven input focus", () => {
    expect(presentationSource).toContain(
      'if (!revealed || mode === "study" || queuedReview) return;',
    );
    expect(presentationSource).toContain(
      "feedbackRef.current?.focus({ preventScroll: true });",
    );
    expect(presentationSource).not.toContain("premiumAnswerRef.current?.focus");
  });
});
