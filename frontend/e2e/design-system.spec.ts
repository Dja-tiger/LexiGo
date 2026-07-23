import { expect, test } from "@playwright/test";

test.describe("code-first design system", () => {
  test("renders foundations without booting the authenticated product shell", async ({ page }) => {
    let apiRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/v1/")) apiRequests += 1;
    });

    await page.goto("/design-system");

    await expect(page.getByRole("heading", { level: 1, name: "LexiGo Design System" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Семантическая палитра" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Типографическая шкала" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Сетка и плотность" })).toBeVisible();
    await expect(page.locator('[data-token-category="color"] [data-token]')).toHaveCount(12);
    await expect(page.locator('[data-token-category="spacing"] [data-token]')).toHaveCount(8);
    await expect(page.locator(".lx-routed-app")).toHaveCount(0);
    expect(apiRequests).toBe(0);
  });

  test("keeps controls accessible and the mobile canvas free of horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/design-system");

    const primary = page.getByRole("button", { name: "Начать урок" });
    await expect(primary).toBeVisible();
    await expect(primary).toHaveCSS("min-height", "44px");
    await expect(page.getByRole("button", { name: "Недоступно" })).toBeDisabled();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  test("resolves shared motion durations to zero for reduced-motion users", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/design-system");

    const duration = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--lx-duration-normal").trim(),
    );
    expect(duration).toBe("0ms");
  });
});
