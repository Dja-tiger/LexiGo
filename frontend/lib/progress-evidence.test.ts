import { describe, expect, it } from "vitest";

import { isProgressSummaryPayload } from "./account-resources";
import {
  normalizedWeeklyEvidence,
  type ProgressSummary,
  type WeeklyProgressEvidence,
} from "./progress";

const weekly: WeeklyProgressEvidence = {
  weekStart: "2026-07-20",
  weekEnd: "2026-07-26",
  recallAttempts: 5,
  recallSuccessful: 4,
  recallRate: 80,
  previousRecallAttempts: 4,
  previousRecallSuccessful: 2,
  previousRecallRate: 50,
  choiceAttempts: 3,
  choiceSuccessful: 3,
  choiceRate: 100,
  reviews: 11,
  lessons: 2,
  activeMinutes: 14,
  trend: Array.from({ length: 7 }, (_, index) => ({
    date: `2026-07-${String(index + 20).padStart(2, "0")}`,
    attempts: index === 0 ? 2 : 0,
    successful: index === 0 ? 1 : 0,
    rate: index === 0 ? 50 : 0,
  })),
  weakTopics: [{
    topic: "Incident updates",
    attempts: 3,
    successful: 1,
    errors: 2,
    rate: 33,
  }],
  weakPartsOfSpeech: [{
    partOfSpeech: "noun",
    attempts: 4,
    successful: 2,
    errors: 2,
    rate: 50,
  }],
};

const progress: ProgressSummary = {
  dueNow: 3,
  dueWords: 2,
  duePhrases: 1,
  totalWords: 10,
  totalPhrases: 2,
  newWords: 1,
  learningWords: 2,
  reviewWords: 7,
  masteredWords: 4,
  masteredPhrases: 1,
  reviewsToday: 3,
  successfulToday: 2,
  objectiveReviewsToday: 3,
  objectiveSuccessfulToday: 2,
  reviewsTotal: 20,
  dailyGoal: 15,
  currentStreak: 2,
  longestStreak: 4,
  retainedItemsWeek: 4,
  retainedWordsWeek: 3,
  retainedPhrasesWeek: 1,
  eventSchemaVersion: 2,
  modes: {
    study: { attemptsToday: 0, successfulToday: 0, attemptsTotal: 2, successfulTotal: 0 },
    recall: { attemptsToday: 2, successfulToday: 1, attemptsTotal: 10, successfulTotal: 7 },
    choice: { attemptsToday: 1, successfulToday: 1, attemptsTotal: 8, successfulTotal: 6 },
    legacy: { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 },
  },
  weekly,
};

describe("weekly progress evidence", () => {
  it("retains the server-owned seven-day report", () => {
    expect(normalizedWeeklyEvidence(progress)).toEqual(weekly);
    expect(isProgressSummaryPayload(progress)).toBe(true);
  });

  it("rejects malformed rates, incomplete trends and invalid weak-area evidence", () => {
    expect(isProgressSummaryPayload({
      ...progress,
      weekly: { ...weekly, recallRate: 101 },
    })).toBe(false);
    expect(isProgressSummaryPayload({
      ...progress,
      weekly: { ...weekly, trend: weekly.trend.slice(0, 6) },
    })).toBe(false);
    expect(isProgressSummaryPayload({
      ...progress,
      weekly: {
        ...weekly,
        weakPartsOfSpeech: [{ ...weekly.weakPartsOfSpeech[0], partOfSpeech: "" }],
      },
    })).toBe(false);
  });

  it("provides a compatibility report for rolling frontend fixtures", () => {
    const fallback = normalizedWeeklyEvidence({ ...progress, weekly: undefined });
    expect(fallback.recallAttempts).toBe(2);
    expect(fallback.recallRate).toBe(50);
    expect(fallback.choiceRate).toBe(100);
    expect(fallback.trend).toHaveLength(7);
    expect(fallback.weakPartsOfSpeech).toEqual([]);
  });
});
