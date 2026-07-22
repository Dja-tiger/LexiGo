import { expect, test } from "@playwright/test";

import { learningTermCopy } from "../lib/interface-copy";
import {
  installDeterministicRuntime,
  installQualityGateAPI,
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

  test("home and progress use the same Russian learning terms", async ({ page }) => {
    const due = learningTermCopy("due");
    const recall = learningTermCopy("recall");
    const retained = learningTermCopy("retained");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /готов(?:ы)? к повторению/ })).toBeVisible();
    await expect(page.getByText(due.explanation, { exact: true })).toBeVisible();
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
    await expect(page.getByRole("radio", { name: "Инциденты" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Релизы" })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());

    await page.goto("/phrases/identify-root-cause", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();
    await expect(page.getByText("Инциденты", { exact: true })).toBeVisible();
    await expect(page.getByText(cloze.label, { exact: true })).toBeVisible();
    await expect(page.getByText(cloze.explanation, { exact: true })).toBeVisible();
    await expectNoUnexplainedTechnicalUI(await page.locator("body").innerText());
  });
});
