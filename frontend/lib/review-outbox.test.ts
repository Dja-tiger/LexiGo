import { describe, expect, it } from "vitest";

import {
  parseLessonReviewEndpoint,
  parseLessonReviewPayload,
  reviewOperationKey,
  reviewResponseDisposition,
} from "./review-outbox";

const LESSON_ID = "f83b96b7-8d16-493d-bc81-d37a814db583";

describe("lesson review outbox contracts", () => {
  it("recognizes only the persisted lesson review endpoint", () => {
    expect(parseLessonReviewEndpoint(
      `https://lexigo.example/api/v1/lessons/${LESSON_ID}/words/42/review`,
    )).toEqual({ lessonId: LESSON_ID, wordId: 42 });
    expect(parseLessonReviewEndpoint("https://lexigo.example/api/v1/words/42/review")).toBeNull();
    expect(parseLessonReviewEndpoint(
      `https://lexigo.example/api/v1/lessons/${LESSON_ID}/words/0/review`,
    )).toBeNull();
  });

  it("validates the complete payload before it can be persisted", () => {
    expect(parseLessonReviewPayload({
      lessonVersion: 3,
      rating: "known",
      responseMs: 420,
      answerMode: "recall",
      correct: true,
      answerRevealed: false,
      timezoneOffsetMinutes: -120,
    })).toEqual({
      lessonVersion: 3,
      rating: "known",
      responseMs: 420,
      answerMode: "recall",
      correct: true,
      answerRevealed: false,
      timezoneOffsetMinutes: -120,
    });
    expect(parseLessonReviewPayload({
      lessonVersion: 0,
      rating: "known",
      answerMode: "recall",
      timezoneOffsetMinutes: 0,
    })).toBeNull();
    expect(parseLessonReviewPayload({
      lessonVersion: 1,
      rating: "excellent",
      answerMode: "recall",
      timezoneOffsetMinutes: 0,
    })).toBeNull();
  });

  it("deduplicates one logical card review independently from the selected rating", () => {
    const endpoint = { lessonId: LESSON_ID, wordId: 42 };
    expect(reviewOperationKey("user-1", endpoint, 7)).toBe(
      `user-1:${LESSON_ID}:42:7`,
    );
  });

  it.each([
    [200, "synced"],
    [204, "synced"],
    [401, "refresh-session"],
    [408, "retry"],
    [429, "retry"],
    [503, "retry"],
    [404, "failed"],
    [409, "failed"],
    [422, "failed"],
  ] as const)("classifies HTTP %s as %s", (status, expected) => {
    expect(reviewResponseDisposition(status)).toBe(expected);
  });
});
