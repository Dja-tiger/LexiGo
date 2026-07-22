import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDirectory = path.join(process.cwd(), "app");

function cssSources(): Array<{ file: string; source: string }> {
  return readdirSync(appDirectory)
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => ({
      file,
      source: readFileSync(path.join(appDirectory, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, ""),
    }));
}

function ownersOf(pattern: RegExp): string[] {
  return cssSources()
    .filter(({ source }) => pattern.test(source))
    .map(({ file }) => file);
}

describe("global document style ownership", () => {
  it("keeps the document body declaration in globals.css", () => {
    expect(ownersOf(/(^|})\s*body\s*\{/m)).toEqual(["globals.css"]);

    const globals = readFileSync(path.join(appDirectory, "globals.css"), "utf8");
    expect(globals).toContain("radial-gradient(circle at 8% 2%");
    expect(globals).toContain("linear-gradient(180deg, #050914 0%, #07101d 52%, #050914 100%)");
  });

  it("keeps shared button and input font inheritance in globals.css", () => {
    expect(ownersOf(/(^|})\s*button\s*,\s*input\s*\{/m)).toEqual(["globals.css"]);

    const globals = readFileSync(path.join(appDirectory, "globals.css"), "utf8");
    expect(globals).toContain("button, input { font: inherit; }");
  });
});
