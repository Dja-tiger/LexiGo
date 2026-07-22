import { describe, expect, it } from "vitest";

import {
  catalogStatusLabel,
  learningTermCopy,
  partOfSpeechLabel,
  topicLabel,
} from "./interface-copy";

describe("interface copy", () => {
  it("localizes canonical catalog topics without changing filter values", () => {
    expect(topicLabel("academic-technical-english")).toBe("Технический английский");
    expect(topicLabel("Data Engineering")).toBe("Инженерия данных");
    expect(topicLabel("Incidents")).toBe("Инциденты");
    expect(topicLabel("  Travel  ")).toBe("Путешествия");
  });

  it("keeps an unknown content topic visible instead of inventing a translation", () => {
    expect(topicLabel("Domain Specific Topic")).toBe("Domain Specific Topic");
    expect(topicLabel(" ")).toBe("Тема не указана");
  });

  it("uses one Russian label for parts of speech and learning statuses", () => {
    expect(partOfSpeechLabel("noun")).toBe("существительное");
    expect(partOfSpeechLabel("Adjective")).toBe("прилагательное");
    expect(partOfSpeechLabel("phrase")).toBe("фраза");
    expect(catalogStatusLabel("review")).toBe("На повторении");
    expect(catalogStatusLabel("mastered")).toBe("Освоено");
  });

  it("provides plain-language explanations for learning mechanics", () => {
    expect(learningTermCopy("recall")).toEqual({
      label: "Вспомнить самостоятельно",
      explanation: "Ответ нужно восстановить по памяти, не открывая подсказку заранее.",
    });
    expect(learningTermCopy("due").label).toBe("Готово к повторению");
    expect(learningTermCopy("retained").explanation).toContain("после интервала");
    expect(learningTermCopy("cloze").label).toBe("Восстановить пропуск");
    expect(learningTermCopy("chunk").label).toBe("Готовая фраза");
  });
});
