import { describe, expect, it } from "vitest";

import {
  isWordDetailPayload,
  wordDetailSchedule,
  wordDetailStatus,
} from "./word-detail";

const validPayload = {
  id: 101,
  kind: "word",
  lemma: "idempotent",
  translation: "идемпотентный",
  phonetic: "/ˌaɪ.dəmˈpoʊ.tənt/",
  partOfSpeech: "adjective",
  topic: "Backend Development",
  aliases: ["idempotency-safe"],
  acceptedAnswers: ["идемпотентный", "повторяемый без изменения результата"],
  examples: ["The retry handler must remain idempotent."],
  note: "Повторный вызов не меняет результат после первого успешного применения.",
  status: "review",
  easiness: 2.5,
  intervalDays: 12,
  repetitions: 4,
  dueAt: "2026-07-27T08:00:00Z",
  lastReviewedAt: "2026-07-15T08:00:00Z",
};

describe("Word Detail contract", () => {
  it("accepts the complete user-scoped scheduler payload", () => {
    expect(isWordDetailPayload(validPayload)).toBe(true);
  });

  it.each([
    ["missing due timestamp", { ...validPayload, dueAt: undefined }],
    ["invalid due timestamp", { ...validPayload, dueAt: "tomorrow" }],
    ["non-positive easiness", { ...validPayload, easiness: 0 }],
    ["fractional repetitions", { ...validPayload, repetitions: 2.5 }],
    ["negative interval", { ...validPayload, intervalDays: -1 }],
    ["invalid last review timestamp", { ...validPayload, lastReviewedAt: "recently" }],
  ])("rejects %s", (_name, payload) => {
    expect(isWordDetailPayload(payload)).toBe(false);
  });

  it("maps server statuses to honest practice actions without retention percentages", () => {
    expect(wordDetailStatus("new")).toMatchObject({
      label: "Новое",
      action: "Добавить в практику",
      studyMode: "study",
    });
    expect(wordDetailStatus("learning")).toMatchObject({
      label: "В работе",
      action: "Практиковать слово",
      studyMode: "recall",
    });
    expect(wordDetailStatus("review")).toMatchObject({
      label: "К повторению",
      action: "Повторить сейчас",
      studyMode: "recall",
    });
    expect(wordDetailStatus("mastered")).toMatchObject({
      label: "Готово",
      action: "Повторить сейчас",
      studyMode: "recall",
    });
  });

  it("formats only scheduler fields supplied by the server", () => {
    const schedule = wordDetailSchedule({
      intervalDays: 12,
      repetitions: 4,
      dueAt: "2026-07-27T08:00:00Z",
      lastReviewedAt: "2026-07-15T08:00:00Z",
    });

    expect(schedule.interval).toBe("12 дн.");
    expect(schedule.repetitions).toBe("4");
    expect(schedule.due).toContain("2026");
    expect(schedule.lastReviewed).toContain("2026");
  });

  it("describes a first review without inventing a date or interval", () => {
    expect(wordDetailSchedule({
      intervalDays: 0,
      repetitions: 0,
      dueAt: "2026-07-27T08:00:00Z",
    })).toMatchObject({
      interval: "первое повторение",
      repetitions: "0",
      lastReviewed: "ещё не было",
    });
  });
});
