import { describe, expect, it } from "vitest";

import {
  failedResourceStatus,
  isActiveLessonPayload,
  isItemsResponsePayload,
  isProgressSummaryPayload,
} from "./account-resources";
import { RequestFailure } from "./request-failure";

const MODE = {
  attemptsToday: 2,
  successfulToday: 1,
  attemptsTotal: 10,
  successfulTotal: 8,
};

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
  objectiveReviewsToday: 4,
  objectiveSuccessfulToday: 3,
  reviewsTotal: 12,
  dailyGoal: 30,
  currentStreak: 2,
  longestStreak: 5,
  retainedItemsWeek: 3,
  retainedWordsWeek: 2,
  retainedPhrasesWeek: 1,
  eventSchemaVersion: 2,
  nextDueAt: "2026-07-18T10:00:00Z",
  modes: {
    study: MODE,
    recall: MODE,
    choice: MODE,
    legacy: MODE,
  },
};

const ITEM = {
  id: 10,
  kind: "phrase",
  slug: "retry-the-request",
  lemma: "retry the request",
  translation: "повторить запрос",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Reliability",
  examples: ["Retry the request after reconnecting."],
  note: "Use after a recoverable failure.",
  status: "new",
};

describe("account resource contracts", () => {
  it("accepts complete progress and rejects missing or invalid counters", () => {
    expect(isProgressSummaryPayload(PROGRESS)).toBe(true);
    expect(isProgressSummaryPayload({ ...PROGRESS, dailyGoal: 0 })).toBe(false);
    expect(isProgressSummaryPayload({ ...PROGRESS, dueNow: undefined })).toBe(false);
    expect(isProgressSummaryPayload({ ...PROGRESS, nextDueAt: "not-a-date" })).toBe(false);
    expect(isProgressSummaryPayload({
      ...PROGRESS,
      modes: { ...PROGRESS.modes, recall: { ...MODE, attemptsToday: -1 } },
    })).toBe(false);
  });

  it("validates every field consumed from catalog and active lesson payloads", () => {
    expect(isItemsResponsePayload({ items: [ITEM], count: 1 })).toBe(true);
    expect(isItemsResponsePayload({ items: [{ ...ITEM, examples: "invalid" }], count: 1 })).toBe(false);
    expect(isItemsResponsePayload({ items: [{ ...ITEM, phonetic: undefined }], count: 1 })).toBe(false);
    expect(isItemsResponsePayload({ items: [{ ...ITEM, note: undefined }], count: 1 })).toBe(false);

    const activeLesson = {
      id: "lesson-1",
      source: "mixed",
      studyMode: "study",
      lessonSize: "30",
      currentIndex: 0,
      version: 1,
      status: "active",
      items: [{ ...ITEM, position: 0, reason: "recent_failure" }],
      createdAt: "2026-07-18T00:00:00Z",
      updatedAt: "2026-07-18T00:00:00Z",
    };
    expect(isActiveLessonPayload(activeLesson)).toBe(true);
    for (const sessionKind of ["study", "review", "remediation"]) {
      expect(isActiveLessonPayload({ ...activeLesson, sessionKind })).toBe(true);
    }
    expect(isActiveLessonPayload({ ...activeLesson, sessionKind: "future" })).toBe(false);
    for (const reason of ["overdue", "relearning_due", "repeated_again", "repeated_almost", "scheduled"]) {
      expect(isActiveLessonPayload({ ...activeLesson, items: [{ ...ITEM, position: 0, reason }] })).toBe(true);
    }
    expect(isActiveLessonPayload({ ...activeLesson, items: [{ ...ITEM, position: 0 }] })).toBe(true);
    expect(isActiveLessonPayload({ ...activeLesson, items: [{ ...ITEM, position: 0, reason: "unknown_reason" }] })).toBe(false);
    expect(isActiveLessonPayload({ ...activeLesson, source: "unknown" })).toBe(false);
    expect(isActiveLessonPayload({ ...activeLesson, createdAt: "invalid" })).toBe(false);
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
