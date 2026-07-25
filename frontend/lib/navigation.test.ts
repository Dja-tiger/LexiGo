import { describe, expect, it, vi } from "vitest";

import {
  canonicalURLFromLegacySearch,
  isCanonicalRoutePath,
  isRestorableNavigation,
  LEGACY_NAVIGATION_STORAGE_KEY,
  NAVIGATION_STORAGE_KEY,
  navigationURL,
  parseLegacyStoredNavigation,
  parseNavigation,
  parseNavigationLocation,
  parseStoredNavigation,
  readPersistedNavigation,
  routePath,
  serializeStoredNavigation,
  viewTitle,
  writePersistedNavigation,
} from "./navigation";

describe("product navigation", () => {
  it("uses the home view for an empty or invalid URL", () => {
    expect(parseNavigation("", "/")).toEqual({ view: "home" });
    expect(parseNavigation("?view=unknown", "/")).toEqual({ view: "home" });
    expect(parseNavigation("", "/unknown-route")).toEqual({ view: "home" });
  });

  it("parses canonical primary and focused routes", () => {
    expect(parseNavigation("", "/learn")).toEqual({ view: "learn" });
    expect(parseNavigation("", "/phrases")).toEqual({ view: "phrases" });
    expect(parseNavigation("", "/dictionary")).toEqual({ view: "library" });
    expect(parseNavigation("", "/progress")).toEqual({ view: "progress" });
    expect(parseNavigation("", "/profile")).toEqual({ view: "profile" });
    expect(parseNavigation("", "/lesson/active")).toEqual({ view: "lesson", detail: "active" });
    expect(parseNavigation("", "/scenarios/incident-update")).toEqual({
      view: "scenario",
      detail: "incident-update",
    });
    expect(parseNavigation("", "/scenarios/Incident_Update")).toEqual({ view: "home" });
  });

  it("parses canonical detail routes and filter state", () => {
    expect(parseNavigation("?source=phrases", "/phrases/phrase-root-cause")).toEqual({
      view: "phrases",
      source: "phrases",
      detail: "phrase-root-cause",
    });
    expect(parseNavigation(
      "?source=backend&topic=Backend%20Development&status=review&query=temporary%20storage&sort=az&page=3",
      "/words/101",
    )).toEqual({
      view: "library",
      source: "backend",
      topic: "Backend Development",
      status: "review",
      query: "temporary storage",
      sort: "az",
      page: 3,
      detail: "101",
    });
  });

  it("parses a browser location without coupling callers to query-only routing", () => {
    expect(parseNavigationLocation({
      pathname: "/dictionary",
      search: "?source=data-engineering&query=pipeline",
    } as Location)).toEqual({
      view: "library",
      source: "data-engineering",
      query: "pipeline",
    });
  });

  it("parses legacy view URLs for backward-compatible redirects", () => {
    expect(parseNavigation("?view=phrases&source=phrases&detail=phrase-root-cause", "/")).toEqual({
      view: "phrases",
      source: "phrases",
      detail: "phrase-root-cause",
    });
    expect(canonicalURLFromLegacySearch("?view=library&source=backend&status=review&detail=101")).toBe(
      "/words/101?source=backend&status=review",
    );
    expect(canonicalURLFromLegacySearch("?source=backend")).toBeNull();
  });

  it("parses all themed vocabulary collections", () => {
    for (const source of ["daily-life", "travel", "data-engineering", "backend", "academic-technical-english"] as const) {
      expect(parseNavigation(`?source=${source}`, "/learn")).toEqual({ view: "learn", source });
      expect(navigationURL({ view: "learn", source })).toBe(`/learn?source=${source}`);
    }
  });

  it("drops invalid catalog filters without losing the selected route", () => {
    expect(parseNavigation("?source=adverb&status=unknown&sort=random&page=zero", "/dictionary")).toEqual({
      view: "library",
    });
  });

  it("builds stable canonical URLs for browser history", () => {
    expect(navigationURL({ view: "home" })).toBe("/");
    expect(navigationURL({ view: "learn", source: "noun" })).toBe("/learn?source=noun");
    expect(navigationURL({ view: "phrases", detail: "phrase-root-cause" })).toBe(
      "/phrases/phrase-root-cause",
    );
    expect(navigationURL({ view: "scenario", detail: "incident-update" })).toBe(
      "/scenarios/incident-update",
    );
    expect(navigationURL({
      view: "library",
      source: "backend",
      topic: "Backend Development",
      status: "review",
      query: "temporary storage",
      sort: "za",
      page: 2,
      detail: "101",
    })).toBe("/words/101?source=backend&topic=Backend+Development&status=review&query=temporary+storage&sort=za&page=2");
  });

  it("omits default sort and first page from canonical URLs", () => {
    expect(navigationURL({ view: "library", sort: "default", page: 1 })).toBe("/dictionary");
  });

  it("keeps only supported detail route shapes canonical", () => {
    expect(routePath({ view: "lesson" })).toBe("/lesson/active");
    expect(routePath({ view: "scenario" })).toBe("/learn");
    expect(routePath({ view: "scenario", detail: "release-go-no-go" })).toBe("/scenarios/release-go-no-go");
    expect(routePath({ view: "library", detail: "101" })).toBe("/words/101");
    expect(routePath({ view: "library", detail: "not-a-word-id" })).toBe("/dictionary");
    expect(isCanonicalRoutePath("/learn")).toBe(true);
    expect(isCanonicalRoutePath("/phrases/root-cause")).toBe(true);
    expect(isCanonicalRoutePath("/words/101")).toBe(true);
    expect(isCanonicalRoutePath("/lesson/active")).toBe(true);
    expect(isCanonicalRoutePath("/scenarios/incident-update")).toBe(true);
    expect(isCanonicalRoutePath("/scenarios/Incident_Update")).toBe(false);
    expect(isCanonicalRoutePath("/lesson/another-users-session")).toBe(false);
    expect(isCanonicalRoutePath("/unknown")).toBe(false);
  });

  it("provides human-readable page titles", () => {
    expect(viewTitle("home")).toBe("Главная");
    expect(viewTitle("lesson")).toBe("Урок");
    expect(viewTitle("scenario")).toBe("Сценарий");
  });
});

