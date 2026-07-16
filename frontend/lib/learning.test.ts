import { describe, expect, it } from "vitest";

import {
  buildAnswerOptions,
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

  it("normalizes punctuation, spaces and Russian yo", () => {
    expect(normalizeAnswer("  Ёмкость,  системы! ")).toBe("емкость системы");
  });
});
