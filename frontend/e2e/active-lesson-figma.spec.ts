import { expect, test, type Page } from "@playwright/test";

import {
  installActiveLessonFixture,
  openActiveLesson,
  type ActiveLessonMode,
} from "./support/active-lesson-fixture";

function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1440) < 768;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.document,
    `horizontal overflow: viewport=${dimensions.viewport}px, document=${dimensions.document}px`,
  ).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function openMode(page: Page, mode: ActiveLessonMode) {
  const fixture = await installActiveLessonFixture(page, mode);
  await openActiveLesson(page);
  await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-mode", mode);
  return fixture;
}

test.describe("Issue #193 canonical Active Lesson", () => {
  test.describe.configure({ timeout: 60_000 });

  test("mobile Recall default follows the canonical prompt hierarchy", async ({ page }) => {
    test.skip(!isMobile(page), "mobile canonical state");
    await openMode(page, "recall");

    await expect(page.getByText("Воспроизведение", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Прогресс урока" })).toHaveAttribute("aria-valuetext", "1 из 3 элементов");
    await expect(page.getByRole("textbox", { name: "Введите ответ" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Варианты ответа" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Сверить ответ" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Не знал" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Почти" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeDisabled();
    await expect(page.locator(".lx-active-lesson__primary")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });

  test("keyboard Recall preserves objective answer and server review contracts", async ({ page }) => {
    const fixture = await openMode(page, "recall");
    const answer = page.getByRole("textbox", { name: "Введите ответ" });

    await answer.focus();
    await answer.fill("backlog");
    await answer.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ подготовлен" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeEnabled();

    await page.getByRole("button", { name: "Знал", exact: true }).focus();
    await page.getByRole("button", { name: "Знал", exact: true }).press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ принят" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Дальше" })).toBeFocused();

    await expect.poll(() => fixture.reviewRequests().length).toBe(1);
    expect(fixture.reviewRequests()[0]).toMatchObject({
      lessonVersion: 1,
      rating: "known",
      answerMode: "recall",
      answerRevealed: true,
      submittedAnswer: "backlog",
    });
  });

  test("Choice shows options immediately and announces incorrect/correct states beyond color", async ({ page }) => {
    const fixture = await openMode(page, "choice");

    await expect(page.getByRole("textbox", { name: "Введите ответ" })).toHaveCount(0);
    const choices = page.getByRole("group", { name: "Варианты ответа" }).getByRole("button");
    await expect(choices).toHaveCount(3);

    const wrong = page.getByRole("button", { name: "checkpoint", exact: true });
    await wrong.focus();
    await wrong.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ подготовлен" })).toBeFocused();

    await page.getByRole("button", { name: "Не знал" }).focus();
    await page.getByRole("button", { name: "Не знал" }).press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ не принят" })).toBeVisible();
    await expect(page.getByRole("button", { name: "checkpoint: выбран неверно" })).toBeVisible();
    await expect(page.getByRole("button", { name: "backlog: верный вариант" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Дальше" })).toBeFocused();

    expect(fixture.reviewRequests()[0]).toMatchObject({
      answerMode: "choice",
      answerRevealed: true,
      submittedAnswer: "checkpoint",
    });
  });

  test("desktop Study is explicit exposure and never submits an objective answer", async ({ page }) => {
    test.skip(isMobile(page), "desktop canonical Study frame");
    const fixture = await openMode(page, "study");

    await expect(page.getByText("Изучение", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The pipeline is delayed by a backlog in the ingestion stage." })).toBeVisible();
    await expect(page.getByText("Пайплайн задерживается из-за очереди на этапе загрузки.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeEnabled();

    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Изучение готово к сохранению" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Дальше" })).toBeVisible();

    const request = fixture.reviewRequests()[0];
    expect(request).toMatchObject({
      answerMode: "study",
      answerRevealed: true,
      rating: "known",
    });
    expect(request).not.toHaveProperty("submittedAnswer");
  });

  test("safe exit explains persistence and restores focus after cancellation", async ({ page }) => {
    await openMode(page, "recall");
    const exitTrigger = isMobile(page)
      ? page.getByRole("button", { name: "Закрыть", exact: true })
      : page.getByRole("button", { name: "Закрыть урок" });

    await exitTrigger.focus();
    await exitTrigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Закрыть урок?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Несохранённый ответ текущей карточки будет сброшен");
    await expect(page.getByRole("button", { name: "Продолжить урок", exact: true })).toBeFocused();

    await page.getByRole("button", { name: "Продолжить урок", exact: true }).press("Escape");
    await expect(dialog).toBeHidden();
    await expect(exitTrigger).toBeFocused();

    await exitTrigger.click();
    await page.getByRole("dialog", { name: "Закрыть урок?" })
      .getByRole("button", { name: "Сохранить и выйти", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".lx-active-lesson")).toHaveCount(0);
  });

  test("direct entry and reload restore the active server session without Home or Learn", async ({ page }) => {
    const fixture = await installActiveLessonFixture(page, "recall");
    await page.goto("/lesson/active", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Продолжить урок", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Продолжить урок", exact: true }).click();
    await expect(page.locator(".lx-active-lesson")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Продолжить урок", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Продолжить урок", exact: true }).click();
    await expect(page.locator(".lx-active-lesson")).toBeVisible();
    await expect.poll(fixture.activeRequests).toBeGreaterThanOrEqual(4);
    expect(fixture.reviewRequests()).toEqual([]);
  });

  test("browser Back opens safe exit instead of navigating or duplicating a submit", async ({ page }) => {
    const fixture = await openMode(page, "recall");
    await page.evaluate(() => {
      const activeState = window.history.state;
      const learnState = {
        lexigo: true,
        version: 1,
        target: { view: "learn" },
        scroll: { x: 0, y: 0 },
      };

      // Next.js patches the instance methods to synchronize App Router state.
      // Use the native prototype methods only to seed the adjacent entries;
      // the actual Browser Back below remains a real browser traversal.
      History.prototype.replaceState.call(window.history, learnState, "", "/learn");
      History.prototype.pushState.call(window.history, activeState, "", "/lesson/active");
    });
    await expect(page).toHaveURL(/\/lesson\/active$/);
    await expect(page.locator(".lx-active-lesson")).toBeVisible();

    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/lesson/active");
    await expect(page.getByRole("dialog", { name: "Закрыть урок?" })).toBeVisible();
    expect(fixture.reviewRequests()).toEqual([]);
  });

  test("minimum width and 200% page zoom do not introduce horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openMode(page, "recall");
    await page.evaluate(() => {
      document.body.style.setProperty("zoom", "2");
    });
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("textbox", { name: "Введите ответ" })).toBeVisible();
  });

  test("Dark appearance and reduced motion resolve through semantic tokens", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openMode(page, "recall");

    const styles = await page.locator(".lx-active-lesson").evaluate((element) => {
      const root = getComputedStyle(document.documentElement);
      const progress = getComputedStyle(element.querySelector(".lx-active-lesson__progress-track > span") as Element);
      return {
        canvas: getComputedStyle(element).backgroundColor,
        tokenCanvas: root.getPropertyValue("--ak-color-canvas").trim(),
        transitionDuration: progress.transitionDuration,
      };
    });
    expect(styles.tokenCanvas).toBe("#10211d");
    expect(styles.canvas).toBe("rgb(16, 33, 29)");
    expect(Number.parseFloat(styles.transitionDuration)).toBeLessThanOrEqual(0.00001);
  });
});
