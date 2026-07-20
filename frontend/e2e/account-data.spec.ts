import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000157",
    email: "export@example.com",
    displayName: "Export User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "account-export-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 0,
  newWords: 1,
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
  catalogVersion: "sha256:account-export-e2e",
  updatedAt: "2026-07-20T00:00:00Z",
  totals: { items: 1, words: 1, phrases: 0 },
  sources: {
    mixed: 1,
    noun: 1,
    verb: 0,
    adjective: 0,
    phrases: 0,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 1,
  },
  topics: [],
};

const EXPORT_PAYLOAD = {
  schemaVersion: 1,
  generatedAt: "2026-07-20T01:00:00Z",
  account: {
    id: SESSION.user.id,
    email: SESSION.user.email,
    displayName: SESSION.user.displayName,
    createdAt: SESSION.user.createdAt,
    updatedAt: "2026-07-20T00:00:00Z",
  },
  learningPreferences: { dailyGoal: 30, updatedAt: "2026-07-20T00:00:00Z" },
  words: [],
  reviewHistory: [],
  securityAudit: [],
};

async function json(route: Route, status: number, body: unknown, headers?: Record<string, string>) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

async function installAPI(page: Page) {
  const exportRequests: Array<{ csrf: string; body: Record<string, string> }> = [];
  const deleteRequests: Array<{ csrf: string; body: Record<string, string> }> = [];
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "account-export-csrf",
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
    if (path === "/api/v1/auth/sessions") return json(route, 200, { sessions: [] });
    if (path === "/api/v1/auth/audit-events") return json(route, 200, { events: [] });
    if (path === "/api/v1/account/export") {
      const body = request.postDataJSON() as Record<string, string>;
      exportRequests.push({ csrf: request.headers()["x-csrf-token"] ?? "", body });
      if (body.currentPassword !== "current-password") {
        return json(route, 401, {
          error: {
            code: "reauthentication_failed",
            message: "current password is invalid",
            field: "currentPassword",
          },
        });
      }
      return json(route, 200, EXPORT_PAYLOAD, {
        "Content-Disposition": "attachment; filename=\"lexigo-export-20260720.json\"",
        "Cache-Control": "no-store",
      });
    }
    if (path === "/api/v1/account" && request.method() === "DELETE") {
      const body = request.postDataJSON() as Record<string, string>;
      deleteRequests.push({ csrf: request.headers()["x-csrf-token"] ?? "", body });
      await route.fulfill({
        status: 204,
        headers: {
          "Clear-Site-Data": "\"cache\", \"storage\"",
          "Cache-Control": "no-store",
        },
      });
      return;
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
  return { exportRequests, deleteRequests };
}

test("data export requires the current password and downloads versioned JSON", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Browser download contract is asserted once in Chromium.");
  const api = await installAPI(page);

  await page.goto("/profile");
  const panel = page.getByRole("region", { name: "Данные и удаление аккаунта" });
  await expect(panel).toBeVisible();
  const exportCard = panel.getByRole("article").filter({ hasText: "Скачать JSON" });
  await exportCard.getByRole("button", { name: "Скачать мои данные" }).click();
  await expect(exportCard.getByRole("alert")).toHaveText("Введите текущий пароль");

  await exportCard.getByLabel("Текущий пароль").fill("wrong-password");
  await exportCard.getByRole("button", { name: "Скачать мои данные" }).click();
  await expect(exportCard.getByRole("alert")).toHaveText("current password is invalid");

  await exportCard.getByLabel("Текущий пароль").fill("current-password");
  const downloadPromise = page.waitForEvent("download");
  await exportCard.getByRole("button", { name: "Скачать мои данные" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("lexigo-export-20260720.json");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(JSON.parse(Buffer.concat(chunks).toString("utf8"))).toEqual(EXPORT_PAYLOAD);
  await expect(panel.getByRole("status")).toHaveText("Выгрузка сформирована и передана браузеру.");

  expect(api.exportRequests).toEqual([
    { csrf: "account-export-csrf", body: { currentPassword: "wrong-password" } },
    { csrf: "account-export-csrf", body: { currentPassword: "current-password" } },
  ]);
});

test("account deletion requires email, password and irreversible-action acknowledgement", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Destructive account form is asserted once in Chromium.");
  const api = await installAPI(page);

  await page.goto("/profile");
  const panel = page.getByRole("region", { name: "Данные и удаление аккаунта" });
  const dangerCard = panel.getByRole("article").filter({ hasText: "Удалить аккаунт" });
  await dangerCard.getByRole("button", { name: "Удалить аккаунт навсегда" }).click();
  await expect(dangerCard.getByText("Введите текущий пароль")).toBeVisible();
  await expect(dangerCard.getByText("Введите email аккаунта")).toBeVisible();
  await expect(dangerCard.getByText("Подтвердите, что понимаете последствия")).toBeVisible();

  await dangerCard.getByLabel("Текущий пароль").fill("current-password");
  await dangerCard.getByLabel(`Введите ${SESSION.user.email}`).fill("different@example.com");
  await dangerCard.getByRole("checkbox").check();
  await dangerCard.getByRole("button", { name: "Удалить аккаунт навсегда" }).click();
  await expect(dangerCard.getByText("Email не совпадает с адресом аккаунта")).toBeVisible();
  expect(api.deleteRequests).toEqual([]);

  await dangerCard.getByLabel(`Введите ${SESSION.user.email}`).fill(SESSION.user.email);
  await dangerCard.getByRole("button", { name: "Удалить аккаунт навсегда" }).click();
  await expect(page).toHaveURL(/\/profile\?account=deleted$/);
  await expect(page.getByRole("status")).toContainText("Аккаунт и связанные учебные данные удалены.");
  await expect(page.getByRole("heading", { name: "Сохраняйте прогресс на всех устройствах" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Данные и удаление аккаунта" })).toHaveCount(0);

  expect(api.deleteRequests).toEqual([{
    csrf: "account-export-csrf",
    body: {
      currentPassword: "current-password",
      confirmationEmail: SESSION.user.email,
    },
  }]);
});
