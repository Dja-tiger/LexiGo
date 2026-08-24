import { describe, expect, it } from "vitest";

import {
  LESSON_RESULT_MAX_AGE_MS,
  buildLessonResultEvidence,
  buildLessonResultSnapshot,
  claimDailyGoalCelebration,
  clearLessonResultSnapshot,
  isDistinctLessonResultCandidate,
  lessonResultOutcomeState,
  lessonResultRecommendedAction,
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
const NEXT_DUE_AT = "2026-07-25T08:30:00.000Z";

function snapshot(overrides: Partial<LessonResultSnapshot> = {}): LessonResultSnapshot {
  return {
    version: 2,
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
      recall: { attempted: 2, correct: 1, unavailable: 0 },
      recognition: { attempted: 1, correct: 1, unavailable: 0 },
      activity: { reviewed: 3, total: 3 },
    },
    confidence: { known: 2, almost: 1, again: 0 },
    skipped: 0,
    dueNow: 4,
    nextDueAt: NEXT_DUE_AT,
    dailyGoal: 30,
    reviewsBefore: 27,
    reviewsAfter: 30,
    objectiveReviewsToday: 20,
    objectiveSuccessfulToday: 16,
    currentStreak: 7,
    dailyGoalReached: true,
    dailyGoalJustReached: true,
    syncPending: false,
    ...overrides,
  };
}

describe("lesson result evidence", () => {
  it("keeps objective recall, supported recognition, unavailable correctness, and activity separate", () => {
    expect(buildLessonResultEvidence({
      recallCorrect: { mode: "recall", correct: true },
      recallIncorrect: { mode: "recall", correct: false },
      restoredRecall: { mode: "recall", correct: null },
      choiceCorrect: { mode: "choice", correct: true },
      restoredChoice: { mode: "choice", correct: null },
      studyExposure: { mode: "study", correct: null },
    }, 7)).toEqual({
      recall: { attempted: 2, correct: 1, unavailable: 1 },
      recognition: { attempted: 1, correct: 1, unavailable: 1 },
      activity: { reviewed: 6, total: 7 },
    });
  });

  it("never turns a restored unknown correctness value into an objective attempt", () => {
    const evidence = buildLessonResultEvidence({
      restored: { mode: "recall", correct: null },
    }, 1);

    expect(evidence.recall).toEqual({ attempted: 0, correct: 0, unavailable: 1 });
    expect(evidence.activity).toEqual({ reviewed: 1, total: 1 });
  });

  it("derives honest complete, partial, study, skipped, and empty outcome states", () => {
    expect(lessonResultOutcomeState(snapshot())).toBe("complete");
    expect(lessonResultOutcomeState(snapshot({
      evidence: {
        recall: { attempted: 1, correct: 1, unavailable: 1 },
        recognition: { attempted: 0, correct: 0, unavailable: 0 },
        activity: { reviewed: 2, total: 2 },
      },
    }))).toBe("partial");
    expect(lessonResultOutcomeState(snapshot({
      studyMode: "study",
      evidence: {
        recall: { attempted: 0, correct: 0, unavailable: 0 },
        recognition: { attempted: 0, correct: 0, unavailable: 0 },
        activity: { reviewed: 3, total: 3 },
      },
    }))).toBe("study");
    expect(lessonResultOutcomeState(snapshot({ skipped: 1 }))).toBe("skipped");
    expect(lessonResultOutcomeState(snapshot({
      evidence: {
        recall: { attempted: 0, correct: 0, unavailable: 0 },
        recognition: { attempted: 0, correct: 0, unavailable: 0 },
        activity: { reviewed: 0, total: 3 },
      },
    }))).toBe("empty");
  });

  it("derives the daily-goal transition only from a known before/after crossing and preserves server progress context", () => {
    const result = buildLessonResultSnapshot({
      userId: "user-194",
      lessonId: "lesson-194-a",
      source: "mixed",
      studyMode: "choice",
      sessionKind: "study",
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
      nextDueAt: NEXT_DUE_AT,
      dailyGoal: 15,
      reviewsBefore: 14,
      reviewsAfter: 16,
      objectiveReviewsToday: 10,
      objectiveSuccessfulToday: 8,
      currentStreak: 5,
    });

    expect(result.sessionKind).toBe("study");
    expect(result.dailyGoalReached).toBe(true);
    expect(result.dailyGoalJustReached).toBe(true);
    expect(result.evidence.recognition).toEqual({ attempted: 2, correct: 1, unavailable: 0 });
    expect(result.confidence).toEqual({ known: 1, almost: 0, again: 1 });
    expect(result.nextDueAt).toBe(NEXT_DUE_AT);
    expect(result.objectiveReviewsToday).toBe(10);
    expect(result.objectiveSuccessfulToday).toBe(8);
    expect(result.currentStreak).toBe(5);
  });

  it("drops malformed scheduler timestamps instead of inventing a due time", () => {
    const result = buildLessonResultSnapshot({
      userId: "user-194",
      lessonId: "lesson-194-a",
      source: "mixed",
      studyMode: "recall",
      lessonSize: "15",
      completedAt: COMPLETED_AT,
      itemIds: [101],
      judgements: { "101": { mode: "recall", correct: true } },
      ratings: { "101": "known" },
      skipped: 0,
      dueNow: 0,
      nextDueAt: "not-a-timestamp",
      dailyGoal: 15,
      reviewsBefore: 1,
      reviewsAfter: 2,
    });

    expect(result.nextDueAt).toBeNull();
  });
});

