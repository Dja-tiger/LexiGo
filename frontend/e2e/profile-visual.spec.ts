import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function openStableProfile(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await installAppearance(page, appearance);
  await page.goto("/profile", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-route-client-island="profile"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
  await expect(page.getByText("12 из 30 ответов сегодня", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);

  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function expectProfileScreenshot(page: Page, name: string): Promise<void> {
  await expect(page).toHaveScreenshot(name, {
    fullPage: false,
  });
}

test.describe("Profile Figma visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  for (const appearance of ["light", "dark"] as const) {
    test(`compact ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-compact", "390×844 Figma Profile baseline only");
      const runtimeErrors = captureRuntimeErrors(page);
      await openStableProfile(page, appearance);
      await expectProfileScreenshot(page, `profile-compact-${appearance}.png`);
      expect(runtimeErrors).toEqual([]);
    });

    test(`desktop ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-desktop", "1440×1024 Figma Profile baseline only");
      const runtimeErrors = captureRuntimeErrors(page);
      await page.setViewportSize({ width: 1440, height: 1024 });
      await openStableProfile(page, appearance);
      await expectProfileScreenshot(page, `profile-desktop-${appearance}.png`);
      expect(runtimeErrors).toEqual([]);
    });
  }
});
