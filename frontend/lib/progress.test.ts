import { describe, expect, it } from "vitest";

import {
  goalPercent,
  normalizedProgressModes,
  objectiveSuccessRate,
  ratingLabel,
  type ProgressSummary,
} from "./progress";

function progress(reviewsToday: number, dailyGoal: number): ProgressSummary {
  return {
    dueNow: 0,
    dueWords: 0,
    duePhrases: 0,
    totalWords: 579,
    totalPhrases: 24,
    newWords: 0,
    learningWords: 0,
    reviewWords: 0,
    masteredWords: 0,
    masteredPhrases: 0,
    reviewsToday,
    successfulToday: 0,
    reviewsTotal: 0,
    dailyGoal,
    currentStreak: 0,
    longestStreak: 0,
    retainedItemsWeek: 0,
    retainedWordsWeek: 0,
    retainedPhrasesWeek: 0,
  };
}

describe("progress helpers", () => {
  it("caps completed goals at one hundred percent", () => {
    expect(goalPercent(progress(45, 30))).toBe(100);
  });

  it("calculates partial daily progress", () => {
    expect(goalPercent(progress(9, 30))).toBe(30);
  });

  it("uses objective attempts instead of passive study in success rate", () => {
    expect(objectiveSuccessRate({
      ...progress(5, 30),
      successfulToday: 2,
      objectiveReviewsToday: 2,
      objectiveSuccessfulToday: 2,
    })).toBe(100);
  });

  it("falls back to v1 progress fields during rolling deployments", () => {
    expect(objectiveSuccessRate({ ...progress(4, 30), successfulToday: 3 })).toBe(75);
    expect(normalizedProgressModes(progress(1, 30)).study.attemptsToday).toBe(0);
  });

  it("uses user-facing rating labels", () => {
    expect(ratingLabel("again")).toBe("Не знал");
    expect(ratingLabel("almost")).toBe("Почти");
    expect(ratingLabel("known")).toBe("Знал");
  });
});
