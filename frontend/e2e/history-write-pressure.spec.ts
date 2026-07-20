import { expect, test, type Page, type Route } from "@playwright/test";

const METADATA = {
  catalogVersion: "sha256:history-pressure-e2e",
  updatedAt: "2026-07-20T00:00:00Z",
  totals: { items: 2, words: 1, phrases: 1 },
  sources: {
    mixed: 2,
    noun: 1,
    verb: 0,
    adjective: 0,
    phrases: 1,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 1,
  },
  topics: [{ topic: "Frontend Reliability", count: 2, words: 1, phrases: 1 }],
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installGuestAPI(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/refresh") {
      return json(route, 401, { error: { code: "session_required", message: "guest" } });
    }
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

test("continuous touch-like scrolling does not flood the native History API", async ({ page }, testInfo) => {
  test.skip(
    !["desktop-chromium", "ios-webkit"].includes(testInfo.project.name),
    "History pressure is verified in desktop Chromium and iOS WebKit.",
  );

  const runtimeErrors: string[] = [];
  page.on("crash", () => runtimeErrors.push("page crashed"));
  page.on("pageerror", (error) => runtimeErrors.push(`${error.name}: ${error.message}`));

  await page.addInitScript(() => {
    const trackedWindow = window as typeof window & {
      __lexigoNativeReplaceStateCount?: number;
    };
    const nativeReplaceState = window.history.replaceState;
    trackedWindow.__lexigoNativeReplaceStateCount = 0;
    window.history.replaceState = function trackedReplaceState(...args) {
      trackedWindow.__lexigoNativeReplaceStateCount = (
        trackedWindow.__lexigoNativeReplaceStateCount ?? 0
      ) + 1;
      return nativeReplaceState.apply(this, args);
    };
  });
  await installGuestAPI(page);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  await page.evaluate(() => {
    (window as typeof window & { __lexigoNativeReplaceStateCount?: number })
      .__lexigoNativeReplaceStateCount = 0;
  });

  await page.evaluate(async () => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    for (let frame = 0; frame < 120; frame += 1) {
      window.scrollTo(0, maximum * ((frame + 1) / 120));
      window.dispatchEvent(new Event("scroll"));
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }
  });
  await page.waitForTimeout(700);

  const nativeWrites = await page.evaluate(() => (
    window as typeof window & { __lexigoNativeReplaceStateCount?: number }
  ).__lexigoNativeReplaceStateCount ?? 0);

  expect(nativeWrites).toBeLessThanOrEqual(3);
  await expect(page.getByTestId("application-error-boundary")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
