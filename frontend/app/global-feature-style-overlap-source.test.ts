import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

type ConflictClassification = "protected" | "intentional" | "requires-proof";

type ClassifiedConflict = Readonly<{
  id: string;
  classification: ConflictClassification;
  evidence: string;
}>;

type MediaConstraints = Readonly<{
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  states: ReadonlyMap<string, string>;
}>;

type DeclarationOwner = Readonly<{
  file: string;
  importIndex: number;
  selector: string;
  property: string;
  value: string;
  important: boolean;
  conditions: readonly string[];
  media: MediaConstraints;
}>;

type Conflict = Readonly<{
  id: string;
  earlier: DeclarationOwner;
  later: DeclarationOwner;
}>;

const layoutUrl = new URL("./layout.tsx", import.meta.url);
const layout = readFileSync(layoutUrl, "utf8");
const cssImportPattern = /import\s+["']\.\/([^"']+\.css)["'];/g;
const importedCssFiles = Array.from(layout.matchAll(cssImportPattern), (match) => match[1]);

/*
 * Discovery starts fail-closed. The first authoritative run publishes the exact
 * deterministic IDs. Each item must then be reviewed and classified before the
 * final immutable head; production CSS is outside this proof-only slice.
 */
const CLASSIFIED_CONFLICTS = [] satisfies readonly ClassifiedConflict[];

function stripComments(source: string): string {
  let result = "";
  let cursor = 0;
  let quote: "\"" | "'" | null = null;

  while (cursor < source.length) {
    const character = source[cursor];
    const next = source[cursor + 1];

    if (quote !== null) {
      result += character;
      if (character === "\\" && next !== undefined) {
        result += next;
        cursor += 2;
        continue;
      }
      if (character === quote) quote = null;
      cursor += 1;
      continue;
    }

    if (character === "\"" || character === "'") {
      quote = character;
      result += character;
      cursor += 1;
      continue;
    }

    if (character === "/" && next === "*") {
      const commentEnd = source.indexOf("*/", cursor + 2);
      cursor = commentEnd === -1 ? source.length : commentEnd + 2;
      continue;
    }

    result += character;
    cursor += 1;
  }

  return result;
}

function collapseWhitespaceOutsideStrings(source: string): string {
  let result = "";
  let cursor = 0;
  let quote: "\"" | "'" | null = null;
  let pendingWhitespace = false;

  while (cursor < source.length) {
    const character = source[cursor];
    const next = source[cursor + 1];

    if (quote !== null) {
      result += character;
      if (character === "\\" && next !== undefined) {
        result += next;
        cursor += 2;
        continue;
      }
      if (character === quote) quote = null;
      cursor += 1;
      continue;
    }

    if (character === "\"" || character === "'") {
      if (pendingWhitespace && result.length > 0) result += " ";
      pendingWhitespace = false;
      quote = character;
      result += character;
      cursor += 1;
      continue;
    }

    if (/\s/.test(character)) {
      pendingWhitespace = true;
      cursor += 1;
      continue;
    }

    if (pendingWhitespace && result.length > 0) result += " ";
    pendingWhitespace = false;
    result += character;
    cursor += 1;
  }

  return result.trim();
}

function splitTopLevel(source: string, delimiter: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let quote: "\"" | "'" | null = null;
  let parentheses = 0;
  let brackets = 0;
  let braces = 0;

  for (let cursor = 0; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    const next = source[cursor + 1];

    if (quote !== null) {
      if (character === "\\" && next !== undefined) {
        cursor += 1;
        continue;
      }
      if (character === quote) quote = null;
      continue;
    }

    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }

    if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (character === "{") braces += 1;
    else if (character === "}") braces = Math.max(0, braces - 1);
    else if (
      character === delimiter &&
      parentheses === 0 &&
      brackets === 0 &&
      braces === 0
    ) {
      parts.push(source.slice(start, cursor));
      start = cursor + 1;
    }
  }

  parts.push(source.slice(start));
  return parts;
}

function findTopLevelColon(source: string): number {
  let quote: "\"" | "'" | null = null;
  let parentheses = 0;
  let brackets = 0;

  for (let cursor = 0; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    const next = source[cursor + 1];

    if (quote !== null) {
      if (character === "\\" && next !== undefined) {
        cursor += 1;
        continue;
      }
      if (character === quote) quote = null;
      continue;
    }

    if (character === "\"" || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (character === ":" && parentheses === 0 && brackets === 0) return cursor;
  }

  return -1;
}

function findBlockBoundary(
  source: string,
  start: number,
): Readonly<{ index: number; kind: "block" | "statement" }> | null {
  let quote: "\"" | "'" | null = null;
  let parentheses = 0;
  let brackets = 0;

  for (let cursor = start; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    const next = source[cursor + 1];

    if (quote !== null) {
      if (character === "\\" && next !== undefined) {
        cursor += 1;
        continue;
      }
      if (character === quote) quote = null;
      continue;
    }

    if (character === "\"" || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (parentheses === 0 && brackets === 0 && character === "{") {
      return { index: cursor, kind: "block" };
    } else if (parentheses === 0 && brackets === 0 && character === ";") {
      return { index: cursor, kind: "statement" };
    }
  }

  return null;
}

function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 1;
  let quote: "\"" | "'" | null = null;

  for (let cursor = openIndex + 1; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    const next = source[cursor + 1];

    if (quote !== null) {
      if (character === "\\" && next !== undefined) {
        cursor += 1;
        continue;
      }
      if (character === quote) quote = null;
      continue;
    }

    if (character === "\"" || character === "'") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return cursor;
    }
  }

  throw new Error(`Unclosed CSS block at offset ${openIndex}`);
}

