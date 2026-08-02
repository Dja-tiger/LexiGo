import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");
const libDirectory = path.join(frontendDirectory, "lib");

const themedVocabularyStyles = readFileSync(path.join(appDirectory, "themed-vocabulary.css"), "utf8");
const accessibilityFocusStyles = readFileSync(path.join(appDirectory, "accessibility-focus.css"), "utf8");
const accessibilityNavigationStyles = readFileSync(
  path.join(appDirectory, "accessibility-navigation.css"),
  "utf8",
);

const RETIRED_THEMED_CARD_CLASSES = ["lx-themed-home", "lx-themed-library"] as const;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) return sourceFiles(absolutePath);
    if (!/\.(?:ts|tsx)$/.test(entry)) return [];
    if (/\.(?:test|spec)\.(?:ts|tsx)$/.test(entry)) return [];

    return [absolutePath];
  });
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

function executableConsumers(value: string): string[] {
  return [appDirectory, componentsDirectory, libDirectory]
    .flatMap(sourceFiles)
    .filter((file) => stripComments(readFileSync(file, "utf8")).includes(value))
    .map((file) => path.relative(frontendDirectory, file))
    .sort();
}

describe("retired themed card CSS absence", () => {
  it("has no executable TypeScript or TSX consumer for either retired card class", () => {
    for (const className of RETIRED_THEMED_CARD_CLASSES) {
      expect(executableConsumers(className), className).toEqual([]);
    }
  });

  it("requires both retired class names to be physically absent from every former CSS owner", () => {
    const cssOwners = [
      ["themed-vocabulary", themedVocabularyStyles],
      ["accessibility-focus", accessibilityFocusStyles],
      ["accessibility-navigation", accessibilityNavigationStyles],
    ] as const;

    for (const className of RETIRED_THEMED_CARD_CLASSES) {
      for (const [owner, styles] of cssOwners) {
        expect(styles, `${className} ${owner}`).not.toContain(className);
      }
    }
  });

  it("protects the exact remaining themed and accessibility owners", () => {
    const themedStyles = stripComments(themedVocabularyStyles);
    const focusStyles = stripComments(accessibilityFocusStyles);
    const navigationStyles = stripComments(accessibilityNavigationStyles);

    expect(occurrences(themedStyles, ".lx-themed-selector")).toBe(4);
    expect(occurrences(focusStyles, ".lx-themed-selector")).toBe(2);

    expect(themedStyles).toContain(".lx-themed-selector {\n  cursor: pointer;\n}");
    expect(focusStyles).toContain(
      ".lx-progress-stats > button,\n  .lx-themed-selector,\n  .lx-calendar-provider-grid > button,",
    );
    expect(focusStyles).toContain(
      ".lx-progress-stats > button,\n  .lx-themed-selector,\n  .lx-calendar-provider-grid > button\n):focus-visible {\n  background-image:",
    );
    expect(navigationStyles).toContain(
      ".lx-route-nav--header a:hover,\n  .lx-dictionary-result > button:hover,",
    );
  });

  it("protects live themed selector, symbol, arrow and collection owners", () => {
    expect(executableConsumers("lx-themed-selector").length).toBeGreaterThan(0);
    expect(executableConsumers("lx-themed-symbol").length).toBeGreaterThan(0);
    expect(executableConsumers("lx-themed-arrow").length).toBeGreaterThan(0);
    expect(executableConsumers("lx-collection-").length).toBeGreaterThan(0);

    expect(themedVocabularyStyles).toContain(".lx-themed-selector.selected {");
    expect(themedVocabularyStyles).toContain(".lx-themed-selector.selected .lx-themed-symbol {");
    expect(themedVocabularyStyles).toContain(".lx-collection-travel .lx-themed-symbol {");
    expect(themedVocabularyStyles).toContain(".lx-collection-data-engineering .lx-themed-symbol {");
    expect(themedVocabularyStyles).toContain(".lx-collection-backend .lx-themed-symbol {");
    expect(themedVocabularyStyles).toContain(".lx-themed-arrow {");
  });
});
