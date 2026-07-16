import { describe, expect, it } from "vitest";

import { EXPANDED_PHRASES, extendTechnicalPhraseCatalog } from "./expanded-phrases";
import { TECHNICAL_PHRASES } from "./technical-phrases";

describe("expanded phrase catalog", () => {
  it("contains one hundred new phrases with complete cloze exercises", () => {
    expect(EXPANDED_PHRASES).toHaveLength(100);
    expect(new Set(EXPANDED_PHRASES.map((item) => item.id)).size).toBe(100);
    expect(new Set(EXPANDED_PHRASES.map((item) => item.prompt)).size).toBe(100);

    for (const item of EXPANDED_PHRASES) {
      expect(item.kind).toBe("phrase");
      expect(item.cloze).toContain("_");
      expect(item.clozeAnswer?.trim()).not.toBe("");
      expect(item.examples[0]?.trim()).not.toBe("");
      expect(item.answer.trim()).not.toBe("");
    }
  });

  it("adds twenty-five phrases to each themed collection", () => {
    const counts = EXPANDED_PHRASES.reduce<Record<string, number>>((result, item) => {
      result[item.topic] = (result[item.topic] ?? 0) + 1;
      return result;
    }, {});

    expect(counts).toEqual({
      "Daily Life": 25,
      Travel: 25,
      "Data Engineering": 25,
      "Backend Development": 25,
    });
  });

  it("extends the original catalog once without duplicating phrases", () => {
    extendTechnicalPhraseCatalog();
    extendTechnicalPhraseCatalog();
    expect(TECHNICAL_PHRASES).toHaveLength(124);
    expect(new Set(TECHNICAL_PHRASES.map((item) => item.id)).size).toBe(124);
  });
});
