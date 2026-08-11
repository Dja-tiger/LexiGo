import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const phrasesApp = readFileSync(new URL("./lexigo-phrases-app.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("./phrases-catalog.tsx", import.meta.url), "utf8");
const appRouterJourney = readFileSync(new URL("../e2e/app-router-routes.spec.ts", import.meta.url), "utf8");
const uiOwnershipJourney = readFileSync(new URL("../e2e/ui-ownership.spec.ts", import.meta.url), "utf8");
const acceptanceJourney = readFileSync(new URL("../e2e/phrases-search-acceptance.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #75 Phrases search acceptance source contract", () => {
  it("keeps guest and authenticated search fields aligned", () => {
    expect(phrasesApp).toContain("[item.prompt, item.answer, item.topic, ...item.examples]");
    expect(phrasesApp).toContain('parameters.set("topic", activeFilters.topic)');
    expect(phrasesApp).toContain('parameters.set("query", activeFilters.query)');
    expect(acceptanceJourney).toContain("phrase.lemma, phrase.translation, phrase.topic, ...phrase.examples");
    expect(acceptanceJourney).toContain('search.fill("первопричину")');
    expect(acceptanceJourney).toContain('search.fill("smoke checks are green")');
  });

  it("keeps topic controls semantic and exposes selected state", () => {
    expect(catalog).toContain('aria-pressed={filters.topic === topic}');
    expect(catalog).toContain('type="radio"');
    expect(catalog).toContain('checked={filters.topic === topic}');
    expect(catalog).toContain('aria-label="Фильтры каталога фраз"');
    expect(acceptanceJourney).toContain("await releaseChip.click()");
    expect(acceptanceJourney).toContain('toHaveAttribute("aria-pressed", "true")');
    expect(acceptanceJourney).toContain("await expect(releaseRadio).toBeChecked()");
  });

  it("keeps query and topic combined in URL-backed History state with stable filter identity", () => {
    expect(phrasesApp).toContain("const filters = useMemo(() => phraseCatalogFilters(navigation), [navigation]);");
    expect(phrasesApp).not.toContain("const filters = phraseCatalogFilters(navigation);");
    expect(phrasesApp).toContain("phraseCatalogTarget");
    expect(phrasesApp).toContain('window.addEventListener("popstate", syncNavigation)');
    expect(acceptanceJourney).toContain('["первопричину", "Release"]');
    expect(acceptanceJourney).toContain("await page.goBack()");
    expect(acceptanceJourney).toContain("await page.goForward()");
  });

  it("keeps result count, clear/reset and truthful empty state in React", () => {
    expect(catalog).toContain('aria-live="polite"');
    expect(catalog).toContain('`${info.total.toLocaleString("ru-RU")} результатов`');
    expect(catalog).toContain('aria-label="Очистить поиск"');
    expect(catalog).toContain("Сбросить фильтры");
    expect(catalog).toContain('kind="empty"');
    expect(acceptanceJourney).toContain('getByText("1 результатов", { exact: true })');
    expect(acceptanceJourney).toContain('name: "Каталог фраз пуст"');
  });

  it("keeps detail return, filter state and scroll restoration covered", () => {
    expect(phrasesApp).toContain("writeNavigationScrollSnapshot");
    expect(phrasesApp).toContain("scheduleNavigationScrollRestoration");
    expect(appRouterJourney).toContain('test("phrase Back restores catalog filters, page and scroll"');
    expect(acceptanceJourney).toContain("toBeGreaterThan(500)");
  });

  it("keeps sorting React/data-layer owned without DOM injection", () => {
    expect(catalog).toContain('<select\n            aria-label="Сортировка каталога"');
    expect(catalog).toContain('data-lexigo-sort-for="phrases"');
    expect(uiOwnershipJourney).toContain('test("phrase sorting is React state, persists across reload and creates one toolbar"');
    expect(phrasesApp).not.toContain("MutationObserver");
    expect(phrasesApp).not.toContain("document.createElement");
    expect(catalog).not.toContain("MutationObserver");
    expect(catalog).not.toContain("document.createElement");
  });

  it("registers the focused browser acceptance suite in authoritative UI CI", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    expect(uiCommand).toContain("e2e/phrases-search-acceptance.spec.ts");
    expect(uiCommand.match(/e2e\/phrases-search-acceptance\.spec\.ts/g)).toHaveLength(1);
  });
});
