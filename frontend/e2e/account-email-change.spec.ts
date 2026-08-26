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
    backend: 1, academicTechnicalEnglish: 0,
  },
  topics: [],
};

type Appearance = "light" | "dark";

type ConfirmationSnapshot = Readonly<{
  appearance: Appearance;
  geometry: Readonly<{ left: number; top: number; width: number; height: number }>;
  clientWidth: number;
  documentWidth: number;
  card: Readonly<{ background: string; color: string; border: string; shadow: string }>;
  eyebrow: string;
  body: string;
  action: Readonly<{ background: string; color: string }>;
  tokens: Readonly<{
    surface: string;
    subtle: string;
    primary: string;
    retained: string;
    weak: string;
    text: string;
    muted: string;
    elevation2: string;
  }>;
  expected: Readonly<{
    cardBorder: string;
    successBorder: string;
    successBackground: string;
    errorBorder: string;
    errorBackground: string;
  }>;
}>;

type ConfirmationStatusSnapshot = Readonly<{
  success: Readonly<{ background: string; color: string; border: string }>;
  error: Readonly<{ background: string; color: string; border: string }>;
}>;

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

async function installInitialAppearance(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (localStorage.getItem("lexigo.appearance.v1") === null) {
      localStorage.setItem("lexigo.appearance.v1", "light");
    }
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
}

async function switchAppearance(page: Page, appearance: Appearance): Promise<void> {
  await page.evaluate((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function snapshotConfirmation(page: Page, appearance: Appearance): Promise<ConfirmationSnapshot> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await expect(page.getByRole("region", { name: "Подтвердить новый адрес" })).toBeVisible();

  return page.evaluate((currentAppearance) => {
    const root = document.documentElement;
    const confirmation = document.querySelector<HTMLElement>(".lx-email-confirmation");
    const card = document.querySelector<HTMLElement>(".lx-email-confirmation-card");
    const eyebrow = card?.querySelector<HTMLElement>(":scope > span");
    const body = card?.querySelector<HTMLElement>(":scope > p");
    const action = card?.querySelector<HTMLButtonElement>(".lx-button.primary");
    if (!confirmation || !card || !eyebrow || !body || !action) {
      throw new Error("Missing email confirmation appearance owner");
    }

    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas color normalization is unavailable");

    const normalizeColor = (value: string) => {
      context.fillStyle = "#000000";
      context.fillStyle = value.trim();
      return context.fillStyle;
    };
    const rootStyle = getComputedStyle(root);
    const token = (name: string) => normalizeColor(rootStyle.getPropertyValue(name));
    const resolveColor = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.append(probe);
      const resolved = normalizeColor(getComputedStyle(probe).color);
      probe.remove();
      return resolved;
    };
    const resolveShadow = (value: string) => {
      const probe = document.createElement("span");
      probe.style.boxShadow = value;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).boxShadow;
      probe.remove();
      return resolved;
    };
    const paint = (element: Element) => {
      const style = getComputedStyle(element);
      return {
        background: normalizeColor(style.backgroundColor),
        color: normalizeColor(style.color),
      };
    };
    const cardStyle = getComputedStyle(card);
    const rect = card.getBoundingClientRect();

    return {
      appearance: currentAppearance,
      geometry: {
        left: Math.round(rect.left * 100) / 100,
        top: Math.round(rect.top * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
      },
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      card: {
        ...paint(card),
        border: normalizeColor(cardStyle.borderTopColor),
        shadow: cardStyle.boxShadow,
      },
      eyebrow: normalizeColor(getComputedStyle(eyebrow).color),
      body: normalizeColor(getComputedStyle(body).color),
      action: paint(action),
      tokens: {
        surface: token("--ak-color-surface"),
        subtle: token("--ak-color-subtle"),
        primary: token("--ak-color-primary"),
        retained: token("--ak-color-retained"),
        weak: token("--ak-color-weak"),
        text: token("--ak-color-text-main"),
        muted: token("--ak-color-text-muted"),
        elevation2: resolveShadow("var(--ak-elevation-2)"),
      },
      expected: {
        cardBorder: resolveColor("color-mix(in srgb, var(--ak-color-primary) 28%, var(--ak-color-subtle))"),
        successBorder: resolveColor("color-mix(in srgb, var(--ak-color-retained) 52%, var(--ak-color-subtle))"),
        successBackground: resolveColor("color-mix(in srgb, var(--ak-color-retained) 16%, var(--ak-color-surface))"),
        errorBorder: resolveColor("color-mix(in srgb, var(--ak-color-weak) 52%, var(--ak-color-subtle))"),
        errorBackground: resolveColor("color-mix(in srgb, var(--ak-color-weak) 16%, var(--ak-color-surface))"),
      },
    } satisfies ConfirmationSnapshot;
  }, appearance);
}

async function snapshotConfirmationStatuses(page: Page): Promise<ConfirmationStatusSnapshot> {
  await expect(page.locator(".lx-email-confirmation-card .lx-account-notice.error")).toBeVisible();

  return page.evaluate(() => {
    const card = document.querySelector<HTMLElement>(".lx-email-confirmation-card");
    const error = card?.querySelector<HTMLElement>(".lx-account-notice.error");
    if (!card || !error) throw new Error("Missing email confirmation error status");

    const syntheticSuccess = document.createElement("div");
    syntheticSuccess.className = "lx-account-notice success";
    syntheticSuccess.textContent = "semantic-success-probe";
    card.append(syntheticSuccess);

    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      syntheticSuccess.remove();
      throw new Error("Canvas color normalization is unavailable");
    }
    const normalizeColor = (value: string) => {
      context.fillStyle = "#000000";
      context.fillStyle = value.trim();
      return context.fillStyle;
    };
    const paint = (element: Element) => {
      const style = getComputedStyle(element);
      return {
        background: normalizeColor(style.backgroundColor),
        color: normalizeColor(style.color),
        border: normalizeColor(style.borderTopColor),
      };
    };

    const result = {
      success: paint(syntheticSuccess),
      error: paint(error),
    } satisfies ConfirmationStatusSnapshot;
    syntheticSuccess.remove();
    return result;
  });
}

