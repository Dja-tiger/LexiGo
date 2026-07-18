import { readFile } from "node:fs/promises";

import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

type SharedCalendarCapture = { name: string; type: string; text: string };

declare global {
  interface Window {
    __lexigoSharedCalendars?: SharedCalendarCapture[];
  }
}

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000049",
    email: "apple-calendar@example.com",
    displayName: "Apple Calendar User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "apple-calendar-access-token",
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
  catalogVersion: "sha256:apple-calendar-e2e",
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
    backend: 1,
  },
  topics: [{ topic: "Calendar", count: 1 }],
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
    value: "apple-calendar-csrf",
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

async function emulateStandaloneShare(context: BrowserContext) {
  await context.addInitScript(() => {
    type ShareInput = { files?: File[] };
    const calls: SharedCalendarCapture[] = [];
    Object.defineProperty(window, "__lexigoSharedCalendars", {
      configurable: true,
      value: calls,
    });
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      get: () => true,
    });

    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query !== "(display-mode: standalone)") return nativeMatchMedia(query);
      return {
        matches: true,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => true,
      } as MediaQueryList;
    };

    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (input: ShareInput) => input.files?.length === 1 && input.files[0].type.startsWith("text/calendar"),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (input: ShareInput) => {
        const file = input.files?.[0];
        if (!file) throw new Error("calendar file is missing");
        calls.push({ name: file.name, type: file.type, text: await file.text() });
      },
    });
  });
}

async function disableFileSharing(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });
}

async function openCalendarDialog(page: Page) {
  await page.goto("/?view=progress");
  await expect(page.getByRole("heading", { name: "Смотрите, что действительно сохранилось" })).toBeVisible();
  await page.getByRole("button", { name: "Настроить календарь" }).click();
  const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.use({ timezoneId: "Europe/Berlin" });
test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test("installed iOS PWA shares a real ICS file without opening an error page", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "ios-webkit", "Dedicated installed iOS PWA file-share regression.");
  await emulateStandaloneShare(context);
  const attachmentRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/calendar/reminder") attachmentRequests.push(request.url());
  });

  const dialog = await openCalendarDialog(page);
  await dialog.getByRole("button", { name: /Apple Calendar/ }).click();

  await expect.poll(() => page.evaluate(() => window.__lexigoSharedCalendars?.length ?? 0)).toBe(1);
  const shared = await page.evaluate(() => window.__lexigoSharedCalendars?.[0] ?? null);
  expect(shared).not.toBeNull();
  if (!shared) throw new Error("shared calendar capture is missing");

  expect(shared.name).toBe("lexigo-study-reminder.ics");
  expect(shared.type).toBe("text/calendar;charset=utf-8");
  expect(shared.text).toContain("BEGIN:VCALENDAR\r\n");
  expect(shared.text).toContain("BEGIN:VTIMEZONE\r\nTZID:Europe/Berlin\r\n");
  expect(shared.text).toContain("DTSTART;TZID=Europe/Berlin:");
  expect(shared.text).toContain("RRULE:FREQ=DAILY\r\n");
  expect(shared.text).toContain("BEGIN:VALARM\r\n");
  expect(shared.text).toMatch(/END:VCALENDAR\r\n$/);
  expect(attachmentRequests).toEqual([]);
  await expect(page).toHaveURL(/view=progress/);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("status")).toContainText("Файл передан выбранному приложению");
});

test("desktop fallback downloads the ICS attachment with the expected filename and content", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Deterministic browser download fallback regression.");
  await disableFileSharing(context);

  const dialog = await openCalendarDialog(page);
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: /Apple Calendar/ }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(download.suggestedFilename()).toBe("lexigo-study-reminder.ics");
  expect(downloadPath).not.toBeNull();
  const content = await readFile(downloadPath!, "utf8");
  expect(content).toContain("BEGIN:VCALENDAR\r\n");
  expect(content).toContain("BEGIN:VTIMEZONE\r\nTZID:Europe/Berlin\r\n");
  expect(content).toContain("RRULE:FREQ=DAILY\r\n");
  expect(content).toContain("BEGIN:VALARM\r\n");
  await expect(dialog.getByRole("status")).toContainText("lexigo-study-reminder.ics загружен");
});
