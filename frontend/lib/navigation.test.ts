import { describe, expect, it } from "vitest";

import { navigationURL, parseNavigation, viewTitle } from "./navigation";

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
