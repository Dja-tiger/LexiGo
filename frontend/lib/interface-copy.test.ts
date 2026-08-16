import { describe, expect, it } from "vitest";

import {
  catalogStatusLabel,
  interfaceActionLabel,
  learningTermCopy,
  lessonSelectionReasonLabel,
  lessonSourceLabel,
  partOfSpeechLabel,
  systemStateEyebrow,
  topicLabel,
} from "./interface-copy";

describe("interface copy", () => {
  it("localizes canonical catalog topics without changing filter values", () => {
    expect(topicLabel("academic-technical-english")).toBe("Технический английский");
    expect(topicLabel("Data Engineering")).toBe("Инженерия данных");
    expect(topicLabel("Incident")).toBe("Инциденты");
    expect(topicLabel("Incidents")).toBe("Инциденты");
    expect(topicLabel("Incident updates")).toBe("Обновления по инцидентам");
    expect(topicLabel("Architecture trade-offs")).toBe("Архитектурные компромиссы");
    expect(topicLabel("Backend terminology")).toBe("Backend-терминология");
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

  it("uses one canonical label for every lesson source shown across routes", () => {
    expect(lessonSourceLabel("mixed")).toBe("Смешанная практика");
    expect(lessonSourceLabel("noun")).toBe("Существительные");
    expect(lessonSourceLabel("verb")).toBe("Глаголы");
    expect(lessonSourceLabel("adjective")).toBe("Прилагательные");
    expect(lessonSourceLabel("phrases")).toBe("Технические фразы");
    expect(lessonSourceLabel("daily-life")).toBe("Бытовой английский");
    expect(lessonSourceLabel("travel")).toBe("Для путешествий");
    expect(lessonSourceLabel("data-engineering")).toBe("Инженерия данных");
    expect(lessonSourceLabel("backend")).toBe("Backend-разработка");
    expect(lessonSourceLabel("academic-technical-english")).toBe("Academic Technical English");
    expect(lessonSourceLabel(" future-source ")).toBe("future-source");
    expect(lessonSourceLabel(" ")).toBe("Раздел не указан");
  });

  it("keeps lesson selection reasons concise and truthful", () => {
    expect(lessonSelectionReasonLabel("recent_failure")).toBe("Недавняя ошибка");
    expect(lessonSelectionReasonLabel("due")).toBe("Готово к повторению");
    expect(lessonSelectionReasonLabel("weak_topic")).toBe("Слабая тема");
    expect(lessonSelectionReasonLabel("new")).toBe("Новый материал");
    expect(lessonSelectionReasonLabel("scheduled")).toBe("По расписанию");
    expect(lessonSelectionReasonLabel("manual")).toBe("Выбрано вручную");
  });

  it("keeps generic async-state and recovery actions stable", () => {
    expect(systemStateEyebrow("loading")).toBe("ЗАГРУЗКА");
    expect(systemStateEyebrow("empty")).toBe("НИЧЕГО НЕ НАЙДЕНО");
    expect(systemStateEyebrow("error")).toBe("НЕ УДАЛОСЬ ЗАГРУЗИТЬ");
    expect(systemStateEyebrow("success")).toBe("ГОТОВО");
    expect(interfaceActionLabel("retry")).toBe("Повторить");
    expect(interfaceActionLabel("home")).toBe("На главную");
    expect(interfaceActionLabel("continueLesson")).toBe("Продолжить урок");
  });
});
