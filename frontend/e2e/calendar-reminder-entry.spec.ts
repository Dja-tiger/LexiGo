import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000067",
    email: "calendar-entry@example.com",
    displayName: "Calendar Entry User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "calendar-entry-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const EMPTY_MODE = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 1,
  newWords: 2,
  learningWords: 0,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  objectiveReviewsToday: 0,
  objectiveSuccessfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 30,
  currentStreak: 0,
  longestStreak: 0,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
  eventSchemaVersion: 2,
  modes: {
    study: EMPTY_MODE,
    recall: EMPTY_MODE,
    choice: EMPTY_MODE,
    legacy: EMPTY_MODE,
  },
};

const METADATA = {
  catalogVersion: "sha256:calendar-entry-e2e",
  updatedAt: "2026-07-22T00:00:00Z",
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
  topics: [{ topic: "Accessibility", count: 2 }],
};

const SAVED_SETTINGS = {
  time: "18:30",
  durationMinutes: 20,
  reminderMinutes: 10,
  recurrence: "daily",
  weekdays: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
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
    value: "calendar-entry-csrf",
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

async function installSavedSchedule(page: Page) {
  await page.addInitScript((settings) => {
    window.localStorage.setItem("lexigo.calendar.reminder.v1", JSON.stringify(settings));
  }, SAVED_SETTINGS);
}

function reminderEntry(page: Page) {
  return page.locator(".lx-route-reminder-entry");
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await installSavedSchedule(page);
  await installMocks(page);
});

test("route chrome exposes the saved schedule before opening the calendar dialog", async ({ page }) => {
  await page.goto("/");

  const entry = reminderEntry(page);
  const trigger = entry.locator(":scope > summary");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute(
    "aria-label",
    "Напоминание о занятии. Каждый день в 18:30",
  );

  // The ambiguous legacy bell remains mounted inside the product graph but is no longer
  // an interactive duplicate of the route-level calendar action.
  await expect(page.locator('button[aria-label="Уведомления"]')).toBeHidden();

  await trigger.click();
  const preview = entry.getByRole("region", { name: "Текущее напоминание о занятии" });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Каждый день в 18:30");
  await expect(preview).toContainText("хранится только в этом браузере");

  await page.keyboard.press("Escape");
  await expect(preview).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Настроить календарь" }).click();
  await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
});

test("calendar reminder entry keeps a 44px target and an in-viewport preview at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const entry = reminderEntry(page);
  const trigger = entry.locator(":scope > summary");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-label", /Каждый день в 18:30/);

  const triggerBox = await trigger.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(triggerBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(triggerBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await trigger.click();
  const preview = entry.getByRole("region", { name: "Текущее напоминание о занятии" });
  await expect(preview).toBeVisible();

  const previewBox = await preview.boundingBox();
  expect(previewBox).not.toBeNull();
  expect(previewBox?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((previewBox?.x ?? 0) + (previewBox?.width ?? 0)).toBeLessThanOrEqual(390.5);

  await preview.getByRole("button", { name: "Настроить календарь" }).click();
  await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
});

test("contextual and route-level entries share one persisted schedule", async ({ page }) => {
  await page.addInitScript(() => {
    window.open = () => null;
  });
  await page.goto("/progress");

  const routeTrigger = reminderEntry(page).locator(":scope > summary");
  await expect(routeTrigger).toHaveAttribute("aria-label", /Каждый день в 18:30/);

  const contextualCard = page.locator(".lx-calendar-reminder-card");
  await expect(contextualCard).toBeVisible();
  await contextualCard.getByRole("button", { name: "Настроить календарь" }).click();

  const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Время занятия").fill("20:15");
  await dialog.getByRole("button", { name: /Google Calendar/ }).click();
  await expect(dialog.getByRole("status")).toContainText("Подтвердите сохранение");
  await dialog.getByRole("button", { name: "Закрыть" }).click();

  await expect(routeTrigger).toHaveAttribute(
    "aria-label",
    "Напоминание о занятии. Каждый день в 20:15",
  );
  await routeTrigger.click();
  await expect(
    reminderEntry(page).getByRole("region", { name: "Текущее напоминание о занятии" }),
  ).toContainText("Каждый день в 20:15");
});
