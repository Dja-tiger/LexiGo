import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  LanguageVariant,
  ScriptTarget,
  SyntaxKind,
  createScanner,
} from "typescript";
import { describe, expect, it } from "vitest";

const appDirectory = path.join(process.cwd(), "app");
const componentDirectory = path.join(process.cwd(), "components");
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");

const LEGACY_ACTIVE_LESSON_CONTRACTS = [
  "data-study-view",
  ".lx-lesson-top",
  ".lx-lesson-page",
  ".lx-lesson-progress",
  ".lx-lesson-layout",
  ".lx-study-column",
  ".lx-study-tabs",
  ".lx-main-word-card",
  ".lx-word-header",
  ".lx-simple-word",
  ".lx-word-title-row",
  ".lx-cloze-note",
  ".lx-test-word",
  ".lx-recall-box",
  ".lx-answer-grid",
  ".lx-answer-reveal",
  ".lx-lesson-navigation",
  ".lx-rating-row",
  ".lx-judgement",
  ".lx-suggestion-success",
  ".lx-suggestion-error",
  ".lx-related",
  ".lx-lesson-stats",
] as const;

type SourceFile = {
  file: string;
  source: string;
};

function sourceFiles(directory: string, extension: RegExp): SourceFile[] {
  const files: SourceFile[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(absolutePath, extension));
      continue;
    }
    if (!extension.test(entry.name)) {
      continue;
    }

    files.push({
      file: path.relative(process.cwd(), absolutePath),
      source: readFileSync(absolutePath, "utf8"),
    });
  }

  return files.sort((left, right) => left.file.localeCompare(right.file));
}

function cssWithoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function typeScriptWithoutComments(source: string): string {
  const scanner = createScanner(ScriptTarget.Latest, false, LanguageVariant.JSX, source);
  const executableTokens: string[] = [];

  for (let token = scanner.scan(); token !== SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (token === SyntaxKind.SingleLineCommentTrivia || token === SyntaxKind.MultiLineCommentTrivia) {
      continue;
    }
    executableTokens.push(scanner.getTokenText());
  }

  return executableTokens.join("");
}

function componentContract(cssContract: string): string {
  return cssContract.startsWith(".") ? cssContract.slice(1) : cssContract;
}

function matchingFiles(sources: SourceFile[], contract: string): string[] {
  return sources.filter(({ source }) => source.includes(contract)).map(({ file }) => file);
}

describe("legacy Active Lesson style ownership", () => {
  it("removes selectors and runtime class contracts from the retired lesson DOM", () => {
    const css = sourceFiles(appDirectory, /\.css$/).map(({ file, source }) => ({
      file,
      source: cssWithoutComments(source),
    }));
    const components = sourceFiles(componentDirectory, /\.(?:ts|tsx)$/).map(({ file, source }) => ({
      file,
      source: typeScriptWithoutComments(source),
    }));

    for (const cssContract of LEGACY_ACTIVE_LESSON_CONTRACTS) {
      const runtimeContract = componentContract(cssContract);

      expect(
        matchingFiles(css, cssContract),
        `legacy CSS contract ${cssContract}`,
      ).toEqual([]);
      expect(
        matchingFiles(components, runtimeContract),
        `legacy component contract ${runtimeContract}`,
      ).toEqual([]);
    }
  });

  it("normalizes CSS class selectors before scanning executable TSX", () => {
    const componentSource = typeScriptWithoutComments(
      "// .lx-lesson-top\nconst className = 'lx-lesson-top';",
    );

    expect(componentContract(".lx-lesson-top")).toBe("lx-lesson-top");
    expect(componentSource).not.toContain(".lx-lesson-top");
    expect(componentSource).toContain(componentContract(".lx-lesson-top"));
  });

  it("ignores retired contract names in comments but retains executable strings", () => {
    expect(cssWithoutComments("/* .lx-recall-box */ .lx-canonical-lesson {}"))
      .toBe(" .lx-canonical-lesson {}");
    expect(typeScriptWithoutComments("// lx-answer-grid\nconst className = 'lx-recall-box';"))
      .not.toContain("lx-answer-grid");
    expect(typeScriptWithoutComments("// lx-answer-grid\nconst className = 'lx-recall-box';"))
      .toContain("lx-recall-box");
  });

  it("keeps the live all-items header under catalog ownership", () => {
    const premiumStyleSource = cssWithoutComments(
      readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8"),
    );
    const componentSource = sourceFiles(componentDirectory, /\.(?:ts|tsx)$/)
      .map(({ source }) => typeScriptWithoutComments(source))
      .join("");

    expect(componentSource).toContain("lx-all-items-top");
    expect(premiumStyleSource).toContain(".lx-all-items-top");
    expect(componentSource).not.toContain("lx-lesson-top");
  });

  it("keeps canonical lesson layers ordered after the base product UI", () => {
    const baseIndex = layoutSource.indexOf('import "./premium-ui.css";');
    const activeLessonIndex = layoutSource.indexOf('import "./active-lesson.css";');
    const lessonResultIndex = layoutSource.indexOf('import "./lesson-result.css";');

    expect(baseIndex).toBeGreaterThanOrEqual(0);
    expect(activeLessonIndex).toBeGreaterThan(baseIndex);
    expect(lessonResultIndex).toBeGreaterThan(activeLessonIndex);
  });
});
