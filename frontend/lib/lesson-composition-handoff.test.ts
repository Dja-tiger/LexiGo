import { describe, expect, it } from "vitest";

import {
  consumeLearnHandoffFallbackNotice,
  markLearnLessonHandoff,
  trackLearnHandoffItem,
} from "./lesson-composition-handoff";

describe("Learn lesson composition handoff", () => {
  it("restores the phrase-only mixed fallback after the route island remount", () => {
    markLearnLessonHandoff();
    trackLearnHandoffItem("phrase");

    const notice = "Слова для этого режима закончились. Смешанная практика продолжится доступными фразами.";
    expect(consumeLearnHandoffFallbackNotice("mixed")).toBe(notice);
    expect(consumeLearnHandoffFallbackNotice("mixed")).toBe(notice);
  });

  it("restores the word-only mixed fallback", () => {
    markLearnLessonHandoff();
    trackLearnHandoffItem("word");

    expect(consumeLearnHandoffFallbackNotice("mixed")).toBe(
      "Фразы для этого режима закончились. Смешанная практика продолжится доступными словами.",
    );
  });

  it("does not invent a fallback for a mixed lesson containing both kinds", () => {
    markLearnLessonHandoff();
    trackLearnHandoffItem("word");
    trackLearnHandoffItem("phrase");

    expect(consumeLearnHandoffFallbackNotice("mixed")).toBe("");
  });

  it("closes the transient handoff for a non-mixed lesson", () => {
    markLearnLessonHandoff();
    trackLearnHandoffItem("phrase");
    expect(consumeLearnHandoffFallbackNotice("phrases")).toBe("");

    trackLearnHandoffItem("word");
    expect(consumeLearnHandoffFallbackNotice("mixed")).toBe("");
  });
});