function normalizeSelector(selector: string): string {
  return collapseWhitespaceOutsideStrings(selector)
    .replace(/\s*([>+~])\s*/g, "$1")
    .trim();
}

function parseDeclarations(body: string): readonly Readonly<{
  property: string;
  value: string;
  important: boolean;
}>[] {
  const declarations: Array<Readonly<{
    property: string;
    value: string;
    important: boolean;
  }>> = [];

  for (const segment of splitTopLevel(body, ";")) {
    const colon = findTopLevelColon(segment);
    if (colon === -1) continue;

    const property = segment.slice(0, colon).trim().toLowerCase();
    if (!/^(?:--|-[a-z]+-|[a-z])[a-z0-9_-]*$/.test(property)) continue;

    const rawValue = collapseWhitespaceOutsideStrings(segment.slice(colon + 1));
    if (rawValue.length === 0) continue;

    const important = /\s*!important\s*$/i.test(rawValue);
    const value = rawValue.replace(/\s*!important\s*$/i, "").trim();
    declarations.push({ property, value, important });
  }

  return declarations;
}

function parseMediaConstraints(conditions: readonly string[]): MediaConstraints {
  let minWidth = 0;
  let maxWidth = Number.POSITIVE_INFINITY;
  let minHeight = 0;
  let maxHeight = Number.POSITIVE_INFINITY;
  const states = new Map<string, string>();
  const stateFeatures = [
    "prefers-color-scheme",
    "forced-colors",
    "prefers-reduced-motion",
    "prefers-contrast",
    "orientation",
    "hover",
    "any-hover",
    "pointer",
    "any-pointer",
  ] as const;

  for (const condition of conditions) {
    if (!condition.toLowerCase().startsWith("@media")) continue;
    const query = condition.slice("@media".length);

    for (const match of query.matchAll(/\(\s*(min|max)-(width|height)\s*:\s*([0-9.]+)px\s*\)/gi)) {
      const boundary = Number(match[3]);
      if (!Number.isFinite(boundary)) continue;

      if (match[2].toLowerCase() === "width") {
        if (match[1].toLowerCase() === "min") minWidth = Math.max(minWidth, boundary);
        else maxWidth = Math.min(maxWidth, boundary);
      } else if (match[1].toLowerCase() === "min") {
        minHeight = Math.max(minHeight, boundary);
      } else {
        maxHeight = Math.min(maxHeight, boundary);
      }
    }

    for (const feature of stateFeatures) {
      const pattern = new RegExp(`\\(\\s*${feature}\\s*:\\s*([^\\s)]+)\\s*\\)`, "i");
      const match = query.match(pattern);
      if (match !== null) states.set(feature, match[1].toLowerCase());
    }

    const mediaType = query.match(/^\s*(screen|print|speech)\b/i)?.[1]?.toLowerCase();
    if (mediaType !== undefined) states.set("media-type", mediaType);
  }

  return { minWidth, maxWidth, minHeight, maxHeight, states };
}

function mediaOverlaps(left: MediaConstraints, right: MediaConstraints): boolean {
  if (Math.max(left.minWidth, right.minWidth) > Math.min(left.maxWidth, right.maxWidth)) {
    return false;
  }
  if (Math.max(left.minHeight, right.minHeight) > Math.min(left.maxHeight, right.maxHeight)) {
    return false;
  }

  for (const [feature, leftValue] of left.states) {
    const rightValue = right.states.get(feature);
    if (rightValue !== undefined && rightValue !== leftValue) return false;
  }

  return true;
}

function conditionLabel(conditions: readonly string[]): string {
  return conditions.length === 0
    ? "global"
    : conditions.map(collapseWhitespaceOutsideStrings).join(" && ");
}

