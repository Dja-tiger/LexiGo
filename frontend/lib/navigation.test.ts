import { describe, expect, it } from "vitest";

import {
  isRestorableNavigation,
  navigationURL,
  parseNavigation,
  parseStoredNavigation,
  viewTitle,
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
  ] as const)("restores the %s dictionary source", (source, expectedURL) => {
    const target = parseStoredNavigation(JSON.stringify({ view: "learn", source }));
    expect(target).toEqual({ view: "learn", source });
    expect(target && navigationURL(target)).toBe(expectedURL);
  });

  it("restores the phrases section without inventing a source parameter", () => {
    const target = parseStoredNavigation(JSON.stringify({ view: "phrases" }));
    expect(target).toEqual({ view: "phrases" });
    expect(target && navigationURL(target)).toBe("/?view=phrases");
  });

  it.each([
    null,
    "",
    "not-json",
    JSON.stringify({ view: "unknown" }),
    JSON.stringify({ view: "learn", source: "unknown" }),
    JSON.stringify({ view: "lesson", source: "mixed" }),
    JSON.stringify({ view: "profile" }),
  ])("rejects unsafe or malformed persisted value %s", (raw) => {
    expect(parseStoredNavigation(raw)).toBeNull();
  });

  it("persists only stable top-level views", () => {
    expect(isRestorableNavigation({ view: "library" })).toBe(true);
    expect(isRestorableNavigation({ view: "learn", source: "backend" })).toBe(true);
    expect(isRestorableNavigation({ view: "lesson", source: "backend" })).toBe(false);
    expect(isRestorableNavigation({ view: "profile" })).toBe(false);
  });
});