describe("lesson result continuation", () => {
  it("prioritizes sync safety and one-time milestone feedback before another action", () => {
    expect(resolveLessonResultContinuation({
      snapshot: snapshot({ syncPending: true }),
      previewTotal: 15,
    })).toEqual({ kind: "sync-pending" });

    expect(resolveLessonResultContinuation({
      snapshot: snapshot(),
      previewTotal: 15,
    })).toEqual({ kind: "daily-goal" });
  });

  it("prioritizes already-due review before creating another block", () => {
    expect(resolveLessonResultContinuation({
      snapshot: snapshot({ dailyGoalJustReached: false, dailyGoalReached: false }),
      previewTotal: 15,
    })).toEqual({ kind: "due", dueCount: 4 });
  });

  it("maps every continuation to the stable recommendation analytics vocabulary", () => {
    expect(lessonResultRecommendedAction({ kind: "next", title: "Next", itemCount: 15, estimatedMinutes: 8 })).toBe("next_lesson");
    expect(lessonResultRecommendedAction({ kind: "due", dueCount: 4 })).toBe("due_review");
    expect(lessonResultRecommendedAction({ kind: "checking" })).toBe("none");
    expect(lessonResultRecommendedAction({ kind: "daily-goal" })).toBe("home");
    expect(lessonResultRecommendedAction({ kind: "home" })).toBe("home");
    expect(lessonResultRecommendedAction({ kind: "sync-pending" })).toBe("home");
  });

  it("routes to the next distinct block or home when nothing is currently due", () => {
    expect(resolveLessonResultContinuation({
      snapshot: snapshot({ dailyGoalJustReached: false, dueNow: 0 }),
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
  it("restores explicit process intent and historical version-2 snapshots that omit it", () => {
    const storage = new MemoryStorage();
    const explicit = snapshot({ sessionKind: "remediation" });
    writeLessonResultSnapshot(storage, explicit);
    expect(readLessonResultSnapshot(storage, explicit.userId, Date.parse(COMPLETED_AT) + 1_000)).toEqual(explicit);

    const historical = snapshot();
    writeLessonResultSnapshot(storage, historical);
    expect(readLessonResultSnapshot(storage, historical.userId, Date.parse(COMPLETED_AT) + 1_000)).toEqual(historical);

    clearLessonResultSnapshot(storage, historical.userId);
    expect(readLessonResultSnapshot(storage, historical.userId, Date.parse(COMPLETED_AT) + 1_000)).toBeNull();
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

    storage.setItem("lexigo.lesson-result.v2.user-194", "{invalid");
    expect(readLessonResultSnapshot(storage, result.userId, Date.parse(COMPLETED_AT))).toBeNull();
  });

  it("rejects impossible objective aggregates in persisted state", () => {
    const storage = new MemoryStorage();
    const invalid = snapshot({
      objectiveReviewsToday: 2,
      objectiveSuccessfulToday: 3,
    });
    writeLessonResultSnapshot(storage, invalid);

    expect(readLessonResultSnapshot(storage, invalid.userId, Date.parse(COMPLETED_AT))).toBeNull();
  });

  it("claims daily-goal celebration at most once per user and day", () => {
    const storage = new MemoryStorage();
    const result = snapshot();
    expect(claimDailyGoalCelebration(storage, result)).toBe(true);
    expect(claimDailyGoalCelebration(storage, result)).toBe(false);
    expect(claimDailyGoalCelebration(storage, result)).toBe(false);
    expect(claimDailyGoalCelebration(storage, snapshot({ dailyGoalJustReached: false }))).toBe(false);
  });
});
