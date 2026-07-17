import { describe, expect, it } from "vitest";

import { decideLessonAdvance, resolveActiveLessonIndex, summarizePersistedLesson } from "./lesson-flow";

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

  it("requires the exact server next index", () => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 3,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
      serverNextIndex: 1,
    })).toEqual({ kind: "next", canAdvance: true, label: "Дальше", nextIndex: 1 });
  });

  it.each([undefined, null])("blocks when the server position is %s", (serverNextIndex) => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 3,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
      serverNextIndex,
    })).toMatchObject({ kind: "blocked", reason: "server_position_missing" });
  });

  it.each([-1, 0, 2, 99, 1.5])("rejects unsafe server index %s", (serverNextIndex) => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 3,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
      serverNextIndex,
    })).toMatchObject({ kind: "blocked", reason: "server_position_invalid" });
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

  it.each([-1, 2, 1.5])("rejects invalid active lesson index %s", (index) => {
    expect(resolveActiveLessonIndex(index, 2, false)).toBeNull();
  });

  it("rejects a server position that already has a rating", () => {
    expect(resolveActiveLessonIndex(1, 3, true)).toBeNull();
  });

  it("accepts the current unrated server position", () => {
    expect(resolveActiveLessonIndex(1, 3, false)).toBe(1);
  });

  it("reports only persisted ratings and exposes divergence as skipped", () => {
    expect(summarizePersistedLesson({ first: "known", second: "almost", third: "again" }, 4)).toEqual({
      known: 1,
      almost: 1,
      again: 1,
      reviewed: 3,
      skipped: 1,
    });
  });
});
