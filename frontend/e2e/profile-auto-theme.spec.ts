import { createHash } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  captureRuntimeErrors,
  installQualityGateAPI,
} from "./support/quality-gates";

type ResolvedAppearance = "light" | "dark";

type ThemeSnapshot = {
  preference: string | undefined;
  resolved: string | undefined;
  canvasToken: string;
  surfaceToken: string;
  subtleToken: string;
  htmlBackground: string;
  htmlBackgroundImage: string;
  bodyBackground: string;
  bodyBackgroundImage: string;
  accountBackground: string;
  accountColor: string;
  accountCardBackground: string;
  viewportWidth: number;
  documentWidth: number;
};

const AUTO_LIGHT_430_BASELINE = {
  width: 430,
  height: 932,
  sha256: "2f0740a996c7198811e66dd77a8d5a845d4ca285d9a6f4350ae74e3635c98b35",
  sourceRun: 32141138160,
  sourceHeadSha: "03832a62e2bfe064cabce6dc81fe333e8af6dd80",
} as const;

function normalizeHexColorToken(value: string): string {
  const normalized = value.trim().toLowerCase();
  const shorthand = normalized.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (!shorthand) return normalized;
  return `#${shorthand[1]}${shorthand[1]}${shorthand[2]}${shorthand[2]}${shorthand[3]}${shorthand[3]}`;
}

function isReviewRequiredFingerprint(value: string): boolean {
  return value === "REVIEW_REQUIRED";
}

async function installAutoPreference(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("lexigo.appearance.v1", "auto");
  });
}

async function setSystemAppearance(page: Page, colorScheme: ResolvedAppearance): Promise<void> {
  await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
}

function accountSecurityRegion(page: Page) {
  return page.getByRole("region", { name: "Пароль и активные устройства", exact: true });
}

async function openProfile(page: Page): Promise<void> {
  await page.goto("/profile", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-route-client-island="profile"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
  await expect(accountSecurityRegion(page)).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function readThemeSnapshot(page: Page): Promise<ThemeSnapshot> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const account = document.querySelector<HTMLElement>(".lx-account-security");
    const accountCard = document.querySelector<HTMLElement>(".lx-account-card");
    if (!account || !accountCard) throw new Error("Profile account compatibility owners are not mounted");

    const rootStyle = getComputedStyle(root);
    const bodyStyle = getComputedStyle(document.body);
    const accountStyle = getComputedStyle(account);
    const accountCardStyle = getComputedStyle(accountCard);

    return {
      preference: root.dataset.lexigoAppearance,
      resolved: root.dataset.lexigoResolvedAppearance,
      canvasToken: rootStyle.getPropertyValue("--ak-color-canvas").trim(),
      surfaceToken: rootStyle.getPropertyValue("--ak-color-surface").trim(),
      subtleToken: rootStyle.getPropertyValue("--ak-color-subtle").trim(),
      htmlBackground: rootStyle.backgroundColor,
      htmlBackgroundImage: rootStyle.backgroundImage,
      bodyBackground: bodyStyle.backgroundColor,
      bodyBackgroundImage: bodyStyle.backgroundImage,
      accountBackground: accountStyle.backgroundColor,
      accountColor: accountStyle.color,
      accountCardBackground: accountCardStyle.backgroundColor,
      viewportWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
    };
  });
}

