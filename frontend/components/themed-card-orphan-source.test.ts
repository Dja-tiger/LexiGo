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

const LEGACY_THEMED_CARD_CLASSES = ["lx-themed-home", "lx-themed-library"] as const;

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

describe("legacy themed card CSS reachability", () => {
  it("has no executable TypeScript or TSX consumer for either legacy card class", () => {
    for (const className of LEGACY_THEMED_CARD_CLASSES) {
      expect(executableConsumers(className), className).toEqual([]);
    }
  });

  it("bounds the exact candidate inventory across all CSS owners", () => {
    const themedStyles = stripComments(themedVocabularyStyles);
    const focusStyles = stripComments(accessibilityFocusStyles);
    const navigationStyles = stripComments(accessibilityNavigationStyles);

    for (const className of LEGACY_THEMED_CARD_CLASSES) {
      expect(occurrences(themedStyles, `.${className}`), `${className} themed-vocabulary`).toBe(5);
      expect(occurrences(focusStyles, `.${className}`), `${className} accessibility-focus`).toBe(2);
      expect(occurrences(navigationStyles, `.${className}`), `${className} accessibility-navigation`).toBe(1);
    }

    expect(themedStyles).toContain(
      ".lx-themed-home,\n.lx-themed-library,\n.lx-themed-selector {",
    );
    expect(themedStyles).toContain(
      ".lx-themed-home:hover .lx-themed-arrow,\n.lx-themed-library:hover .lx-themed-arrow {",
    );
    expect(themedStyles).toContain(".lx-themed-home,\n.lx-themed-library {");
    expect(themedStyles).toContain(".lx-themed-home::before,\n.lx-themed-library::before {");
    expect(themedStyles).toContain(".lx-themed-home > *,\n.lx-themed-library > * {");

    expect(focusStyles).toContain(".lx-themed-home,");
    expect(focusStyles).toContain(".lx-themed-library,");
    expect(navigationStyles).toContain(
      ".lx-themed-home:hover .lx-themed-arrow,\n  .lx-themed-library:hover .lx-themed-arrow,",
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
