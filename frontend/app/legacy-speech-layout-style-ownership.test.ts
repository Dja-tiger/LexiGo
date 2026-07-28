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
const currentTest = path.join(appDirectory, "legacy-speech-layout-style-ownership.test.ts");
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const speechPlayerStyles = readFileSync(path.join(appDirectory, "speech-player.css"), "utf8");
const phraseDetailSource = readFileSync(path.join(componentDirectory, "phrase-detail-presentation.tsx"), "utf8");
const wordDetailSource = readFileSync(path.join(componentDirectory, "word-detail-presentation.tsx"), "utf8");
const activeLessonSource = readFileSync(path.join(componentDirectory, "active-lesson-presentation.tsx"), "utf8");

const RETIRED_SPEECH_LAYOUT_SELECTORS = [
  ".lx-detail-speech-row",
  ".lx-test-prompt-row",
] as const;

type SourceFile = {
  file: string;
  source: string;
};

function sourceFiles(
  directory: string,
  extension: RegExp,
  ignoredFiles: ReadonlySet<string> = new Set(),
): SourceFile[] {
  const files: SourceFile[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(absolutePath, extension, ignoredFiles));
      continue;
    }
    if (!extension.test(entry.name) || ignoredFiles.has(absolutePath)) {
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

function runtimeClass(selector: string): string {
  return selector.startsWith(".") ? selector.slice(1) : selector;
}

function matchingFiles(sources: SourceFile[], contract: string): string[] {
  return sources
    .filter(({ source }) => source.includes(contract))
    .map(({ file }) => file);
}

describe("legacy speech layout style ownership", () => {
  it("removes the retired selectors and every executable class consumer", () => {
    const cssSources = sourceFiles(appDirectory, /\.css$/).map(({ file, source }) => ({
      file,
      source: cssWithoutComments(source),
    }));
    const runtimeSources = [
      ...sourceFiles(appDirectory, /\.(?:ts|tsx)$/, new Set([currentTest])),
      ...sourceFiles(componentDirectory, /\.(?:ts|tsx)$/),
    ].map(({ file, source }) => ({
      file,
      source: typeScriptWithoutComments(source),
    }));

    for (const selector of RETIRED_SPEECH_LAYOUT_SELECTORS) {
      const className = runtimeClass(selector);
      expect(matchingFiles(cssSources, selector), `retired CSS selector ${selector}`).toEqual([]);
      expect(matchingFiles(runtimeSources, className), `retired runtime class ${className}`).toEqual([]);
    }
  });

  it("preserves shared speech state, feedback and accessibility behavior", () => {
    for (const contract of [
      ".lx-speech-player",
      ".lx-speech-player > button:disabled",
      ".lx-speech-player > button.speech-loading svg",
      ".lx-speech-player > button.speech-error",
      ".lx-speech-player > button.speech-unsupported",
      ".lx-speech-feedback",
      ".lx-speech-feedback.unsupported",
      "@keyframes lx-speech-pulse",
      "@media (prefers-reduced-motion: reduce)",
      ".lx-lesson-focus-mode .lx-speech-feedback",
    ]) {
      expect(speechPlayerStyles, `live speech contract ${contract}`).toContain(contract);
    }
  });

  it("keeps canonical route-specific speech layout owners", () => {
    expect(phraseDetailSource).toContain('className="lx-phrase-detail-title-row"');
    expect(phraseDetailSource).toContain('className="lx-phrase-listen"');
    expect(wordDetailSource).toContain('className="lx-word-detail-hero"');
    expect(wordDetailSource).toContain('className="lx-word-detail-speech"');
    expect(activeLessonSource).toContain('className="lx-active-lesson__utilities"');
  });

  it("keeps canonical route layers ordered after the shared speech layer", () => {
    const speechIndex = layoutSource.indexOf('import "./speech-player.css";');
    const phrasesIndex = layoutSource.indexOf('import "./phrases.css";');
    const wordDetailIndex = layoutSource.indexOf('import "./word-detail.css";');
    const activeLessonIndex = layoutSource.indexOf('import "./active-lesson.css";');

    expect(speechIndex).toBeGreaterThanOrEqual(0);
    expect(phrasesIndex).toBeGreaterThan(speechIndex);
    expect(wordDetailIndex).toBeGreaterThan(speechIndex);
    expect(activeLessonIndex).toBeGreaterThan(speechIndex);
  });

  it("ignores retired names in comments but retains executable strings", () => {
    expect(cssWithoutComments("/* .lx-detail-speech-row */ .lx-speech-player {}"))
      .toBe(" .lx-speech-player {}");
    expect(typeScriptWithoutComments("// lx-test-prompt-row\nconst className = 'lx-detail-speech-row';"))
      .not.toContain("lx-test-prompt-row");
    expect(typeScriptWithoutComments("// lx-test-prompt-row\nconst className = 'lx-detail-speech-row';"))
      .toContain("lx-detail-speech-row");
  });
});
