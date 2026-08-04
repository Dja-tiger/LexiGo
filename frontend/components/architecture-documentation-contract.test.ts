import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type ManifestClassification = "intentional" | "requires-proof" | "protected";

type ManifestItem = Readonly<{
  id: string;
  classification: ManifestClassification;
  evidence: string;
}>;

type PackageScripts = Readonly<Record<string, string>>;

type ProofFamily = Readonly<{
  id: string;
  expectedCount: number;
  matches: (manifestId: string) => boolean;
  cssPath: string;
  ownerMarkers: readonly string[];
  sourceContractPath: string;
  sourceMarkers: readonly string[];
  browserSpecPath: string;
}>;

const frontendDirectory = process.cwd();
const repositoryDirectory = path.resolve(frontendDirectory, "..");

function readFrontendFile(relativePath: string): string {
  return readFileSync(path.join(frontendDirectory, relativePath), "utf8");
}

function readRepositoryFile(relativePath: string): string {
  return readFileSync(path.join(repositoryDirectory, relativePath), "utf8");
}

function parseManifest(value: unknown): readonly ManifestItem[] {
  if (!Array.isArray(value)) throw new Error("Global style overlap manifest must be an array");

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`Manifest item ${index} must be an object`);
    }

    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== "string"
      || typeof record.classification !== "string"
      || typeof record.evidence !== "string"
      || !["intentional", "requires-proof", "protected"].includes(record.classification)
    ) {
      throw new Error(`Manifest item ${index} is malformed`);
    }

    return {
      id: record.id,
      classification: record.classification as ManifestClassification,
      evidence: record.evidence,
    };
  });
}

function parsePackageScripts(value: unknown): PackageScripts {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Frontend package.json must be an object");
  }

  const scripts = (value as Record<string, unknown>).scripts;
  if (typeof scripts !== "object" || scripts === null || Array.isArray(scripts)) {
    throw new Error("Frontend package.json requires a scripts object");
  }

  return Object.fromEntries(
    Object.entries(scripts).map(([name, command]) => {
      if (typeof command !== "string") {
        throw new Error(`Frontend package script ${name} must be a string`);
      }
      return [name, command];
    }),
  );
}

function occurrenceCount(source: string, token: string): number {
  return source.split(token).length - 1;
}

const manifest = parseManifest(JSON.parse(
  readFrontendFile("app/global-feature-style-overlap-manifest.json"),
));
const scripts = parsePackageScripts(JSON.parse(readFrontendFile("package.json")));

