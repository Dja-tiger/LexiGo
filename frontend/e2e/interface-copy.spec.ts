import { expect, test } from "@playwright/test";

import {
  interfaceActionLabel,
  learningTermCopy,
  lessonSourceLabel,
} from "../lib/interface-copy";
import {
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PROGRESS,
  QUALITY_WORDS,
} from "./support/quality-gates";

const FORBIDDEN_UI_TERMS = /\b(?:due|retained items?|active recall|recall|cloze practice|chunks|learning status|incident updates|composer|server lesson session|legacy)\b/i;

async function expectNoUnexplainedTechnicalUI(pageText: string): Promise<void> {
  expect(pageText).not.toMatch(FORBIDDEN_UI_TERMS);
}

test.describe("interface copy contract", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("home, lesson composer and progress use the same Russian learning terms", async ({ page }) => {
    const due = learningTermCopy("due");
    const recall = learningTermCopy("recall");
    const retained = learningTermCopy("retained");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /готов(?:ы)? к повторению/ })).toBeVisible();
    await expect(page.getByText(due.explanation, { exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());

    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
    const configureLesson = page.getByRole("button", { name: "Настроить урок", exact: true });
    if (await configureLesson.isVisible()) await configureLesson.click();
    const recallMode = page.getByRole("radio", { name: new RegExp(recall.label) });
    await expect(recallMode).toBeVisible();
    await expect(recallMode).toContainText(recall.explanation);
    await expect(page.locator(".lx-heading-badge")).toContainText(`${due.label}: ${QUALITY_PROGRESS.dueNow}`);
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());

    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    const retainedMetric = page.locator(".lx-progress-evidence__metric").filter({ hasText: retained.label });
    await expect(retainedMetric).toHaveCount(1);
    await expect(retainedMetric.locator("dt")).toContainText(retained.label);
    await expect(page.getByText(retained.explanation, { exact: true })).toBeVisible();

    const modeBreakdown = page.getByText("Разделение по режимам", { exact: true });
    await expect(modeBreakdown).toBeVisible();
    await modeBreakdown.click();
    await expect(page.getByText(recall.label, { exact: true })).toBeVisible();
    await expect(page.getByText(recall.explanation, { exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());
  });

  test("lesson sources and recovery actions use one user-facing copy contract", async ({ page }) => {
    await page.route("**/api/v1/lessons/active", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "quality-copy-active-lesson",
          source: "travel",
          studyMode: "study",
          lessonSize: "15",
          currentIndex: 0,
          version: 1,
          status: "active",
          items: [{ ...QUALITY_WORDS[0], position: 0 }],
          createdAt: "2026-07-20T10:00:00Z",
          updatedAt: "2026-07-20T10:00:00Z",
        }),
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(`${lessonSourceLabel("travel")} · карточка 1 из 1.`, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: interfaceActionLabel("continueLesson"), exact: true })).toBeVisible();
    await expect(page.getByText("Путешествия · карточка 1 из 1.", { exact: true })).toHaveCount(0);

    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    const configureLesson = page.getByRole("button", { name: "Настроить урок", exact: true });
    if (await configureLesson.isVisible()) await configureLesson.click();
    await expect(page.getByRole("radio", { name: new RegExp(lessonSourceLabel("travel")) })).toBeVisible();
    await expect(page.getByRole("radio", { name: new RegExp(lessonSourceLabel("phrases")) })).toBeVisible();

    await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: interfaceActionLabel("home"), exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Открыть главную", exact: true })).toHaveCount(0);
  });

  test("phrase catalog localizes topics and explains the missing-fragment exercise", async ({ page }) => {
    const cloze = learningTermCopy("cloze");

    await page.goto("/phrases", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
    const incidentTopic = page.getByRole("button", { name: "Инциденты", exact: true });
    await expect(incidentTopic).toHaveCount(1);
    await expect(incidentTopic).toBeVisible();
    await expect(page.getByRole("button", { name: "Релизы", exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());

    await page.getByRole("link", { name: /We need to identify the root cause\./ }).click();
    await expect(page).toHaveURL(/\/phrases\/identify-root-cause$/);
    await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();
    const detail = page.locator(".lx-phrase-detail-main");
    await expect(detail.getByText("Инциденты", { exact: true })).toBeVisible();
    await expect(detail.getByText(cloze.label, { exact: true })).toBeVisible();
    await expect(detail.getByText(cloze.explanation, { exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());
  });
});
