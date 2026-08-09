import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/issue-74-final-touch-targets.css", import.meta.url), "utf8");
const scenarioStyles = readFileSync(new URL("../app/scenario-lessons.css", import.meta.url), "utf8");
const serviceWorkerStyles = readFileSync(new URL("../app/service-worker-update.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const serviceWorkerRuntime = readFileSync(new URL("./service-worker-registration.tsx", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 final residual touch-target ownership", () => {
  it("loads one interaction owner after both canonical painted owners", () => {
    expect(layout).toContain('import "./issue-74-final-touch-targets.css";');
    expect(layout.indexOf('import "./service-worker-update.css";'))
      .toBeLessThan(layout.indexOf('import "./issue-74-final-touch-targets.css";'));
    expect(layout.indexOf('import "./scenario-lessons-accessibility.css";'))
      .toBeLessThan(layout.indexOf('import "./issue-74-final-touch-targets.css";'));
    expect(layout.match(/issue-74-final-touch-targets\.css/g)).toHaveLength(1);
  });

  it("owns the live Scenario route, Scenario portal dialog and Service Worker banner families", () => {
    expect(touchTargets).toContain(".lx-scenario button,");
    expect(touchTargets).toContain(".lx-scenario-dialog button,");
    expect(touchTargets).toContain(".lx-sw-update button {");
    expect(serviceWorkerRuntime).toContain('data-testid="service-worker-update"');
    expect(serviceWorkerRuntime).toContain("Обновить сейчас");
    expect(serviceWorkerRuntime).toContain("После урока");
    expect(serviceWorkerRuntime).toContain("Позже");
  });

  it("expands a transparent 44px fine / 48px coarse minimum square without paint changes", () => {
    expect(touchTargets).toContain("--lx-issue-74-final-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-issue-74-final-touch-target: 48px;");
    expect(touchTargets).toContain("inset-block: calc((100% - var(--lx-issue-74-final-touch-target)) / 2);");
    expect(touchTargets).toContain("inset-inline: calc((100% - var(--lx-issue-74-final-touch-target)) / 2);");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("background: transparent;");
    expect(touchTargets).toContain("border: 0;");
    expect(touchTargets).toContain("box-shadow: none;");
  });

  it("preserves canonical painted geometry", () => {
    expect(scenarioStyles).toContain(".lx-scenario button {\n  min-height: 44px;");
    expect(serviceWorkerStyles).toContain(".lx-sw-update button {\n  min-height: 42px;");
    expect(touchTargets).not.toContain("min-height:");
    expect(touchTargets).not.toContain("min-width:");
    expect(touchTargets).not.toContain("transform:");
  });

  it("registers one cross-browser proof in focused and blocking collections", () => {
    for (const commandName of ["test:e2e:scenario", "test:e2e:sw", "test:e2e:ui", "test:e2e:a11y"] as const) {
      const command = packageJSON.scripts?.[commandName] ?? "";
      expect(command).toContain("e2e/issue-74-final-touch-targets.spec.ts");
      expect(command.match(/e2e\/issue-74-final-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
  });
});