const proofFamilies: readonly ProofFamily[] = [
  {
    id: "routed-resource-stack",
    expectedCount: 1,
    matches: (id) => id.startsWith(".lx-resource-stack | width | normal ->"),
    cssPath: "app/adaptive-navigation.css",
    ownerMarkers: [".lx-routed-app .lx-resource-stack"],
    sourceContractPath: "components/navigation-mobile-shell-css-ownership.test.ts",
    sourceMarkers: [".lx-routed-app .lx-resource-stack", "resourceStackMatchesMainContent"],
    browserSpecPath: "e2e/navigation-mobile-shell-cascade.spec.ts",
  },
  {
    id: "routed-async-state",
    expectedCount: 1,
    matches: (id) => id.startsWith(".lx-async-state | width | normal ->"),
    cssPath: "app/adaptive-navigation.css",
    ownerMarkers: [".lx-routed-app .lx-async-state"],
    sourceContractPath: "components/navigation-mobile-shell-css-ownership.test.ts",
    sourceMarkers: [".lx-routed-app .lx-async-state", "asyncStateMatchesResourceStack"],
    browserSpecPath: "e2e/navigation-mobile-shell-cascade.spec.ts",
  },
  {
    id: "learn-section-switch",
    expectedCount: 8,
    matches: (id) => id.startsWith(".lx-learning-section-switch--learn |"),
    cssPath: "app/learning-section-switch.css",
    ownerMarkers: [
      ".lx-routed-app[data-route-path=\"/learn\"] .lx-learning-section-switch--learn",
    ],
    sourceContractPath: "components/learning-section-switch-css-ownership.test.ts",
    sourceMarkers: ["ROUTED_SELECTOR", "FALLBACK_SELECTOR", "switchMarginLeft", "switchWidth"],
    browserSpecPath: "e2e/navigation-mobile-shell-cascade.spec.ts",
  },
  {
    id: "adaptive-lesson-composer",
    expectedCount: 6,
    matches: (id) => [
      ".lx-source-selector |",
      ".lx-source-selector>button |",
      ".lx-setup-footer |",
      ".lx-setup-submit |",
    ].some((prefix) => id.startsWith(prefix)),
    cssPath: "app/adaptive-lesson-composer.css",
    ownerMarkers: [
      ".lx-main-content[aria-label=\"Обучение\"] .lx-source-selector",
      ".lx-main-content[aria-label=\"Обучение\"] .lx-source-selector > button",
      ".lx-main-content[aria-label=\"Обучение\"] .lx-setup-footer",
      ".lx-main-content[aria-label=\"Обучение\"] .lx-setup-submit",
    ],
    sourceContractPath: "components/adaptive-layout-css-ownership.test.ts",
    sourceMarkers: [
      "CANONICAL_ANCESTRY",
      ".lx-source-selector > button",
      ".lx-setup-footer",
      ".lx-setup-submit",
    ],
    browserSpecPath: "e2e/adaptive-layout-cascade.spec.ts",
  },
  {
    id: "phrases-result-grid",
    expectedCount: 4,
    matches: (id) => id.startsWith(".lx-phrase-grid |"),
    cssPath: "app/phrases.css",
    ownerMarkers: [
      ".lx-app[data-route-client-island=\"phrases\"] .lx-phrase-grid",
    ],
    sourceContractPath: "components/phrases-css-ownership.test.ts",
    sourceMarkers: [
      ".lx-app[data-route-client-island=\"phrases\"] .lx-phrase-grid",
      "canonicalCascadeBlock",
    ],
    browserSpecPath: "e2e/phrases-grid-cascade.spec.ts",
  },
  {
    id: "routed-account-security",
    expectedCount: 1,
    matches: (id) => id.startsWith(".lx-account-security | width | normal ->"),
    cssPath: "app/account-security.css",
    ownerMarkers: [".lx-routed-app .lx-account-security"],
    sourceContractPath: "components/account-security-css-ownership.test.ts",
    sourceMarkers: [".lx-routed-app .lx-account-security", "routedOwner"],
    browserSpecPath: "e2e/account-security-width-cascade.spec.ts",
  },
];

