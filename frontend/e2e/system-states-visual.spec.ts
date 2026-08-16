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

type SystemStateVisualBaselineContract = {
  figmaNode: "79:69" | "79:93" | "79:117" | "79:194" | "75:57";
  sha256: string;
  rendererEquivalentSha256?: readonly string[];
};

type StableLayoutSample = {
  viewportWidth: number;
  viewportHeight: number;
  contentWidth: number;
  contentHeight: number;
  scrollX: number;
  scrollY: number;
  reminderSummary: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
};

const SYSTEM_STATE_VISUAL_BASELINES: Record<SystemStateVisualBaseline, SystemStateVisualBaselineContract> = {
  "compact-loading-dark": {
    figmaNode: "79:69",
    sha256: "45956af4fd18983b56d9c6ae38714b1ba5ed984a930c8ffca7472dd65a699368",
  },
  "compact-empty-light": {
    figmaNode: "79:93",
    sha256: "e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf",
    // Issue #545 independently compared authoritative Linux artifacts from the same 390×844 state.
    // This hosted-renderer fingerprint differs from the primary Figma-approved raster at exactly
    // three antialiased calendar-reminder edge pixels, with a maximum RGB delta of one LSB.
    // Keep this as an exact scoped fingerprint: no numerical tolerance and no third raster is accepted.
    rendererEquivalentSha256: [
      "dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6",
    ],
  },
  "compact-error-dark": {
    figmaNode: "79:117",
    sha256: "84576205fe0619b9e1707f5c2e8ccf4a6ce7e6c285c5a261170709efa1549b11",
  },
  "desktop-offline-dark": {
    figmaNode: "79:194",
    sha256: "8f3b6192ba542969101166997046d92df0dc041ed9c8ec0fc7f588e951931f7a",
  },
  "compact-recall-offline-dark": {
    figmaNode: "75:57",
    sha256: "0d7393ab3793ab5d773d167f65f743d3cd53190c4da4899a2d915e1d3b01d2ae",
  },
};

const VISUAL_LESSON_ID = "00000000-0000-0000-0000-000000000575";
const VISUAL_WORD = {
  ...QUALITY_WORDS[2],
  id: 575,
  position: 0,
};
const CALENDAR_REMINDER_STORAGE_KEY = "lexigo.calendar.reminder.v1";
const VISUAL_REMINDER_HYDRATED_LABEL = "Напоминание о занятии. Каждый день в 19:37";
const VISUAL_REMINDER_HYDRATION_SENTINEL = {
  time: "19:37",
  durationMinutes: 20,
  reminderMinutes: 10,
  recurrence: "daily",
  weekdays: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
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

async function installReminderHydrationSentinel(page: Page): Promise<void> {
  await page.addInitScript(({ key, settings }) => {
    localStorage.setItem(key, JSON.stringify(settings));
  }, {
    key: CALENDAR_REMINDER_STORAGE_KEY,
    settings: VISUAL_REMINDER_HYDRATION_SENTINEL,
  });
}

async function waitForReminderHydration(page: Page): Promise<void> {
  await expect(page.locator(".lx-route-reminder-entry > summary")).toHaveAttribute(
    "aria-label",
    VISUAL_REMINDER_HYDRATED_LABEL,
  );
}

async function sampleLayoutAfterPaintBarrier(page: Page): Promise<StableLayoutSample> {
  return page.evaluate(() => new Promise<StableLayoutSample>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const reminderSummary = document.querySelector<HTMLElement>(".lx-route-reminder-entry > summary");
        const reminderRect = reminderSummary?.getBoundingClientRect();
        resolve({
          viewportWidth: document.documentElement.clientWidth,
          viewportHeight: document.documentElement.clientHeight,
          contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          contentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          reminderSummary: reminderRect ? {
            x: reminderRect.x,
            y: reminderRect.y,
            width: reminderRect.width,
            height: reminderRect.height,
          } : null,
        });
      });
    });
  }));
}

async function stabilize(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  });

  const firstLayout = await sampleLayoutAfterPaintBarrier(page);
  const secondLayout = await sampleLayoutAfterPaintBarrier(page);

  expect(
    secondLayout,
    "System-state visual layout must stay unchanged across consecutive paint barriers before raw capture",
  ).toEqual(firstLayout);
  expect(secondLayout.contentWidth).toBeLessThanOrEqual(secondLayout.viewportWidth + 1);
  expect(secondLayout.scrollX).toBe(0);
  expect(secondLayout.scrollY).toBe(0);
}

async function captureSystemState(page: Page): Promise<Buffer> {
  return page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
  });
}

async function expectApprovedSystemStateBaseline(
  page: Page,
  testInfo: TestInfo,
  baselineName: SystemStateVisualBaseline,
): Promise<void> {
  const baseline = SYSTEM_STATE_VISUAL_BASELINES[baselineName];
  const firstCapture = await captureSystemState(page);
  await testInfo.attach(`system-state-${baselineName}-capture-1.png`, {
    body: firstCapture,
    contentType: "image/png",
  });

  await sampleLayoutAfterPaintBarrier(page);

  const secondCapture = await captureSystemState(page);
  await testInfo.attach(`system-state-${baselineName}-capture-2.png`, {
    body: secondCapture,
    contentType: "image/png",
  });

  const firstSha256 = createHash("sha256").update(firstCapture).digest("hex");
  const secondSha256 = createHash("sha256").update(secondCapture).digest("hex");
  expect(
    secondSha256,
    `System state ${baselineName} must produce two consecutive identical steady-state captures; first=${firstSha256}, second=${secondSha256}`,
  ).toBe(firstSha256);

  const acceptedSha256 = [baseline.sha256, ...(baseline.rendererEquivalentSha256 ?? [])];
  expect(
    acceptedSha256,
    `System state ${baselineName} must match the primary Figma-approved SHA or an exact independently reviewed renderer-equivalent fingerprint for Figma ${baseline.figmaNode}; primary=${baseline.sha256}, received=${firstSha256}`,
  ).toContain(firstSha256);
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
    await installReminderHydrationSentinel(page);
    await installQualityGateAPI(context);
    await context.route("**/api/v1/words**", async (route) => {
      if (new URL(route.request().url()).pathname !== "/api/v1/words") return route.fallback();
      return fulfillJSON(route, 200, catalogPage([]));
    });

    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("status", { name: "Слова не найдены" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Добавить термин", exact: true })).toHaveCount(0);
    await waitForReminderHydration(page);
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
    await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();
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
