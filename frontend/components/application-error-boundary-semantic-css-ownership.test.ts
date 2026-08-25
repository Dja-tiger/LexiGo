import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const stylesheetPath = path.join(frontendDirectory, "app", "error-boundary.css");
const componentPath = path.join(frontendDirectory, "components", "application-error-boundary.tsx");
const layoutPath = path.join(frontendDirectory, "app", "layout.tsx");
const packagePath = path.join(frontendDirectory, "package.json");

const stylesheet = readFileSync(stylesheetPath, "utf8");
const component = readFileSync(componentPath, "utf8");
const layout = readFileSync(layoutPath, "utf8");
const packageJSON = JSON.parse(readFileSync(packagePath, "utf8")) as { scripts?: Record<string, string> };

const LEGACY_FATAL_PAINT = [
  "#f8f9ff",
  "rgba(121, 93, 255",
  "#050914",
  "rgba(255, 117, 137",
  "#ff7589",
  "rgba(126, 30, 47",
  "#ff8798",
  "#9da9bd",
  "rgba(126, 146, 185",
  "#b9c4d7",
  "rgba(255, 255, 255, .04)",
] as const;

const REQUIRED_SEMANTIC_TOKENS = [
  "var(--ak-color-canvas)",
  "var(--ak-color-surface)",
  "var(--ak-color-subtle)",
  "var(--ak-color-weak)",
  "var(--ak-color-text-main)",
  "var(--ak-color-text-muted)",
] as const;

describe("application error boundary semantic CSS ownership", () => {
  it("keeps the fatal boundary globally mounted with one stylesheet owner", () => {
    expect(layout).toContain('import { ApplicationErrorBoundary } from "@/components/application-error-boundary"');
    expect(layout).toContain('import "./error-boundary.css"');
    expect(layout).toMatch(/<ApplicationErrorBoundary>[\s\S]*<RoutedLexigoApp \/>[\s\S]*<\/ApplicationErrorBoundary>/);
    expect(component).toContain('className="lx-fatal-error"');
    expect(component).toContain('className="lx-fatal-error-mark"');
    expect(component).toContain('className="lx-fatal-error-actions"');
  });

  it("derives fatal presentation from Foundation semantic appearance tokens", () => {
    for (const token of REQUIRED_SEMANTIC_TOKENS) {
      expect(stylesheet).toContain(token);
    }

    expect(stylesheet).toContain("background: var(--ak-color-canvas)");
    expect(stylesheet).toContain("color: var(--ak-color-text-main)");
    expect(stylesheet).toContain("color: var(--ak-color-weak)");
    expect(stylesheet).toContain("color: var(--ak-color-text-muted)");
    expect(stylesheet).not.toContain("radial-gradient");

    for (const legacyPaint of LEGACY_FATAL_PAINT) {
      expect(stylesheet).not.toContain(legacyPaint);
    }
  });

  it("preserves recovery lifecycle ownership outside the presentation slice", () => {
    expect(component).toContain("static getDerivedStateFromError");
    expect(component).toContain("componentDidCatch");
    expect(component).toContain("UI_RENDER_FAILURE");
    expect(component).toContain("UI_VERSION_MISMATCH");
    expect(component).toContain("clearLexigoRuntimeState");
    expect(component).toContain("SERVICE_WORKER_SKIP_WAITING");
    expect(component).toContain('window.location.assign("/")');
  });

  it("collects effective Light/Dark cascade evidence in the blocking UI suite", () => {
    const uiScript = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    expect(uiScript).toContain("e2e/application-error-boundary-appearance.spec.ts");
  });
});
