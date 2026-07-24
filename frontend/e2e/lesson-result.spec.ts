import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  completeRecallLesson,
  installLessonResultFixture,
} from "./support/lesson-result-fixture";

test.describe("canonical Lesson Result", () => {
  test("shows separated evidence and creates one distinct next lesson", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);

    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "next");
    await expect(page.getByRole("heading", { name: "Готов следующий блок" })).toBeVisible();
    await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Самостоятельно", { exact: true })).toBeVisible();
    await expect(page.getByText("С выбором", { exact: true })).toBeVisible();
    await expect(page.getByText("Просмотрено", { exact: true })).toBeVisible();

    const next = page.getByRole("button", { name: "Следующий урок", exact: true });
    await next.evaluate((element) => {
      const button = element as HTMLButtonElement;
      button.click();
      button.click();
    });

    // Recall intentionally exposes the cloze prompt and keeps the full answer
    // hidden until the learner submits an attempt. The distinct-next contract
    // is therefore asserted through the public prompt, not answer leakage.
    await expect(page.getByRole("heading", { name: "Verify the ____." })).toBeVisible();
    await expect(page.getByText("Verify the checkpoint.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("The pipeline is delayed by a backlog.", { exact: true })).toHaveCount(0);
    expect(fixture.reviewRequests()).toBe(1);
    expect(fixture.lessonCreateRequests()).toBe(2);
  });

  test("restores the completed result after reload and browser history without duplicate review", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "next");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Готов следующий блок" })).toBeVisible();
    expect(fixture.reviewRequests()).toBe(1);

    await page.getByRole("button", { name: "На главную", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Добавьте новые слова|готов(?:ы)? к повторению/ })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Готов следующий блок" })).toBeVisible();
    expect(fixture.reviewRequests()).toBe(1);
  });

  test("announces a daily goal once and does not replay celebration after reload", async ({ page }) => {
    await installLessonResultFixture(page, {
      previewTotal: 1,
      reviewsBefore: 14,
      reviewsAfter: 15,
      dailyGoal: 15,
    });
    await completeRecallLesson(page);

    const result = page.locator(".lx-lesson-result");
    await expect(result).toHaveAttribute("data-lesson-result-state", "daily-goal");
    await expect(page.getByRole("heading", { name: "Цель дня достигнута" })).toBeVisible();
    await expect(result).toHaveClass(/lx-lesson-result--celebrate/);
    await expect(page.getByRole("button", { name: "На главную", exact: true })).toHaveCount(1);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Цель дня достигнута" })).toBeVisible();
    await expect(page.locator(".lx-lesson-result")).not.toHaveClass(/lx-lesson-result--celebrate/);
  });

  test("routes to due review when no new block exists", async ({ page }) => {
    await installLessonResultFixture(page, {
      previewTotal: 0,
      dueNow: 6,
    });
    await completeRecallLesson(page);

    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "due");
    await expect(page.getByRole("heading", { name: "Новых блоков пока нет" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Повторить 6 элементов", exact: true })).toBeVisible();
  });

  test("rejects a server response that repeats the completed lesson", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, {
      previewTotal: 1,
      repeatCompletedBlock: true,
    });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "next");

    await page.getByRole("button", { name: "Следующий урок", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Готов следующий блок" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "Следующий урок совпал" })).toBeVisible();
    expect(fixture.lessonCreateRequests()).toBe(2);
  });

  test("passes the blocking axe audit with semantic evidence and action hierarchy", async ({ page }) => {
    await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);

    const results = await new AxeBuilder({ page })
      .include(".lx-lesson-result")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("keeps controls reachable at 200 percent zoom and respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });

    await expect(page.getByRole("button", { name: "Следующий урок", exact: true })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      duration: Number.parseFloat(getComputedStyle(document.querySelector(".lx-lesson-result__primary")!).transitionDuration),
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.duration).toBeLessThanOrEqual(0.00001);
  });
});
