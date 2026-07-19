import { describe, expect, it } from "vitest";

import {
  createNavigationTabStore,
  isPrimaryNavigationView,
  navigationTabDestination,
  rememberNavigationTabSnapshot,
  type NavigationTabSnapshots,
} from "./navigation-tabs";

describe("navigation tab snapshots", () => {
  it("remembers the last nested target and scroll position for a primary tab", () => {
    const target = {
      view: "library" as const,
      source: "backend" as const,
      topic: "Backend Development",
      status: "review" as const,
      query: "cache",
      sort: "az" as const,
      page: 2,
      detail: "101",
    };
    const snapshots = rememberNavigationTabSnapshot({}, target, { x: 0, y: 842 });

    expect(navigationTabDestination(snapshots, "library")).toEqual({
      target,
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
      { view: "library", source: "backend", status: "mastered", page: 3 },
      { x: -40, y: Number.NaN },
    );

    const first = navigationTabDestination(snapshots, "library");
    first.target.source = "mixed";
    first.target.status = "new";
    first.scroll.y = 999;

    expect(navigationTabDestination(snapshots, "library")).toEqual({
      target: { view: "library", source: "backend", status: "mastered", page: 3 },
      scroll: { x: 0, y: 0 },
    });
  });

  it("keeps frequent scroll snapshots outside React render state", () => {
    const store = createNavigationTabStore();
    store.remember({ view: "library", query: "pipeline", detail: "103" }, { x: 0, y: 640 });

    const first = store.destination("library");
    first.target.detail = "mutated";
    first.target.query = "mutated";
    first.scroll.y = 0;

    expect(store.destination("library")).toEqual({
      target: { view: "library", query: "pipeline", detail: "103" },
      scroll: { x: 0, y: 640 },
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
