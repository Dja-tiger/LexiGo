import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const focused = readFileSync(new URL("../app/issue-603-browser-zoom-reflow.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const routeNavigation = readFileSync(new URL("../app/route-navigation.css", import.meta.url), "utf8");
const adaptiveNavigation = readFileSync(new URL("../app/adaptive-navigation.css", import.meta.url), "utf8");
const semanticCompact = readFileSync(new URL("../app/adaptive-knowledge-coach-home.css", import.meta.url), "utf8");
const learningSwitch = readFileSync(new URL("../app/learning-section-switch.css", import.meta.url), "utf8");
const profileTablet = readFileSync(new URL("../app/profile-tablet-layout.css", import.meta.url), "utf8");
const reminder = readFileSync(new URL("../app/calendar-reminder-entry.css", import.meta.url), "utf8");
const visualConfig = readFileSync(new URL("../playwright.visual.config.ts", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/issue-603-browser-zoom-reflow.spec.ts", import.meta.url), "utf8");
const semanticBrowserProof = readFileSync(new URL("../e2e/issue-684-zoom-compact-semantic.spec.ts", import.meta.url), "utf8");
const learnBrowserZoom = readFileSync(new URL("../e2e/learn-browser-zoom.spec.ts", import.meta.url), "utf8");
const phrasesVisual = readFileSync(new URL("../e2e/phrases-visual.spec.ts", import.meta.url), "utf8");

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

  it("continues compact shell/RouteChrome only for the seven affected ordinary route families", () => {
    for (const pathToken of [
      '[data-route-path="/learn"]',
      '[data-route-path="/progress"]',
      '[data-route-path="/dictionary"]',
      '[data-route-path^="/words/"]',
      '[data-route-path="/phrases"]',
      '[data-route-path^="/phrases/"]',
      '[data-route-path="/profile"]',
    ]) {
      expect(focused).toContain(pathToken);
    }

    expect(focused).not.toContain('[data-route-path="/"]');
    expect(focused).not.toContain('[data-route-path="/lesson/active"]');
    expect(focused).not.toContain('[data-route-path="/onboarding"]');
    expect(focused).toContain("padding-bottom: calc(var(--lx-compact-navigation-height) + 28px + env(safe-area-inset-bottom));");
    expect(focused).toContain(".lx-app-shell {\n    display: block;");
    expect(focused).toContain(".lx-main-content {\n    min-width: 0;\n    margin-left: 0;");
    expect(focused).toContain(".lx-route-nav--header");
    expect(focused).toContain(".lx-route-nav--rail");
    expect(focused).toContain("display: none;");
    expect(focused).toContain(".lx-route-nav--mobile {");
    expect(focused).toContain("display: grid;");
    expect(focused).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
  });

  it("keeps the Issue #684 late compact owner aligned with current semantic compact presentation", () => {
    expect(semanticCompact).toContain("@media (max-width: 719px) {");
    for (const declaration of [
      "right: 0;",
      "bottom: 0;",
      "left: 0;",
      "min-height: calc(72px + env(safe-area-inset-bottom));",
      "grid-template-columns: repeat(4, minmax(0, 1fr));",
      "gap: 0;",
      "border-top: 1px solid var(--ak-border);",
      "border-radius: 0;",
      "background: color-mix(in srgb, var(--ak-surface) 96%, transparent);",
      "box-shadow: none;",
      "backdrop-filter: blur(18px);",
      "min-width: 44px;",
      "min-height: 54px;",
      "border-radius: 10px;",
      "color: var(--ak-text-muted);",
      "font-size: 11px;",
      "font-weight: 600;",
      "color: var(--ak-primary);",
      "background: transparent;",
    ]) {
      expect(semanticCompact, `canonical compact owner missing ${declaration}`).toContain(declaration);
      expect(focused, `720-767 continuation must mirror ${declaration}`).toContain(declaration);
    }

    expect(focused).toContain("Issue #684: preserve #603 compact ownership but use current semantic compact chrome.");
    for (const retiredPaint of [
      "rgba(126, 146, 185, 0.2)",
      "rgba(8, 14, 27, 0.96)",
      "#c1adff",
      "rgba(104, 75, 220, 0.19)",
    ]) {
      expect(focused, `retired compact paint must stay absent: ${retiredPaint}`).not.toContain(retiredPaint);
    }
  });

  it("resets route-specific rail reservations only inside the exact gap", () => {
    expect(learningSwitch).toContain("margin-left: calc(var(--lx-navigation-rail-width) + 48px);");
    expect(profileTablet).toContain("margin-left: calc(var(--lx-navigation-rail-width) + 20px);");

    expect(focused).toContain('html[data-lexigo-build] .lx-routed-app[data-route-path="/learn"] .lx-learning-section-switch--learn {');
    expect(focused).toContain("width: calc(100% - 48px);");
    expect(focused).toContain("margin-right: auto;\n    margin-left: auto;");
    expect(focused).toContain('html[data-lexigo-build] .lx-routed-app[data-route-path="/profile"] .lx-profile-app .lx-main-content {');
    expect(focused).toContain("width: min(1060px, 100%);");
  });

  it("keeps Phrases and Reminder on the same route-scoped compact geometry", () => {
    expect(focused).toContain('.lx-routed-app[data-route-path="/phrases"]');
    expect(focused).toContain('.lx-app[data-route-client-island="phrases"]');
    expect(focused).toContain("padding-right: max(14px, env(safe-area-inset-right));");
    expect(focused).toContain("padding-left: max(14px, env(safe-area-inset-left));");
    expect(focused).toContain(".lx-phrases-catalog {\n    padding-right: 0;\n    padding-left: 0;");

    expect(reminder).toContain("@media (min-width: 720px) and (max-width: 1099px) {");
    expect(focused).toContain(".lx-route-reminder-entry {");
    expect(focused).toContain("top: calc(10px + env(safe-area-inset-top));");
    expect(focused).toContain("pointer-events: auto;");
    expect(focused).toContain(".lx-route-reminder-entry > summary::before {");
    expect(focused).toContain("content: none;");
    expect(focused).toContain("clip-path: inset(50%);");
  });

  it("does not absorb the Home or focused-route repairs", () => {
    expect(focused).toContain("Home remains on its existing, independently");
    expect(focused).toContain("focused Active Lesson/Onboarding are #604/#605");
    expect(focused).not.toContain(".lx-active-lesson");
    expect(focused).not.toContain(".lx-first-use");
    expect(focused).not.toContain(".lx-onboarding");
  });

  it("routes the true browser-owned 720px proof through authoritative Visual CI and keeps it fail-closed", () => {
    expect(visualConfig.match(/"issue-603-browser-zoom-reflow\.spec\.ts"/g)).toHaveLength(1);
    expect(visualConfig.match(/"issue-684-zoom-compact-semantic\.spec\.ts"/g)).toHaveLength(1);
    expect(browserProof).toContain('testInfo.project.name !== "visual-desktop"');
    expect(browserProof).toContain('viewport: { width: 1440, height: 900 }');
    expect(browserProof).toContain("setBrowserZoom(worker, targetURL, 2)");
    expect(browserProof).toContain("cssVisualViewport.zoom");
    expect(browserProof).toContain("cssContentSize");
    expect(browserProof).toContain("window.innerWidth");
    expect(browserProof).toContain("toBe(720)");
    expect(browserProof).toContain('toEqual(["mobile"])');
    expect(browserProof).toContain("textOffenders");
    expect(browserProof).toContain('cdp.send("Page.captureScreenshot"');
    expect(browserProof).toContain("width: metrics.cssLayoutViewport.clientWidth * zoom");
    expect(browserProof).toContain("height: metrics.cssContentSize.height * zoom");
    expect(browserProof).toContain("scale: 1 / zoom");
    expect(browserProof).toContain('evidenceCapture: "cdp-normalized-dip"');
    expect(browserProof).not.toContain("page.screenshot({");
    expect(browserProof).toContain("REVIEW_REQUIRED");
    expect(browserProof).not.toContain("font-size: 200%");

    expect(semanticBrowserProof).toContain('testInfo.project.name !== "visual-desktop"');
    expect(semanticBrowserProof).toContain('viewport: { width: 1440, height: 900 }');
    expect(semanticBrowserProof).toContain("setBrowserZoom(worker, page.url(), 2)");
    expect(semanticBrowserProof).toContain("window.innerWidth");
    expect(semanticBrowserProof).toContain("toBe(720)");
    expect(semanticBrowserProof).toContain('[data-route-navigation="mobile"]');
    expect(semanticBrowserProof).toContain("getComputedStyle");
    expect(semanticBrowserProof).toContain("--ak-border");
    expect(semanticBrowserProof).toContain("--ak-surface");
    expect(semanticBrowserProof).toContain("--ak-text-muted");
    expect(semanticBrowserProof).toContain("--ak-primary");
  });

  it("keeps standalone Learn and Phrases zoom owners aligned with compact RouteChrome at exact 720px", () => {
    for (const source of [learnBrowserZoom, phrasesVisual]) {
      expect(source).toContain("await expect(railNavigation).toBeHidden();");
      expect(source).toContain("await expect(headerNavigation).toBeHidden();");
      expect(source).toContain("await expect(mobileNavigation).toBeVisible();");
      expect(source).toContain('name: "Мобильная навигация"');
      expect(source).not.toContain("await expect(railNavigation).toBeVisible();");
    }
  });
});
