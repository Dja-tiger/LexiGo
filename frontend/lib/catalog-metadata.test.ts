import { describe, expect, it } from "vitest";

import { catalogCountText, catalogSourceCount, catalogSummaryText, russianCount, type CatalogMetadata } from "./catalog-metadata";

const metadata: CatalogMetadata = {
  catalogVersion: "sha256:test",
  updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: 923, words: 799, phrases: 124 },
  sources: { mixed: 923, noun: 383, verb: 179, adjective: 193, phrases: 124, dailyLife: 55, travel: 55, dataEngineering: 55, backend: 55, academicTechnicalEnglish: 579 },
  topics: [],
};

describe("catalog metadata helpers", () => {
  it("maps every product source alias", () => {
    expect(catalogSourceCount(metadata, "mixed")).toBe(923);
    expect(catalogSourceCount(metadata, "noun")).toBe(383);
    expect(catalogSourceCount(metadata, "verb")).toBe(179);
    expect(catalogSourceCount(metadata, "adjective")).toBe(193);
    expect(catalogSourceCount(metadata, "phrases")).toBe(124);
    expect(catalogSourceCount(metadata, "daily-life")).toBe(55);
    expect(catalogSourceCount(metadata, "travel")).toBe(55);
    expect(catalogSourceCount(metadata, "data-engineering")).toBe(55);
    expect(catalogSourceCount(metadata, "backend")).toBe(55);
    expect(catalogSourceCount(metadata, "academic-technical-english")).toBe(579);
  });

  it.each([
    [1, "1 слово"],
    [2, "2 слова"],
    [5, "5 слов"],
    [11, "11 слов"],
    [21, "21 слово"],
    [24, "24 слова"],
    [25, "25 слов"],
  ])("formats Russian plural forms for %i", (value, expected) => {
    expect(russianCount(value, ["слово", "слова", "слов"])).toBe(expected);
  });

  it("never invents totals while loading or after an error", () => {
    expect(catalogCountText(null, "loading", "noun", ["слово", "слова", "слов"])).toBe("Загрузка…");
    expect(catalogCountText(null, "error", "noun", ["слово", "слова", "слов"])).toBe("Количество недоступно");
    expect(catalogSummaryText(null, "loading")).toContain("Загружаем");
    expect(catalogSummaryText(null, "error")).toContain("Не удалось");
  });

  it("formats the authoritative catalog summary", () => {
    expect(catalogSummaryText(metadata, "ready")).toBe("799 слов и 124 технические фразы с общей системой повторений.");
  });
});
