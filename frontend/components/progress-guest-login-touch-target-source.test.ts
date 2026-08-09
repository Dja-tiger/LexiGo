import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/progress-guest-login-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/premium-ui.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./lexigo-progress-app.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/progress-guest-login-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 Progress guest login touch-target ownership", () => {
  it("loads one route-scoped interaction layer after Progress presentation owners", () => {
    const progressLayoutImport = 'import "./progress-evidence-layout.css";';
    const touchImport = 'import "./progress-guest-login-touch-targets.css";';

    expect(layout).toContain(touchImport);
    expect(layout.indexOf(progressLayoutImport)).toBeLessThan(layout.indexOf(touchImport));
    expect(layout.indexOf(touchImport)).toBeLessThan(layout.indexOf('import "./scenario-catalog.css";'));
    expect(layout.match(/progress-guest-login-touch-targets\.css/g)).toHaveLength(1);
  });

  it("proves the canonical guest Progress runtime and authentication callback", () => {
    expect(runtime).toContain('aria-label={viewTitle("progress")}');
    expect(runtime).toContain('<section className="lx-empty">');
    expect(runtime).toContain('className="lx-button primary"');
    expect(runtime).toContain("Войти и открыть прогресс");
    expect(runtime).toContain('router.push("/profile?session=required&return_to=%2Fprogress", { scroll: false });');
  });

  it("preserves the painted 44px button and expands only transparent block-axis hit ownership", () => {
    expect(presentation).toContain(".lx-button {\n  display: inline-flex;\n  min-height: 44px;");
    expect(presentation).toContain(".lx-empty .lx-button { width: fit-content; margin: 24px auto 0; }");
    expect(touchTargets).toContain('.lx-main-content[aria-label="Прогресс"] .lx-empty > .lx-button.primary');
    expect(touchTargets).toContain("--lx-progress-guest-login-touch-target: 44px;");
    expect(touchTargets).toContain("--lx-progress-guest-login-touch-target: 48px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-progress-guest-login-touch-target)) / 2));");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("background: transparent;");
    expect(touchTargets).toContain("border: 0;");
    expect(touchTargets).toContain("box-shadow: none;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("keeps the guest real-hit proof in blocking UI and accessibility collections", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";

    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/progress-guest-login-touch-targets.spec.ts");
      expect(command.match(/e2e\/progress-guest-login-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }

    expect(browserProof).toContain("Issue #74 Progress guest login touch target");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("await context.clearCookies();");
    expect(browserProof).toContain("installQualityGateAPI(context, { authenticated: false })");
    expect(browserProof).toContain("window.matchMedia(\"(pointer: coarse)\")");
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("return_to=%2Fprogress");
  });
});
