import { describe, expect, it } from "vitest";

import {
  failedResourceStatus,
  isActiveLessonPayload,
  isItemsResponsePayload,
  isProgressSummaryPayload,
} from "./account-resources";
import { RequestFailure } from "./request-failure";

const PROGRESS = {
  dueNow: 1,
  dueWords: 1,
  duePhrases: 0,
  totalWords: 10,
  totalPhrases: 2,
  newWords: 3,
  learningWords: 2,
  reviewWords: 4,
  masteredWords: 1,
  masteredPhrases: 0,
  reviewsToday: 4,
  successfulToday: 3,
  reviewsTotal: 12,
  dailyGoal: 30,
  currentStreak: 2,
  longestStreak: 5,
  retainedItemsWeek: 3,
  retainedWordsWeek: 2,
  retainedPhrasesWeek: 1,
};

const ITEM = {
  id: 10,
  kind: "phrase",
  lemma: "retry the request",
  translation: "повторить запрос",
  partOfSpeech: "phrase",
  topic: "Reliability",
  examples: ["Retry the request after reconnecting."],
  status: "new",
};

describe("account resource contracts", () => {
  it("accepts complete progress and rejects missing or invalid counters", () => {
    expect(isProgressSummaryPayload(PROGRESS)).toBe(true);
    expect(isProgressSummaryPayload({ ...PROGRESS, dailyGoal: 0 })).toBe(false);
    const { dueNow: _dueNow, ...missingDueNow } = PROGRESS;
    expect(isProgressSummaryPayload(missingDueNow)).toBe(false);
  });

  it("validates catalog and active lesson payloads", () => {
    expect(isItemsResponsePayload({ items: [ITEM], count: 1 })).toBe(true);
    expect(isItemsResponsePayload({ items: [{ ...ITEM, examples: "invalid" }], count: 1 })).toBe(false);

    expect(isActiveLessonPayload({
      id: "lesson-1",
      source: "mixed",
      studyMode: "study",
      lessonSize: "30",
      currentIndex: 0,
      version: 1,
      status: "active",
      items: [{ ...ITEM, position: 0 }],
      createdAt: "2026-07-18T00:00:00Z",
      updatedAt: "2026-07-18T00:00:00Z",
    })).toBe(true);
    expect(isActiveLessonPayload({ id: "lesson-1", items: [] })).toBe(false);
  });

  it("preserves a typed problem in a resource-specific error state", () => {
    expect(failedResourceStatus(
      new RequestFailure("server", "unavailable", { status: 503 }),
      "каталог фраз",
    )).toMatchObject({
      phase: "error",
      problem: {
        kind: "server",
        title: "Сервис временно недоступен",
        retryable: true,
      },
    });
  });
});
