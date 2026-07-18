import { describe, expect, it, vi } from "vitest";

import {
  createNavigationHistoryState,
  navigationIdentity,
  navigationScrollBehavior,
  navigationScrollFromHistory,
  navigationTargetFromHistory,
  readNavigationHistoryState,
} from "./navigation-history";

describe("navigation history accessibility state", () => {
  it("stores a validated target and finite non-negative scroll position", () => {
    const state = createNavigationHistoryState(
      { view: "library", source: "backend", detail: "grpc" },
      { x: Number.NaN, y: 740 },
    );

    expect(state).toEqual({
      lexigo: true,
      version: 1,
      target: { view: "library", source: "backend", detail: "grpc" },
      scroll: { x: 0, y: 740 },
    });
    expect(readNavigationHistoryState(state)).toEqual(state);
  });

  it("sanitizes infinite and negative scroll coordinates", () => {
    expect(createNavigationHistoryState(
      { view: "progress" },
      { x: Number.POSITIVE_INFINITY, y: -240 },
    ).scroll).toEqual({ x: 0, y: 0 });
  });

  it("rejects malformed versioned entries instead of trusting arbitrary history data", () => {
    expect(readNavigationHistoryState({
      lexigo: true,
      version: 1,
      target: { view: "unknown" },
      scroll: { x: 0, y: 100 },
    })).toBeNull();

    expect(readNavigationHistoryState({
      lexigo: true,
      version: 1,
      target: { view: "learn", source: "unknown" },
      scroll: { x: 0, y: 100 },
    })).toBeNull();
  });

  it("reads current entries, migrates legacy targets and falls back to the URL", () => {
    const current = createNavigationHistoryState({ view: "phrases" }, { x: 0, y: 310 });
    expect(navigationTargetFromHistory(current, "?view=home")).toEqual({ view: "phrases" });
    expect(navigationScrollFromHistory(current)).toEqual({ x: 0, y: 310 });

    expect(navigationTargetFromHistory(
      { lexigo: true, view: "progress" },
      "?view=home",
    )).toEqual({ view: "progress" });

    expect(navigationTargetFromHistory(null, "?view=learn&source=travel")).toEqual({
      view: "learn",
      source: "travel",
    });
    expect(navigationScrollFromHistory(null)).toEqual({ x: 0, y: 0 });
  });

  it("uses the canonical URL as the navigation identity", () => {
    expect(navigationIdentity({ view: "home" })).toBe("/");
    expect(navigationIdentity({ view: "learn", source: "data-engineering" }))
      .toBe("/?view=learn&source=data-engineering");
  });
});

describe("navigation motion preference", () => {
  it("uses instant scrolling when reduced motion is requested", () => {
    const matchMedia = vi.fn(() => ({ matches: true }));
    expect(navigationScrollBehavior({ matchMedia })).toBe("auto");
    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("uses smooth scrolling otherwise and fails safe when matchMedia is unavailable", () => {
    expect(navigationScrollBehavior({ matchMedia: () => ({ matches: false }) })).toBe("smooth");
    expect(navigationScrollBehavior({ matchMedia: () => { throw new Error("blocked"); } })).toBe("auto");
  });
});
