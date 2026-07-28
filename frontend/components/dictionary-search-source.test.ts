import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const componentPath = path.join(process.cwd(), "components", "dictionary-catalog.tsx");

describe("Dictionary search input synchronization", () => {
  it("does not defer the initial filter value across the first user interaction", () => {
    const source = readFileSync(componentPath, "utf8");
    const synchronization = source.match(
      /const lastSyncedFilterQueryRef = useRef\(filters\.query\);[\s\S]*?\}, \[filters\.query\]\);/,
    )?.[0];

    expect(synchronization).toBeDefined();
    expect(synchronization).toContain(
      "if (lastSyncedFilterQueryRef.current === filters.query) return;",
    );
    expect(synchronization).toContain(
      "lastSyncedFilterQueryRef.current = filters.query;",
    );
    expect(synchronization).toContain(
      "window.requestAnimationFrame(() => setSearchInput(filters.query))",
    );
    const guardIndex = synchronization?.indexOf("=== filters.query") ?? -1;
    const frameIndex = synchronization?.indexOf("requestAnimationFrame") ?? -1;
    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(guardIndex).toBeLessThan(frameIndex);
  });
});
