import { expect, test, type Page, type Route } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PHRASES,
} from "./support/quality-gates";

function phraseSearchValues(phrase: (typeof QUALITY_PHRASES)[number]): string[] {
  return [phrase.lemma, phrase.translation, phrase.topic, ...phrase.examples];
}

async function fulfillFilteredPhrases(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  if (url.pathname !== "/api/v1/words" || url.searchParams.get("kind") !== "phrase") {
    await route.fallback();
    return;
  }

  const query = (url.searchParams.get("query") ?? "").trim().toLocaleLowerCase("ru-RU");
  const topic = url.searchParams.get("topic") ?? "all";
  const sort = url.searchParams.get("sort") ?? "default";
  const requestedPage = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.max(1, Number(url.searchParams.get("limit") ?? "48"));

  const filtered = QUALITY_PHRASES.filter((phrase) => {
    if (topic !== "all" && phrase.topic !== topic) return false;
    if (!query) return true;
    return phraseSearchValues(phrase)
      .some((value) => value.toLocaleLowerCase("ru-RU").includes(query));
  });
  const ordered = [...filtered];
  if (sort === "az") ordered.sort((left, right) => left.lemma.localeCompare(right.lemma, "en"));
  if (sort === "za") ordered.sort((left, right) => right.lemma.localeCompare(left.lemma, "en"));

  const totalPages = ordered.length === 0 ? 0 : Math.ceil(ordered.length / pageSize);
  const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const items = ordered.slice(offset, offset + pageSize);

  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      items,
      count: items.length,
      total: ordered.length,
      page,
      pageSize,
      totalPages,
      hasPrevious: page > 1,
      hasNext: totalPages > 0 && page < totalPages,
    }),
  });
}

function phrases(page: Page) {
  return page.getByRole("list", { name: "Результаты каталога фраз" });
}

async function expectCatalogState(page: Page, expected: {
  query: string | null;
  topic: string | null;
  prompts: string[];
}): Promise<void> {
  await expect.poll(() => {
    const url = new URL(page.url());
    return {
      query: url.searchParams.get("query"),
      topic: url.searchParams.get("topic"),
    };
  }).toEqual({ query: expected.query, topic: expected.topic });

  await expect.poll(async () => phrases(page).getByRole("listitem").locator("strong").allTextContents())
    .toEqual(expected.prompts);
}

test.describe("Issue #75 Phrases search acceptance", () => {
  test.beforeEach(async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The acceptance journey runs in desktop Chromium and iOS WebKit.",
    );
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
    await page.route("**/api/v1/words?*", fulfillFilteredPhrases);
  });

  test("search, topic, History, empty/reset and detail return remain one URL-backed contract", async ({ page }) => {
    await page.goto("/phrases", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
    await expect(page.locator('.lx-catalog-sort[data-lexigo-sort-for="phrases"]')).toHaveCount(1);

    const search = page.getByRole("searchbox", { name: "Поиск по фразам" });
    await search.fill("первопричину");
    await page.getByRole("button", { name: "Найти", exact: true }).click();
    await expectCatalogState(page, {
      query: "первопричину",
      topic: null,
      prompts: ["We need to identify the root cause."],
    });
    await expect(page.getByText("1 результатов", { exact: true })).toBeVisible();

    const releaseRadio = page.locator('input[type="radio"][name="phrase-topic"][value="Release"]');
    const releaseChip = page
      .getByRole("navigation", { name: "Быстрый выбор темы" })
      .getByRole("button", { name: /Релиз|Release/ });
    await releaseChip.click();
    await expect(releaseChip).toHaveAttribute("aria-pressed", "true");
    await expect(releaseRadio).toBeChecked();
    await expect.poll(() => {
      const url = new URL(page.url());
      return [url.searchParams.get("query"), url.searchParams.get("topic")];
    }).toEqual(["первопричину", "Release"]);

    const empty = page.getByRole("status", { name: "Каталог фраз пуст" });
    await expect(empty).toContainText("По заданным условиям фразы не найдены");
    await expect(empty).toContainText("Текущие фильтры сохранены в адресе страницы");

    await page.goBack();
    await expectCatalogState(page, {
      query: "первопричину",
      topic: null,
      prompts: ["We need to identify the root cause."],
    });
    await page.goForward();
    await expect(empty).toBeVisible();
    await expect(releaseRadio).toBeChecked();

    await empty.getByRole("button", { name: "Сбросить фильтры" }).click();
    await expectCatalogState(page, {
      query: null,
      topic: null,
      prompts: QUALITY_PHRASES.map((phrase) => phrase.lemma),
    });
    await expect(search).toHaveValue("");

    await search.fill("smoke checks are green");
    await page.getByRole("button", { name: "Найти", exact: true }).click();
    await expectCatalogState(page, {
      query: "smoke checks are green",
      topic: null,
      prompts: ["The deployment is complete."],
    });

    await page.evaluate(() => {
      document.body.style.minHeight = "2800px";
      window.scrollTo({ top: 720, behavior: "auto" });
      window.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(120);
    await phrases(page).getByRole("link", { name: /The deployment is complete/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "The deployment is complete." })).toBeVisible();
    await page.goBack();
    await expectCatalogState(page, {
      query: "smoke checks are green",
      topic: null,
      prompts: ["The deployment is complete."],
    });
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(500);
    await expect(page.locator('.lx-catalog-sort[data-lexigo-sort-for="phrases"]')).toHaveCount(1);
  });
});
