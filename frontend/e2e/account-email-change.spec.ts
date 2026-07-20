import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000157",
    email: "old-email@example.com",
    displayName: "Email User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "email-change-access-token",
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
  catalogVersion: "sha256:account-email-e2e",
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

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installBaseAPI(page: Page) {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "email-change-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);
}

test("email change request requires reauthentication and sends only the new address", async ({ page }) => {
  await installBaseAPI(page);
  const requests: Array<{ body: Record<string, string>; csrf: string; authorization: string }> = [];

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
    if (path === "/api/v1/account/email-change/request") {
      requests.push({
        body: request.postDataJSON() as Record<string, string>,
        csrf: request.headers()["x-csrf-token"] ?? "",
        authorization: request.headers().authorization ?? "",
      });
      return json(route, 202, { accepted: true });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  await page.goto("/profile");
  const panel = page.getByRole("region", { name: "Изменить email" });
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: "Отправить ссылку подтверждения" }).click();
  await expect(panel.getByRole("alert").first()).toHaveText("Введите текущий пароль");

  await panel.getByLabel("Текущий пароль").fill("current-password");
  await panel.getByLabel("Новый email").fill(SESSION.user.email);
  await panel.getByRole("button", { name: "Отправить ссылку подтверждения" }).click();
  await expect(panel.getByRole("alert")).toHaveText("Новый email должен отличаться от текущего");

  await panel.getByLabel("Новый email").fill("new-email@example.com");
  await panel.getByRole("button", { name: "Отправить ссылку подтверждения" }).click();
  await expect(panel.getByRole("status")).toHaveText("Письмо с одноразовой ссылкой отправлено на новый email.");

  expect(requests).toEqual([{
    body: { currentPassword: "current-password", newEmail: "new-email@example.com" },
    csrf: "email-change-csrf",
    authorization: "Bearer email-change-access-token",
  }]);
});

test("email change token is confirmed publicly and invalidates the local session", async ({ page }) => {
  await installBaseAPI(page);
  const confirmations: Array<{ body: Record<string, string>; authorization: string; csrf: string }> = [];

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
    if (path === "/api/v1/account/email-change/confirm") {
      confirmations.push({
        body: request.postDataJSON() as Record<string, string>,
        authorization: request.headers().authorization ?? "",
        csrf: request.headers()["x-csrf-token"] ?? "",
      });
      return route.fulfill({ status: 204, body: "" });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  await page.goto("/profile#email_change_token=one-time-email-token");
  const confirmation = page.getByRole("region", { name: "Подтвердить новый адрес" });
  await expect(confirmation).toBeVisible();
  expect(page.url()).toContain("#email_change_token=");

  await confirmation.getByRole("button", { name: "Подтвердить email" }).click();
  await expect(page).toHaveURL(/\/profile\?account=email-changed$/);
  await expect(page.getByRole("status")).toContainText("Email изменён");
  await expect(page.getByRole("status")).toContainText("Войдите с новым адресом");

  expect(confirmations).toEqual([{
    body: { token: "one-time-email-token" },
    authorization: "",
    csrf: "",
  }]);
});
