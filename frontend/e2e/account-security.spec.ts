import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000057",
    email: "account-security@example.com",
    displayName: "Account Security",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "account-security-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 10,
  totalPhrases: 5,
  newWords: 10,
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
    study: { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 },
    recall: { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 },
    choice: { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 },
    legacy: { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 },
  },
};

const METADATA = {
  catalogVersion: "sha256:account-security-e2e",
  updatedAt: "2026-07-20T00:00:00Z",
  totals: { items: 15, words: 10, phrases: 5 },
  sources: {
    mixed: 15,
    noun: 4,
    verb: 3,
    adjective: 3,
    phrases: 5,
    dailyLife: 3,
    travel: 3,
    dataEngineering: 3,
    backend: 3,
  },
  topics: [],
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installAPI(page: Page) {
  let sessions = [
    {
      id: "family-current",
      current: true,
      userAgent: "Mozilla/5.0 Chrome",
      ipAddress: "127.0.0.1",
      createdAt: "2026-07-19T10:00:00Z",
      lastSeenAt: "2026-07-20T00:10:00Z",
      expiresAt: "2026-08-19T10:00:00Z",
    },
    {
      id: "family-other",
      current: false,
      userAgent: "Mozilla/5.0 iPhone Safari",
      ipAddress: "198.51.100.20",
      createdAt: "2026-07-18T10:00:00Z",
      lastSeenAt: "2026-07-19T22:00:00Z",
      expiresAt: "2026-08-18T10:00:00Z",
    },
  ];
  const auditEvents: Array<Record<string, unknown>> = [];
  const requests: Array<{ path: string; csrf: string; body: Record<string, string> }> = [];

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "account-security-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    if (path === "/api/v1/progress") return json(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return json(route, 404, { error: { code: "active_lesson_not_found", message: "not found" } });
    }
    if (path === "/api/v1/auth/sessions" && request.method() === "GET") {
      return json(route, 200, { sessions });
    }
    if (path === "/api/v1/auth/audit-events" && request.method() === "GET") {
      return json(route, 200, { events: auditEvents });
    }
    if (path === "/api/v1/auth/sessions/revoke-others" && request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, string>;
      requests.push({ path, csrf: request.headers()["x-csrf-token"] ?? "", body });
      if (body.currentPassword !== "current-password") {
        return json(route, 401, {
          error: {
            code: "reauthentication_failed",
            message: "current password is invalid",
            field: "currentPassword",
          },
        });
      }
      sessions = sessions.filter((item) => item.current);
      auditEvents.unshift({
        id: 1,
        type: "other_sessions_revoked",
        userAgent: "Mozilla/5.0 Chrome",
        ipAddress: "127.0.0.1",
        metadata: { revokedRefreshTokens: "1" },
        createdAt: "2026-07-20T00:15:00Z",
      });
      await route.fulfill({ status: 204 });
      return;
    }
    if (path === "/api/v1/auth/password" && request.method() === "PUT") {
      const body = request.postDataJSON() as Record<string, string>;
      requests.push({ path, csrf: request.headers()["x-csrf-token"] ?? "", body });
      if (body.currentPassword !== "current-password") {
        return json(route, 401, {
          error: {
            code: "reauthentication_failed",
            message: "current password is invalid",
            field: "currentPassword",
          },
        });
      }
      auditEvents.unshift({
        id: 2,
        type: "password_changed",
        userAgent: "Mozilla/5.0 Chrome",
        ipAddress: "127.0.0.1",
        metadata: { revokedRefreshTokens: "0" },
        createdAt: "2026-07-20T00:20:00Z",
      });
      await route.fulfill({ status: 204 });
      return;
    }

    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  return { requests };
}

test("account security panel lists devices, reauthenticates mutations and updates audit history", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Account form behavior is deterministic in the desktop release profile.");
  const api = await installAPI(page);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Пароль и активные устройства" })).toBeVisible();
  await expect(page.getByText("Chrome", { exact: true })).toBeVisible();
  await expect(page.getByText("Safari на iOS", { exact: true })).toBeVisible();
  await expect(page.getByText("Критичных изменений пока не было.")).toBeVisible();

  const sessionsCard = page.getByRole("article").filter({ hasText: "Активные сессии" });
  await sessionsCard.getByLabel("Текущий пароль").fill("wrong-password");
  await sessionsCard.getByRole("button", { name: "Завершить остальные сессии" }).click();
  await expect(sessionsCard.getByRole("alert")).toContainText("current password is invalid");

  await sessionsCard.getByLabel("Текущий пароль").fill("current-password");
  await sessionsCard.getByRole("button", { name: "Завершить остальные сессии" }).click();
  await expect(page.getByRole("status")).toHaveText("Остальные сессии завершены.");
  await expect(page.getByText("Safari на iOS", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Остальные сессии завершены", { exact: true })).toBeVisible();

  const passwordCard = page.getByRole("article").filter({ hasText: "Сменить пароль" });
  await passwordCard.getByLabel("Текущий пароль").fill("current-password");
  await passwordCard.getByLabel("Новый пароль").fill("new-strong-password");
  await passwordCard.getByLabel("Повторите новый пароль").fill("new-strong-password");
  await passwordCard.getByRole("button", { name: "Изменить пароль" }).click();
  await expect(page.getByRole("status")).toHaveText("Пароль изменён. Остальные сессии завершены.");
  await expect(page.getByText("Пароль изменён", { exact: true })).toBeVisible();

  expect(api.requests).toHaveLength(3);
  expect(api.requests.every((entry) => entry.csrf === "account-security-csrf")).toBe(true);
  expect(api.requests.at(-1)?.body).toEqual({
    currentPassword: "current-password",
    newPassword: "new-strong-password",
  });
  await expect(page.getByRole("link", { name: "Конфиденциальность" })).toHaveAttribute("href", "/privacy");
  await expect(page.getByRole("link", { name: "Условия использования" })).toHaveAttribute("href", "/terms");
  expect(runtimeErrors).toEqual([]);
});
