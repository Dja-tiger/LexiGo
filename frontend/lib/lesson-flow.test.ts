import { describe, expect, it } from "vitest";

import { decideLessonAdvance, summarizePersistedLesson } from "./lesson-flow";

describe("lesson completion state machine", () => {
  it.each(["study", "recall", "choice"])(
    "blocks forward navigation before a persisted review in %s mode",
    () => {
      expect(decideLessonAdvance({
        currentIndex: 0,
        itemCount: 2,
        reviewPersisted: false,
        reviewSaving: false,
        serverCompleted: false,
      })).toMatchObject({ kind: "blocked", reason: "review_required", canAdvance: false });
    },
  );

  it("blocks repeat navigation while the review request is in flight", () => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 2,
      reviewPersisted: false,
      reviewSaving: true,
      serverCompleted: false,
    })).toMatchObject({ kind: "blocked", reason: "saving", canAdvance: false });
  });

  it("uses the server next index after persistence", () => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 3,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
      serverNextIndex: 1,
    })).toEqual({ kind: "next", canAdvance: true, label: "Дальше", nextIndex: 1 });
  });

  it("does not infer completion from the local last index", () => {
    expect(decideLessonAdvance({
      currentIndex: 1,
      itemCount: 2,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
    })).toMatchObject({ kind: "blocked", reason: "completion_not_confirmed", canAdvance: false });
  });

  it("opens results only after the backend confirms the last review", () => {
    expect(decideLessonAdvance({
      currentIndex: 1,
      itemCount: 2,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: true,
    })).toEqual({ kind: "results", canAdvance: true, label: "К результатам" });
  });

  it("reports only persisted ratings and exposes any divergence as skipped", () => {
    expect(summarizePersistedLesson({
      first: "known",
      second: "almost",
      third: "again",
    }, 4)).toEqual({
      known: 1,
      almost: 1,
      again: 1,
      reviewed: 3,
      skipped: 1,
    });
  });
});
