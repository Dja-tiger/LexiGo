import { createHash } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";
type ProfileVisualBaseline = "compact-light" | "compact-dark" | "desktop-light" | "desktop-dark";

const PROFILE_VISUAL_BASELINES: Record<ProfileVisualBaseline, {
  figmaNode: "79:6" | "79:129";
  sha256: string;
}> = {
  "compact-light": {
    figmaNode: "79:6",
    sha256: "e89a8d931de7854a56235bff661afe23317505333dc9671d392076c76bd8198c",
  },
  "compact-dark": {
    figmaNode: "79:6",
    sha256: "ecea257dca01358a66be1078938b202f7ad8194baeae80cb43c45d8ebcefa92d",
  },
  "desktop-light": {
    figmaNode: "79:129",
    sha256: "3da62f1cd51197f7b10ab5ec6cf51fc3c6f6d9503f2ea8d40fdc5ff1518816b1",
  },
  "desktop-dark": {
    figmaNode: "79:129",
    sha256: "f5670eaaa3ca527f081698c7629bd0c96de9117553fe9b16ff97739c191010ae",
  },
};

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

async function expectApprovedProfileBaseline(
  page: Page,
  testInfo: TestInfo,
  baselineName: ProfileVisualBaseline,
): Promise<void> {
  const baseline = PROFILE_VISUAL_BASELINES[baselineName];
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
  });
  await testInfo.attach(`profile-${baselineName}.png`, {
    body: screenshot,
    contentType: "image/png",
  });

  const actualSha256 = createHash("sha256").update(screenshot).digest("hex");
  expect(
    actualSha256,
    `Profile ${baselineName} changed from the manually reviewed Figma ${baseline.figmaNode} Linux baseline`,
  ).toBe(baseline.sha256);
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
      await expectApprovedProfileBaseline(page, testInfo, `compact-${appearance}`);
      expect(runtimeErrors).toEqual([]);
    });

    test(`desktop ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-desktop", "1440×1024 Figma Profile baseline only");
      const runtimeErrors = captureRuntimeErrors(page);
      await page.setViewportSize({ width: 1440, height: 1024 });
      await openStableProfile(page, appearance);
      await expectApprovedProfileBaseline(page, testInfo, `desktop-${appearance}`);
      expect(runtimeErrors).toEqual([]);
    });
  }
});