describe("standalone navigation persistence", () => {
  it.each([
    ["mixed", "/learn?source=mixed"],
    ["noun", "/learn?source=noun"],
    ["verb", "/learn?source=verb"],
    ["adjective", "/learn?source=adjective"],
    ["daily-life", "/learn?source=daily-life"],
    ["travel", "/learn?source=travel"],
    ["data-engineering", "/learn?source=data-engineering"],
    ["backend", "/learn?source=backend"],
    ["academic-technical-english", "/learn?source=academic-technical-english"],
  ] as const)("restores the versioned %s dictionary source", (source, expectedURL) => {
    const target = parseStoredNavigation(serializeStoredNavigation({ view: "learn", source }));
    expect(target).toEqual({ view: "learn", source });
    expect(target && navigationURL(target)).toBe(expectedURL);
  });

  it("restores the complete dictionary query from a versioned envelope", () => {
    const stored = serializeStoredNavigation({
      view: "library",
      source: "data-engineering",
      topic: "Data Engineering",
      status: "learning",
      query: "pipeline",
      sort: "az",
      page: 2,
    });
    expect(parseStoredNavigation(stored)).toEqual({
      view: "library",
      source: "data-engineering",
      topic: "Data Engineering",
      status: "learning",
      query: "pipeline",
      sort: "az",
      page: 2,
    });
  });

  it("restores the phrases section from a versioned envelope", () => {
    const target = parseStoredNavigation(serializeStoredNavigation({ view: "phrases" }));
    expect(target).toEqual({ view: "phrases" });
    expect(target && navigationURL(target)).toBe("/phrases");
  });

  it.each([
    null,
    "",
    "not-json",
    JSON.stringify({ version: 99, target: { view: "home" } }),
    JSON.stringify({ version: 2, target: { view: "unknown" } }),
    JSON.stringify({ version: 2, target: { view: "lesson", source: "mixed" } }),
    JSON.stringify({ version: 2, target: { view: "scenario", detail: "incident-update" } }),
    JSON.stringify({ version: 2, target: { view: "library", status: "unknown" } }),
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

    writePersistedNavigation(storage, { view: "library", status: "review", query: "cache" });
    expect(parseStoredNavigation(values.get(NAVIGATION_STORAGE_KEY) ?? null)).toEqual({ view: "library", status: "review", query: "cache" });
    writePersistedNavigation(storage, { view: "lesson" });
    expect(values.get(NAVIGATION_STORAGE_KEY)).toBeUndefined();
    writePersistedNavigation(storage, { view: "scenario", detail: "incident-update" });
    expect(values.get(NAVIGATION_STORAGE_KEY)).toBeUndefined();

    expect(isRestorableNavigation({ view: "learn", source: "backend" })).toBe(true);
    expect(isRestorableNavigation({ view: "lesson", source: "backend" })).toBe(false);
    expect(isRestorableNavigation({ view: "scenario", detail: "incident-update" })).toBe(false);
    expect(isRestorableNavigation({ view: "profile" })).toBe(false);
  });

  it("parses legacy values only through the explicit migration path", () => {
    const legacy = JSON.stringify({ view: "phrases" });
    expect(parseStoredNavigation(legacy)).toBeNull();
    expect(parseLegacyStoredNavigation(legacy)).toEqual({ view: "phrases" });
  });
});