function parseStylesheet(
  file: string,
  importIndex: number,
  source: string,
): readonly DeclarationOwner[] {
  const declarations: DeclarationOwner[] = [];
  const css = stripComments(source);

  function parseBlocks(blockSource: string, conditions: readonly string[]): void {
    let cursor = 0;

    while (cursor < blockSource.length) {
      while (cursor < blockSource.length && /[\s;]/.test(blockSource[cursor])) cursor += 1;
      if (cursor >= blockSource.length) break;

      const boundary = findBlockBoundary(blockSource, cursor);
      if (boundary === null) break;
      if (boundary.kind === "statement") {
        cursor = boundary.index + 1;
        continue;
      }

      const prelude = collapseWhitespaceOutsideStrings(blockSource.slice(cursor, boundary.index));
      const closeIndex = findMatchingBrace(blockSource, boundary.index);
      const body = blockSource.slice(boundary.index + 1, closeIndex);
      cursor = closeIndex + 1;

      if (/^@(media|supports|container|layer)\b/i.test(prelude)) {
        parseBlocks(body, [...conditions, prelude]);
        continue;
      }
      if (/^@(?:-[a-z]+-)?keyframes\b/i.test(prelude) || prelude.startsWith("@")) {
        continue;
      }

      const ruleDeclarations = parseDeclarations(body);
      if (ruleDeclarations.length === 0) continue;

      for (const rawSelector of splitTopLevel(prelude, ",")) {
        const selector = normalizeSelector(rawSelector);
        if (!selector.includes(".lx-")) continue;

        for (const declaration of ruleDeclarations) {
          declarations.push({
            file,
            importIndex,
            selector,
            property: declaration.property,
            value: declaration.value,
            important: declaration.important,
            conditions,
            media: parseMediaConstraints(conditions),
          });
        }
      }
    }
  }

  parseBlocks(css, []);
  return declarations;
}

function conflictId(earlier: DeclarationOwner, later: DeclarationOwner): string {
  const priority = earlier.important ? "important" : "normal";
  return [
    `${earlier.selector} | ${earlier.property} | ${priority}`,
    `${earlier.file} [${conditionLabel(earlier.conditions)}] = ${JSON.stringify(earlier.value)}`,
    `${later.file} [${conditionLabel(later.conditions)}] = ${JSON.stringify(later.value)}`,
  ].join(" -> ");
}

function collectConflicts(owners: readonly DeclarationOwner[]): readonly Conflict[] {
  const groups = new Map<string, DeclarationOwner[]>();

  for (const owner of owners) {
    const key = [owner.selector, owner.property, owner.important ? "important" : "normal"].join("\u0000");
    const group = groups.get(key) ?? [];
    group.push(owner);
    groups.set(key, group);
  }

  const conflicts = new Map<string, Conflict>();

  for (const group of groups.values()) {
    for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < group.length; rightIndex += 1) {
        const left = group[leftIndex];
        const right = group[rightIndex];
        if (left.file === right.file || left.value === right.value) continue;
        if (!mediaOverlaps(left.media, right.media)) continue;

        const [earlier, later] =
          left.importIndex < right.importIndex ||
          (left.importIndex === right.importIndex && left.file.localeCompare(right.file) <= 0)
            ? [left, right]
            : [right, left];
        const id = conflictId(earlier, later);
        conflicts.set(id, { id, earlier, later });
      }
    }
  }

  return [...conflicts.values()].sort((left, right) => left.id.localeCompare(right.id));
}

const importedDeclarations = importedCssFiles.flatMap((file, importIndex) =>
  parseStylesheet(file, importIndex, readFileSync(new URL(`./${file}`, import.meta.url), "utf8")),
);
const conflicts = collectConflicts(importedDeclarations);

describe("global feature-style exact-selector overlap inventory", () => {
  it("derives a unique and complete CSS inventory from the production root layout", () => {
    expect(importedCssFiles.length).toBeGreaterThan(30);
    expect(new Set(importedCssFiles).size).toBe(importedCssFiles.length);
    expect(importedCssFiles).toContain("globals.css");
    expect(importedCssFiles).toContain("premium-ui.css");
    expect(importedCssFiles).toContain("phrases.css");
    expect(importedCssFiles).toContain("compact-home.css");
    expect(importedDeclarations.length).toBeGreaterThan(100);
  });

  it("matches the complete reviewed conflict manifest", () => {
    const classifiedIds = CLASSIFIED_CONFLICTS.map((conflict) => conflict.id);
    const actualIds = conflicts.map((conflict) => conflict.id);

    expect(new Set(classifiedIds).size).toBe(classifiedIds.length);
    for (const conflict of CLASSIFIED_CONFLICTS) {
      expect(conflict.evidence.trim().length, conflict.id).toBeGreaterThan(0);
    }

    if (JSON.stringify(actualIds) !== JSON.stringify(classifiedIds)) {
      throw new Error(
        [
          "Global feature-style conflict manifest is stale or unclassified.",
          "BEGIN ACTUAL CONFLICT IDS",
          JSON.stringify(actualIds, null, 2),
          "END ACTUAL CONFLICT IDS",
        ].join("\n"),
      );
    }
  });
});
