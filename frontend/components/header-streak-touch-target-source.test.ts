import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/header-streak-touch-targets.css", import.meta.url), "utf8");
const reminderEntry = readFileSync(new URL("../app/calendar-reminder-entry.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const premiumUI = readFileSync(new URL("../app/premium-ui.css", import.meta.url), "utf8");
const adaptiveHome = readFileSync(new URL("../app/adaptive-knowledge-coach-home.css", import.meta.url), "utf8");
const profileTargets = readFileSync(new URL("../app/header-profile-touch-targets.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const interactiveRouteRuntimes = [
  {
    path: "lexigo-home-app.tsx",
    progressNavigation: 'navigate({ view: "progress" })',
  },
  {
    path: "lexigo-learn-app.tsx",
    progressNavigation: 'navigate({ view: "progress" })',
  },
  {
    path: "lexigo-active-lesson-app.tsx",
    progressNavigation: 'navigate({ view: "progress" })',
  },
  {
    path: "lexigo-premium-app.tsx",
    progressNavigation: 'navigatePrimary("progress")',
  },
].map(({ path, progressNavigation }) => ({
  path,
  progressNavigation,
  source: readFileSync(new URL(`./${path}`, import.meta.url), "utf8"),
}));
const dictionaryRuntime = readFileSync(new URL("./lexigo-dictionary-app.tsx", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const LIVE_SELECTOR = "button.lx-streak";

function declarationNames(source: string): string[] {
  return Array.from(source.matchAll(/^\s*([\w-]+)\s*:/gm), (match) => match[1]);
}

describe("Issue #74 header streak touch-target ownership", () => {
  it("loads one narrow owner after the profile target owner and before queued-state overrides", () => {
    expect(layout).toContain('import "./header-streak-touch-targets.css";');
    expect(layout.indexOf('import "./header-profile-touch-targets.css";'))
      .toBeLessThan(layout.indexOf('import "./header-streak-touch-targets.css";'));
    expect(layout.indexOf('import "./header-streak-touch-targets.css";'))
      .toBeLessThan(layout.indexOf('import "./active-lesson-queued-state.css";'));
    expect(layout.match(/header-streak-touch-targets\.css/g)).toHaveLength(1);
  });

  it("gives the exact live button a real 44px fine and 48px coarse border box", () => {
    expect(touchTargets).toContain("--lx-header-streak-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-header-streak-touch-target: 48px;");
    expect(touchTargets).toContain(`.lx-routed-app ${LIVE_SELECTOR} {`);
    expect(touchTargets).toContain("min-block-size: var(--lx-header-streak-touch-target);");
    expect(touchTargets).toContain("min-inline-size: var(--lx-header-streak-touch-target);");
    expect(touchTargets).toContain("touch-action: manipulation;");
    expect(touchTargets).not.toContain(`${LIVE_SELECTOR}::before`);
    expect(touchTargets).not.toContain("position:");
    expect(touchTargets).not.toContain("inset-");
    expect(touchTargets).not.toContain("pointer-events:");
  });

  it("changes only minimum interaction geometry and preserves painted presentation ownership", () => {
    expect(premiumUI).toContain(".lx-streak {\n  gap: 8px;\n  padding: 10px 11px;");
    expect(premiumUI).toContain(".lx-streak span { font-size: 14px; font-weight: 720; }");

    const declarations = declarationNames(touchTargets);
    for (const prohibited of [
      "width",
      "height",
      "padding",
      "margin",
      "gap",
      "transform",
      "background",
      "border",
      "box-shadow",
      "font",
      "display",
      "position",
      "top",
      "right",
      "bottom",
      "left",
    ]) {
      expect(declarations, `${prohibited} must remain owned by the painted presentation layers`)
        .not.toContain(prohibited);
    }
  });

  it("maps every confirmed interactive route consumer and excludes the decorative Dictionary streak", () => {
    for (const runtime of interactiveRouteRuntimes) {
      expect(runtime.source, runtime.path).toContain('className="lx-streak"');
      expect(runtime.source, runtime.path).toContain("<button");
      expect(runtime.source, runtime.path).toContain(runtime.progressNavigation);
    }

    expect(dictionaryRuntime).toContain('<span className="lx-streak" aria-label={`Серия: ${progress.currentStreak} дней`}>');
    expect(dictionaryRuntime).not.toContain('<button className="lx-streak"');
    expect(touchTargets).toContain(LIVE_SELECTOR);
    expect(touchTargets).not.toContain(`${LIVE_SELECTOR}::before`);
    expect(touchTargets).not.toContain("span.lx-streak");
    expect(touchTargets).not.toContain(".lx-icon-button");
    expect(touchTargets).not.toContain(".lx-avatar");
  });

  it("preserves the intentional phone-width hidden state", () => {
    expect(adaptiveHome).toContain("@media (max-width: 719px)");
    expect(adaptiveHome).toContain(".lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island=\"dictionary\"]) .lx-streak,");
    expect(adaptiveHome).toContain("display: none;");
    expect(touchTargets).not.toContain("display:");
    expect(touchTargets).not.toContain("visibility:");
  });

  it("keeps the profile and reminder targets separated from the streak without moving painted pixels", () => {
    expect(profileTargets).toContain('button.lx-avatar[aria-label="Открыть профиль"]::before');
    expect(profileTargets).toContain("--lx-header-profile-touch-target: 48px;");

    expect(reminderEntry).toContain("@media (min-width: 720px)");
    expect(reminderEntry).toContain(".lx-route-reminder-entry > summary {\n    position: relative;\n    pointer-events: none;");
    expect(reminderEntry).toContain(".lx-route-reminder-entry > summary::before {");
    expect(reminderEntry).toContain("inset-block: -1px;");
    expect(reminderEntry).toContain("inset-inline-start: -17px;");
    expect(reminderEntry).toContain("inset-inline-end: 15px;");
    expect(reminderEntry).toContain("pointer-events: auto;");
    expect(reminderEntry).toContain("right: max(150px, calc((100vw - 1540px) / 2 + 150px));");
    expect(reminderEntry).not.toContain("transform:");
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
      expect(command).toContain("e2e/header-streak-touch-targets.spec.ts");
      expect(command.match(/e2e\/header-streak-touch-targets\.spec\.ts/g)).toHaveLength(1);
      expect(command).toContain("e2e/header-profile-touch-targets.spec.ts");
    }
  });
});