function expectSemanticConfirmation(snapshot: ConfirmationSnapshot): void {
  expect(snapshot.documentWidth).toBeLessThanOrEqual(snapshot.clientWidth + 1);
  expect(snapshot.card.background).toBe(snapshot.tokens.surface);
  expect(snapshot.card.color).toBe(snapshot.tokens.text);
  expect(snapshot.card.border).toBe(snapshot.expected.cardBorder);
  expect(snapshot.card.shadow).toBe(snapshot.tokens.elevation2);
  expect(snapshot.eyebrow).toBe(snapshot.tokens.primary);
  expect(snapshot.body).toBe(snapshot.tokens.muted);
  expect(snapshot.action.background).toBe(snapshot.tokens.primary);
  expect(snapshot.action.color).toBe(snapshot.tokens.surface);
}

function expectSemanticStatuses(
  status: ConfirmationStatusSnapshot,
  snapshot: ConfirmationSnapshot,
): void {
  expect(status.success.background).toBe(snapshot.expected.successBackground);
  expect(status.success.color).toBe(snapshot.tokens.text);
  expect(status.success.border).toBe(snapshot.expected.successBorder);
  expect(status.error.background).toBe(snapshot.expected.errorBackground);
  expect(status.error.color).toBe(snapshot.tokens.text);
  expect(status.error.border).toBe(snapshot.expected.errorBorder);
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
  const changedEmailNotice = page.getByRole("status").filter({ hasText: "Email изменён" });
  await expect(changedEmailNotice).toContainText("Email изменён");
  await expect(changedEmailNotice).toContainText("Войдите с новым адресом");

  expect(confirmations).toEqual([{
    body: { token: "one-time-email-token" },
    authorization: "",
    csrf: "",
  }]);
});

test("email confirmation follows explicit Light/Dark semantic paint without geometry drift", async ({ page }) => {
  await installBaseAPI(page);
  await installInitialAppearance(page);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    if (path === "/api/v1/progress") return json(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return json(route, 404, { error: { code: "active_lesson_not_found", message: "not found" } });
    }
    if (path === "/api/v1/auth/sessions") return json(route, 200, { sessions: [] });
    if (path === "/api/v1/auth/audit-events") return json(route, 200, { events: [] });
    if (path === "/api/v1/account/email-change/confirm") {
      return json(route, 400, { error: { code: "invalid_email_change_token", message: "Ссылка подтверждения недействительна" } });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/profile#email_change_token=appearance-proof", { waitUntil: "domcontentloaded" });
  const light = await snapshotConfirmation(page, "light");
  expectSemanticConfirmation(light);
  await page.getByRole("region", { name: "Подтвердить новый адрес" })
    .getByRole("button", { name: "Подтвердить email" })
    .click();
  await expect(page.locator(".lx-email-confirmation-card .lx-account-notice.error")).toHaveText(
    "Ссылка подтверждения недействительна",
  );
  expectSemanticStatuses(await snapshotConfirmationStatuses(page), light);

  await switchAppearance(page, "dark");
  const dark = await snapshotConfirmation(page, "dark");
  expectSemanticConfirmation(dark);
  await page.getByRole("region", { name: "Подтвердить новый адрес" })
    .getByRole("button", { name: "Подтвердить email" })
    .click();
  await expect(page.locator(".lx-email-confirmation-card .lx-account-notice.error")).toHaveText(
    "Ссылка подтверждения недействительна",
  );
  expectSemanticStatuses(await snapshotConfirmationStatuses(page), dark);

  expect(dark.geometry).toEqual(light.geometry);
  expect(dark.card.background).not.toBe(light.card.background);
  expect(dark.card.color).not.toBe(light.card.color);
  expect(dark.action.background).not.toBe(light.action.background);
  expect(runtimeErrors).toEqual([]);
});