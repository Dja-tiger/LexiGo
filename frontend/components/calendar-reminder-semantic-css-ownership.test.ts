import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const calendarCSS = readFileSync(new URL("../app/calendar-reminders.css", import.meta.url), "utf8");
const designTokens = readFileSync(new URL("../app/design-tokens.css", import.meta.url), "utf8");
const appearance = readFileSync(new URL("../app/appearance.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/calendar-dialog-appearance.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const REQUIRED_COLOR_TOKENS = [
  "--ak-color-canvas",
  "--ak-color-surface",
  "--ak-color-subtle",
  "--ak-color-primary",
  "--ak-color-primary-soft",
  "--ak-color-retained",
  "--ak-color-text-main",
  "--ak-color-text-muted",
] as const;

const REQUIRED_ELEVATION_TOKENS = [
  "--ak-elevation-2",
  "--ak-elevation-3",
] as const;

describe("Issue #695 Calendar reminder semantic CSS ownership", () => {
  it("keeps one globally loaded Calendar owner on the canonical appearance token graph", () => {
    expect(layout.match(/import "\.\/calendar-reminders\.css";/g)).toHaveLength(1);
    expect(layout.match(/import "\.\/design-tokens\.css";/g)).toHaveLength(1);
    expect(layout.match(/import "\.\/appearance\.css";/g)).toHaveLength(1);

    for (const token of REQUIRED_COLOR_TOKENS) {
      expect(designTokens).toContain(`${token}:`);
      expect(appearance).toContain(`${token}:`);
      expect(calendarCSS).toContain(`var(${token})`);
    }
    for (const token of REQUIRED_ELEVATION_TOKENS) {
      expect(designTokens).toContain(`${token}:`);
      expect(appearance).toContain(`${token}:`);
      expect(calendarCSS).toContain(`var(${token})`);
    }
  });

  it("rejects the pre-Foundation fixed Calendar palette and forced dark native controls", () => {
    expect(calendarCSS).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(calendarCSS).not.toContain("rgba(");
    expect(calendarCSS).not.toContain("color-scheme: dark");
    expect(calendarCSS).toContain("color-scheme: inherit");
  });

  it("binds the opened dialog and representative child surfaces to semantic owners", () => {
    expect(calendarCSS).toContain(".lx-calendar-modal {");
    expect(calendarCSS).toContain("color: var(--ak-color-text-main);");
    expect(calendarCSS).toContain("var(--ak-color-surface);");
    expect(calendarCSS).toContain("box-shadow: var(--ak-elevation-3);");

    expect(calendarCSS).toContain(".lx-calendar-form-grid input,\n.lx-calendar-form-grid select {");
    expect(calendarCSS).toContain("background: var(--ak-color-surface);");
    expect(calendarCSS).toContain("border-color: var(--ak-color-primary);");

    expect(calendarCSS).toContain(".lx-calendar-weekdays button.selected {");
    expect(calendarCSS).toContain("background: var(--ak-color-primary-soft);");

    expect(calendarCSS).toContain(".lx-calendar-provider-grid .google > span {");
    expect(calendarCSS).toContain(".lx-calendar-provider-grid .apple > span {");
    expect(calendarCSS).toContain(".lx-calendar-status {");
    expect(calendarCSS).toContain("color: var(--ak-color-retained);");
  });

  it("keeps the semantic computed-style proof in blocking UI CI", () => {
    const ui = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    expect(ui).toContain("e2e/calendar-dialog-appearance.spec.ts");
    expect(ui.match(/e2e\/calendar-dialog-appearance\.spec\.ts/g)).toHaveLength(1);

    expect(browserProof).toContain('"light"');
    expect(browserProof).toContain('"dark"');
    expect(browserProof).toContain("getComputedStyle");
    expect(browserProof).toContain("--ak-color-surface");
    expect(browserProof).toContain("--ak-color-primary-soft");
    expect(browserProof).toContain("colorScheme");
    expect(browserProof).toContain("documentWidth");
    expect(browserProof).toContain("geometry");
    expect(browserProof).not.toContain("waitForTimeout");
  });
});
