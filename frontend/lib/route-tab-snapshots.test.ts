import { beforeEach, describe, expect, it } from "vitest";

import {
  clearRouteTabSnapshots,
  rememberRouteTab,
  routeTabDestination,
} from "./route-tab-snapshots";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("route tab snapshots", () => {
  const storage = new MemoryStorage();

  beforeEach(() => {
    clearRouteTabSnapshots(storage);
  });

  it("restores nested filters, detail and scroll for a primary route", () => {
    rememberRouteTab({
      view: "library",
      source: "backend",
      status: "review",
      query: "cache",
      page: 2,
      detail: "101",
    }, { x: 0, y: 840 }, storage);

    expect(routeTabDestination("library", storage)).toEqual({
      target: {
        view: "library",
        source: "backend",
        status: "review",
        query: "cache",
        page: 2,
        detail: "101",
      },
      scroll: { x: 0, y: 840 },
    });
  });

  it("persists phrase catalog state under the Dictionary route tab", () => {
    rememberRouteTab({
      view: "phrases",
      topic: "Incident communication",
      detail: "incident-update",
    }, { x: 0, y: 620 }, storage);

    expect(routeTabDestination("library", storage)).toEqual({
      target: {
        view: "phrases",
        topic: "Incident communication",
        detail: "incident-update",
      },
      scroll: { x: 0, y: 620 },
    });
  });

  it("returns a stable top-level destination for an unseen route", () => {
    expect(routeTabDestination("progress", storage)).toEqual({
      target: { view: "progress" },
      scroll: { x: 0, y: 0 },
    });
  });

  it("does not persist transient lesson and profile states", () => {
    rememberRouteTab({ view: "lesson", detail: "active" }, { x: 0, y: 120 }, storage);
    rememberRouteTab({ view: "profile" }, { x: 0, y: 220 }, storage);

    expect(routeTabDestination("home", storage)).toEqual({
      target: { view: "home" },
      scroll: { x: 0, y: 0 },
    });
  });
});
