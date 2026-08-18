import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const appearance = readFileSync(new URL("../app/appearance.css", import.meta.url), "utf8");
const profile = readFileSync(new URL("../app/profile.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../lib/appearance-preference.ts", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/profile-auto-theme.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #593 Profile resolved-theme ownership", () => {
  it("keeps preference token overrides explicit while rendered canvas follows resolved appearance", () => {
    expect(appearance).toContain(':root[data-lexigo-appearance="light"] {');
    expect(appearance).toContain(':root[data-lexigo-appearance="dark"] {');

    expect(appearance).toContain('html[data-lexigo-resolved-appearance="light"],\nhtml[data-lexigo-resolved-appearance="dark"] {\n  background: var(--ak-color-canvas);');
    expect(appearance).toContain('html[data-lexigo-resolved-appearance="light"] body,\nhtml[data-lexigo-resolved-appearance="dark"] body {');
    expect(appearance).not.toContain('html[data-lexigo-appearance="light"] body');
    expect(appearance).not.toContain('html[data-lexigo-appearance="dark"] body');

    expect(runtime).toContain("root.dataset.lexigoAppearance = preference;");
    expect(runtime).toContain("root.dataset.lexigoResolvedAppearance = resolved;");
    expect(runtime).toContain("return window.matchMedia(APPEARANCE_DARK_QUERY);");
    expect(runtime).toContain('const mediaQuery = mediaQueryOrNull();');
  });

  it("bridges legacy Profile account paint from resolved Light without mutating its base owner", () => {
    const resolvedOwner = 'html[data-lexigo-resolved-appearance="light"] .lx-routed-app[data-route-path="/profile"]';

    for (const selector of [
      ".lx-account-security",
      ".lx-account-card",
      ".lx-session-row",
      ".lx-audit-list > div",
      ".lx-account-form input",
      ".lx-session-row > span.current",
      ".lx-session-row > span.other",
      ".lx-account-danger-card",
      ".lx-account-confirmation",
    ]) {
      expect(appearance).toContain(`${resolvedOwner} ${selector}`);
    }

    expect(profile).toContain('html[data-lexigo-appearance="light"] .lx-routed-app[data-route-path="/profile"] .lx-account-security');
    expect(appearance).toContain("background: var(--ak-color-surface);");
    expect(appearance).toContain("background: var(--ak-color-subtle);");
  });

  it("uses resolved Dark for Profile dark-only compatibility paint", () => {
    const resolvedDark = 'html[data-lexigo-resolved-appearance="dark"] .lx-routed-app[data-route-path="/profile"]';
    expect(appearance).toContain(`${resolvedDark} .lx-profile-initials,`);
    expect(appearance).toContain(`${resolvedDark} .lx-account-security .lx-button.primary {`);
    expect(appearance).not.toContain('html[data-lexigo-appearance="dark"] .lx-routed-app[data-route-path="/profile"]');
  });

  it("routes the real 430px Auto regression through blocking iOS WebKit UI CI", () => {
    const ui = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    expect(ui).toContain("e2e/profile-auto-theme.spec.ts");
    expect(ui.match(/e2e\/profile-auto-theme\.spec\.ts/g)).toHaveLength(1);

    expect(browserProof).toContain('testInfo.project.name !== "ios-webkit"');
    expect(browserProof).toContain("width: 430");
    expect(browserProof).toContain("height: 932");
    expect(browserProof).toContain('localStorage.setItem("lexigo.appearance.v1", "auto")');
    expect(browserProof).toContain('page.emulateMedia({ colorScheme, reducedMotion: "reduce" })');
    expect(browserProof).toContain('await setSystemAppearance(page, "light");');
    expect(browserProof).toContain('await setSystemAppearance(page, "dark");');
    expect(browserProof).toContain("data-lexigo-resolved-appearance");
    expect(browserProof).toContain("backgroundImage");
    expect(browserProof).toContain("page.goBack()");
    expect(browserProof).toContain("page.goForward()");
    expect(browserProof).toContain("REVIEW_REQUIRED");
  });
});
