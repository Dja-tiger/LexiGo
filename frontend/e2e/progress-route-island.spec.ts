import { expect, test, type Page } from "@playwright/test";

import { installQualityGateAPI } from "./support/quality-gates";

async function clickPrimaryNavigation(
  page: Page,
  view: "home" | "learn" | "library" | "progress",
): Promise<void> {
  const controls = page.locator(`[data-navigation-view="${view}"]`);
  const count = await controls.count();

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (await control.isVisible()) {
      await control.click();
      return;
    }
  }

  throw new Error(`No visible primary navigation control for ${view}`);
}

test("reuses one session bootstrap across direct Progress entry and repeated route-island navigation", async ({
  context,
  page,
}) => {
  let refreshRequests = 0;
  await installQualityGateAPI(context);
  await context.route("**/api/v1/auth/refresh", async (route) => {
    refreshRequests += 1;
    await route.fallback();
  });

  await page.goto("/progress");
  await expect(page).toHaveURL((url) => url.pathname === "/progress");
  await expect(page.locator('[data-route-client-island="progress"]')).toBeVisible();
  await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", "Прогресс");
  await expect.poll(() => refreshRequests).toBe(1);

  const destinations = [
    { view: "home" as const, pathname: "/", label: "Главная" },
    { view: "learn" as const, pathname: "/learn", label: "Обучение" },
    { view: "library" as const, pathname: "/dictionary", label: "Словарь" },
  ];

  for (const destination of destinations) {
    await clickPrimaryNavigation(page, destination.view);
    await expect(page).toHaveURL((url) => url.pathname === destination.pathname);
    await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", destination.label);

    await clickPrimaryNavigation(page, "progress");
    await expect(page).toHaveURL((url) => url.pathname === "/progress");
    await expect(page.locator('[data-route-client-island="progress"]')).toBeVisible();
    await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", "Прогресс");
    await expect.poll(() => refreshRequests).toBe(1);
  }
});
