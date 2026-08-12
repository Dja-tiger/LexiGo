import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentsDirectory = path.join(frontendDirectory, "components");
const appDirectory = path.join(frontendDirectory, "app");

const DICTIONARY_CASCADE_BLOCK = `/* Issue #70: canonical Dictionary computed-cascade ownership. */
.lx-app[data-route-client-island="dictionary"] {
  --lx-dictionary-retained-strong: #146c4e;
  --lx-dictionary-retained-text: #146c4e;
  --lx-dictionary-weak-strong: #a83232;
  --lx-dictionary-weak-text: #a83232;
  --lx-dictionary-learning: #7a4e00;
}

.lx-dictionary-quick-filters button.active,
.lx-dictionary-quick-filters button[aria-pressed="true"],
.lx-dictionary-filter-panel button.active,
.lx-dictionary-filter-panel button[aria-pressed="true"] {
  color: #ffffff;
  background: var(--lx-dictionary-retained-strong);
}

.lx-dictionary-quick-filters button.weak {
  color: var(--lx-dictionary-weak-text);
}

.lx-dictionary-quick-filters button.weak[aria-pressed="true"] {
  color: #ffffff;
  background: var(--lx-dictionary-weak-strong);
}

.lx-dictionary-status[data-tone="mastered"] {
  color: var(--lx-dictionary-retained-text);
}

.lx-dictionary-status[data-tone="review"] {
  color: var(--lx-dictionary-weak-text);
}

.lx-dictionary-filter-toggle > span:first-child:last-child {
  min-width: 0;
  min-height: 0;
  display: inline;
  border-radius: 0;
  color: inherit;
  background: transparent;
  font-size: inherit;
}

@media (prefers-color-scheme: dark) {
  .lx-app[data-route-client-island="dictionary"] {
    --lx-dictionary-retained-text: #7ee2b8;
    --lx-dictionary-weak-text: #ff9f9f;
    --lx-dictionary-learning: #f6d27b;
  }
}`;

const WORD_DETAIL_CONTRAST_BLOCK = `/* Issue #70: canonical Word Detail dark contrast ownership. */
@media (prefers-color-scheme: dark) {
  .lx-routed-app[data-route-path^="/words/"] .lx-word-detail-example h2 {
    color: #9fb7ff;
  }
}`;

const ROUTE_CHROME_CONTRAST_BLOCK = `/* Issue #70: canonical Word Detail route-chrome contrast ownership. */
@media (prefers-color-scheme: dark) {
  .lx-routed-app[data-route-path^="/words/"] .lx-route-nav--rail > .active[aria-current="page"][data-navigation-view="library"] > span > span {
    color: #9fb7ff;
  }
}`;

function readSource(directory: string, file: string): string {
  return readFileSync(path.join(directory, file), "utf8");
}

function occurrenceCount(source: string, value: string): number {
  return source.split(value).length - 1;
}

