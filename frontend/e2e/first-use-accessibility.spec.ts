import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000201",
    email: "first-use-a11y@example.com",
    displayName: "First Use A11y",
    createdAt: "2026-08-16T00:00:00Z",
  },
  tokens: {
    accessToken: "first-use-a11y-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROMPT = {
  position: 0,
  id: 20101,
  kind: "word",
  lemma: "schema evolution",
  phonetic: "/ˈskiːmə/",
  partOfSpeech: "noun",
  topic: "Data Engineering",
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installGuest(context: BrowserContext) {
  await context.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/refresh") {
      return json(route, 401, { error: { code: "unauthorized", message: "guest" } });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function installAuthenticatedOnboarding(context: BrowserContext) {
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "first-use-a11y-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/onboarding" && request.method() === "GET") {
      return json(route, 200, { state: "not_started", total: 0, marked: 0 });
    }
    if (path === "/api/v1/onboarding/start" && request.method() === "POST") {
      return json(route, 200, { state: "in_progress", total: 1, marked: 0, current: PROMPT });
    }
    if (path === "/api/v1/auth/sessions") return json(route, 200, { sessions: [] });
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function expectNoSeriousAccessibilityViolations(page: Parameters<typeof test>[0] extends never ? never : import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter((violation) => (
    violation.impact === "serious" || violation.impact === "critical"
  ));
  expect(blocking).toEqual([]);
}

test.describe("First Use accessibility", () => {
  test.describe.configure({ timeout: 90_000 });

  test("Guest Home has one focused main flow and passes axe", async ({ context, page }) => {
    await installGuest(context);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const guest = page.locator('[data-route-client-island="guest-home"]');
    await expect(guest).toBeVisible();
    await expect(page.locator('#lexigo-main-content[aria-label="Главная"]')).toBeVisible();
    await expect(page.locator("[data-route-navigation]:visible")).toHaveCount(0);

    await expectNoSeriousAccessibilityViolations(page);

    const primary = page.getByRole("button", { name: "Настроить первый урок" });
    await primary.focus();
    await expect(primary).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL((url) => (
      url.pathname === "/profile" && url.searchParams.get("return_to") === "/onboarding"
    ));
  });

  test("onboarding role and diagnostic choices are keyboard operable and pass axe", async ({ context, page }) => {
    await installAuthenticatedOnboarding(context);
    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-route-client-island="onboarding"]')).toBeVisible();
    await expect(page.locator("[data-route-navigation]:visible")).toHaveCount(0);
    await expect(page.getByRole("radiogroup", { name: "Ваша рабочая роль" })).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);

    const backend = page.getByRole("radio", { name: "Backend Engineer" });
    await backend.focus();
    await page.keyboard.press("Space");
    await expect(backend).toHaveAttribute("aria-checked", "true");

    const continueButton = page.getByRole("button", { name: "Продолжить" });
    await continueButton.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: "Что уже знакомо?" })).toBeVisible();
    const markGroup = page.getByRole("radiogroup", { name: "Насколько знаком термин" });
    await expect(markGroup).toBeVisible();
    const unsure = page.getByRole("radio", { name: "Не уверен" });
    await unsure.focus();
    await page.keyboard.press("Space");
    await expect(unsure).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("эволюция схемы", { exact: true })).toHaveCount(0);

    await expectNoSeriousAccessibilityViolations(page);
  });
});
