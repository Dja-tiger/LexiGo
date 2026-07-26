import { createHash } from "node:crypto";

import { expect, test, type Page, type Route, type TestInfo } from "@playwright/test";

import {
  QUALITY_WORDS,
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";
type SystemStateVisualBaseline =
  | "compact-loading-dark"
  | "compact-empty-light"
  | "compact-error-dark"
  | "desktop-offline-dark"
  | "compact-recall-offline-dark";

const SYSTEM_STATE_VISUAL_BASELINES: Record<SystemStateVisualBaseline, {
  figmaNode: "79:69" | "79:93" | "79:117" | "79:194" | "75:57";
  sha256: string;
}> = {
  "compact-loading-dark": { figmaNode: "79:69", sha256: "PENDING_MANUAL_REVIEW" },
  "compact-empty-light": { figmaNode: "79:93", sha256: "PENDING_MANUAL_REVIEW" },
  "compact-error-dark": { figmaNode: "79:117", sha256: "PENDING_MANUAL_REVIEW" },
  "desktop-offline-dark": { figmaNode: "79:194", sha256: "PENDING_MANUAL_REVIEW" },
  "compact-recall-offline-dark": { figmaNode: "75:57", sha256: "PENDING_MANUAL_REVIEW" },
};

const VISUAL_LESSON_ID = "00000000-0000-0000-0000-000000000575";
const VISUAL_WORD = {
  ...QUALITY_WORDS[2],
  id: 575,
  position: 0,
};

function catalogPage(items: readonly unknown[]) {
  return {
    items,
    count: items.length,
    total: items.length,
    page: 1,
    pageSize: 48,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };
}

async function fulfillJSON(route: Route, status: number, body: unknown, headers: Record<string, string> = {}) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function stabilize(page: Page): Promise<void> {
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

async function expectApprovedSystemStateBaseline(
  page: Page,
  testInfo: TestInfo,
  baselineName: SystemStateVisualBaseline,
): Promise<void> {
  const baseline = SYSTEM_STATE_VISUAL_BASELINES[baselineName];
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
  });
  await testInfo.attach(`system-state-${baselineName}.png`, {
    body: screenshot,
    contentType: "image/png",
  });
  const actualSha256 = createHash("sha256").update(screenshot).digest("hex");
  expect(
    actualSha256,
    `System state ${baselineName} must be manually reviewed against Figma ${baseline.figmaNode} before baseline promotion`,
  ).toBe(baseline.sha256);
}

async function installRecallLesson(page: Page) {
  await page.context().route("**/api/v1/lessons/active", async (route) => fulfillJSON(route, 200, {
    id: VISUAL_LESSON_ID,
    source: "mixed",
    studyMode: "recall",
    lessonSize: "1",
    currentIndex: 0,
    version: 1,
    status: "active",
    items: [VISUAL_WORD],
    createdAt: "2026-07-27T00:00:00Z",
    updatedAt: "2026-07-27T00:00:00Z",
  }));
}

test.describe("System state Figma visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await installDeterministicRuntime(page);
  });

  test("compact loading dark", async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== "visual-compact", "390×844 compact loading baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installAppearance(page, "dark");
    await installQualityGateAPI(context);
    await context.route("**/api/v1/auth/refresh", async () => {
      await new Promise<void>(() => undefined);
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".lx-bootstrap:not(.lx-bootstrap--recoverable)")).toBeVisible();
    await expect(page.getByText("Восстанавливаем сессию…", { exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", "dark");
    await stabilize(page);
    await expectApprovedSystemStateBaseline(page, testInfo, "compact-loading-dark");
    expect(runtimeErrors).toEqual([]);
  });

  test("compact Dictionary empty light", async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== "visual-compact", "390×844 compact Dictionary empty baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installAppearance(page, "light");
    await installQualityGateAPI(context);
    await context.route("**/api/v1/words**", async (route) => {
      if (new URL(route.request().url()).pathname !== "/api/v1/words") return route.fallback();
      return fulfillJSON(route, 200, catalogPage([]));
    });

    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("status", { name: "Слова не найдены" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Добавить термин", exact: true })).toHaveCount(0);
    await stabilize(page);
    await expectApprovedSystemStateBaseline(page, testInfo, "compact-empty-light");
    expect(runtimeErrors).toEqual([]);
  });

  test("compact correlated error dark", async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== "visual-compact", "390×844 compact error baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installAppearance(page, "dark");
    await installQualityGateAPI(context);
    await context.route("**/api/v1/words**", async (route) => {
      if (new URL(route.request().url()).pathname !== "/api/v1/words") return route.fallback();
      return fulfillJSON(
        route,
        503,
        { error: { code: "catalog_temporarily_unavailable", message: "retry" } },
        { "x-correlation-id": "visual-system-state-503" },
      );
    });

    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("alert", { name: "Словарь недоступен" })).toContainText("visual-system-state-503");
    await stabilize(page);
    await expectApprovedSystemStateBaseline(page, testInfo, "compact-error-dark");
    expect(runtimeErrors.filter((entry) => !entry.includes("503"))).toEqual([]);
  });

  test("desktop offline dark", async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== "visual-desktop", "1440×1024 desktop offline baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.setViewportSize({ width: 1440, height: 1024 });
    await installAppearance(page, "dark");
    await installQualityGateAPI(context);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу", exact: true })).toBeVisible();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Подробнее", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Работа без сети", exact: true })).toBeVisible();
    await stabilize(page);
    await expectApprovedSystemStateBaseline(page, testInfo, "desktop-offline-dark");
    expect(runtimeErrors).toEqual([]);
  });

  test("compact Recall offline dark", async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== "visual-compact", "390×844 compact Recall offline baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installAppearance(page, "dark");
    await installQualityGateAPI(context);
    await installRecallLesson(page);

    await page.goto("/lesson/active", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Продолжить урок", exact: true }).click();
    const answer = page.getByRole("textbox", { name: "Введите ответ", exact: true });
    await answer.fill("надёжный");
    await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await expect(page.getByText("Ответ сохранён на устройстве", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Работа без сети", exact: true })).toBeVisible();
    await stabilize(page);
    await expectApprovedSystemStateBaseline(page, testInfo, "compact-recall-offline-dark");
    expect(runtimeErrors).toEqual([]);
  });
});
