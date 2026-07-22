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
    expect(topicLabel("Incident")).toBe("Инциденты");
    expect(topicLabel("Incidents")).toBe("Инциденты");
    expect(topicLabel("Release")).toBe("Релизы");
    expect(topicLabel("Storage")).toBe("Хранение данных");
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

  it("provides stable plain-language labels and explanations for learning mechanics", () => {
    expect(learningTermCopy("recall")).toEqual({
      label: "Вспомнить самостоятельно",
      explanation: "Ответ нужно восстановить по памяти, не открывая подсказку заранее.",
    });
    expect(learningTermCopy("due")).toEqual({
      label: "Готово к повторению",
      explanation: "Материал, для которого наступило запланированное время следующего повторения.",
    });
    expect(learningTermCopy("retained")).toEqual({
      label: "Закреплено",
      explanation: "Материал, который был успешно воспроизведён после интервала и сохранился в памяти.",
    });
    expect(learningTermCopy("cloze")).toEqual({
      label: "Восстановить пропуск",
      explanation: "Нужно вписать пропущенное английское слово или фрагмент фразы.",
    });
    expect(learningTermCopy("chunk")).toEqual({
      label: "Готовая фраза",
      explanation: "Устойчивый фрагмент речи, который полезно запоминать целиком.",
    });
  });
});
