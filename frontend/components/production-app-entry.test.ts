import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");

const productionAppFiles = [
  "lexigo-bootstrapped-app.tsx",
  "lexigo-dictionary-app.tsx",
  "lexigo-premium-app.tsx",
  "routed-lexigo-app.tsx",
] as const;

const retiredAppFiles = [
  "lexigo-app.tsx",
  "lexigo-learning-app.tsx",
  "lexigo-product-app.tsx",
  "lexigo-resumable-app.tsx",
] as const;

function readSource(...segments: string[]): string {
  return readFileSync(path.join(...segments), "utf8");
}

function componentSources(): Array<{ file: string; source: string }> {
  return readdirSync(componentsDirectory)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => ({
      file,
      source: readSource(componentsDirectory, file),
    }));
}

describe("production frontend application entry", () => {
  it("keeps one audited application-root file set", () => {
    const applicationRootFiles = readdirSync(componentsDirectory)
      .filter((file) => file.includes("lexigo") && file.endsWith("-app.tsx"))
      .sort();

    expect(applicationRootFiles).toEqual([...productionAppFiles].sort());
  });

  it("keeps the root chain layout -> routed shell -> bootstrap -> route graph", () => {
    const layout = readSource(appDirectory, "layout.tsx");
    const routedApp = readSource(componentsDirectory, "routed-lexigo-app.tsx");
    const bootstrappedApp = readSource(componentsDirectory, "lexigo-bootstrapped-app.tsx");

    expect(layout).toMatch(/import\s+\{\s*RoutedLexigoApp\s*\}\s+from\s+["']@\/components\/routed-lexigo-app["']/);
    expect(layout.match(/<RoutedLexigoApp\s*\/>/g)).toHaveLength(1);

    expect(routedApp).toMatch(/import\s+\{\s*LexigoBootstrappedApp\s*\}\s+from\s+["']\.\/lexigo-bootstrapped-app["']/);
    expect(routedApp.match(/<LexigoBootstrappedApp\s+pathname=\{pathname\}\s*\/>/g)).toHaveLength(1);

    expect(bootstrappedApp).not.toContain('from "next/navigation"');
    expect(bootstrappedApp).toContain('import("./lexigo-premium-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-dictionary-app")');
    expect(bootstrappedApp.match(/<LexigoPremiumApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoDictionaryApp\b/g)).toHaveLength(1);
  });

  it("allows only the bootstrap layer to load route application entries", () => {
    const sources = componentSources();
    const productGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-premium-app"))
      .map(({ file }) => file)
      .sort();
    const dictionaryGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-dictionary-app"))
      .map(({ file }) => file)
      .sort();

    expect(productGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(dictionaryGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
  });

  it("keeps dictionary code inside its route island", () => {
    const dictionaryApp = readSource(componentsDirectory, "lexigo-dictionary-app.tsx");

    expect(dictionaryApp).toContain('from "./dictionary-catalog"');
    expect(dictionaryApp).toContain('data-route-client-island="dictionary"');
    expect(dictionaryApp).not.toContain("lexigo-premium-app");
    expect(dictionaryApp).not.toContain("restoreSession");
  });

  it("keeps retired alternative roots outside the production tree", () => {
    const restoredAlternatives = retiredAppFiles.filter((file) => (
      existsSync(path.join(componentsDirectory, file))
    ));

    expect(restoredAlternatives).toEqual([]);
  });
});
