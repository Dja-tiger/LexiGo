import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000048",
    email: "dialog@example.com",
    displayName: "Dialog User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "dialog-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 1,
  newWords: 1,
  learningWords: 0,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 30,
  currentStreak: 0,
  longestStreak: 0,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
};

const METADATA = {
  catalogVersion: "sha256:dialog-e2e",
  updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: 2, words: 1, phrases: 1 },
  sources: {
    mixed: 2,
    noun: 1,
    verb: 0,
    adjective: 0,
    phrases: 1,
    dailyLife: 1,
    travel: 1,
    dataEngineering: 1,
    backend: 1, academicTechnicalEnglish: 0,
  },
  topics: [{ topic: "Accessibility", count: 1 }],
};

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installMocks(page: Page) {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "dialog-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SESSION);
    if (url.pathname === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (url.pathname === "/api/v1/progress") return fulfillJSON(route, 200, PROGRESS);
    if (url.pathname === "/api/v1/lessons/active") {
      return fulfillJSON(route, 404, { error: { code: "not_found", message: "not found" } });
    }
    if (url.pathname === "/api/v1/words" || url.pathname === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: [], count: 0 });
    }
    return fulfillJSON(route, 404, { error: { code: "not_mocked", message: url.pathname } });
  });
}

async function openDialog(page: Page) {
  const reminder = page.locator(".lx-route-reminder-entry");
  const trigger = reminder.locator(":scope > summary");
  await expect(trigger).toBeVisible();
  await trigger.click();

  const preview = reminder.getByRole("region", { name: "Текущее напоминание о занятии" });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Настроить календарь" }).click();

  const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
  await page.goto("/progress");
  await expect(page.getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();
});

test("calendar dialog isolates the application and contains keyboard and programmatic focus", async ({ page }) => {
  const { trigger, dialog } = await openDialog(page);
  const title = dialog.getByRole("heading", { name: "Напоминание об английском" });
  const close = dialog.getByRole("button", { name: "Закрыть" });
  const apple = dialog.getByRole("button", { name: /Apple Calendar/ });

  await expect(title).toBeFocused();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAttribute("aria-describedby", "lexigo-calendar-modal-description");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  const isolation = await page.locator(".lx-app").evaluate((app) => {
    const bodyChild = app.closest("body > *");
    return {
      inert: bodyChild?.hasAttribute("inert") ?? false,
      ariaHidden: bodyChild?.getAttribute("aria-hidden"),
      portalCount: document.querySelectorAll("body > [data-accessible-dialog-portal='true']").length,
    };
  });
  expect(isolation).toEqual({ inert: true, ariaHidden: "true", portalCount: 1 });

  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await title.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(apple).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  const activeBeforeAttempt = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  await page.locator(".lx-route-nav a").first().evaluate((element) => (element as HTMLElement).focus());
  expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))).toBe(activeBeforeAttempt);
  await expect(close).toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);

  const axe = await new AxeBuilder({ page })
    .withRules([
      "aria-dialog-name",
      "aria-hidden-focus",
      "aria-valid-attr",
      "aria-valid-attr-value",
      "focus-order-semantics",
      "tabindex",
    ])
    .analyze();
  expect(axe.violations).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

  const restored = await page.locator(".lx-app").evaluate((app) => {
    const bodyChild = app.closest("body > *");
    return {
      inert: bodyChild?.hasAttribute("inert") ?? false,
      ariaHidden: bodyChild?.getAttribute("aria-hidden"),
      portalCount: document.querySelectorAll("body > [data-accessible-dialog-portal='true']").length,
    };
  });
  expect(restored).toEqual({ inert: false, ariaHidden: null, portalCount: 0 });
});

test("repeated open and close restores body state and both close paths return focus", async ({ page }) => {
  const first = await openDialog(page);
  await first.dialog.getByRole("button", { name: "Закрыть" }).click();
  await expect(first.dialog).toBeHidden();
  await expect(first.trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

  const second = await openDialog(page);
  await expect(second.dialog.getByRole("heading", { name: "Напоминание об английском" })).toBeFocused();
  await page.locator(".lx-calendar-modal-backdrop").click({ position: { x: 2, y: 2 } });
  await expect(second.dialog).toBeHidden();
  await expect(second.trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(page.locator("[data-accessible-dialog-portal='true']")).toHaveCount(0);
});
