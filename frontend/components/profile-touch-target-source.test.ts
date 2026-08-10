import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/profile-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/profile.css", import.meta.url), "utf8");
const accountSecurity = readFileSync(new URL("../app/account-security.css", import.meta.url), "utf8");
const profile = readFileSync(new URL("./lexigo-profile-app.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/profile-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #460 Profile touch-target ownership", () => {
  it("loads one interaction-only owner immediately after Profile presentation", () => {
    const presentationImport = 'import "./profile.css";';
    const touchImport = 'import "./profile-touch-targets.css";';
    const nextOwnerImport = 'import "./system-states.css";';

    expect(layout).toContain(presentationImport);
    expect(layout).toContain(touchImport);
    expect(layout.indexOf(presentationImport)).toBeLessThan(layout.indexOf(touchImport));
    expect(layout.indexOf(touchImport)).toBeLessThan(layout.indexOf(nextOwnerImport));
    expect(layout.match(/import "\.\/profile-touch-targets\.css";/g)).toHaveLength(1);
  });

  it("keeps Profile paint in profile.css and expands only transparent hit ownership", () => {
    expect(presentation).toContain(
      ".lx-profile-secondary-button,\n.lx-profile-link-button,\n.lx-profile-goal-option,\n.lx-profile-appearance-option {\n  min-height: 42px;",
    );
    expect(presentation).toContain(
      ".lx-profile-goal-option,\n.lx-profile-appearance-option {\n  min-width: 44px;\n  min-height: 38px;",
    );
    expect(presentation).toContain(
      ".lx-profile-goal-options,\n.lx-profile-appearance-options {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n  gap: 6px;",
    );

    expect(touchTargets).toContain("--lx-profile-touch-target: 44px;");
    expect(touchTargets).toContain("--lx-profile-touch-target: 48px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-profile-touch-target)) / 2));");
    expect(touchTargets).toContain("inset-inline: min(0px, calc((100% - var(--lx-profile-touch-target)) / 2));");
    expect(touchTargets).toContain("background: transparent;");
    expect(touchTargets).toContain("border: 0;");
    expect(touchTargets).toContain("box-shadow: none;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");
    expect(touchTargets).not.toContain(".lx-profile-link-button");
    expect(touchTargets).not.toContain(":focus-visible");
    expect(touchTargets).not.toContain("min-height:");
    expect(touchTargets).not.toContain("min-width:");
    expect(touchTargets).not.toContain("padding:");
    expect(touchTargets).not.toContain("border-radius:");
    expect(touchTargets).not.toContain("transform:");
  });

  it("keeps compact account headings wrap-safe without changing their paint tokens", () => {
    const eyebrowSelector = ".lx-account-security-heading > div > span";
    const eyebrowRuleStart = accountSecurity.indexOf(`${eyebrowSelector} {`);
    const eyebrowRuleEnd = accountSecurity.indexOf("}", eyebrowRuleStart);
    const eyebrowRule = accountSecurity.slice(eyebrowRuleStart, eyebrowRuleEnd + 1);
    const headingSelector = ".lx-account-security h2";
    const headingRuleStart = accountSecurity.indexOf(`${headingSelector} {`);
    const headingRuleEnd = accountSecurity.indexOf("}", headingRuleStart);
    const headingRule = accountSecurity.slice(headingRuleStart, headingRuleEnd + 1);

    expect(eyebrowRuleStart).toBeGreaterThanOrEqual(0);
    expect(eyebrowRule).toContain("overflow-wrap: anywhere;");
    expect(eyebrowRule).toContain("font-size: 0.78rem;");
    expect(eyebrowRule).toContain("font-weight: 800;");
    expect(eyebrowRule).toContain("letter-spacing: 0.08em;");

    expect(headingRuleStart).toBeGreaterThanOrEqual(0);
    expect(headingRule).toContain("overflow-wrap: anywhere;");
    expect(headingRule).toContain("font-size: clamp(1.65rem, 4vw, 2.55rem);");
    expect(headingRule).toContain("letter-spacing: -0.04em;");

    expect(browserProof).toContain("ДАННЫЕ И КОНФИДЕНЦИАЛЬНОСТЬ");
    expect(browserProof).toContain("Пароль и активные устройства");
    expect(browserProof).toContain("overflowWrap");
  });

  it("targets the existing semantic Profile controls without changing their runtime owner", () => {
    expect(profile).toContain('className="lx-profile-secondary-button"');
    expect(profile).toContain('className="lx-profile-goal-option"');
    expect(profile).toContain('className="lx-profile-appearance-option"');
    expect(profile).toContain('role="radiogroup" aria-label="Дневная цель"');
    expect(profile).toContain('role="radiogroup" aria-label="Оформление приложения"');
    expect(profile).toContain('role="radio"');
    expect(profile).toContain("moveRovingSelection");
  });

  it("keeps real-hit cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";

    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/profile-touch-targets.spec.ts");
      expect(command.match(/e2e\/profile-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }

    expect(browserProof).toContain("Issue #460 Profile touch targets");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("document.elementFromPoint");
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("expectIndependent");
    expect(browserProof).toContain("window.matchMedia(\"(pointer: coarse)\")");
    expect(browserProof).toContain("width: 320");
    expect(browserProof).toContain("percent = 200");
    expect(browserProof).toContain('forcedColors: "active"');
    expect(browserProof).toContain("horizontal overflow:");
  });
});
