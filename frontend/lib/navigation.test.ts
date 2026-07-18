import { describe, expect, it, vi } from "vitest";

import {
  isRestorableNavigation,
  LEGACY_NAVIGATION_STORAGE_KEY,
  NAVIGATION_STORAGE_KEY,
  navigationURL,
  parseLegacyStoredNavigation,
  parseNavigation,
  parseStoredNavigation,
  readPersistedNavigation,
  serializeStoredNavigation,
  viewTitle,
  writePersistedNavigation,
} from "./navigation";

describe("product navigation", () => {
  it("uses the home view for an empty or invalid URL", () => {
    expect(parseNavigation("")).toEqual({ view: "home" });
    expect(parseNavigation("?view=unknown")).toEqual({ view: "home" });
  });

  it("parses supported views, sources and details", () => {
    expect(parseNavigation("?view=phrases&source=phrases&detail=phrase-root-cause")).toEqual({
      view: "phrases",
      source: "phrases",
      detail: "phrase-root-cause",
    });
  });

  it("parses all themed vocabulary collections", () => {
    for (const source of ["daily-life", "travel", "data-engineering", "backend"] as const) {
      expect(parseNavigation(`?view=learn&source=${source}`)).toEqual({ view: "learn", source });
      expect(navigationURL({ view: "learn", source })).toBe(`/?view=learn&source=${source}`);
    }
  });

  it("drops invalid sources without losing the selected view", () => {
    expect(parseNavigation("?view=learn&source=adverb")).toEqual({ view: "learn" });
  });

  it("builds stable URLs for browser history", () => {
    expect(navigationURL({ view: "home" })).toBe("/");
    expect(navigationURL({ view: "learn", source: "noun" })).toBe("/?view=learn&source=noun");
    expect(navigationURL({ view: "phrases", detail: "phrase-root-cause" })).toBe(
      "/?view=phrases&detail=phrase-root-cause",
    );
  });

  it("provides human-readable page titles", () => {
    expect(viewTitle("home")).toBe("Главная");
    expect(viewTitle("lesson")).toBe("Урок");
  });
});

describe("standalone navigation persistence", () => {
  it.each([
    ["mixed", "/?view=learn&source=mixed"],
    ["noun", "/?view=learn&source=noun"],
    ["verb", "/?view=learn&source=verb"],
    ["adjective", "/?view=learn&source=adjective"],
    ["daily-life", "/?view=learn&source=daily-life"],
    ["travel", "/?view=learn&source=travel"],
    ["data-engineering", "/?view=learn&source=data-engineering"],
    ["backend", "/?view=learn&source=backend"],
  ] as const)("restores the versioned %s dictionary source", (source, expectedURL) => {
    const target = parseStoredNavigation(serializeStoredNavigation({ view: "learn", source }));
    expect(target).toEqual({ view: "learn", source });
    expect(target && navigationURL(target)).toBe(expectedURL);
  });

  it("restores the phrases section from a versioned envelope", () => {
    const target = parseStoredNavigation(serializeStoredNavigation({ view: "phrases" }));
    expect(target).toEqual({ view: "phrases" });
    expect(target && navigationURL(target)).toBe("/?view=phrases");
  });

  it.each([
    null,
    "",
    "not-json",
    JSON.stringify({ version: 99, target: { view: "home" } }),
    JSON.stringify({ version: 2, target: { view: "unknown" } }),
    JSON.stringify({ version: 2, target: { view: "lesson", source: "mixed" } }),
  ])("rejects unsupported or corrupted versioned value %s", (raw) => {
    expect(parseStoredNavigation(raw)).toBeNull();
  });

  it("migrates a valid v1 value and deletes only the legacy cache", () => {
    const values = new Map<string, string>([[
      LEGACY_NAVIGATION_STORAGE_KEY,
      JSON.stringify({ view: "learn", source: "backend" }),
    ]]);
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
      removeItem: vi.fn((key: string) => values.delete(key)),
    };

    expect(readPersistedNavigation(storage)).toEqual({ view: "learn", source: "backend" });
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_NAVIGATION_STORAGE_KEY);
    expect(parseStoredNavigation(values.get(NAVIGATION_STORAGE_KEY) ?? null)).toEqual({
      view: "learn",
      source: "backend",
    });
  });

  it("clears an invalid current envelope without touching unrelated storage", () => {
    const values = new Map<string, string>([
      [NAVIGATION_STORAGE_KEY, JSON.stringify({ version: 2, target: { view: "unknown" } })],
      ["unrelated", "keep"],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    expect(readPersistedNavigation(storage)).toBeNull();
    expect(values.get(NAVIGATION_STORAGE_KEY)).toBeUndefined();
    expect(values.get("unrelated")).toBe("keep");
  });

  it("writes only safe top-level views and rejects transient views", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    writePersistedNavigation(storage, { view: "library" });
    expect(parseStoredNavigation(values.get(NAVIGATION_STORAGE_KEY) ?? null)).toEqual({ view: "library" });
    writePersistedNavigation(storage, { view: "lesson" });
    expect(values.get(NAVIGATION_STORAGE_KEY)).toBeUndefined();

    expect(isRestorableNavigation({ view: "learn", source: "backend" })).toBe(true);
    expect(isRestorableNavigation({ view: "lesson", source: "backend" })).toBe(false);
    expect(isRestorableNavigation({ view: "profile" })).toBe(false);
  });

  it("parses legacy values only through the explicit migration path", () => {
    const legacy = JSON.stringify({ view: "phrases" });
    expect(parseStoredNavigation(legacy)).toBeNull();
    expect(parseLegacyStoredNavigation(legacy)).toEqual({ view: "phrases" });
  });
});
