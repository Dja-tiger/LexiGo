import { describe, expect, it } from "vitest";

import { sortCatalogEntries, type CatalogSortMode } from "./catalog-sort";

type Entry = { label: string; originalIndex: number };

function labels(entries: Entry[], mode: CatalogSortMode): string[] {
  return sortCatalogEntries(entries, (entry) => entry.label, (entry) => entry.originalIndex, mode).map((entry) => entry.label);
}

describe("catalog sorting", () => {
  const entries: Entry[] = [
    { label: "timeout", originalIndex: 0 },
    { label: "API gateway", originalIndex: 1 },
    { label: "backfill", originalIndex: 2 },
    { label: "API gateway", originalIndex: 3 },
  ];

  it("restores the original learning order", () => {
    expect(labels(entries, "default")).toEqual(["timeout", "API gateway", "backfill", "API gateway"]);
  });

  it("sorts English labels from A to Z and keeps equal labels stable", () => {
    const sorted = sortCatalogEntries(entries, (entry) => entry.label, (entry) => entry.originalIndex, "az");
    expect(sorted.map((entry) => entry.label)).toEqual(["API gateway", "API gateway", "backfill", "timeout"]);
    expect(sorted.slice(0, 2).map((entry) => entry.originalIndex)).toEqual([1, 3]);
  });

  it("sorts English labels from Z to A", () => {
    expect(labels(entries, "za")).toEqual(["timeout", "backfill", "API gateway", "API gateway"]);
  });
});
