import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const dictionary = readFileSync(new URL("./lexigo-dictionary-app.tsx", import.meta.url), "utf8");
const premium = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");

function sourceIndex(source: string, marker: string): number {
  const index = source.lastIndexOf(marker);
  expect(index, `missing source marker ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe("Dictionary route island source contract", () => {
  it("loads one dedicated entry for Dictionary and Word Detail routes", () => {
    expect(bootstrap).toContain('import("./lexigo-dictionary-app")');
    expect(bootstrap).toContain('normalized === "/dictionary" || normalized.startsWith("/words/")');
    expect(bootstrap).toContain("useDictionaryIsland");
    expect(bootstrap).toContain("<LexigoDictionaryApp");
  });

  it("selects the canonical Dictionary island before the compatibility fallback for guest and authenticated canonical entry", () => {
    expect(bootstrap).toContain(
      'const useDictionaryIsland = effectiveRouteGraph === "dictionary" && isDictionaryRoute(pathname);',
    );
    expect(bootstrap).not.toContain("useDictionaryIsland = initialSession");
    expect(dictionary).toContain("initialSession: Session | null;");

    const dictionaryRender = sourceIndex(bootstrap, "<LexigoDictionaryApp");
    const compatibilityFallback = sourceIndex(bootstrap, "<LexigoPremiumApp");
    expect(compatibilityFallback).toBeGreaterThan(dictionaryRender);
  });

  it("uses the Dictionary graph for direct entry, reload and new-tab reconstruction", () => {
    expect(bootstrap).toContain('if (isDictionaryRoute(pathname)) return "dictionary";');
    expect(bootstrap).toContain("historyRouteGraph(normalizedCurrentPath");
    expect(bootstrap).toContain("routeGraphForPath(pathname)");
  });

  it("preserves the product graph for product-owned Dictionary history entries", () => {
    expect(bootstrap).toContain(
      'return candidate === "product" || candidate === "dictionary" ? candidate : "dictionary";',
    );
    expect(bootstrap).toContain('[ROUTE_GRAPH_HISTORY_KEY]: routeGraph');
    expect(premium).toContain("function renderLibrary()");
    expect(premium).toContain("<DictionaryCatalog");
  });

  it("keeps URL, History, scroll restoration and product-route handoff in the canonical owner", () => {
    const canonicalContracts = [
      "parseNavigationLocation(window.location)",
      "createNavigationHistoryState",
      'window.addEventListener("popstate", syncNavigation)',
      "createScrollSnapshotScheduler",
      "scheduleNavigationScrollRestoration",
      'if (target.view !== "library")',
      "PRODUCT_ROUTE_GRAPH_EVENT",
      "router.push(url, { scroll: false })",
    ] as const;

    for (const marker of canonicalContracts) {
      expect(dictionary, `canonical Dictionary contract ${marker}`).toContain(marker);
    }
  });

  it("does not duplicate persistent bootstrap and outbox owners", () => {
    expect(dictionary).not.toContain("ReviewOutboxRuntime");
    expect(dictionary).not.toContain("restoreBootstrappedSession");
    expect(dictionary).not.toContain("subscribeAppearanceRuntime");
    expect(dictionary).not.toContain("ServiceWorkerRegistration");
  });

  it("records a two-sided boundary rather than claiming the compatibility family is dead", () => {
    const liveCompatibilityMarkers = [
      "function renderLibrary()",
      "<DictionaryCatalog",
      "loadDictionaryPage",
      "loadDictionaryDetail",
      "requestAuthentication(\"library\")",
    ] as const;

    for (const marker of liveCompatibilityMarkers) {
      expect(premium, `live Dictionary compatibility marker ${marker}`).toContain(marker);
    }
  });
});