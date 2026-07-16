import { describe, expect, it } from "vitest";

import {
  buildAnswerOptions,
  exerciseAnswer,
  exercisePromptLabel,
  inferClozeAnswer,
  normalizeAnswer,
  normalizePartOfSpeech,
  prepareWordItems,
  takeLessonBlock,
  type LearningItem,
} from "./learning";

function item(id: string, section: LearningItem["section"], answer = id): LearningItem {
  return {
    id,
    kind: "word",
    prompt: id,
    answer,
    phonetic: "",
    partOfSpeech: section,
    section,
    topic: "",
    examples: [],
    note: "",
    status: "new",
  };
}

function phrase(id: string, prompt: string, cloze: string, translation: string): LearningItem {
  return {
    id,
    kind: "phrase",
    prompt,
    answer: translation,
    phonetic: "",
    partOfSpeech: "phrase",
    section: "phrase",
    topic: "Incidents",
    examples: [],
    note: "",
    status: "new",
    cloze,
  };
}

describe("learning helpers", () => {
  it("normalizes the supported parts of speech", () => {
    expect(normalizePartOfSpeech("noun")).toBe("noun");
    expect(normalizePartOfSpeech("phrasal verb")).toBe("verb");
    expect(normalizePartOfSpeech("Adjective")).toBe("adjective");
    expect(normalizePartOfSpeech("adverb")).toBe("other");
  });

  it("interleaves parts of speech in mixed mode", () => {
    const result = prepareWordItems(
      [item("n1", "noun"), item("n2", "noun"), item("v1", "verb"), item("a1", "adjective")],
      "mixed",
    );
    expect(result.map((entry) => entry.id)).toEqual(["n1", "v1", "a1", "n2"]);
  });

  it("filters one section and supports finite or all blocks", () => {
    const items = [item("n1", "noun"), item("v1", "verb"), item("n2", "noun")];
    const nouns = prepareWordItems(items, "noun");
    expect(takeLessonBlock(nouns, 15)).toHaveLength(2);
    expect(takeLessonBlock(items, "all")).toHaveLength(3);
  });

  it("builds stable unique answer options containing the correct answer", () => {
    const current = item("current", "noun", "правильный ответ");
    const pool = [current, item("a", "noun", "вариант A"), item("b", "verb", "вариант B"), item("c", "adjective", "вариант C")];
    const options = buildAnswerOptions(current, pool);
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain("правильный ответ");
    expect(buildAnswerOptions(current, pool)).toEqual(options);
  });

  it("uses the missing English fragment as the answer for a phrase cloze", () => {
    const current = phrase(
      "phrase-root-cause",
      "We need to identify the root cause.",
      "We need to identify the _____ cause.",
      "Нам нужно определить первопричину.",
    );
    const pool = [
      current,
      phrase("phrase-reproducible", "The issue is reproducible in production.", "The issue is _____ in production.", "Проблема воспроизводится."),
      phrase("phrase-degraded", "The service is currently degraded.", "The service is currently _____.", "Сервис деградировал."),
      phrase("phrase-confirmed", "There is no confirmed root cause yet.", "There is no _____ root cause yet.", "Причина не подтверждена."),
    ];

    expect(inferClozeAnswer(current.prompt, current.cloze)).toBe("root");
    expect(exerciseAnswer(current)).toBe("root");
    expect(exercisePromptLabel(current)).toContain("английское");
    expect(buildAnswerOptions(current, pool)).toContain("root");
    expect(buildAnswerOptions(current, pool)).not.toContain(current.answer);
  });

  it("normalizes punctuation, spaces and Russian yo", () => {
    expect(normalizeAnswer("  Ёмкость,  системы! ")).toBe("емкость системы");
  });
});
