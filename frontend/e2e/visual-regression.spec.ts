import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";
import {
  installActiveLessonFixture,
  openActiveLesson,
} from "./support/active-lesson-fixture";
import {
  completeRecallLesson,
  installLessonResultFixture,
} from "./support/lesson-result-fixture";

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
    await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();
    await expectStableScreenshot(page, "home.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson composer", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
    await expectStableScreenshot(page, "lesson-composer.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("dictionary", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Открыть карточку: rollback" })).toBeVisible();
    await expectStableScreenshot(page, "dictionary.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("progress", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".lx-progress-evidence").getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await expectStableScreenshot(page, "progress.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("calendar dialog", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".lx-progress-evidence").getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Настроить календарь" }).click();
    await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
    await expectStableScreenshot(page, "calendar-dialog.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson compact Recall default", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installActiveLessonFixture(page, "recall");
    await openActiveLesson(page);
    await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-state", "prompt");
    await expectStableScreenshot(page, "active-lesson-recall-default.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson medium Choice incorrect", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 768, "medium baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installActiveLessonFixture(page, "choice");
    await openActiveLesson(page);
    await page.getByRole("button", { name: "checkpoint", exact: true }).click();
    await page.getByRole("button", { name: "Не знал" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ответ не принят" })).toBeVisible();
    await expectStableScreenshot(page, "active-lesson-choice-incorrect.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson desktop Study", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installActiveLessonFixture(page, "study");
    await openActiveLesson(page);
    await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-mode", "study");
    await expectStableScreenshot(page, "active-lesson-study.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson desktop Recall correct Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop dark baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installActiveLessonFixture(page, "recall");
    await openActiveLesson(page);
    await page.getByRole("textbox", { name: "Введите ответ" }).fill("backlog");
    await page.getByRole("button", { name: "Сверить ответ" }).click();
    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ответ принят" })).toBeVisible();
    await expectStableScreenshot(page, "active-lesson-recall-correct-dark.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson result compact Next Block", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact result baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "next");
    await expectStableScreenshot(page, "lesson-result-next-compact.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson result desktop Due Review", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop result baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installLessonResultFixture(page, { previewTotal: 0, dueNow: 6 });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "due");
    await expectStableScreenshot(page, "lesson-result-due-desktop.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson result desktop Daily Goal Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop dark result baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installLessonResultFixture(page, {
      previewTotal: 1,
      reviewsBefore: 14,
      reviewsAfter: 15,
      dailyGoal: 15,
    });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "daily-goal");
    await expectStableScreenshot(page, "lesson-result-daily-goal-dark-desktop.png");
    expect(runtimeErrors).toEqual([]);
  });
});
