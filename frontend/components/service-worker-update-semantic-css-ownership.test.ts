import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const stylesheetPath = path.join(frontendDirectory, "app", "service-worker-update.css");
const registrationPath = path.join(frontendDirectory, "components", "service-worker-registration.tsx");
const layoutPath = path.join(frontendDirectory, "app", "layout.tsx");
const packagePath = path.join(frontendDirectory, "package.json");

const stylesheet = readFileSync(stylesheetPath, "utf8");
const registration = readFileSync(registrationPath, "utf8");
const layout = readFileSync(layoutPath, "utf8");
const packageJSON = JSON.parse(readFileSync(packagePath, "utf8")) as { scripts?: Record<string, string> };

const LEGACY_PAINT = [
  "rgba(139, 92, 246",
  "rgba(17, 23, 36",
  "#7c3aed",
  "#0891b2",
  "#cbd5e1",
] as const;

const REQUIRED_SEMANTIC_TOKENS = [
  "--ak-color-surface",
  "--ak-color-subtle",
  "--ak-color-primary",
  "--ak-color-primary-hover",
  "--ak-color-retained",
  "--ak-color-weak",
  "--ak-color-text-main",
  "--ak-color-text-muted",
  "--ak-elevation-3",
] as const;

describe("Service Worker update semantic presentation ownership", () => {
  it("keeps the live update owner on Foundation semantic tokens without the retired purple/cyan/navy paint", () => {
    expect(stylesheet).toContain(".lx-sw-update {");
    expect(stylesheet).toContain(".lx-sw-update--success {");
    expect(stylesheet).toContain(".lx-sw-update--error {");

    for (const token of REQUIRED_SEMANTIC_TOKENS) {
      expect(stylesheet).toContain(`var(${token})`);
    }
    for (const paint of LEGACY_PAINT) {
      expect(stylesheet.toLowerCase()).not.toContain(paint);
    }

    expect(stylesheet).not.toMatch(/linear-gradient\([^)]*(?:7c3aed|0891b2|139,\s*92,\s*246)/i);
  });

  it("proves the semantic owner is production-reachable and its browser regression is blocking", () => {
    expect(layout).toContain("<ServiceWorkerRegistration />");
    expect(registration).toContain('className="lx-sw-update"');
    expect(registration).toContain('className="lx-sw-update lx-sw-update--success"');
    expect(registration).toContain('className="lx-sw-update lx-sw-update--error"');
    expect(registration).toContain('data-testid="service-worker-update"');
    expect(registration).toContain('data-testid="service-worker-error"');

    expect(packageJSON.scripts?.["test:e2e:sw"]).toContain("e2e/service-worker-update.spec.ts");
    expect(packageJSON.scripts?.["test:e2e:security"]).toContain("e2e/service-worker-update.spec.ts");
  });
});
