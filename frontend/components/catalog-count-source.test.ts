import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");

describe("catalog count ownership", () => {
  it("does not contain historical product totals", () => {
    for (const forbidden of ["WORD_CATALOG_COUNT", "count: 799", "count: 579", "count: 383", "count: 179", "count: 193", "count: 55", "option.count", "definition.count"]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("loads public catalog metadata and never mutates count text through the DOM", () => {
    expect(source).toContain("/api/v1/catalog/metadata");
    expect(source).not.toContain("textContent");
    expect(source).not.toMatch(/replace\([^)]*\d/);
  });
});
