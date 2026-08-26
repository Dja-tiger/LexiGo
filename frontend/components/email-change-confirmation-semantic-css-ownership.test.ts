import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const confirmationCSS = readFileSync(new URL("../app/account-email.css", import.meta.url), "utf8");
const designTokens = readFileSync(new URL("../app/design-tokens.css", import.meta.url), "utf8");
const appearance = readFileSync(new URL("../app/appearance.css", import.meta.url), "utf8");
const profileCSS = readFileSync(new URL("../app/profile.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const routedShell = readFileSync(new URL("./routed-lexigo-app.tsx", import.meta.url), "utf8");
const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const component = readFileSync(new URL("./email-change-confirmation.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/account-email-change.spec.ts", import.meta.url), "utf8");
const visualProof = readFileSync(new URL("../e2e/profile-email-confirmation-visual.spec.ts", import.meta.url), "utf8");
const visualConfig = readFileSync(new URL("../playwright.visual.config.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const REQUIRED_TOKENS = [
  "--ak-color-surface",
  "--ak-color-subtle",
  "--ak-color-primary",
  "--ak-color-retained",
  "--ak-color-weak",
  "--ak-color-text-main",
  "--ak-color-text-muted",
  "--ak-elevation-2",
] as const;

const CONFIRMATION_SUCCESS_SELECTOR =
  '.lx-routed-app[data-route-path="/profile"] .lx-email-confirmation .lx-email-confirmation-card .lx-account-notice.success';
const CONFIRMATION_ERROR_SELECTOR =
  '.lx-routed-app[data-route-path="/profile"] .lx-email-confirmation .lx-email-confirmation-card .lx-account-notice.error';
const APPEARANCE_SUCCESS_SELECTOR =
  'html[data-lexigo-resolved-appearance="light"] .lx-routed-app[data-route-path="/profile"] .lx-account-notice.success';
const APPEARANCE_ERROR_SELECTOR =
  'html[data-lexigo-resolved-appearance="light"] .lx-routed-app[data-route-path="/profile"] .lx-account-notice.error';
const PROFILE_SUCCESS_SELECTOR =
  'html[data-lexigo-appearance="light"] .lx-routed-app[data-route-path="/profile"] .lx-account-notice.success';
const PROFILE_ERROR_SELECTOR =
  'html[data-lexigo-appearance="light"] .lx-routed-app[data-route-path="/profile"] .lx-account-notice.error';

function emailConfirmationPresentationBlock(): string {
  const start = confirmationCSS.indexOf(".lx-email-confirmation-card {");
  const end = confirmationCSS.indexOf("@media (max-width: 719px)", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return confirmationCSS.slice(start, end);
}

function classAndAttributeSpecificity(selector: string): number {
  return (selector.match(/\.[a-z0-9_-]+|\[[^\]]+\]/gi) ?? []).length;
}

describe("Issue #698 email confirmation semantic CSS ownership", () => {
  it("proves the bootstrap-owned confirmation is a Profile-island sibling inside the routed shell", () => {
    expect(layout.match(/import "\.\/account-email\.css";/g)).toHaveLength(1);
    expect(layout.match(/import "\.\/design-tokens\.css";/g)).toHaveLength(1);
    expect(layout.match(/import "\.\/appearance\.css";/g)).toHaveLength(1);

    const shellRender = routedShell.indexOf(
      '<div className="lx-routed-app" data-app-router-shell="true" data-route-path={pathname}>',
    );
    const bootstrapRenderInShell = routedShell.indexOf(
      "<LexigoBootstrappedApp pathname={pathname} onNavigateHome={navigateHome} />",
    );
    expect(shellRender).toBeGreaterThanOrEqual(0);
    expect(bootstrapRenderInShell).toBeGreaterThan(shellRender);

    const confirmationRender = bootstrap.indexOf(
      "<EmailChangeConfirmation onSessionInvalidated={handleEmailChanged} />",
    );
    const profileRender = bootstrap.indexOf("<LexigoProfileApp");
    expect(confirmationRender).toBeGreaterThanOrEqual(0);
    expect(profileRender).toBeGreaterThan(confirmationRender);

    expect(component).toContain('pathname !== "/profile"');
    expect(component).toContain('fragment.get("email_change_token")');
    expect(component).toContain("window.location.hash.replace");
    expect(component).not.toContain('searchParams.get("email_change_token")');
  });

  it("keeps confirmation paint on the Foundation semantic token graph", () => {
    const presentation = emailConfirmationPresentationBlock();

    for (const token of REQUIRED_TOKENS) {
      expect(designTokens).toContain(`${token}:`);
      expect(appearance).toContain(`${token}:`);
      expect(presentation).toContain(`var(${token})`);
    }

    expect(presentation).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(presentation).not.toContain("rgba(");
    expect(presentation).not.toContain("linear-gradient(");
    expect(presentation).not.toContain("color-scheme: dark");

    expect(presentation).toContain(".lx-email-confirmation-card .lx-button.primary {");
    expect(presentation).toContain(`${CONFIRMATION_SUCCESS_SELECTOR} {`);
    expect(presentation).toContain(`${CONFIRMATION_ERROR_SELECTOR} {`);
    expect(presentation).toContain("background: var(--ak-color-surface);");
    expect(presentation).toContain("background: var(--ak-color-primary);");
    expect(presentation).toContain("box-shadow: var(--ak-elevation-2);");
  });

  it("out-ranks the existing Profile compatibility status bridge without modifying that bridge", () => {
    expect(appearance).not.toContain(".lx-email-confirmation");
    expect(profileCSS).not.toContain(".lx-email-confirmation");

    expect(appearance).toContain(APPEARANCE_SUCCESS_SELECTOR);
    expect(appearance).toContain(APPEARANCE_ERROR_SELECTOR);
    expect(profileCSS).toContain(PROFILE_SUCCESS_SELECTOR);
    expect(profileCSS).toContain(PROFILE_ERROR_SELECTOR);

    expect(classAndAttributeSpecificity(CONFIRMATION_SUCCESS_SELECTOR)).toBeGreaterThan(
      classAndAttributeSpecificity(APPEARANCE_SUCCESS_SELECTOR),
    );
    expect(classAndAttributeSpecificity(CONFIRMATION_SUCCESS_SELECTOR)).toBeGreaterThan(
      classAndAttributeSpecificity(PROFILE_SUCCESS_SELECTOR),
    );
    expect(classAndAttributeSpecificity(CONFIRMATION_ERROR_SELECTOR)).toBeGreaterThan(
      classAndAttributeSpecificity(APPEARANCE_ERROR_SELECTOR),
    );
    expect(classAndAttributeSpecificity(CONFIRMATION_ERROR_SELECTOR)).toBeGreaterThan(
      classAndAttributeSpecificity(PROFILE_ERROR_SELECTOR),
    );
  });

  it("binds computed Light/Dark browser proof to blocking UI CI", () => {
    const ui = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    expect(ui).toContain("e2e/account-email-change.spec.ts");
    expect(ui.match(/e2e\/account-email-change\.spec\.ts/g)).toHaveLength(1);

    expect(browserProof).toContain("email confirmation follows explicit Light/Dark semantic paint without geometry drift");
    expect(browserProof).toContain('"light"');
    expect(browserProof).toContain('"dark"');
    expect(browserProof).toContain("getComputedStyle");
    expect(browserProof).toContain("--ak-color-surface");
    expect(browserProof).toContain("--ak-color-primary");
    expect(browserProof).toContain("--ak-color-retained");
    expect(browserProof).toContain("--ak-color-weak");
    expect(browserProof).toContain("geometry");
    expect(browserProof).toContain("documentWidth");
    expect(browserProof).toContain("#email_change_token=appearance-proof");
    expect(browserProof).not.toContain("waitForTimeout");
  });

  it("collects content-addressed Linux confirmation evidence in the authoritative Visual job", () => {
    expect(visualConfig).toContain('"profile-email-confirmation-visual.spec.ts"');
    expect(visualConfig.match(/profile-email-confirmation-visual\.spec\.ts/g)).toHaveLength(1);

    expect(visualProof).toContain('createHash("sha256")');
    expect(visualProof).toContain("fig_4305");
    expect(visualProof).toContain("fig_4157");
    expect(visualProof).toContain('"visual-compact"');
    expect(visualProof).toContain('"visual-desktop"');
    expect(visualProof).toContain("page.screenshot");
    expect(visualProof).toContain("profile-email-confirmation-");
    expect(visualProof).not.toContain("update-snapshots");
  });
});
