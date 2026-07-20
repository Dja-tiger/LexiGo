import { expect, test, type Page } from "@playwright/test";

const ROUTES = ["/", "/learn", "/phrases", "/dictionary", "/progress"] as const;
const FATAL_RUNTIME_PATTERN = /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed|hydration failed|UI_RENDER_FAILURE|UI_VERSION_MISMATCH|ROOT_RENDER_FAILURE|ROOT_VERSION_MISMATCH/i;

function captureFatalRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("crash", () => errors.push("pagecrash: browser renderer terminated"));
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.name}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (FATAL_RUNTIME_PATTERN.test(text)) errors.push(`console: ${text}`);
  });
  return errors;
}

test.describe.configure({ mode: "serial" });

for (const route of ROUTES) {
  test(`${route} remains usable after hydration and scrolling`, async ({ page }) => {
    const fatalErrors = captureFatalRuntimeErrors(page);
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response).not.toBeNull();
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('[data-app-router-shell="true"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /LexiGo/ })).toBeVisible();

    await page.evaluate(async () => {
      const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      for (let index = 0; index < 48; index += 1) {
        window.scrollTo({ top: index % 2 === 0 ? maximumScroll : 0, behavior: "auto" });
        window.dispatchEvent(new Event("scroll"));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }
    });
    await page.waitForTimeout(2_000);

    await expect(page.locator('[data-testid="application-error-boundary"]')).toHaveCount(0);
    await expect(page.getByText("LexiGo не смог открыть страницу", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Загружены файлы разных версий", { exact: false })).toHaveCount(0);
    expect(fatalErrors).toEqual([]);
  });
}
