import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/connectivity-touch-targets.css", import.meta.url), "utf8");
const systemStates = readFileSync(new URL("../app/system-states.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const calendarEntry = readFileSync(new URL("../app/calendar-reminder-entry.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./review-outbox-runtime.tsx", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 connectivity action touch-target ownership", () => {
  it("loads one narrow owner after canonical system-state geometry", () => {
    expect(layout).toContain('import "./connectivity-touch-targets.css";');
    expect(layout.indexOf('import "./system-states.css";'))
      .toBeLessThan(layout.indexOf('import "./connectivity-touch-targets.css";'));
    expect(layout.indexOf('import "./connectivity-touch-targets.css";'))
      .toBeLessThan(layout.indexOf('import "./active-lesson-queued-state.css";'));
    expect(layout.match(/connectivity-touch-targets\.css/g)).toHaveLength(1);
    expect(layout).not.toContain('import "./header-touch-targets.css";');
  });

  it("expands only the live action block axis to 44px fine and 48px coarse", () => {
    expect(touchTargets).toContain("--lx-connectivity-action-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-connectivity-action-touch-target: 48px;");
    expect(touchTargets).toContain(".lx-system-connectivity .lx-review-sync__actions > button::before");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("calc((100% - var(--lx-connectivity-action-touch-target)) / 2)");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
  });

  it("preserves visible button geometry and introduces no painted output", () => {
    expect(systemStates).toContain(".lx-review-sync button,\n.lx-connectivity-panel button {\n  min-height: 40px;");
    expect(systemStates).toContain("body:has(.lx-active-lesson) .lx-review-sync__actions button {\n    min-height: 36px;");
    expect(touchTargets).not.toContain("min-height:");
    expect(touchTargets).not.toContain("width:");
    expect(touchTargets).not.toContain("transform:");
    expect(touchTargets).not.toContain("background:");
    expect(touchTargets).not.toContain("border:");
    expect(touchTargets).not.toContain("box-shadow:");
  });

  it("maps the live ReviewOutbox action and rejects the hidden legacy reminder", () => {
    expect(runtime).toContain('className="lx-review-sync__actions"');
    expect(runtime).toContain('{detailsOpen ? "Скрыть" : "Подробнее"}');
    expect(runtime).toContain('>Обновить состояние</button>');
    expect(runtime).toContain('>Повторить сейчас</button>');
    expect(calendarEntry).toContain(".lx-routed-app .lx-header-tools > .lx-icon-button {");
    expect(calendarEntry).toContain("display: none !important;");
    expect(touchTargets).not.toContain("lx-icon-button");
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
      expect(command).toContain("e2e/connectivity-touch-targets.spec.ts");
      expect(command.match(/e2e\/connectivity-touch-targets\.spec\.ts/g)).toHaveLength(1);
      expect(command).not.toContain("e2e/header-touch-targets.spec.ts");
    }
  });
});
