import { describe, expect, it } from "vitest";

import {
  activeLessonChoiceState,
  activeLessonConfidenceAvailable,
  activeLessonEyebrow,
  activeLessonFeedbackKind,
  activeLessonModeLabel,
  activeLessonSelectionReasonText,
} from "./active-lesson-presentation";

const normalize = (value: string) => value.trim().toLocaleLowerCase("ru-RU");

describe("active lesson presentation model", () => {
  it("maps every backend answer mode to the canonical visible label", () => {
    expect(activeLessonModeLabel("study")).toBe("Изучение");
    expect(activeLessonModeLabel("recall")).toBe("Воспроизведение");
    expect(activeLessonModeLabel("choice")).toBe("Выбор ответа");
  });

  it("keeps study exposure distinct from recall and choice prompts", () => {
    expect(activeLessonEyebrow("study", "word")).toBe("НОВОЕ СЛОВО");
    expect(activeLessonEyebrow("study", "phrase")).toBe("НОВАЯ ФРАЗА");
    expect(activeLessonEyebrow("recall", "word")).toBe("ВВЕДИТЕ ОТВЕТ");
    expect(activeLessonEyebrow("choice", "phrase")).toBe("ВЫБЕРИТЕ ПЕРЕВОД");
  });

  it("shows a server-owned selection reason without inventing one", () => {
    expect(activeLessonSelectionReasonText("recent_failure")).toBe("Почему предложено: Недавняя ошибка");
    expect(activeLessonSelectionReasonText("due")).toBe("Почему предложено: Готово к повторению");
    expect(activeLessonSelectionReasonText("weak_topic")).toBe("Почему предложено: Слабая тема");
    expect(activeLessonSelectionReasonText("new")).toBe("Почему предложено: Новый материал");
    expect(activeLessonSelectionReasonText("scheduled")).toBe("Почему предложено: По расписанию");
    expect(activeLessonSelectionReasonText("manual")).toBe("Почему предложено: Выбрано вручную");
    expect(activeLessonSelectionReasonText(undefined)).toBe("");
  });

  it("does not expose confidence before an objective recall or choice attempt", () => {
    expect(activeLessonConfidenceAvailable("recall", false)).toBe(false);
    expect(activeLessonConfidenceAvailable("choice", false)).toBe(false);
    expect(activeLessonConfidenceAvailable("recall", true)).toBe(true);
    expect(activeLessonConfidenceAvailable("choice", true)).toBe(true);
    expect(activeLessonConfidenceAvailable("study", true)).toBe(true);
  });

  it("represents correctness as an explicit semantic feedback state", () => {
    expect(activeLessonFeedbackKind("recall", false, undefined)).toBe("idle");
    expect(activeLessonFeedbackKind("recall", true, undefined)).toBe("pending");
    expect(activeLessonFeedbackKind("recall", true, true)).toBe("correct");
    expect(activeLessonFeedbackKind("choice", true, false)).toBe("incorrect");
    expect(activeLessonFeedbackKind("study", true, undefined)).toBe("study");
  });

  it("marks selected, correct and incorrect choice states without color-only meaning", () => {
    expect(activeLessonChoiceState("skip", "skip", "remove", false, normalize)).toBe("selected");
    expect(activeLessonChoiceState("remove", "skip", "remove", true, normalize)).toBe("correct");
    expect(activeLessonChoiceState("skip", "skip", "remove", true, normalize)).toBe("incorrect");
    expect(activeLessonChoiceState("reduce", "skip", "remove", true, normalize)).toBe("idle");
  });
});
