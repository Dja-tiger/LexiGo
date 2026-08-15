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
  alternateSha256?: string;
}> = {
  "compact-light": {
    figmaNode: "79:6",
    sha256: "9c215d2ae5c190bbd368e86a0170a08d5f8f303bbd45ba147cde84b42b99f8e0",
    alternateSha256: "3f6d23a5dc52a46214b7e0e493af54e76020d66d126de5224f3cb69048abf448",
  },
  "compact-dark": {
    figmaNode: "79:6",
    sha256: "6ed95c3be8e78700a8b6980eb613a93a58b4a4e6846accc5d4bc6ef50eb71744",
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
  const approvedSha256 = baseline.alternateSha256
    ? [baseline.sha256, baseline.alternateSha256]
    : [baseline.sha256];
  expect(
    approvedSha256,
    `Profile ${baselineName} changed from the manually reviewed Figma ${baseline.figmaNode} Linux baseline`,
  ).toContain(actualSha256);
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

test.describe("Profile canonical Figma parity", () => {
  type CanonicalProfileCase = {
    name: string;
    width: number;
    height: number;
    appearance: ExplicitAppearance;
    canvas: "#f4f7f5" | "#10211d";
    figmaNode: "79:6" | "79:129";
    designContract: string;
    project: "visual-compact" | "visual-desktop";
    expectedNavigation: "mobile" | "rail";
  };

  const canonicalCases: readonly CanonicalProfileCase[] = [
    {
      name: "mobile Light",
      width: 390,
      height: 844,
      appearance: "light",
      canvas: "#f4f7f5",
      figmaNode: "79:6",
      designContract: "Figma 79:6 — mobile Profile Light",
      project: "visual-compact",
      expectedNavigation: "mobile",
    },
    {
      name: "mobile Dark",
      width: 390,
      height: 844,
      appearance: "dark",
      canvas: "#10211d",
      figmaNode: "79:6",
      designContract: "Figma 79:6 — mobile Profile Dark token-derived state",
      project: "visual-compact",
      expectedNavigation: "mobile",
    },
    {
      name: "desktop Light",
      width: 1440,
      height: 1024,
      appearance: "light",
      canvas: "#f4f7f5",
      figmaNode: "79:129",
      designContract: "Figma 79:129 — desktop Profile Light",
      project: "visual-desktop",
      expectedNavigation: "rail",
    },
    {
      name: "desktop Dark",
      width: 1440,
      height: 1024,
      appearance: "dark",
      canvas: "#10211d",
      figmaNode: "79:129",
      designContract: "Figma 79:129 — desktop Profile Dark token-derived state",
      project: "visual-desktop",
      expectedNavigation: "rail",
    },
  ] as const;

  async function expectNoHorizontalOverflow(page: Page): Promise<void> {
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    expect(
      dimensions.contentWidth,
      `Profile must not overflow horizontally: viewport=${dimensions.viewportWidth}px, content=${dimensions.contentWidth}px`,
    ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  }

  async function expectCanonicalProfile(
    page: Page,
    canonicalCase: CanonicalProfileCase,
  ): Promise<string> {
    const url = new URL(page.url());
    expect(url.pathname).toBe("/profile");
    expect(url.search).toBe("");

    const island = page.locator('[data-route-client-island="profile"]');
    const main = page.locator('#lexigo-main-content[aria-label="Профиль"]');
    const visibleNavigation = page.locator("[data-route-navigation]:visible");

    await expect(island).toHaveCount(1);
    await expect(island).toBeVisible();
    await expect(main).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();

    await expect(page.getByRole("heading", { level: 2, name: "Quality Gates", exact: true })).toBeVisible();
    await expect(page.getByText("quality-gates@example.com", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Параметры практики", exact: true })).toBeVisible();
    await expect(page.getByText("12 из 30 ответов сегодня", { exact: true })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Дневная цель", exact: true })).toBeVisible();
    await expect(page.getByText("Напоминания", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Настроить", exact: true })).toBeEnabled();
    await expect(page.getByRole("heading", { level: 2, name: "Интерфейс и устройство", exact: true })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Оформление приложения", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Безопасность и конфиденциальность", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Пароль и активные устройства/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /Email аккаунта/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /Скачать мои данные/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /Удалить аккаунт/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Выйти", exact: true })).toBeEnabled();

    const appearanceRadioName = canonicalCase.appearance === "light"
      ? "Светлая: Всегда светлая"
      : "Тёмная: Всегда тёмная";
    await expect(page.getByRole("radio", { name: appearanceRadioName, exact: true })).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", canonicalCase.appearance);
    await expect(page.locator("html")).toHaveAttribute(
      "data-lexigo-resolved-appearance",
      canonicalCase.appearance,
    );
    const canvas = await page.locator("html").evaluate((element) => (
      window.getComputedStyle(element).getPropertyValue("--ak-color-canvas").trim()
    ));
    expect(canvas).toBe(canonicalCase.canvas);

    await expect(visibleNavigation).toHaveCount(1);
    const navigation = await visibleNavigation.getAttribute("data-route-navigation");
    expect(navigation).toBe(canonicalCase.expectedNavigation);
    await expectNoHorizontalOverflow(page);

    return navigation ?? "";
  }

  test.describe.configure({ timeout: 90_000 });

  for (const canonicalCase of canonicalCases) {
    test(`${canonicalCase.name} uses canonical Profile ownership (${canonicalCase.designContract})`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== canonicalCase.project,
        `Canonical ${canonicalCase.name} Profile Figma parity runs only in ${canonicalCase.project}.`,
      );

      testInfo.annotations.push({
        type: "figma",
        description: `${canonicalCase.figmaNode}: ${canonicalCase.designContract}`,
      });

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installDeterministicRuntime(page);
      await installQualityGateAPI(context);
      await installAppearance(page, canonicalCase.appearance);
      const runtimeErrors = captureRuntimeErrors(page);

      await page.goto("/profile", { waitUntil: "domcontentloaded" });
      const initialNavigation = await expectCanonicalProfile(page, canonicalCase);

      await page.reload({ waitUntil: "domcontentloaded" });
      const reloadedNavigation = await expectCanonicalProfile(page, canonicalCase);
      expect(reloadedNavigation).toBe(initialNavigation);
      expect(runtimeErrors).toEqual([]);

      await testInfo.attach("profile-canonical-runtime.json", {
        body: Buffer.from(JSON.stringify({
          figmaNode: canonicalCase.figmaNode,
          designContract: canonicalCase.designContract,
          viewport: { width: canonicalCase.width, height: canonicalCase.height },
          appearance: canonicalCase.appearance,
          canvas: canonicalCase.canvas,
          path: "/profile",
          navigation: initialNavigation,
        }, null, 2)),
        contentType: "application/json",
      });
    });
  }
});
