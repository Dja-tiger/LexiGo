import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentsDirectory = path.join(frontendDirectory, "components");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
}

describe("final compatibility fallback inventory", () => {
  it("keeps all dedicated route islands before the final premium fallback", () => {
    const bootstrap = readComponent("lexigo-bootstrapped-app.tsx");
    const fallbackIndex = bootstrap.indexOf("<LexigoPremiumApp");

    expect(fallbackIndex).toBeGreaterThan(-1);
    for (const owner of [
      "<LexigoHomeApp",
      "<LexigoLearnApp",
      "<LexigoProgressApp",
      "<LexigoPhrasesApp",
      "<LexigoScenarioCatalogApp",
      "<LexigoScenarioApp",
    ]) {
      const ownerIndex = bootstrap.indexOf(owner);
      expect(ownerIndex, owner).toBeGreaterThan(-1);
      expect(ownerIndex, owner).toBeLessThan(fallbackIndex);
    }
  });

  it("limits the remaining presentation dispatch to live compatibility owners", () => {
    const premium = readComponent("lexigo-premium-app.tsx");

    expect(premium).toContain('const view = navigation.view === "library" ? renderLibrary()');
    expect(premium).toContain(': navigation.view === "profile" ? renderProfile()');
    expect(premium).toContain(': renderLesson();');

    for (const retired of [
      "function renderHome()",
      "function renderLearn()",
      "function renderProgress()",
      "function renderPhrases()",
      'navigation.view === "home"',
      'navigation.view === "learn" ? renderLearn()',
      'navigation.view === "progress" ? renderProgress()',
      'navigation.view === "phrases" ? renderPhrases()',
    ]) {
      expect(premium, retired).not.toContain(retired);
    }
  });

  it("preserves the shared auth, recovery, lesson and unknown-route boundary", () => {
    const premium = readComponent("lexigo-premium-app.tsx");

    expect(premium).toContain("requestAuthentication(");
    expect(premium).toContain("function renderLibrary()");
    expect(premium).toContain("function renderProfile()");
    expect(premium).toContain("function renderLesson()");
    expect(premium).toContain("async function startLesson(");
    expect(premium).toContain("async function resumeLesson(");
    expect(premium).toContain("LexiGo не смог открыть страницу");
  });

  it("does not classify canonical Learn CSS as orphaned after presentation retirement", () => {
    const learn = readComponent("lexigo-learn-app.tsx");

    for (const className of [
      "lx-composer-context",
      "lx-setup-card",
      "lx-setup-block",
      "lx-mode-selector",
      "lx-source-selector",
      "lx-setup-footer",
      "lx-lesson-preview",
      "lx-setup-submit",
    ]) {
      expect(learn, className).toContain(className);
    }
  });
});