describe("Word Detail production ownership", () => {
  it("keeps Word Detail inside the existing Dictionary client island", () => {
    const bootstrap = readSource(componentsDirectory, "lexigo-bootstrapped-app.tsx");
    const dictionaryApp = readSource(componentsDirectory, "lexigo-dictionary-app.tsx");
    const catalog = readSource(componentsDirectory, "dictionary-catalog.tsx");

    expect(bootstrap).toContain('normalized.startsWith("/words/")');
    expect(bootstrap.match(/<LexigoDictionaryApp\b/g)).toHaveLength(1);
    expect(dictionaryApp).toContain('data-route-client-island="dictionary"');
    expect(dictionaryApp).not.toContain("restoreSession");
    expect(catalog).toContain('import { WordDetailRoute } from "./word-detail-route"');
  });

  it("hands the canonical URL and explicit graph owner to History after pathname settlement", () => {
    const bootstrap = readSource(componentsDirectory, "lexigo-bootstrapped-app.tsx");

    expect(bootstrap).toContain('const ROUTE_GRAPH_HISTORY_KEY = "lexigoRouteGraph"');
    expect(bootstrap).toContain("function historyRouteGraph(pathname: string, state: unknown): RouteGraph");
    expect(bootstrap).toContain("const settleRouteGraph = () => {");
    expect(bootstrap).toContain("normalizedPathname(window.location.pathname) !== expectedPath");
    expect(bootstrap).toContain("window.requestAnimationFrame(settleRouteGraph)");
    expect(bootstrap).toContain("parseNavigation(window.location.search, window.location.pathname)");
    expect(bootstrap).toContain("mergedNavigationHistoryState(canonicalTarget, expectedGraph)");
    expect(bootstrap).toContain("window.history.replaceState(");
    expect(bootstrap).toContain("window.cancelAnimationFrame(frame)");
    expect(bootstrap).not.toContain("productGraphTimer");
  });

  it("loads direct detail without starting catalog metadata, progress or page requests", () => {
    const dictionaryApp = readSource(componentsDirectory, "lexigo-dictionary-app.tsx");
    const catalog = readSource(componentsDirectory, "dictionary-catalog.tsx");

    expect(dictionaryApp).toContain("const detailActive = Boolean(navigation.detail)");
    expect(dictionaryApp.match(/if \(detailActive\) return;/g)).toHaveLength(2);
    expect(catalog.match(/if \(navigation\.detail\) return;/g)).toHaveLength(1);
    expect(catalog).not.toContain("if (!authenticated || navigation.detail) return;");
    expect(dictionaryApp).toContain("`/api/v1/catalog/words/${wordID}`");
    expect(dictionaryApp).toContain("`/api/v1/words/${wordID}`");
  });

  it("uses bounded server-owned related phrase search and preserves response order", () => {
    const dictionaryApp = readSource(componentsDirectory, "lexigo-dictionary-app.tsx");

    expect(dictionaryApp).toContain('kind: "phrase"');
    expect(dictionaryApp).toContain('limit: "3"');
    expect(dictionaryApp).toContain('query: item.prompt');
    expect(dictionaryApp).toContain("return result.data.items.map(toLearningItem);");
    expect(dictionaryApp).not.toMatch(/\.sort\([^\n]*related/i);
  });

  it("creates a lesson with exactly the selected word and keeps Active Lesson ownership external", () => {
    const dictionaryApp = readSource(componentsDirectory, "lexigo-dictionary-app.tsx");

    expect(dictionaryApp).toContain("wordIds: [item.wordId]");
    expect(dictionaryApp).toContain('navigate({ view: "lesson", detail: "active" }');
    expect(dictionaryApp).not.toContain("ReviewLessonWord");
    expect(dictionaryApp).not.toContain("lessonVersion");
  });

  it("keeps each proven contrast and catalog cascade block in its canonical owner", () => {
    const dictionary = readSource(appDirectory, "dictionary-catalog.css");
    const wordDetail = readSource(appDirectory, "word-detail.css");
    const routeNavigation = readSource(appDirectory, "route-navigation.css");

    expect(occurrenceCount(dictionary, DICTIONARY_CASCADE_BLOCK)).toBe(1);
    expect(occurrenceCount(wordDetail, WORD_DETAIL_CONTRAST_BLOCK)).toBe(1);
    expect(occurrenceCount(routeNavigation, ROUTE_CHROME_CONTRAST_BLOCK)).toBe(1);
    expect(wordDetail).not.toContain("route-chrome contrast ownership");
    expect(routeNavigation).not.toContain("canonical Word Detail dark contrast ownership");
  });

  it("retires the obsolete compatibility stylesheet and import", () => {
    const catalog = readSource(componentsDirectory, "dictionary-catalog.tsx");
    const layout = readSource(appDirectory, "layout.tsx");

    expect(catalog).not.toContain("Настроить урок по этой теме");
    expect(existsSync(path.join(appDirectory, "dictionary-detail-compatibility.css"))).toBe(false);
    expect(layout).not.toContain("dictionary-detail-compatibility.css");
    expect(layout).toContain('import "./dictionary-catalog.css";');
    expect(layout).toContain('import "./word-detail.css";');
  });
});