async function expectResolvedTheme(page: Page, expected: ResolvedAppearance): Promise<ThemeSnapshot> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", "auto");
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", expected);

  const snapshot = await readThemeSnapshot(page);
  expect(snapshot.preference).toBe("auto");
  expect(snapshot.resolved).toBe(expected);
  expect(snapshot.viewportWidth).toBe(430);
  expect(snapshot.documentWidth).toBeLessThanOrEqual(snapshot.viewportWidth + 1);
  expect(snapshot.htmlBackgroundImage).toBe("none");
  expect(snapshot.bodyBackgroundImage).toBe("none");

  if (expected === "light") {
    expect(normalizeHexColorToken(snapshot.canvasToken)).toBe("#f4f7f5");
    expect(normalizeHexColorToken(snapshot.surfaceToken)).toBe("#ffffff");
    expect(normalizeHexColorToken(snapshot.subtleToken)).toBe("#e6efeb");
    expect(snapshot.htmlBackground).toBe("rgb(244, 247, 245)");
    expect(snapshot.bodyBackground).toBe("rgb(244, 247, 245)");
    expect(snapshot.accountBackground).toBe("rgb(255, 255, 255)");
    expect(snapshot.accountCardBackground).toBe("rgb(230, 239, 235)");
    expect(snapshot.accountColor).toBe("rgb(16, 33, 29)");
  } else {
    expect(normalizeHexColorToken(snapshot.canvasToken)).toBe("#10211d");
    expect(normalizeHexColorToken(snapshot.surfaceToken)).toBe("#18302b");
    expect(snapshot.htmlBackground).toBe("rgb(16, 33, 29)");
    expect(snapshot.bodyBackground).toBe("rgb(16, 33, 29)");
    expect(snapshot.accountBackground).not.toBe("rgb(255, 255, 255)");
    expect(snapshot.accountCardBackground).not.toBe("rgb(230, 239, 235)");
    expect(snapshot.accountColor).not.toBe("rgb(16, 33, 29)");
  }

  return snapshot;
}

async function captureReviewedLightEvidence(page: Page, testInfo: TestInfo): Promise<void> {
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
  });
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };

  await testInfo.attach("profile-auto-system-light-430x932-webkit.png", {
    body: screenshot,
    contentType: "image/png",
  });
  await testInfo.attach("profile-auto-system-light-430x932-webkit.json", {
    body: Buffer.from(JSON.stringify({
      issue: 593,
      browser: "ios-webkit",
      viewport: { width: 430, height: 932 },
      preference: "auto",
      systemAppearance: "light",
      actual,
      approved: AUTO_LIGHT_430_BASELINE,
    }, null, 2)),
    contentType: "application/json",
  });

  if (isReviewRequiredFingerprint(AUTO_LIGHT_430_BASELINE.sha256)) {
    throw new Error(`Profile Auto/system-Light 430×932 REVIEW_REQUIRED exact Linux WebKit evidence ${JSON.stringify(actual)}`);
  }

  expect(actual).toEqual({
    width: AUTO_LIGHT_430_BASELINE.width,
    height: AUTO_LIGHT_430_BASELINE.height,
    sha256: AUTO_LIGHT_430_BASELINE.sha256,
  });
}

test.describe("Issue #593 Profile Auto resolved-theme ownership", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installQualityGateAPI(context);
    await installAutoPreference(page);
    await page.setViewportSize({ width: 430, height: 932 });
  });

  test("430px Auto follows system Light across entry, reload and browser history", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ios-webkit", "Issue #593 requires real WebKit Auto/system ownership proof");

    const runtimeErrors = captureRuntimeErrors(page);
    await setSystemAppearance(page, "light");
    await openProfile(page);
    await expectResolvedTheme(page, "light");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
    await expect(accountSecurityRegion(page)).toBeVisible();
    await expectResolvedTheme(page, "light");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", "light");
    await page.getByRole("button", { name: "Открыть профиль" }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/profile");
    await expect(accountSecurityRegion(page)).toBeVisible();
    await expectResolvedTheme(page, "light");

    await page.goBack();
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", "light");
    await page.goForward();
    await expect(page).toHaveURL((url) => url.pathname === "/profile");
    await expect(accountSecurityRegion(page)).toBeVisible();
    await expectResolvedTheme(page, "light");

    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo({ top: 0, behavior: "auto" });
    });
    await page.waitForTimeout(100);
    expect(runtimeErrors).toEqual([]);
    await captureReviewedLightEvidence(page, testInfo);
  });

  test("430px Auto follows system Dark at bootstrap and reacts to system changes without reload", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ios-webkit", "Issue #593 requires real WebKit Auto/system ownership proof");

    const runtimeErrors = captureRuntimeErrors(page);
    await setSystemAppearance(page, "dark");
    await openProfile(page);
    await expectResolvedTheme(page, "dark");

    await setSystemAppearance(page, "light");
    await expectResolvedTheme(page, "light");

    await setSystemAppearance(page, "dark");
    await expectResolvedTheme(page, "dark");
    expect(runtimeErrors).toEqual([]);
  });
});
