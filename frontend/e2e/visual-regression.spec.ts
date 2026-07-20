import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

async function expectStableScreenshot(page: Page, name: string): Promise<void> {
  const dimensions = await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });

    const root = document.documentElement;
    return {
      viewportWidth: root.clientWidth,
      contentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
    };
  });

  expect(
    dimensions.contentWidth,
    `Страница не должна иметь горизонтальный overflow: viewport=${dimensions.viewportWidth}px, content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);

  await page.waitForTimeout(100);
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
  });
}

test.describe("critical visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("home", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();
    await expectStableScreenshot(page, "home.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson composer", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
    await expectStableScreenshot(page, "lesson-composer.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("dictionary", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Каталог слов и терминов" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Открыть карточку: rollback" })).toBeVisible();
    await expectStableScreenshot(page, "dictionary.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("progress", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Смотрите, что действительно сохранилось" })).toBeVisible();
    await expectStableScreenshot(page, "progress.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("calendar dialog", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Смотрите, что действительно сохранилось" })).toBeVisible();
    await page.getByRole("button", { name: "Настроить календарь" }).click();
    await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
    await expectStableScreenshot(page, "calendar-dialog.png");
    expect(runtimeErrors).toEqual([]);
  });
});
