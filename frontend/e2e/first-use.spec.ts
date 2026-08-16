import { expect, test, type BrowserContext, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000201",
    email: "first-use@example.com",
    displayName: "First Use User",
    createdAt: "2026-08-16T00:00:00Z",
  },
  tokens: {
    accessToken: "first-use-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROMPT_ONE = {
  position: 0,
  id: 20101,
  kind: "word",
  lemma: "schema evolution",
  phonetic: "/ˈskiːmə/",
  partOfSpeech: "noun",
  topic: "Data Engineering",
};

const PROMPT_TWO = {
  position: 1,
  id: 20102,
  kind: "phrase",
  lemma: "roll back safely",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Backend Development",
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

type OnboardingFixture = {
  state: "not_started" | "in_progress" | "completed" | "skipped";
  total: number;
  marked: number;
  current?: typeof PROMPT_ONE;
  markAttempts: number;
  failFirstMark: boolean;
  marks: string[];
  starts: number;
  skips: number;
  completes: number;
};

function snapshot(state: OnboardingFixture) {
  return {
    state: state.state,
    total: state.total,
    marked: state.marked,
    ...(state.current ? { current: state.current } : {}),
  };
}

async function installGuestAPI(context: BrowserContext) {
  const requested: string[] = [];
  await context.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    requested.push(path);
    if (path === "/api/v1/auth/refresh") {
      return json(route, 401, { error: { code: "unauthorized", message: "guest" } });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
  return requested;
}

async function installOnboardingAPI(
  context: BrowserContext,
  initial: Partial<OnboardingFixture> = {},
): Promise<OnboardingFixture> {
  const state: OnboardingFixture = {
    state: "not_started",
    total: 0,
    marked: 0,
    markAttempts: 0,
    failFirstMark: false,
    marks: [],
    starts: 0,
    skips: 0,
    completes: 0,
    ...initial,
  };

  await context.addCookies([{
    name: "lexigo_csrf",
    value: "first-use-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/onboarding" && request.method() === "GET") return json(route, 200, snapshot(state));

    if (path === "/api/v1/onboarding/start" && request.method() === "POST") {
      state.starts += 1;
      state.state = "in_progress";
      state.total = 2;
      state.marked = 0;
      state.current = PROMPT_ONE;
      return json(route, 200, snapshot(state));
    }

    if (path === `/api/v1/onboarding/items/${state.current?.id ?? 0}/mark` && request.method() === "POST") {
      state.markAttempts += 1;
      const body = request.postDataJSON() as { mark?: string };
      if (body.mark) state.marks.push(body.mark);
      if (state.failFirstMark && state.markAttempts === 1) {
        return json(route, 500, { error: { code: "temporary_failure", message: "temporary failure" } });
      }
      const markedID = state.current?.id ?? 0;
      const translation = markedID === PROMPT_ONE.id ? "эволюция схемы" : "безопасно откатить";
      state.marked += 1;
      const completeReady = state.marked >= state.total;
      return json(route, 200, {
        marked: state.marked,
        total: state.total,
        completeReady,
        reveal: { id: markedID, translation },
      });
    }

    if (path === "/api/v1/onboarding/complete" && request.method() === "POST") {
      state.completes += 1;
      state.state = "completed";
      delete state.current;
      return json(route, 200, snapshot(state));
    }

    if (path === "/api/v1/onboarding/skip" && request.method() === "POST") {
      state.skips += 1;
      state.state = "skipped";
      delete state.current;
      return json(route, 200, snapshot(state));
    }

    if (path === "/api/v1/auth/sessions") return json(route, 200, { sessions: [] });
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  return state;
}

test.describe.configure({ timeout: 90_000 });

test("guest Home is truthful, preserves Browser Back, and routes First Use through authentication", async ({ context, page }) => {
  const requested = await installGuestAPI(context);

  await page.goto("/");
  const guest = page.locator('[data-route-client-island="guest-home"]');
  await expect(guest).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Английский|Первый полезный урок/);
  await expect(page.getByText("Без fake progress")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Учебный статус" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Открыть прогресс" })).toHaveCount(0);
  await expect(page.locator(".lx-route-nav:visible")).toHaveCount(0);
  await expect(page.locator(".lx-route-reminder-entry:visible")).toHaveCount(0);

  expect(requested.filter((path) => path === "/api/v1/progress")).toEqual([]);
  expect(requested.filter((path) => path === "/api/v1/lessons/active")).toEqual([]);

  await page.getByRole("button", { name: "Настроить первый урок" }).click();
  await expect(page).toHaveURL((url) => (
    url.pathname === "/profile"
    && url.searchParams.get("return_to") === "/onboarding"
  ));

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(guest).toBeVisible();
  await expect(page.getByRole("heading", { name: "Учебный статус" })).toHaveCount(0);
});

test("guest direct onboarding entry is guarded and preserves the exact return target", async ({ context, page }) => {
  await installGuestAPI(context);

  await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL((url) => (
    url.pathname === "/profile"
    && url.searchParams.get("session") === "required"
    && url.searchParams.get("return_to") === "/onboarding"
  ));
  await expect(page.locator('[data-route-client-island="onboarding"]')).toHaveCount(0);
});

test("diagnostic never reveals an answer before a successful mark and completes on server state", async ({ context, page }, testInfo) => {
  test.skip(!["desktop-chromium", "ios-webkit"].includes(testInfo.project.name), "Core reveal sequencing runs once per engine family.");
  const state = await installOnboardingAPI(context, { failFirstMark: true });

  await page.goto("/onboarding");
  await expect(page.locator('[data-route-client-island="onboarding"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Настроим полезный первый урок" })).toBeVisible();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByText("schema evolution", { exact: true })).toBeVisible();
  await expect(page.getByText("эволюция схемы", { exact: true })).toHaveCount(0);

  await page.getByRole("radio", { name: "Не уверен" }).click();
  await page.getByRole("button", { name: "Сохранить отметку" }).click();
  await expect(page.getByText("эволюция схемы", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("temporary failure");

  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByText("эволюция схемы", { exact: true })).toBeVisible();
  await expect(page.getByText("Вы отметили: Не уверен")).toBeVisible();
  expect(state.marks).toEqual(["unsure", "unsure"]);

  state.current = PROMPT_TWO;
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByText("roll back safely", { exact: true })).toBeVisible();
  await expect(page.getByText("эволюция схемы", { exact: true })).toHaveCount(0);

  await page.getByRole("radio", { name: "Знаю" }).click();
  await page.getByRole("button", { name: "Сохранить отметку" }).click();
  await expect(page.getByText("безопасно откатить", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("heading", { name: "Персональная очередь готова" })).toBeVisible();
  expect(state.completes).toBe(1);
});

test("in-progress state resumes after reload and skip stays server-backed", async ({ context, page }, testInfo) => {
  test.skip(!["desktop-webkit", "android-chromium"].includes(testInfo.project.name), "Resume/skip runs once per remaining engine/device family.");
  const state = await installOnboardingAPI(context, {
    state: "in_progress",
    total: 12,
    marked: 4,
    current: PROMPT_ONE,
  });

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Продолжим диагностику" })).toBeVisible();
  await expect(page.getByText("Прогресс сохранён: 4 ответов. Этот термин — следующий.")).toBeVisible();
  await expect(page.getByText("эволюция схемы", { exact: true })).toHaveCount(0);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Продолжим диагностику" })).toBeVisible();
  await expect(page.getByText("эволюция схемы", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Пропустить диагностику" }).click();
  await expect(page.getByRole("heading", { name: "Пропустить диагностику?" })).toBeVisible();
  await page.getByRole("button", { name: "Продолжить без диагностики" }).click();
  await expect(page.getByRole("heading", { name: "Диагностика пропущена" })).toBeVisible();
  expect(state.skips).toBe(1);
});
