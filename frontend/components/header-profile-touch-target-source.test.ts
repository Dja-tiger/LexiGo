import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/header-profile-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const premiumUI = readFileSync(new URL("../app/premium-ui.css", import.meta.url), "utf8");
const mobilePWA = readFileSync(new URL("../app/mobile-pwa-fixes.css", import.meta.url), "utf8");
const profileStyles = readFileSync(new URL("../app/profile.css", import.meta.url), "utf8");
const reminderEntryStyles = readFileSync(new URL("../app/calendar-reminder-entry.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const profileRuntime = readFileSync(new URL("./lexigo-profile-app.tsx", import.meta.url), "utf8");
const routeRuntimes = [
  "lexigo-home-app.tsx",
  "lexigo-learn-app.tsx",
  "lexigo-dictionary-app.tsx",
  "lexigo-progress-app.tsx",
  "lexigo-scenario-catalog-app.tsx",
  "lexigo-active-lesson-app.tsx",
  "lexigo-premium-app.tsx",
].map((path) => ({
  path,
  source: readFileSync(new URL(`./${path}`, import.meta.url), "utf8"),
}));
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const LIVE_SELECTOR = 'button.lx-avatar[aria-label="Открыть профиль"]';

describe("Issue #74 header profile touch-target ownership", () => {
  it("loads one narrow owner after visible geometry and appearance owners", () => {
    expect(layout).toContain('import "./header-profile-touch-targets.css";');
    expect(layout.indexOf('import "./profile.css";'))
      .toBeLessThan(layout.indexOf('import "./header-profile-touch-targets.css";'));
    expect(layout.indexOf('import "./connectivity-touch-targets.css";'))
      .toBeLessThan(layout.indexOf('import "./header-profile-touch-targets.css";'));
    expect(layout.indexOf('import "./header-profile-touch-targets.css";'))
      .toBeLessThan(layout.indexOf('import "./active-lesson-queued-state.css";'));
    expect(layout.match(/header-profile-touch-targets\.css/g)).toHaveLength(1);
  });

  it("expands the exact live button to 44px fine and 48px coarse on both axes", () => {
    expect(touchTargets).toContain("--lx-header-profile-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-header-profile-touch-target: 48px;");
    expect(touchTargets).toContain(`.lx-routed-app ${LIVE_SELECTOR} {`);
    expect(touchTargets).toContain(`.lx-routed-app ${LIVE_SELECTOR}::before {`);
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("calc((100% - var(--lx-header-profile-touch-target)) / 2)");
    expect(touchTargets).toContain("inset-block: min(");
    expect(touchTargets).toContain("inset-inline: min(");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");
  });

  it("preserves the 44px desktop and 42px compact painted avatar geometry", () => {
    expect(premiumUI).toContain(".lx-avatar {\n  width: 44px;\n  height: 44px;");
    expect(mobilePWA).toContain(".lx-routed-app .lx-avatar {\n    width: 42px;\n    height: 42px;");
    expect(profileStyles).toContain(".lx-profile-app .lx-avatar {\n  width: 42px;\n  height: 42px;");
    expect(touchTargets).not.toContain("min-height:");
    expect(touchTargets).not.toContain("min-width:");
    expect(touchTargets).not.toContain("width:");
    expect(touchTargets).not.toContain("height:");
    expect(touchTargets).not.toContain("transform:");
    expect(touchTargets).not.toContain("background:");
    expect(touchTargets).not.toContain("border:");
    expect(touchTargets).not.toContain("box-shadow:");
  });

  it("maps every confirmed interactive route consumer and excludes the decorative Profile avatar", () => {
    for (const runtime of routeRuntimes) {
      expect(runtime.source, runtime.path).toContain('className="lx-avatar"');
      expect(runtime.source, runtime.path).toContain('aria-label="Открыть профиль"');
      expect(runtime.source, runtime.path).toContain("<button");
    }

    expect(profileRuntime).toContain('<span className="lx-avatar" aria-hidden="true">');
    expect(touchTargets).toContain(LIVE_SELECTOR);
    expect(touchTargets).not.toContain(".lx-avatar::before");
    expect(touchTargets).not.toContain(".lx-icon-button");
  });

  it("protects the visible route reminder summary as the compact adjacent control", () => {
    expect(reminderEntryStyles).toContain(".lx-route-reminder-entry > summary {");
    expect(reminderEntryStyles).toContain("min-width: 44px;");
    expect(reminderEntryStyles).toContain("min-height: 48px;");
    expect(reminderEntryStyles).toContain("@media (max-width: 719px)");
    expect(reminderEntryStyles).toContain("right: max(68px, calc(env(safe-area-inset-right) + 68px));");
    expect(reminderEntryStyles).toContain("min-width: 48px;\n    min-height: 48px;");
    expect(mobilePWA).toContain(".lx-routed-app .lx-streak {\n    display: none;");
  });

  it("retains the existing global keyboard focus owner", () => {
    expect(focusStyles).toContain(":focus-visible {");
    expect(focusStyles).toContain("outline: var(--lx-focus-width) solid var(--lx-focus-ring) !important;");
    expect(focusStyles).toContain("0 0 0 7px var(--lx-focus-halo) !important;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("registers the focused browser proof in UI and accessibility commands", () => {
    for (const commandName of ["test:e2e:ui", "test:e2e:a11y"] as const) {
      const command = packageJSON.scripts?.[commandName] ?? "";
      expect(command).toContain("e2e/header-profile-touch-targets.spec.ts");
      expect(command.match(/e2e\/header-profile-touch-targets\.spec\.ts/g)).toHaveLength(1);
      expect(command).toContain("e2e/connectivity-touch-targets.spec.ts");
    }
  });
});
