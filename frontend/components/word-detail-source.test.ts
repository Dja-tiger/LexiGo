import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentsDirectory = path.join(frontendDirectory, "components");
const appDirectory = path.join(frontendDirectory, "app");

function readSource(directory: string, file: string): string {
  return readFileSync(path.join(directory, file), "utf8");
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
    expect(catalog).toContain("if (!authenticated || navigation.detail) return;");
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

  it("keeps the two proven dark contrast corrections route-local", () => {
    const compatibility = readSource(appDirectory, "dictionary-detail-compatibility.css");

    expect(compatibility).toContain('.lx-routed-app[data-route-path^="/words/"] .lx-word-detail-example h2');
    expect(compatibility).toContain('.active[aria-current="page"][data-navigation-view="library"]');
    expect(compatibility).toContain("color: #9fb7ff;");
  });

  it("retires the old topic-wide detail CTA and compatibility presentation", () => {
    const catalog = readSource(componentsDirectory, "dictionary-catalog.tsx");
    const compatibility = readSource(appDirectory, "dictionary-detail-compatibility.css");
    const layout = readSource(appDirectory, "layout.tsx");

    expect(catalog).not.toContain("Настроить урок по этой теме");
    expect(compatibility).not.toContain("lx-dictionary-detail-card");
    expect(layout).toContain('import "./word-detail.css";');
  });
});
