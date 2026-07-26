import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000200",
    email: "profile@example.com",
    displayName: "Profile Owner",
    createdAt: "2026-01-15T10:00:00Z",
  },
  tokens: {
    accessToken: "profile-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const BASE_PROGRESS = {
  dueNow: 4,
  dueWords: 3,
  duePhrases: 1,
  totalWords: 20,
  totalPhrases: 5,
  newWords: 7,
  learningWords: 6,
  reviewWords: 4,
  masteredWords: 3,
  masteredPhrases: 2,
  reviewsToday: 8,
  successfulToday: 6,
  objectiveReviewsToday: 8,
  objectiveSuccessfulToday: 6,
  reviewsTotal: 120,
  dailyGoal: 30,
  currentStreak: 5,
  longestStreak: 11,
  retainedItemsWeek: 14,
  retainedWordsWeek: 11,
  retainedPhrasesWeek: 3,
  eventSchemaVersion: 2,
  modes: {
    study: { attemptsToday: 1, successfulToday: 0, attemptsTotal: 20, successfulTotal: 0 },
    recall: { attemptsToday: 5, successfulToday: 4, attemptsTotal: 70, successfulTotal: 50 },
    choice: { attemptsToday: 2, successfulToday: 2, attemptsTotal: 30, successfulTotal: 25 },
    legacy: { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 },
  },
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installProfileAPI(page: Page) {
  let dailyGoal = BASE_PROGRESS.dailyGoal;
  let logoutRequests = 0;
  const goalRequests: Array<{ body: unknown; csrf: string }> = [];

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "profile-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/progress" && request.method() === "GET") {
      return json(route, 200, { ...BASE_PROGRESS, dailyGoal });
    }
    if (path === "/api/v1/progress/goal" && request.method() === "PUT") {
      const body = request.postDataJSON() as { dailyGoal: number };
      dailyGoal = body.dailyGoal;
      goalRequests.push({ body, csrf: request.headers()["x-csrf-token"] ?? "" });
      return json(route, 200, { ...BASE_PROGRESS, dailyGoal });
    }
    if (path === "/api/v1/auth/sessions") {
      return json(route, 200, {
        sessions: [{
          id: "profile-current-session",
          current: true,
          userAgent: "Mozilla/5.0 Chrome",
          ipAddress: "127.0.0.1",
          createdAt: "2026-07-25T10:00:00Z",
          lastSeenAt: "2026-07-26T10:00:00Z",
          expiresAt: "2026-08-25T10:00:00Z",
        }],
      });
    }
    if (path === "/api/v1/auth/audit-events") return json(route, 200, { events: [] });
    if (path === "/api/v1/auth/logout" && request.method() === "POST") {
      logoutRequests += 1;
      await route.fulfill({ status: 204 });
      return;
    }

    return json(route, 404, { error: { code: "not_mocked", message: `${request.method()} ${path}` } });
  });

  return {
    goalRequests,
    logoutRequests: () => logoutRequests,
  };
}

test("authenticated Profile owns learning, reminder, appearance and account navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Profile interaction contract runs in the desktop Chromium release profile.");
  const api = await installProfileAPI(page);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/profile");

  await expect(page.locator('[data-route-client-island="profile"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Профиль", exact: true })).toBeVisible();
  await expect(page.getByText("Profile Owner", { exact: true })).toBeVisible();
  await expect(page.getByText("profile@example.com", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Параметры практики" })).toBeVisible();
  await expect(page.getByText("8 из 30 ответов сегодня", { exact: true })).toBeVisible();

  const goalGroup = page.getByRole("radiogroup", { name: "Дневная цель" });
  await expect(goalGroup.getByRole("radio", { name: "30" })).toHaveAttribute("aria-checked", "true");
  await goalGroup.getByRole("radio", { name: "60" }).click();
  await expect(goalGroup.getByRole("radio", { name: "60" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("status").filter({ hasText: "Дневная цель сохранена: 60 ответов." })).toBeVisible();
  expect(api.goalRequests).toEqual([{ body: { dailyGoal: 60 }, csrf: "profile-csrf" }]);

  await page.getByRole("button", { name: "Настроить", exact: true }).click();
  const calendarDialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(calendarDialog).toBeVisible();
  await expect(calendarDialog.getByText("Настройки хранятся только в этом браузере.")).toBeVisible();
  await calendarDialog.getByRole("button", { name: "Закрыть" }).click();
  await expect(calendarDialog).toHaveCount(0);

  const appearanceGroup = page.getByRole("radiogroup", { name: "Оформление приложения" });
  await appearanceGroup.getByRole("radio", { name: "Тёмная: Всегда тёмная" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", "dark");
  expect(await page.evaluate(() => localStorage.getItem("lexigo.appearance.v1"))).toBe("dark");
  expect(await page.locator('meta[name="theme-color"]').evaluateAll((metas) => metas.every((meta) => (
    meta.getAttribute("content") === "#10211d"
    && meta.getAttribute("data-lexigo-resolved-appearance") === "dark"
  )))).toBe(true);

  await page.getByRole("button", { name: "Пароль и активные устройства" }).click();
  await expect(page.getByRole("heading", { name: "Пароль и активные устройства" })).toBeFocused();

  await page.reload({ waitUntil: "domcontentloaded" });
  expect(await page.locator("html").getAttribute("data-lexigo-resolved-appearance")).toBe("dark");
  await expect(page.locator('[data-route-client-island="profile"]')).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("Profile radio groups support roving keyboard focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Keyboard contract runs once in Chromium.");
  await installProfileAPI(page);
  await page.goto("/profile");

  const appearanceGroup = page.getByRole("radiogroup", { name: "Оформление приложения" });
  const auto = appearanceGroup.getByRole("radio", { name: "Авто: Как в системе" });
  await auto.focus();
  await page.keyboard.press("ArrowRight");
  await expect(appearanceGroup.getByRole("radio", { name: "Светлая: Всегда светлая" })).toBeFocused();
  await expect(appearanceGroup.getByRole("radio", { name: "Светлая: Всегда светлая" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("End");
  await expect(appearanceGroup.getByRole("radio", { name: "Тёмная: Всегда тёмная" })).toBeFocused();
  await expect(appearanceGroup.getByRole("radio", { name: "Тёмная: Всегда тёмная" })).toHaveAttribute("aria-checked", "true");

  const goalGroup = page.getByRole("radiogroup", { name: "Дневная цель" });
  await goalGroup.getByRole("radio", { name: "30" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(goalGroup.getByRole("radio", { name: "15" })).toBeFocused();
  await expect(goalGroup.getByRole("radio", { name: "15" })).toHaveAttribute("aria-checked", "true");
});

test("mobile Profile reflows without horizontal overflow and logout preserves guest auth", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "ios-webkit", "Mobile/PWA contract runs in the iOS WebKit release profile.");
  const api = await installProfileAPI(page);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/profile");
  await expect(page.locator('[data-route-client-island="profile"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Интерфейс и устройство" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page.locator('[data-route-client-island="profile"]')).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Вход" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Сохраняйте прогресс на всех устройствах" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Вы вышли из аккаунта" })).toBeVisible();
  expect(api.logoutRequests()).toBe(1);
  expect(runtimeErrors).toEqual([]);
});
