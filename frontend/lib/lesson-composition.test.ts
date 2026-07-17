import { describe, expect, it } from "vitest";

import {
  lessonCompositionDescription,
  lessonCompositionFallbackMessage,
  lessonPriorityDescription,
  type LessonComposition,
} from "./lesson-composition";

const composition: LessonComposition = {
  total: 15,
  words: 8,
  phrases: 7,
  due: 6,
  new: 7,
  scheduled: 2,
  availableWords: 100,
  availablePhrases: 50,
};

describe("lesson composition copy", () => {
  it("describes the expected mixed lesson", () => {
    expect(lessonCompositionDescription(composition)).toBe("15 элементов · 8 слов · 7 фраз");
    expect(lessonPriorityDescription(composition)).toBe("6 due · 7 новых · 2 запланированных");
  });

  it("explains one-kind fallback and empty queues", () => {
    expect(lessonCompositionFallbackMessage({ ...composition, fallback: "words_only" })).toContain("доступными словами");
    expect(lessonCompositionFallbackMessage({ ...composition, fallback: "phrases_only" })).toContain("доступными фразами");
    expect(lessonCompositionFallbackMessage({ ...composition, fallback: "empty" })).toContain("нет доступных элементов");
  });
});
