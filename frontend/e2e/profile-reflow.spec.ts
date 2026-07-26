import { expect, test, type Page } from "@playwright/test";

import { installQualityGateAPI } from "./support/quality-gates";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function applyTextZoom(page: Page, percent = 200): Promise<void> {
  const stylesheetPath = `/__e2e__/profile-text-zoom-${percent}.css`;
  await page.route(`**${stylesheetPath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      body: `html { font-size: ${percent}% !important; }`,
    });
  });
  await page.addStyleTag({ url: new URL(stylesheetPath, page.url()).toString() });
  await expect.poll(async () => page.evaluate(() => (
    Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
  ))).toBeGreaterThanOrEqual(32);
}

test.describe("Profile reflow and system accessibility preferences", () => {
  test.beforeEach(async ({ context }) => {
    await installQualityGateAPI(context);
  });

  test("reflows explicit Dark Profile at 200% text size on iOS WebKit", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ios-webkit", "Compact WebKit is the highest-risk text reflow contract.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("lexigo.appearance.v1", "dark"));
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await applyTextZoom(page);

    await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Параметры практики" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Интерфейс и устройство" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Безопасность и конфиденциальность" })).toBeVisible();
    await expect(page.locator('[data-route-navigation="mobile"]')).toBeVisible();
    await expect(page.locator('[data-route-navigation="rail"]')).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", "dark");
    await expectNoHorizontalOverflow(page);
  });

  test("keeps Profile controls operable in forced-colors mode", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Forced colors are asserted in Chromium.");
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await page.goto("/profile", { waitUntil: "domcontentloaded" });

    const appearance = page.getByRole("radiogroup", { name: "Оформление приложения" });
    await expect(appearance).toBeVisible();
    await appearance.getByRole("radio", { name: "Светлая: Всегда светлая" }).click();
    await expect(appearance.getByRole("radio", { name: "Светлая: Всегда светлая" })).toHaveAttribute("aria-checked", "true");

    const profileCardStyles = await page.locator(".lx-profile-card").first().evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        borderStyle: style.borderStyle,
        forcedColorAdjust: style.forcedColorAdjust,
      };
    });
    expect(profileCardStyles.borderStyle).not.toBe("none");
    expect(profileCardStyles.forcedColorAdjust).toBe("auto");

    await page.getByRole("button", { name: "Пароль и активные устройства" }).click();
    await expect(page.getByRole("heading", { name: "Пароль и активные устройства" })).toBeFocused();
    await expectNoHorizontalOverflow(page);
  });
});
