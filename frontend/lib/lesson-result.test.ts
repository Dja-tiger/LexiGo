import { describe, expect, it } from "vitest";

import {
  LESSON_RESULT_MAX_AGE_MS,
  buildLessonResultEvidence,
  buildLessonResultSnapshot,
  claimDailyGoalCelebration,
  clearLessonResultSnapshot,
  isDistinctLessonResultCandidate,
  readLessonResultSnapshot,
  resolveLessonResultContinuation,
  writeLessonResultSnapshot,
  type LessonResultSnapshot,
} from "./lesson-result";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const COMPLETED_AT = "2026-07-24T18:00:00.000Z";

function snapshot(overrides: Partial<LessonResultSnapshot> = {}): LessonResultSnapshot {
  return {
    version: 1,
    userId: "user-194",
    lessonId: "lesson-194-a",
    source: "academic-technical-english",
    studyMode: "recall",
    lessonSize: "15",
    topic: "",
    completedAt: COMPLETED_AT,
    itemIds: [101, 102, 103],
    itemCount: 3,
    evidence: {
      recall: { attempted: 2, correct: 1 },
      recognition: { attempted: 1, correct: 1 },
      activity: { reviewed: 3, total: 3 },
    },
    confidence: { known: 2, almost: 1, again: 0 },
    skipped: 0,
    dueNow: 4,
    dailyGoal: 30,
    reviewsBefore: 27,
    reviewsAfter: 30,
    dailyGoalReached: true,
    dailyGoalJustReached: true,
    syncPending: false,
    ...overrides,
  };
}

describe("lesson result evidence", () => {
  it("keeps objective recall, supported recognition, and activity separate", () => {
    expect(buildLessonResultEvidence({
      recallCorrect: { mode: "recall", correct: true },
      recallIncorrect: { mode: "recall", correct: false },
      choiceCorrect: { mode: "choice", correct: true },
      studyExposure: { mode: "study", correct: null },
    }, 5)).toEqual({
      recall: { attempted: 2, correct: 1 },
      recognition: { attempted: 1, correct: 1 },
      activity: { reviewed: 4, total: 5 },
    });
  });

  it("derives the daily-goal transition only from a known before/after crossing", () => {
    const result = buildLessonResultSnapshot({
      userId: "user-194",
      lessonId: "lesson-194-a",
      source: "mixed",
      studyMode: "choice",
      lessonSize: "15",
      completedAt: COMPLETED_AT,
      itemIds: [101, 102],
      judgements: {
        "101": { mode: "choice", correct: true },
        "102": { mode: "choice", correct: false },
      },
      ratings: { "101": "known", "102": "again" },
      skipped: 0,
      dueNow: 2,
      dailyGoal: 15,
      reviewsBefore: 14,
      reviewsAfter: 16,
    });

    expect(result.dailyGoalReached).toBe(true);
    expect(result.dailyGoalJustReached).toBe(true);
    expect(result.evidence.recognition).toEqual({ attempted: 2, correct: 1 });
    expect(result.confidence).toEqual({ known: 1, almost: 0, again: 1 });
  });
});

describe("lesson result continuation", () => {
  it("prioritizes sync safety and one-time milestone feedback before another block", () => {
    expect(resolveLessonResultContinuation({
      snapshot: snapshot({ syncPending: true }),
      previewTotal: 15,
    })).toEqual({ kind: "sync-pending" });

    expect(resolveLessonResultContinuation({
      snapshot: snapshot(),
      previewTotal: 15,
    })).toEqual({ kind: "daily-goal" });
  });

  it("routes to the next distinct block, due review, or home", () => {
    expect(resolveLessonResultContinuation({
      snapshot: snapshot({ dailyGoalJustReached: false }),
      previewTotal: 15,
      nextTitle: "Academic Technical English",
      estimatedMinutes: 8,
    })).toEqual({
      kind: "next",
      title: "Academic Technical English",
      itemCount: 15,
      estimatedMinutes: 8,
    });

    expect(resolveLessonResultContinuation({
      snapshot: snapshot({ dailyGoalJustReached: false }),
      previewTotal: 0,
    })).toEqual({ kind: "due", dueCount: 4 });

    expect(resolveLessonResultContinuation({
      snapshot: snapshot({ dailyGoalJustReached: false, dueNow: 0 }),
      previewTotal: 0,
    })).toEqual({ kind: "home" });
  });

  it("rejects the completed lesson id and the same item set", () => {
    const completed = snapshot({ dailyGoalJustReached: false });
    expect(isDistinctLessonResultCandidate(completed, {
      id: completed.lessonId,
      itemIds: [201],
    })).toBe(false);
    expect(isDistinctLessonResultCandidate(completed, {
      id: "lesson-194-b",
      itemIds: [103, 101, 102],
    })).toBe(false);
    expect(isDistinctLessonResultCandidate(completed, {
      id: "lesson-194-b",
      itemIds: [201, 202],
    })).toBe(true);
  });
});

describe("lesson result persistence", () => {
  it("restores a recent snapshot and removes it explicitly", () => {
    const storage = new MemoryStorage();
    const result = snapshot();
    writeLessonResultSnapshot(storage, result);

    expect(readLessonResultSnapshot(storage, result.userId, Date.parse(COMPLETED_AT) + 1_000)).toEqual(result);
    clearLessonResultSnapshot(storage, result.userId);
    expect(readLessonResultSnapshot(storage, result.userId, Date.parse(COMPLETED_AT) + 1_000)).toBeNull();
  });

  it("drops stale or malformed snapshots instead of restoring invented state", () => {
    const storage = new MemoryStorage();
    const result = snapshot();
    writeLessonResultSnapshot(storage, result);
    expect(readLessonResultSnapshot(
      storage,
      result.userId,
      Date.parse(COMPLETED_AT) + LESSON_RESULT_MAX_AGE_MS + 1,
    )).toBeNull();

    storage.setItem("lexigo.lesson-result.v1.user-194", "{invalid");
    expect(readLessonResultSnapshot(storage, result.userId, Date.parse(COMPLETED_AT))).toBeNull();
  });

  it("claims daily-goal celebration at most once per user and day", () => {
    const storage = new MemoryStorage();
    const result = snapshot();
    expect(claimDailyGoalCelebration(storage, result)).toBe(true);
    expect(claimDailyGoalCelebration(storage, result)).toBe(false);
    expect(claimDailyGoalCelebration(storage, result,)).toBe(false);
    expect(claimDailyGoalCelebration(storage, snapshot({ dailyGoalJustReached: false }))).toBe(false);
  });
});
