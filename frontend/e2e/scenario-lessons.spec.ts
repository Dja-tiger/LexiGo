import { expect, test, type Page } from "@playwright/test";

import {
  installScenarioFixture,
  openScenarioEntry,
  SCENARIO_DETAIL,
  startScenario,
} from "./support/scenario-fixture";

const STEP_ZERO_RESPONSE = "The impact is confirmed for delayed ingestion jobs, and the team will publish another update at 17:00 UTC.";
const STEP_ZERO_FACTS = "Ingestion jobs are delayed\nThe customer-facing impact is confirmed";
const STEP_ZERO_HYPOTHESES = "A saturated consumer may be increasing queue depth";

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

async function fillFactHypothesisStep(page: Page): Promise<void> {
  await page.getByRole("textbox", { name: "Рабочая формулировка на английском" }).fill(STEP_ZERO_RESPONSE);
  await page.getByRole("textbox", { name: "Подтверждённые факты — по одному на строку" }).fill(STEP_ZERO_FACTS);
  await page.getByRole("textbox", { name: "Текущие гипотезы — по одной на строку" }).fill(STEP_ZERO_HYPOTHESES);
}

test.describe("Issue #196 Scenario Lessons UI", () => {
  test.describe.configure({ timeout: 60_000 });

  test("direct entry owns the focused route and submits only the bounded server contract", async ({ page }) => {
    const fixture = await installScenarioFixture(page);
    await openScenarioEntry(page);

    await expect(page).toHaveURL(`/scenarios/${SCENARIO_DETAIL.slug}`);
    await expect(page.locator("[data-route-navigation]")).toHaveCount(0);
    await expect(page.locator(".lx-legal-footer")).toHaveCount(0);
    await expect(page.getByText("без self-rating", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Начать или продолжить", exact: true }).click();
    await fillFactHypothesisStep(page);
    const submit = page.getByRole("button", { name: "Отправить ответ", exact: true });
    await expect(submit).toBeEnabled();
    await submit.click();

    const feedback = page.getByRole("status").filter({ hasText: "Шаг принят сервером" });
    await expect(feedback).toBeVisible();
    await expect(feedback).toBeFocused();
    await expect(feedback).toContainText("Языковая цель использована");
    await expect(page.getByRole("progressbar", { name: "Прогресс сценария" }))
      .toHaveAttribute("aria-valuetext", "1 из 3 шагов");

    await expect.poll(() => fixture.submissions().length).toBe(1);
    const request = fixture.submissions()[0].payload;
    expect(Object.keys(request).sort()).toEqual([
      "attemptVersion",
      "facts",
      "hypotheses",
      "response",
      "review",
      "submissionId",
    ]);
    expect(request).toMatchObject({
      attemptVersion: 1,
      response: STEP_ZERO_RESPONSE,
      facts: ["Ingestion jobs are delayed", "The customer-facing impact is confirmed"],
      hypotheses: ["A saturated consumer may be increasing queue depth"],
      review: { timezoneOffsetMinutes: expect.any(Number) },
    });
    expect(request.submissionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(request).not.toHaveProperty("wordId");
    expect(request).not.toHaveProperty("rating");
    expect(request).not.toHaveProperty("correct");
    expect(request.review).not.toHaveProperty("answerRevealed");
  });

  test("ambiguous transport retry keeps authored evidence and one submission id", async ({ page }) => {
    const fixture = await installScenarioFixture(page);
    await startScenario(page);
    await fillFactHypothesisStep(page);
    fixture.failNextSubmission();

    await page.getByRole("button", { name: "Отправить ответ", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("submission id сохранены");
    await expect(page.getByRole("textbox", { name: "Рабочая формулировка на английском" }))
      .toHaveValue(STEP_ZERO_RESPONSE);

    await page.getByRole("button", { name: "Отправить ответ", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Шаг принят сервером" })).toBeVisible();
    await expect.poll(() => fixture.submissions().length).toBe(2);

    const [failed, retried] = fixture.submissions().map((entry) => entry.payload);
    expect(retried.submissionId).toBe(failed.submissionId);
    expect(retried.response).toBe(failed.response);
    expect(retried.facts).toEqual(failed.facts);
    expect(retried.hypotheses).toEqual(failed.hypotheses);
    expect(retried.attemptVersion).toBe(failed.attemptVersion);
  });

  test("pause, reload and resume preserve local draft and server position", async ({ page }) => {
    const fixture = await installScenarioFixture(page);
    await startScenario(page);
    await fillFactHypothesisStep(page);

    await page.getByRole("button", { name: "Сохранить черновик", exact: true }).click();
    await expect(page.getByText("Попытка на паузе", { exact: true })).toBeVisible();
    expect(fixture.attemptSnapshot()).toMatchObject({ status: "paused", version: 2, currentPosition: 0 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Начать или продолжить", exact: true }).click();
    const response = page.getByRole("textbox", { name: "Рабочая формулировка на английском" });
    await expect(response).toHaveValue(STEP_ZERO_RESPONSE);
    await expect(response).toHaveAttribute("readonly", "");
    await expect(page.getByRole("button", { name: "Продолжить сценарий", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Продолжить сценарий", exact: true }).click();
    await expect(response).toBeEditable();
    await expect(response).toHaveValue(STEP_ZERO_RESPONSE);
    expect(fixture.pauseRequests()).toEqual([{ attemptVersion: 1 }]);
    expect(fixture.resumeRequests()).toEqual([{ attemptVersion: 2 }]);
  });

  test("browser Back opens the same save-and-pause flow before leaving", async ({ page }) => {
    const fixture = await installScenarioFixture(page);
    await startScenario(page);
    await page.getByRole("textbox", { name: "Рабочая формулировка на английском" })
      .fill("A draft incident update remains unsent while browser history is tested safely.");

    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe(`/scenarios/${SCENARIO_DETAIL.slug}`);
    const dialog = page.getByRole("dialog", { name: "Сохранить черновик и закрыть сценарий?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Review event создаётся только после принятой отправки");
    expect(fixture.submissions()).toEqual([]);

    await dialog.getByRole("button", { name: "Сохранить и выйти", exact: true }).click();
    await expect(page).toHaveURL(/\/learn$/);
    expect(fixture.attemptSnapshot()).toMatchObject({ status: "paused" });
    expect(fixture.pauseRequests()).toEqual([{ attemptVersion: 1 }]);
  });

  test("the final server-owned attempt state drives completion", async ({ page }) => {
    const fixture = await installScenarioFixture(page, { initialPosition: 2 });
    await startScenario(page);
    const response = "The next checkpoint is at 18:00 UTC, the incident owner is the data platform lead, and rollback remains the decision boundary.";
    await page.getByRole("textbox", { name: "Рабочая формулировка на английском" }).fill(response);
    await page.getByRole("button", { name: "Отправить ответ", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Шаг принят сервером" })).toContainText("Языковая цель использована");

    await page.getByRole("button", { name: "Показать результат", exact: true }).click();
    await expect(page.getByText("СЦЕНАРИЙ ЗАВЕРШЁН", { exact: true })).toBeVisible();
    await expect(page.getByText("3 из 3 шагов приняты сервером", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Прогресс сценария" }))
      .toHaveAttribute("aria-valuetext", "3 из 3 шагов");
    expect(fixture.attemptSnapshot()).toMatchObject({ status: "completed", completedPositions: [0, 1, 2] });
  });

  test("minimum width and 200% page zoom do not introduce horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await installScenarioFixture(page);
    await startScenario(page);
    await page.evaluate(() => {
      document.body.style.setProperty("zoom", "2");
    });

    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("textbox", { name: "Рабочая формулировка на английском" })).toBeVisible();
    const close = isMobile(page)
      ? page.getByRole("button", { name: "Закрыть", exact: true })
      : page.getByRole("button", { name: "Закрыть сценарий", exact: true });
    await expect(close).toBeVisible();
  });

  test("Dark appearance and reduced motion resolve through semantic tokens", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installScenarioFixture(page);
    await startScenario(page);

    const styles = await page.locator(".lx-scenario").evaluate((element) => {
      const root = getComputedStyle(document.documentElement);
      const progress = getComputedStyle(element.querySelector(".lx-scenario-progress > span") as Element);
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
