import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");
const libDirectory = path.join(frontendDirectory, "lib");
const dictionaryStylesheet = path.join(appDirectory, "dictionary-catalog.css");

const LEGACY_DICTIONARY_DETAIL_PREFIX = "lx-dictionary-detail";

const EXPECTED_LEGACY_SELECTORS = [
  ".lx-dictionary-detail",
  ".lx-dictionary-detail > .lx-button",
  ".lx-dictionary-detail-card",
  ".lx-dictionary-detail-meta",
  ".lx-dictionary-detail-meta span",
  ".lx-dictionary-detail-meta span[data-status]",
  ".lx-dictionary-detail-title",
  ".lx-dictionary-detail-title h1",
  ".lx-dictionary-detail-title p",
  ".lx-dictionary-detail-section h2",
  ".lx-dictionary-detail-section p",
  ".lx-dictionary-detail-section",
] as const;

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

function selectorOccurrences(stylesheet: string, selector: string): number {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...stylesheet.matchAll(new RegExp(`${escaped}(?=\\s*[,\\{])`, "g"))].length;
}

describe("legacy Dictionary detail CSS reachability", () => {
  it("has no executable TypeScript or TSX consumer for the legacy class family", () => {
    const candidates = [appDirectory, componentsDirectory, libDirectory]
      .flatMap(sourceFiles)
      .map((file) => ({
        file: path.relative(frontendDirectory, file),
        source: stripComments(readFileSync(file, "utf8")),
      }))
      .filter(({ source }) => source.includes(LEGACY_DICTIONARY_DETAIL_PREFIX));

    expect(candidates).toEqual([]);
  });

  it("keeps the candidate family bounded to the known stylesheet selectors", () => {
    const stylesheet = stripComments(readFileSync(dictionaryStylesheet, "utf8"));
    const selectorTokens = [
      ...stylesheet.matchAll(/\.lx-dictionary-detail(?:-[a-z0-9-]+)?(?:\s+[^,{]+)?(?=\s*[,\{])/g),
    ].map(([selector]) => selector.trim());

    expect([...new Set(selectorTokens)].sort()).toEqual([...EXPECTED_LEGACY_SELECTORS].sort());

    for (const selector of EXPECTED_LEGACY_SELECTORS) {
      expect(selectorOccurrences(stylesheet, selector)).toBeGreaterThanOrEqual(1);
    }
  });
});
