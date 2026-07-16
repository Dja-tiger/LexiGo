import { describe, expect, it } from "vitest";

import { goalPercent, ratingLabel, type ProgressSummary } from "./progress";

function progress(reviewsToday: number, dailyGoal: number): ProgressSummary {
  return {
    dueNow: 0,
    totalWords: 579,
    newWords: 0,
    learningWords: 0,
    reviewWords: 0,
    masteredWords: 0,
    reviewsToday,
    successfulToday: 0,
    reviewsTotal: 0,
    dailyGoal,
    currentStreak: 0,
    longestStreak: 0,
  };
}

describe("progress helpers", () => {
  it("caps completed goals at one hundred percent", () => {
    expect(goalPercent(progress(45, 30))).toBe(100);
  });

  it("calculates partial daily progress", () => {
    expect(goalPercent(progress(9, 30))).toBe(30);
  });

  it("uses user-facing rating labels", () => {
    expect(ratingLabel("again")).toBe("Не знал");
    expect(ratingLabel("almost")).toBe("Почти");
    expect(ratingLabel("known")).toBe("Знал");
  });
});
