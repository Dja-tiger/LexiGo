import { expect, test } from "@playwright/test";

import { learningTermCopy } from "../lib/interface-copy";
import {
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PROGRESS,
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
    await expect(page.getByText(`${due.label}: ${QUALITY_PROGRESS.dueNow}`, { exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());

    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(retained.label, { exact: true })).toBeVisible();
    await expect(page.getByText(retained.explanation, { exact: true })).toBeVisible();
    await expect(page.getByText(recall.label, { exact: true })).toBeVisible();
    await expect(page.getByText(recall.explanation, { exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());
  });

  test("phrase catalog localizes topics and explains the missing-fragment exercise", async ({ page }) => {
    const cloze = learningTermCopy("cloze");

    await page.goto("/phrases", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
    const incidentTopic = page.getByRole("radio", { name: "Инциденты" });
    await expect(incidentTopic).toHaveCount(1);
    await expect(incidentTopic).toBeVisible();
    await expect(page.getByRole("radio", { name: "Релизы" })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());

    await page.getByRole("link", { name: /We need to identify the root cause\./ }).click();
    await expect(page).toHaveURL(/\/phrases\/identify-root-cause$/);
    await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();
    await expect(page.getByText("Инциденты", { exact: true })).toBeVisible();
    await expect(page.getByText(cloze.label, { exact: true })).toBeVisible();
    await expect(page.getByText(cloze.explanation, { exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());
  });
});
