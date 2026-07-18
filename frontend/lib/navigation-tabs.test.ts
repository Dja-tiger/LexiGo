import { describe, expect, it } from "vitest";

import {
  isPrimaryNavigationView,
  navigationTabDestination,
  rememberNavigationTabSnapshot,
  type NavigationTabSnapshots,
} from "./navigation-tabs";

describe("navigation tab snapshots", () => {
  it("remembers the last nested target and scroll position for a primary tab", () => {
    const snapshots = rememberNavigationTabSnapshot(
      {},
      { view: "phrases", detail: "incident-update" },
      { x: 0, y: 842 },
    );

    expect(navigationTabDestination(snapshots, "phrases")).toEqual({
      target: { view: "phrases", detail: "incident-update" },
      scroll: { x: 0, y: 842 },
    });
  });

  it("returns a clean root destination for a tab without a snapshot", () => {
    expect(navigationTabDestination({}, "progress")).toEqual({
      target: { view: "progress" },
      scroll: { x: 0, y: 0 },
    });
  });

  it("does not store profile or lesson as top-level tab state", () => {
    const existing: NavigationTabSnapshots = {
      home: { target: { view: "home" }, scroll: { x: 0, y: 120 } },
    };

    expect(rememberNavigationTabSnapshot(existing, { view: "lesson" }, { x: 0, y: 400 }))
      .toBe(existing);
    expect(rememberNavigationTabSnapshot(existing, { view: "profile" }, { x: 0, y: 400 }))
      .toBe(existing);
  });

  it("normalizes unsafe coordinates and returns defensive copies", () => {
    const snapshots = rememberNavigationTabSnapshot(
      {},
      { view: "learn", source: "backend" },
      { x: -40, y: Number.NaN },
    );

    const first = navigationTabDestination(snapshots, "learn");
    first.target.source = "mixed";
    first.scroll.y = 999;

    expect(navigationTabDestination(snapshots, "learn")).toEqual({
      target: { view: "learn", source: "backend" },
      scroll: { x: 0, y: 0 },
    });
  });

  it("recognizes only the five primary destinations", () => {
    expect(isPrimaryNavigationView("home")).toBe(true);
    expect(isPrimaryNavigationView("learn")).toBe(true);
    expect(isPrimaryNavigationView("phrases")).toBe(true);
    expect(isPrimaryNavigationView("library")).toBe(true);
    expect(isPrimaryNavigationView("progress")).toBe(true);
    expect(isPrimaryNavigationView("profile")).toBe(false);
    expect(isPrimaryNavigationView("lesson")).toBe(false);
  });
});
