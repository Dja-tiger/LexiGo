import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  completeRecallLesson,
  installLessonResultFixture,
} from "./support/lesson-result-fixture";

test.describe("canonical Lesson Result", () => {
  test("shows separated persisted evidence, nearest review timing, and creates one distinct next lesson", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);

    const result = page.locator(".lx-lesson-result");
    await expect(result).toHaveAttribute("data-lesson-result-state", "next");
    await expect(result).toHaveAttribute("data-lesson-result-evidence-state", "complete");
    await expect(page.getByRole("heading", { name: "Готов следующий блок" })).toBeVisible();
    await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Самостоятельно", { exact: true })).toBeVisible();
    await expect(page.getByText("С выбором", { exact: true })).toBeVisible();
    await expect(page.getByText("Просмотрено", { exact: true })).toBeVisible();
    await expect(page.getByText("Объективная проверка и самооценка не смешиваются.", { exact: true })).toBeVisible();
    await expect(page.getByText("Ближайшее повторение назначено", { exact: true })).toBeVisible();

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
    await expect.poll(() => fixture.resultActionRequests().length).toBeGreaterThan(0);
    expect(fixture.resultActionRequests()[0]).toEqual({
      recommendedAction: "next_lesson",
      selectedAction: "next_lesson",
    });
    expect(fixture.reviewRequests()).toBe(1);
    expect(fixture.lessonCreateRequests()).toBe(2);
  });

  test("preserves explicit process intent through result preview and the next block", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, {
      previewTotal: 1,
      resumeWithReviewedItem: true,
      activeSessionKind: "study",
    });

    await page.goto("/lesson/active?resume=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Verify the ____." })).toBeVisible({ timeout: 15_000 });
    const answer = page.getByRole("textbox", { name: "Введите ответ" });
    await answer.fill("checkpoint");
    await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await page.getByRole("button", { name: "К результатам", exact: true }).click();

    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "next");
    const previewBodies = fixture.previewRequestBodies();
    expect(previewBodies[previewBodies.length - 1]).toMatchObject({
      source: "mixed",
      studyMode: "recall",
      sessionKind: "study",
      lessonSize: "15",
    });

    await page.getByRole("button", { name: "Следующий урок", exact: true }).click();
    const createBodies = fixture.lessonCreateRequestBodies();
    expect(createBodies[createBodies.length - 1]).toMatchObject({
      source: "mixed",
      studyMode: "recall",
      sessionKind: "study",
      lessonSize: "15",
    });
    await expect(page.getByRole("heading", { name: "Verify the ____." })).toBeVisible();
  });

  test("marks restored reviews with unavailable correctness as partial instead of lowering objective accuracy", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, {
      previewTotal: 1,
      resumeWithReviewedItem: true,
    });

    await page.goto("/lesson/active?resume=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Verify the ____." })).toBeVisible({ timeout: 15_000 });
    const answer = page.getByRole("textbox", { name: "Введите ответ" });
    await answer.fill("checkpoint");
    await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await page.getByRole("button", { name: "К результатам", exact: true }).click();

    const result = page.locator(".lx-lesson-result");
    await expect(result).toHaveAttribute("data-lesson-result-state", "next");
    await expect(result).toHaveAttribute("data-lesson-result-evidence-state", "partial");
    await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
    await expect(page.getByText(/1 без сохранённой проверки/)).toBeVisible();
    await expect(page.getByText(/ещё 1 восстановлены без сохранённого результата проверки/)).toBeVisible();
    expect(fixture.reviewRequests()).toBe(1);
  });

  test("restores the completed result after reload and browser history without duplicate review", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "next");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Готов следующий блок" })).toBeVisible();
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-evidence-state", "complete");
    expect(fixture.reviewRequests()).toBe(1);

    await page.getByRole("button", { name: "На главную", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Добавьте новые слова|готов(?:ы)? к повторению|доступ(?:ен|ны) для изучения/ })).toBeVisible();
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
    await expect(result).toHaveAttribute("data-lesson-result-evidence-state", "complete");
    await expect(page.getByRole("heading", { name: "Цель дня достигнута" })).toBeVisible();
    await expect(page.getByText("15 объективных проверок сегодня", { exact: true })).toBeVisible();
    await expect(page.getByText("Текущая серия: 4. Значение получено из server progress.", { exact: true })).toBeVisible();
    await expect(result).toHaveClass(/lx-lesson-result--celebrate/);
    await expect(page.getByRole("button", { name: "На главную", exact: true })).toHaveCount(1);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Цель дня достигнута" })).toBeVisible();
    await expect(page.locator(".lx-lesson-result")).not.toHaveClass(/lx-lesson-result--celebrate/);
  });

  test("keeps the due backlog visible while starting only the next bounded review block", async ({ page }) => {
    const fixture = await installLessonResultFixture(page, {
      previewTotal: 1,
      dueNow: 32,
    });
    await completeRecallLesson(page);

    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "due");
    await expect(page.getByRole("heading", { name: "Сначала закрепим материал" })).toBeVisible();
    await expect(page.getByText("32 элементов готовы сейчас", { exact: true })).toBeVisible();
    await expect(page.getByText("Сейчас к повторению: 32. Следующий блок ограничен 15 элементами; остаток останется в очереди.", { exact: true })).toBeVisible();
    const dueReview = page.getByRole("button", { name: "Повторить 15 из 32", exact: true });
    await expect(dueReview).toBeVisible();
    await expect(page.getByRole("button", { name: "Следующий урок", exact: true })).toHaveCount(0);

    await dueReview.click();
    await expect.poll(() => fixture.resultActionRequests().length).toBe(1);
    expect(fixture.resultActionRequests()[0]).toEqual({
      recommendedAction: "due_review",
      selectedAction: "due_review",
    });
    const createBodies = fixture.lessonCreateRequestBodies();
    expect(createBodies[createBodies.length - 1]).toMatchObject({
      source: "mixed",
      studyMode: "recall",
      sessionKind: "review",
      lessonSize: "15",
    });
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

  test("passes the blocking axe audit in light and dark appearance", async ({ page }) => {
    await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);

    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      const results = await new AxeBuilder({ page })
        .include(".lx-lesson-result")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(results.violations, `${colorScheme} Lesson Result axe violations`).toEqual([]);
    }
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
