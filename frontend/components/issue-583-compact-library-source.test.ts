import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const focused = readFileSync(new URL("../app/issue-583-compact-library.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const adaptiveNavigation = readFileSync(new URL("../app/adaptive-navigation.css", import.meta.url), "utf8");
const phrases = readFileSync(new URL("../app/phrases.css", import.meta.url), "utf8");
const calendarReminder = readFileSync(new URL("../app/calendar-reminder-entry.css", import.meta.url), "utf8");
const lessonComposer = readFileSync(new URL("../app/adaptive-lesson-composer.css", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/issue-583-compact-library.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #583 compact library ownership", () => {
  it("loads one focused owner after the existing compact route styles", () => {
    expect(layout.match(/import "\.\/issue-583-compact-library\.css";/g)).toHaveLength(1);

    const phrasesIndex = layout.indexOf('import "./phrases.css";');
    const adaptiveIndex = layout.indexOf('import "./adaptive-navigation.css";');
    const reminderIndex = layout.indexOf('import "./calendar-reminder-entry.css";');
    const focusedIndex = layout.indexOf('import "./issue-583-compact-library.css";');

    expect(phrasesIndex).toBeGreaterThanOrEqual(0);
    expect(adaptiveIndex).toBeGreaterThan(phrasesIndex);
    expect(reminderIndex).toBeGreaterThan(adaptiveIndex);
    expect(focusedIndex).toBeGreaterThan(reminderIndex);
  });

  it("repairs only the 391-719px Phrases catalog continuation and preserves the reviewed 390px boundary", () => {
    expect(phrases).toContain('.lx-app[data-route-client-island="phrases"] {\n    width: 100%;\n    padding-right: 0;\n    padding-left: 0;');
    expect(phrases).toContain('padding: 20px 24px calc(112px + env(safe-area-inset-bottom));');
    expect(adaptiveNavigation).toContain('@media (max-width: 719px) {\n  .lx-app {');
    expect(adaptiveNavigation).toContain('padding-right: max(14px, env(safe-area-inset-right));');
    expect(adaptiveNavigation).toContain('padding-left: max(14px, env(safe-area-inset-left));');

    expect(focused).toContain('@media (min-width: 391px) and (max-width: 719px) {');
    expect(focused).toContain('.lx-routed-app[data-route-path="/phrases"]\n    .lx-app[data-route-client-island="phrases"] {');
    expect(focused).toContain('padding-right: max(14px, env(safe-area-inset-right));');
    expect(focused).toContain('padding-left: max(14px, env(safe-area-inset-left));');
    expect(focused).toContain('.lx-phrases-catalog {\n    padding-right: 0;\n    padding-left: 0;');
    expect(focused).not.toContain(".lx-phrase-detail");
    expect(focused).not.toContain("!important");
  });

  it("keeps the routed Reminder icon-only through the complete compact header range without changing semantics", () => {
    expect(calendarReminder).toContain('@media (max-width: 719px) {');
    expect(calendarReminder).toContain('right: max(68px, calc(env(safe-area-inset-right) + 68px));');
    expect(calendarReminder).toContain('@media (max-width: 390px) {\n  .lx-route-reminder-entry > summary > span {');

    expect(focused).toContain('@media (max-width: 719px) {\n  .lx-route-reminder-entry > summary > span {');
    expect(focused).toContain("clip-path: inset(50%);");
    expect(focused).toContain("white-space: nowrap;");
    expect(focused).not.toContain("display: none");
  });

  it("keeps Learn mode/source controls on semantic current-design tokens rather than restoring legacy paint", () => {
    expect(lessonComposer).toContain('--lx-green: var(--ak-color-retained);');
    expect(lessonComposer).toContain('--lx-blue: var(--ak-color-primary);');
    expect(lessonComposer).toContain('border-color: var(--ak-color-primary);');
    expect(lessonComposer).toContain('background: var(--ak-color-primary-soft);');
    expect(lessonComposer).toContain('color: var(--ak-color-text-main);');
  });

  it("routes the real 430px regression through blocking iOS WebKit UI CI", () => {
    const ui = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    expect(ui).toContain("e2e/issue-583-compact-library.spec.ts");
    expect(ui.match(/e2e\/issue-583-compact-library\.spec\.ts/g)).toHaveLength(1);

    expect(browserProof).toContain('testInfo.project.name !== "ios-webkit"');
    expect(browserProof).toContain("width: 430");
    expect(browserProof).toContain("height: 932");
    expect(browserProof).toContain("page.goBack()");
    expect(browserProof).toContain("page.goForward()");
    expect(browserProof).toContain("REVIEW_REQUIRED");
    expect(browserProof).toContain(".lx-catalog-kind-navigation");
    expect(browserProof).toContain(".lx-route-reminder-entry > summary");
    expect(browserProof).toContain(".lx-mode-selector > button.selected");
  });
});
