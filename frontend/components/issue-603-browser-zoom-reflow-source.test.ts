import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const focused = readFileSync(new URL("../app/issue-603-browser-zoom-reflow.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const routeNavigation = readFileSync(new URL("../app/route-navigation.css", import.meta.url), "utf8");
const adaptiveNavigation = readFileSync(new URL("../app/adaptive-navigation.css", import.meta.url), "utf8");
const learningSwitch = readFileSync(new URL("../app/learning-section-switch.css", import.meta.url), "utf8");
const profileTablet = readFileSync(new URL("../app/profile-tablet-layout.css", import.meta.url), "utf8");
const reminder = readFileSync(new URL("../app/calendar-reminder-entry.css", import.meta.url), "utf8");
const visualConfig = readFileSync(new URL("../playwright.visual.config.ts", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/issue-603-browser-zoom-reflow.spec.ts", import.meta.url), "utf8");

describe("Issue #603 exact 720px browser-zoom reflow ownership", () => {
  it("loads one late compatibility owner after Issue #583 and before feedback", () => {
    expect(layout.match(/import "\.\/issue-603-browser-zoom-reflow\.css";/g)).toHaveLength(1);

    const issue583Index = layout.indexOf('import "./issue-583-compact-library.css";');
    const issue603Index = layout.indexOf('import "./issue-603-browser-zoom-reflow.css";');
    const feedbackIndex = layout.indexOf('import "./feedback.css";');

    expect(issue583Index).toBeGreaterThanOrEqual(0);
    expect(issue603Index).toBeGreaterThan(issue583Index);
    expect(feedbackIndex).toBeGreaterThan(issue603Index);
  });

  it("limits the repair to the unreviewed 720-767px gap and preserves the 768px rail contract", () => {
    expect(routeNavigation).toContain("@media (min-width: 720px) and (max-width: 1099px) {");
    expect(routeNavigation).toContain("margin-left: calc(var(--lx-navigation-rail-width) + 20px);");
    expect(adaptiveNavigation).toContain("@media (max-width: 719px) {");
    expect(adaptiveNavigation).toContain("@media (min-width: 720px) and (max-width: 1099px) {");

    expect(focused).toContain("@media (min-width: 720px) and (max-width: 767px) {");
    expect(focused.match(/@media \(min-width: 720px\) and \(max-width: 767px\)/g)).toHaveLength(1);
    expect(focused).not.toContain("max-width: 768px");
    expect(focused).not.toContain("min-width: 768px");
    expect(focused).not.toContain("!important");
  });

  it("continues the compact shell and RouteChrome instead of reserving the tablet rail", () => {
    expect(focused).toContain("padding-bottom: calc(var(--lx-compact-navigation-height) + 28px + env(safe-area-inset-bottom));");
    expect(focused).toContain(".lx-app-shell {\n    display: block;");
    expect(focused).toContain(".lx-main-content {\n    min-width: 0;\n    margin-left: 0;");
    expect(focused).toContain(".lx-route-nav--header,\n  .lx-route-nav--rail {\n    display: none;");
    expect(focused).toContain(".lx-route-nav--mobile {");
    expect(focused).toContain("grid-template-columns: repeat(4, minmax(48px, 1fr));");
  });

  it("resets route-specific rail reservations only inside the exact gap", () => {
    expect(learningSwitch).toContain("margin-left: calc(var(--lx-navigation-rail-width) + 48px);");
    expect(profileTablet).toContain("margin-left: calc(var(--lx-navigation-rail-width) + 20px);");

    expect(focused).toContain('.lx-routed-app[data-route-path="/learn"] .lx-learning-section-switch--learn {');
    expect(focused).toContain("width: calc(100% - 48px);");
    expect(focused).toContain("margin-right: auto;\n    margin-left: auto;");
    expect(focused).toContain('.lx-routed-app[data-route-path="/profile"] .lx-profile-app .lx-main-content {');
    expect(focused).toContain("width: min(1060px, 100%);");
  });

  it("keeps Phrases and Reminder on the compact shared geometry", () => {
    expect(focused).toContain('.lx-routed-app[data-route-path="/phrases"]');
    expect(focused).toContain('.lx-app[data-route-client-island="phrases"]');
    expect(focused).toContain("padding-right: max(14px, env(safe-area-inset-right));");
    expect(focused).toContain("padding-left: max(14px, env(safe-area-inset-left));");
    expect(focused).toContain(".lx-phrases-catalog {\n    padding-right: 0;\n    padding-left: 0;");

    expect(reminder).toContain("@media (min-width: 720px) and (max-width: 1099px) {");
    expect(focused).toContain(".lx-route-reminder-entry {\n    top: calc(10px + env(safe-area-inset-top));");
    expect(focused).toContain("pointer-events: auto;");
    expect(focused).toContain(".lx-route-reminder-entry > summary::before {\n    content: none;");
    expect(focused).toContain("clip-path: inset(50%);");
  });

  it("does not absorb the focused-route repairs owned by Issues #604 and #605", () => {
    expect(focused).toContain(':not([data-route-path="/lesson/active"]):not([data-route-path="/onboarding"])');
    expect(focused).not.toContain(".lx-active-lesson");
    expect(focused).not.toContain(".lx-first-use");
    expect(focused).not.toContain(".lx-onboarding");
  });

  it("routes the true browser-owned 720px proof through authoritative Visual CI and keeps it fail-closed", () => {
    expect(visualConfig.match(/"issue-603-browser-zoom-reflow\.spec\.ts"/g)).toHaveLength(1);
    expect(browserProof).toContain('testInfo.project.name !== "visual-desktop"');
    expect(browserProof).toContain('viewport: { width: 1440, height: 900 }');
    expect(browserProof).toContain("setBrowserZoom(worker, targetURL, 2)");
    expect(browserProof).toContain("cssVisualViewport.zoom");
    expect(browserProof).toContain("window.innerWidth")).toBeDefined();
    expect(browserProof).toContain("toBe(720)");
    expect(browserProof).toContain('toEqual(["mobile"])');
    expect(browserProof).toContain("textOffenders");
    expect(browserProof).toContain("REVIEW_REQUIRED");
    expect(browserProof).not.toContain("font-size: 200%");
  });
});
