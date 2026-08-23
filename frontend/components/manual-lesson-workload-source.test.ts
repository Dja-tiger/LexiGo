import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentsDirectory = path.join(frontendDirectory, "components");
const libDirectory = path.join(frontendDirectory, "lib");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
}

function readLibrary(file: string): string {
  return readFileSync(path.join(libDirectory, file), "utf8");
}

describe("Issue #651 bounded manual lesson workload", () => {
  it("keeps the shared lesson-size vocabulary at 15, 30, 50 and explicit all", () => {
    const learning = readLibrary("learning.ts");

    expect(learning).toContain('export type LessonSize = 15 | 30 | 50 | "all";');
    expect(learning).not.toContain("15 | 30 | 60");
  });

  it("exposes exactly four manual /learn choices and defaults to 15", () => {
    const learnApp = readComponent("lexigo-learn-app.tsx");

    expect(learnApp).toContain('{ value: 15, label: "15" }');
    expect(learnApp).toContain('{ value: 30, label: "30" }');
    expect(learnApp).toContain('{ value: 50, label: "50" }');
    expect(learnApp).toContain('{ value: "all", label: "Все" }');
    expect(learnApp).not.toContain('{ value: 60, label: "60" }');
    expect(learnApp).toContain("useState<LessonSize>(15)");
  });

  it("sends the exact selected manual token to both preview and create", () => {
    const learnApp = readComponent("lexigo-learn-app.tsx");

    expect(learnApp.match(/lessonSize: String\(lessonSize\)/g)).toHaveLength(2);
    expect(learnApp).toContain('lessonSize === "all" ? "Все доступные"');
    expect(learnApp).toContain('lessonSize === "all" ? "Начать весь выбранный материал"');
  });

  it("does not broaden the automatic Home process blocks beyond 15", () => {
    const homeApp = readComponent("lexigo-home-app.tsx");

    expect(homeApp).toContain('lessonSize: "15"');
    expect(homeApp).not.toContain('lessonSize: "all"');
  });
});