describe("Issue #70 final frontend ownership acceptance", () => {
  it("keeps the reviewed manifest totals and maps every proof item exactly once", () => {
    const classificationCounts: Record<ManifestClassification, number> = {
      intentional: 0,
      "requires-proof": 0,
      protected: 0,
    };
    for (const item of manifest) classificationCounts[item.classification] += 1;

    expect(manifest).toHaveLength(71);
    expect(classificationCounts).toEqual({
      intentional: 50,
      "requires-proof": 21,
      protected: 0,
    });

    const proofItems = manifest.filter((item) => item.classification === "requires-proof");
    for (const item of proofItems) {
      const matchingFamilies = proofFamilies.filter((family) => family.matches(item.id));
      expect(matchingFamilies.map((family) => family.id), item.id).toHaveLength(1);
      expect(item.evidence).toBe("Separate computed-cascade proof required for this owner pair.");
    }

    for (const family of proofFamilies) {
      const familyItems = proofItems.filter((item) => family.matches(item.id));
      expect(familyItems, family.id).toHaveLength(family.expectedCount);
    }

    expect(proofFamilies.reduce((total, family) => total + family.expectedCount, 0)).toBe(21);
  });

  it("keeps every semantic owner connected to its focused source and browser proof", () => {
    for (const family of proofFamilies) {
      const css = readFrontendFile(family.cssPath);
      const sourceContract = readFrontendFile(family.sourceContractPath);
      const browserSpec = readFrontendFile(family.browserSpecPath);

      for (const ownerMarker of family.ownerMarkers) {
        expect(css, `${family.id}: production owner ${ownerMarker}`).toContain(ownerMarker);
      }
      for (const sourceMarker of family.sourceMarkers) {
        expect(sourceContract, `${family.id}: source marker ${sourceMarker}`).toContain(sourceMarker);
      }

      expect(sourceContract, `${family.id}: manifest contract`).toContain(
        "global-feature-style-overlap-manifest.json",
      );
      expect(sourceContract, `${family.id}: reviewed classification`).toContain("requires-proof");
      expect(sourceContract, `${family.id}: browser registration`).toContain(family.browserSpecPath);
      expect(browserSpec, `${family.id}: cascade orders`).toContain("cascadeOrders");
      expect(browserSpec, `${family.id}: immutable computed snapshot`).toContain("toEqual(reference");
    }
  });

  it("registers every unique computed-cascade proof in both authoritative UI commands", () => {
    const uniqueBrowserSpecs = new Set(proofFamilies.map((family) => family.browserSpecPath));
    expect([...uniqueBrowserSpecs].sort()).toEqual([
      "e2e/account-security-width-cascade.spec.ts",
      "e2e/adaptive-layout-cascade.spec.ts",
      "e2e/navigation-mobile-shell-cascade.spec.ts",
      "e2e/phrases-grid-cascade.spec.ts",
    ]);

    for (const browserSpecPath of uniqueBrowserSpecs) {
      expect(occurrenceCount(scripts["test:e2e:ui"] ?? "", browserSpecPath), browserSpecPath).toBe(1);
      expect(
        occurrenceCount(scripts["test:e2e:responsive"] ?? "", browserSpecPath),
        browserSpecPath,
      ).toBe(1);
    }
  });

  it("keeps all seven Issue #70 acceptance criteria executable", () => {
    const productionEntry = readFrontendFile("components/production-app-entry.test.ts");
    const globalStyleOwnership = readFrontendFile("app/global-style-ownership.test.ts");
    const overlapSource = readFrontendFile("app/global-feature-style-overlap-source.test.ts");
    const routeBundleBudget = readFrontendFile("e2e/route-bundle-budget.spec.ts");
    const bundleBudgets = readFrontendFile("bundle-budgets.json");
    const readme = readRepositoryFile("README.md");
    const architecture = readRepositoryFile("docs/architecture.md");

    expect(productionEntry).toContain("routed-lexigo-app.tsx");
    expect(productionEntry).toContain("lexigo-bootstrapped-app.tsx");
    for (const retiredRoot of [
      "lexigo-app.tsx",
      "lexigo-learning-app.tsx",
      "lexigo-product-app.tsx",
      "lexigo-resumable-app.tsx",
    ]) {
      expect(productionEntry).toContain(retiredRoot);
    }
    expect(productionEntry).toContain("keeps retired alternative roots outside the production tree");

    expect(globalStyleOwnership).toContain("ownersOf(/(^|})\\s*body\\s*\\{/m)");
    expect(globalStyleOwnership).toContain("button, input { font: inherit; }");
    expect(overlapSource).toContain("global-feature-style-overlap-manifest.json");
    expect(overlapSource).toContain("parseClassifiedConflicts");
    expect(overlapSource).toContain("cssImportPattern");

    expect(routeBundleBudget).toContain(
      "canonical routes stay within budgets and exclude fallback-only JavaScript",
    );
    expect(routeBundleBudget).toContain("fallbackExclusiveAssets");
    expect(bundleBudgets).toContain('"routes"');
    for (const route of [
      '"/"',
      '"/learn"',
      '"/phrases"',
      '"/dictionary"',
      '"/words/101"',
      '"/progress"',
      '"/profile"',
      '"/lesson/active"',
      '"/scenarios"',
      '"/scenarios/incident-update"',
    ]) {
      expect(bundleBudgets).toContain(route);
    }

    expect(scripts["test:e2e:visual"]).toContain("playwright.visual.config.ts");
    expect(scripts["test:e2e:performance"]).toContain("playwright.performance.config.ts");

    expect(readme).toContain(
      "`frontend/app/layout.tsx` → `RoutedLexigoApp` → `LexigoBootstrappedApp`",
    );
    expect(readme).toContain("Глобальные CSS-файлы подключаются только из `frontend/app/layout.tsx`");
    expect(readme).toContain("frontend/components/architecture-documentation-contract.test.ts");
    expect(architecture).toContain("## Frontend routing");
    expect(architecture).toContain("## System-state ownership");
    expect(architecture).toContain("Route-specific initial JavaScript и request ceilings");
    expect(architecture).toContain("frontend/components/architecture-documentation-contract.test.ts");
  });
});
