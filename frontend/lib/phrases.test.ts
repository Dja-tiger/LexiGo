import { describe, expect, it } from "vitest";

import {
  isPhraseItemPayload,
  isPhraseItemsResponsePayload,
  phraseFromAPI,
  phraseSlug,
  phraseStatusLabel,
  phraseTopicLabel,
} from "./phrases";

const PHRASE = {
  id: 42,
  kind: "phrase" as const,
  slug: "identify-the-root-cause",
  lemma: "We need to identify the root cause.",
  translation: "Нам нужно определить первопричину.",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Incidents",
  examples: ["Before applying another workaround, identify the root cause."],
  note: "Используйте при разборе инцидента.",
  status: "learning",
  cloze: "We need to identify the _____ cause.",
  clozeAnswer: "root",
};

describe("phrase payload contracts", () => {
  it("accepts a complete typed phrase and maps it without changing server order fields", () => {
    expect(isPhraseItemPayload(PHRASE)).toBe(true);
    expect(phraseFromAPI(PHRASE)).toEqual(expect.objectContaining({
      id: "phrase-42",
      wordId: 42,
      kind: "phrase",
      slug: PHRASE.slug,
      prompt: PHRASE.lemma,
      answer: PHRASE.translation,
      topic: PHRASE.topic,
      examples: PHRASE.examples,
      cloze: PHRASE.cloze,
      clozeAnswer: PHRASE.clozeAnswer,
    }));
  });

  it("rejects malformed slugs, missing translations and non-phrase payloads", () => {
    expect(isPhraseItemPayload({ ...PHRASE, slug: "nested/slug" })).toBe(false);
    expect(isPhraseItemPayload({ ...PHRASE, translation: "" })).toBe(false);
    expect(isPhraseItemPayload({ ...PHRASE, kind: "word" })).toBe(false);
    expect(() => phraseFromAPI({ ...PHRASE, examples: "not-an-array" })).toThrow(TypeError);
  });

  it("validates bounded pagination metadata without requiring optional fields", () => {
    expect(isPhraseItemsResponsePayload({ items: [PHRASE], count: 1 })).toBe(true);
    expect(isPhraseItemsResponsePayload({
      items: [PHRASE],
      count: 1,
      total: 49,
      page: 2,
      pageSize: 48,
      totalPages: 2,
      hasPrevious: true,
      hasNext: false,
    })).toBe(true);
    expect(isPhraseItemsResponsePayload({ items: [PHRASE], count: 1, pageSize: 0 })).toBe(false);
    expect(isPhraseItemsResponsePayload({ items: [PHRASE], count: 1, hasNext: "yes" })).toBe(false);
  });
});

describe("phrase presentation helpers", () => {
  it("uses an explicit API slug and preserves the legacy guest fallback", () => {
    expect(phraseSlug({ ...phraseFromAPI(PHRASE), slug: "explicit" })).toBe("explicit");
    expect(phraseSlug({ ...phraseFromAPI(PHRASE), slug: undefined, id: "phrase-legacy-slug" })).toBe("legacy-slug");
  });

  it("reuses canonical localized catalog copy without hiding unknown values", () => {
    expect(phraseTopicLabel("Daily Life")).toBe("Повседневная жизнь");
    expect(phraseTopicLabel("Incidents")).toBe("Инциденты");
    expect(phraseTopicLabel("Custom Topic")).toBe("Custom Topic");
    expect(phraseStatusLabel("mastered")).toBe("Освоено");
    expect(phraseStatusLabel("learning")).toBe("Изучается");
    expect(phraseStatusLabel("unknown")).toBe("unknown");
  });
});
