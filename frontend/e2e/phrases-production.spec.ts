import { expect, test, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PHRASES,
} from "./support/quality-gates";

function phrasePrompts(page: Page) {
  return page
    .getByRole("list", { name: "Результаты каталога фраз" })
    .getByRole("listitem")
    .locator("strong")
    .allTextContents();
}

test.describe("Phrases production route contracts", () => {
  test.beforeEach(async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Production ownership contracts run once in desktop Chromium.");
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("authenticated catalog forwards URL state and preserves server order", async ({ page }) => {
    const catalogRequests: URL[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/v1/words" && url.searchParams.get("kind") === "phrase") {
        catalogRequests.push(url);
      }
    });

    await page.goto("/phrases?topic=Incident&query=root&sort=za&page=2", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
    await expect.poll(() => catalogRequests.length).toBeGreaterThan(0);

    const request = catalogRequests.at(-1);
    expect(request?.searchParams.get("kind")).toBe("phrase");
    expect(request?.searchParams.get("source")).toBe("phrases");
    expect(request?.searchParams.get("topic")).toBe("Incident");
    expect(request?.searchParams.get("query")).toBe("root");
    expect(request?.searchParams.get("sort")).toBe("za");
    expect(request?.searchParams.get("page")).toBe("2");
    expect(Number(request?.searchParams.get("limit"))).toBeLessThanOrEqual(48);

    await expect.poll(() => phrasePrompts(page)).toEqual(QUALITY_PHRASES.map((phrase) => phrase.lemma));
    await expect(page).toHaveURL(/\/phrases\?topic=Incident&query=root&sort=za&page=2$/);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(() => phrasePrompts(page)).toEqual(QUALITY_PHRASES.map((phrase) => phrase.lemma));
    await expect(page).toHaveURL(/\/phrases\?topic=Incident&query=root&sort=za&page=2$/);
  });

  test("direct Phrase Detail loads only its detail resource", async ({ page }) => {
    const requestedAPI: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.startsWith("/api/v1/")) requestedAPI.push(`${request.method()} ${url.pathname}${url.search}`);
    });

    await page.goto(`/phrases/${QUALITY_PHRASES[0].slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: QUALITY_PHRASES[0].lemma })).toBeVisible();
    await expect.poll(() => requestedAPI.some((entry) => entry.includes(`/api/v1/phrases/${QUALITY_PHRASES[0].slug}`))).toBe(true);

    expect(requestedAPI.some((entry) => entry.includes("/api/v1/catalog/metadata"))).toBe(false);
    expect(requestedAPI.some((entry) => entry.includes("/api/v1/progress"))).toBe(false);
    expect(requestedAPI.some((entry) => /\/api\/v1\/words(?:\?|$)/.test(entry))).toBe(false);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: QUALITY_PHRASES[0].lemma })).toBeVisible();
  });

  test("lesson configuration hands off source and selected topic to Learn", async ({ page }) => {
    await page.goto("/phrases?topic=Incident", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();

    await page.getByRole("button", { name: "Урок по теме" }).click();
    await expect(page).toHaveURL(/\/learn\?source=phrases&topic=Incident$/);
    await expect(page.locator('[data-route-client-island="learn"]')).toBeVisible();
  });
});
