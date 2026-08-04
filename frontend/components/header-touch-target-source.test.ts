import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/header-touch-targets.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const adaptiveNavigation = readFileSync(new URL("../app/adaptive-navigation.css", import.meta.url), "utf8");
const dictionary = readFileSync(new URL("./lexigo-dictionary-app.tsx", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 Dictionary reminder touch-target ownership", () => {
  it("uses one narrow routed stylesheet without reordering existing style owners", () => {
    expect(layout).toContain('import "./header-touch-targets.css";');
    expect(layout.indexOf('import "./accessibility-navigation.css";'))
      .toBeLessThan(layout.indexOf('import "./header-touch-targets.css";'));
    expect(layout.indexOf('import "./header-touch-targets.css";'))
      .toBeLessThan(layout.indexOf('import "./adaptive-navigation.css";'));
    expect(layout.match(/header-touch-targets\.css/g)).toHaveLength(1);
  });

  it("preserves a 19px icon while exposing 44px fine and 48px coarse hit boxes", () => {
    expect(touchTargets).toContain("--lx-shared-header-touch-target: 44px;");
    expect(touchTargets).toContain("--lx-shared-header-icon-size: 19px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-shared-header-touch-target: 48px;");
    expect(touchTargets).toContain("button.lx-icon-button > svg");
    expect(touchTargets).toContain("width: var(--lx-shared-header-touch-target);");
    expect(touchTargets).toContain("height: var(--lx-shared-header-touch-target);");
    expect(touchTargets).toContain("box-sizing: border-box;");
    expect(touchTargets).toContain("var(--lx-shared-header-icon-size)");
    expect(touchTargets).toContain("pointer-events: auto;");
  });

  it("does not establish a positioning or paint owner on the visual button", () => {
    expect(touchTargets).not.toContain("position:");
    expect(touchTargets).not.toContain("transform:");
    expect(touchTargets).not.toContain("box-shadow:");
    expect(touchTargets).not.toContain("::before");
    expect(touchTargets).not.toContain("button.lx-avatar");
    expect(touchTargets).not.toContain("button.lx-streak");
  });

  it("retains the existing global keyboard focus owner", () => {
    expect(focusStyles).toContain(":focus-visible {");
    expect(focusStyles).toContain("outline: var(--lx-focus-width) solid var(--lx-focus-ring) !important;");
    expect(focusStyles).toContain("0 0 0 7px var(--lx-focus-halo) !important;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("maps the exact live reminder owner and icon dimensions", () => {
    expect(dictionary).toContain('className="lx-icon-button"');
    expect(dictionary).toContain('aria-label="Напоминание о занятии"');
    expect(dictionary).toContain('function BellIcon()');
    expect(dictionary).toContain('<svg width="19" height="19"');
    expect(dictionary).toContain("<BellIcon />");
  });

  it("preserves the already compliant compact navigation contract", () => {
    expect(adaptiveNavigation).toContain("grid-template-columns: repeat(5, minmax(48px, 1fr));");
    expect(adaptiveNavigation).toContain("min-width: 48px;");
    expect(adaptiveNavigation).toContain("min-height: 52px;");
    expect(adaptiveNavigation).toContain("font-size: 12px;");
    expect(adaptiveNavigation).toContain("font-size: 11px;");
  });

  it("registers the focused browser proof in UI and accessibility commands", () => {
    for (const commandName of ["test:e2e:ui", "test:e2e:a11y"] as const) {
      const command = packageJSON.scripts?.[commandName] ?? "";
      expect(command).toContain("e2e/header-touch-targets.spec.ts");
      expect(command.match(/e2e\/header-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
  });
});
