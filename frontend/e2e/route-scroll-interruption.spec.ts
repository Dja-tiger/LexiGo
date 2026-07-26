import { expect, test, type Page, type Route } from "@playwright/test";

const METADATA = {
  catalogVersion: "sha256:route-scroll-interruption-e2e",
  updatedAt: "2026-07-26T00:00:00Z",
  totals: { items: 36, words: 0, phrases: 36 },
  sources: {
    mixed: 36,
    noun: 0,
    verb: 0,
    adjective: 0,
    phrases: 36,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 18,
    backend: 18,
    academicTechnicalEnglish: 0,
  },
  topics: [
    { topic: "Data Engineering", count: 18 },
    { topic: "Backend Development", count: 18 },
  ],
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function visiblePrimaryNavigation(page: Page, view: "library") {
  const controls = page.locator(`[data-navigation-view="${view}"]`);
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (await control.isVisible()) return control;
  }
  throw new Error(`No visible primary navigation control for ${view}`);
}

test("explicit wheel input cancels unreachable route scroll restoration", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One deterministic browser proves the interruption lifecycle.");

  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    return json(route, 401, { error: { code: "unauthorized", message: "guest" } });
  });

  await page.goto("/progress");
  await expect(page.locator('[data-route-client-island="progress"]')).toBeVisible();

  await page.evaluate(() => {
    sessionStorage.setItem("lexigo.route-tab.v1.library", JSON.stringify({
      lexigo: true,
      version: 1,
      target: { view: "phrases" },
      scroll: { x: 0, y: 50_000 },
    }));

    const runtime = window as typeof window & {
      __lexigoRestoreWrites?: Array<{ left: number; top: number; behavior: ScrollBehavior | undefined }>;
    };
    const nativeScrollTo = window.scrollTo.bind(window);
    runtime.__lexigoRestoreWrites = [];
    window.scrollTo = ((first?: ScrollToOptions | number, second?: number) => {
      if (typeof first === "object" && first !== null) {
        runtime.__lexigoRestoreWrites?.push({
          left: first.left ?? window.scrollX,
          top: first.top ?? window.scrollY,
          behavior: first.behavior,
        });
        nativeScrollTo(first);
        return;
      }
      nativeScrollTo(first ?? 0, second ?? 0);
    }) as typeof window.scrollTo;
  });

  await (await visiblePrimaryNavigation(page, "library")).click();
  await expect(page).toHaveURL((url) => url.pathname === "/phrases");
  await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", "Технические фразы");
  await expect.poll(() => page.evaluate(() => (
    (window as typeof window & { __lexigoRestoreWrites?: unknown[] }).__lexigoRestoreWrites?.length ?? 0
  ))).toBeGreaterThan(0);

  await page.evaluate(() => window.dispatchEvent(new WheelEvent("wheel", { deltaY: 240 })));
  const writesAfterInterruption = await page.evaluate(() => (
    (window as typeof window & { __lexigoRestoreWrites?: unknown[] }).__lexigoRestoreWrites?.length ?? 0
  ));

  await page.waitForTimeout(250);
  const result = await page.evaluate(() => {
    const writes = (window as typeof window & {
      __lexigoRestoreWrites?: Array<{ behavior: ScrollBehavior | undefined }>;
    }).__lexigoRestoreWrites ?? [];
    return {
      count: writes.length,
      behaviors: writes.map((write) => write.behavior),
    };
  });

  expect(result.count).toBe(writesAfterInterruption);
  expect(result.behaviors.length).toBeGreaterThan(0);
  expect(result.behaviors.every((behavior) => behavior === "auto")).toBe(true);
  await expect(page.locator(".lx-route-announcement")).toHaveText("Технические фразы. Экран загружен.");
});
