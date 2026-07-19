import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentsDirectory = path.join(frontendDirectory, "components");
const accessibleDialogFile = "accessible-dialog.tsx";
const delegatedProductEventPattern = /document\.addEventListener\s*\(\s*["'](?:click|dblclick|input|change|submit|keydown|keyup|pointerdown|pointerup|touchstart|touchend)["']/;
const focusContainmentPattern = /document\.addEventListener\s*\(\s*["']focusin["']/;

const forbiddenPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "global MutationObserver", pattern: /\bMutationObserver\b/ },
  { label: "imperative element creation", pattern: /document\.createElement\s*\(/ },
  { label: "imperative appendChild", pattern: /\.appendChild\s*\(/ },
  { label: "imperative insertBefore", pattern: /\.insertBefore\s*\(/ },
  { label: "product textContent rewrite", pattern: /\.textContent\s*=/ },
  { label: "global document event delegation", pattern: delegatedProductEventPattern },
  { label: "imperative React portal host", pattern: /\bcreatePortal\s*\(/ },
];

function componentSources(): Array<{ file: string; source: string }> {
  return readdirSync(componentsDirectory)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => ({
      file,
      source: readFileSync(path.join(componentsDirectory, file), "utf8"),
    }));
}

describe("React owns product UI DOM", () => {
  it("contains no global observer, delegated event or imperative product DOM patch", () => {
    const violations = componentSources()
      .filter(({ file }) => file !== accessibleDialogFile)
      .flatMap(({ file, source }) => forbiddenPatterns
        .filter(({ pattern }) => pattern.test(source))
        .map(({ label }) => `${file}: ${label}`));

    expect(violations).toEqual([]);
  });

  it("confines portal and focus containment infrastructure to the audited dialog primitive", () => {
    const source = readFileSync(path.join(componentsDirectory, accessibleDialogFile), "utf8");
    expect(source).toMatch(/\bcreatePortal\s*\(/);
    expect(source).toMatch(/document\.createElement\s*\(/);
    expect(source).toMatch(focusContainmentPattern);
    expect(source).not.toMatch(/\bMutationObserver\b/);
    expect(source).not.toMatch(/\.textContent\s*=/);
    expect(source).not.toMatch(/\.innerHTML\s*=/);

    const consumers = componentSources()
      .filter(({ file }) => file !== accessibleDialogFile)
      .filter(({ source: componentSource }) => /\bcreatePortal\s*\(/.test(componentSource)
        || focusContainmentPattern.test(componentSource))
      .map(({ file }) => file);
    expect(consumers).toEqual([]);
  });

  it("allows non-delegating browser lifecycle listeners", () => {
    const runtime = readFileSync(path.join(componentsDirectory, "review-outbox-runtime.tsx"), "utf8");
    expect(runtime).toMatch(/document\.addEventListener\s*\(\s*["']visibilitychange["']/);
    expect(runtime).not.toMatch(delegatedProductEventPattern);
  });

  it("removes legacy interaction patchers and does not bootstrap them", () => {
    expect(existsSync(path.join(componentsDirectory, "enhanced-ui-interactions.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDirectory, "premium-ui-interactions.tsx"))).toBe(false);

    const bootstrap = readFileSync(path.join(componentsDirectory, "lexigo-bootstrapped-app.tsx"), "utf8");
    expect(bootstrap).not.toContain("EnhancedUIInteractions");
    expect(bootstrap).not.toContain("PremiumUIInteractions");
    expect(bootstrap).not.toContain("CalendarReminderIntegration");
  });

  it("keeps React Strict Mode enabled for reconciliation regression coverage", () => {
    const nextConfig = readFileSync(path.join(frontendDirectory, "next.config.ts"), "utf8");
    expect(nextConfig).toMatch(/reactStrictMode:\s*true/);
  });
});
