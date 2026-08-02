import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");
const libDirectory = path.join(frontendDirectory, "lib");
const dictionaryStylesheet = path.join(appDirectory, "dictionary-catalog.css");

const LEGACY_DICTIONARY_DETAIL_PREFIX = "lx-dictionary-detail";

const LIVE_DECLARATION_BLOCKS = [
  `.lx-dictionary-result-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}`,
  `.lx-dictionary-result-heading span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(139, 92, 246, 0.1);
  color: #d8b4fe;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}`,
  `.lx-dictionary-result-heading span[data-status] {
  background: rgba(45, 212, 191, 0.1);
  color: var(--lx-secondary);
}`,
  `.lx-dictionary-translation {
  color: var(--lx-secondary);
  font-size: clamp(1.25rem, 3vw, 2rem);
  overflow-wrap: anywhere;
}`,
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

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

describe("legacy Dictionary detail CSS reachability", () => {
  it("has no executable TypeScript or TSX consumer for the retired class family", () => {
    const candidates = [appDirectory, componentsDirectory, libDirectory]
      .flatMap(sourceFiles)
      .map((file) => ({
        file: path.relative(frontendDirectory, file),
        source: stripComments(readFileSync(file, "utf8")),
      }))
      .filter(({ source }) => source.includes(LEGACY_DICTIONARY_DETAIL_PREFIX));

    expect(candidates).toEqual([]);
  });

  it("has no retired selector while preserving the live adjacent declaration owners", () => {
    const stylesheet = stripComments(readFileSync(dictionaryStylesheet, "utf8"));

    expect(stylesheet).not.toContain(`.${LEGACY_DICTIONARY_DETAIL_PREFIX}`);

    for (const declarationBlock of LIVE_DECLARATION_BLOCKS) {
      expect(occurrences(stylesheet, declarationBlock)).toBe(1);
    }
  });
});
