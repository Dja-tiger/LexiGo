import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const repositoryDirectory = path.resolve(frontendDirectory, "..");
const componentsDirectory = path.join(frontendDirectory, "components");

const canonicalRouteEntries = [
  { component: "LexigoHomeApp", module: "./lexigo-home-app" },
  { component: "LexigoLearnApp", module: "./lexigo-learn-app" },
  { component: "LexigoActiveLessonApp", module: "./lexigo-active-lesson-app" },
  { component: "LexigoDictionaryApp", module: "./lexigo-dictionary-app" },
  { component: "LexigoPhrasesApp", module: "./lexigo-phrases-app" },
  { component: "LexigoProgressApp", module: "./lexigo-progress-app" },
  { component: "LexigoProfileApp", module: "./lexigo-profile-app" },
  { component: "LexigoScenarioCatalogApp", module: "./lexigo-scenario-catalog-app" },
  { component: "LexigoScenarioApp", module: "./lexigo-scenario-app" },
] as const;

function readSource(...segments: string[]): string {
  return readFileSync(path.join(...segments), "utf8");
}

describe("frontend architecture documentation", () => {
  it("documents every canonical client entry loaded by the bootstrap owner", () => {
    const bootstrap = readSource(componentsDirectory, "lexigo-bootstrapped-app.tsx");
    const readme = readSource(repositoryDirectory, "README.md");
    const architecture = readSource(repositoryDirectory, "docs", "architecture.md");

    for (const entry of canonicalRouteEntries) {
      expect(bootstrap).toContain(`import("${entry.module}")`);
      expect(readme).toContain(`\`${entry.component}\``);
      expect(architecture).toContain(`\`${entry.component}\``);
    }
  });

  it("keeps LexigoPremiumApp documented as a compatibility fallback, not an extracted route owner", () => {
    const bootstrap = readSource(componentsDirectory, "lexigo-bootstrapped-app.tsx");
    const readme = readSource(repositoryDirectory, "README.md");
    const architecture = readSource(repositoryDirectory, "docs", "architecture.md");
    const publicArchitecture = `${readme}\n${architecture}`;

    expect(bootstrap).toContain('import("./lexigo-premium-app")');
    expect(readme).toContain("`LexigoPremiumApp`");
    expect(architecture).toContain("`LexigoPremiumApp`");
    expect(readme).toContain("Issue #70");
    expect(architecture).toContain("Issue #70");

    expect(publicArchitecture).not.toContain(
      "compatibility graph для ещё не извлечённых Phrases и Active Lesson",
    );
    expect(publicArchitecture).not.toContain(
      "только Phrases пока остаётся в compatibility graph",
    );
    expect(publicArchitecture).not.toContain(
      "текущая React state-модель ещё не извлечённых экранов",
    );
  });
});
