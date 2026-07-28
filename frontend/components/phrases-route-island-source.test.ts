import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const phrases = readFileSync(new URL("./lexigo-phrases-app.tsx", import.meta.url), "utf8");
const premium = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("./phrases-catalog.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("./phrase-detail-presentation.tsx", import.meta.url), "utf8");

describe("Phrases route island source contract", () => {
  it("loads one dedicated entry for the catalog and direct detail routes", () => {
    expect(bootstrap).toContain('import("./lexigo-phrases-app")');
    expect(bootstrap).toContain('normalized === "/phrases" || normalized.startsWith("/phrases/")');
    expect(bootstrap).toContain("usePhrasesIsland");
    expect(bootstrap).toContain("<LexigoPhrasesApp");
    expect(phrases).toContain('data-route-client-island="phrases"');
  });

  it("selects the Phrases island before the compatibility fallback for guest and authenticated entry", () => {
    expect(bootstrap).toContain(
      'const usePhrasesIsland = effectiveRouteGraph === "product" && isPhrasesRoute(pathname);',
    );
    expect(bootstrap).not.toContain("usePhrasesIsland = initialSession");

    const phrasesRender = bootstrap.lastIndexOf("<LexigoPhrasesApp");
    const compatibilityFallback = bootstrap.lastIndexOf("<LexigoPremiumApp");

    expect(phrasesRender).toBeGreaterThanOrEqual(0);
    expect(compatibilityFallback).toBeGreaterThan(phrasesRender);
    expect(phrases).toContain("initialSession: Session | null;");
    expect(phrases).toContain("const GUEST_PHRASES");
    expect(phrases).toContain("function guestCatalog");
  });

  it("does not import the compatibility graph or persistent runtime owners", () => {
    expect(phrases).not.toContain('from "./lexigo-premium-app"');
    expect(phrases).not.toContain("LexigoPremiumApp");
    expect(phrases).not.toContain("ReviewOutboxRuntime");
    expect(phrases).not.toContain("ServiceWorkerRegistration");
    expect(phrases).not.toContain("restoreBootstrappedSession");
    expect(phrases).not.toContain("/api/v1/auth/refresh");
    expect(phrases).not.toContain("indexedDB");
  });

  it("keeps server ordering, bounded pages and direct detail independent", () => {
    expect(phrases).toContain('kind: "phrase"');
    expect(phrases).toContain('source: "phrases"');
    expect(phrases).toContain("limit: String(CATALOG_PAGE_SIZE)");
    expect(phrases).toContain("result.data.items.map(phraseFromAPI)");
    expect(phrases).not.toContain("sortCatalogEntries(result.data.items");
    expect(phrases).toContain('`/api/v1/phrases/${encodeURIComponent(slug)}`');
    expect(phrases).toContain("if (detailSlug) return;");
  });

  it("preserves URL, History and existing Learn handoff ownership", () => {
    expect(phrases).toContain("phraseCatalogTarget");
    expect(phrases).toContain("createNavigationHistoryState");
    expect(phrases).toContain('window.addEventListener("popstate", syncNavigation)');
    expect(phrases).toContain('view: "learn", source: "phrases"');
    expect(phrases).toContain('view: "library"');
    expect(phrases).toContain("shouldUseNativeNavigation(event)");
  });

  it("keeps search controls outside resilient result states and direct detail semantic", () => {
    expect(catalog).toContain('role="search"');
    expect(catalog).toContain("<ResultsSurface");
    expect(catalog).toContain('kind="empty"');
    expect(catalog).toContain('kind="error"');
    expect(detail).toContain('aria-label="Карточка фразы"');
    expect(detail).toContain("<SpeechPlayerButton");
    expect(detail).toContain("Настроить урок");
  });

  it("records the exact compatibility catalog and detail deletion surface", () => {
    const deletionCandidates = [
      "const [phraseCatalog, setPhraseCatalog]",
      "const [phraseCatalogStatus, setPhraseCatalogStatus]",
      "const [remotePhraseDetail, setRemotePhraseDetail]",
      "const [phraseDetailStatus, setPhraseDetailStatus]",
      "const [phraseCatalogPageInfo, setPhraseCatalogPageInfo]",
      "const [phrasePage, setPhrasePage]",
      "const [phraseSearchInput, setPhraseSearchInput]",
      "const [phraseSearch, setPhraseSearch]",
      "const [phraseTopic, setPhraseTopic]",
      "const [phraseSortMode, setPhraseSortMode]",
      "const loadPhraseCatalogResource",
      "const loadPhraseDetailResource",
      "function openPhraseDetail",
      "function backToPhraseCatalog",
      "function changePhrasePage",
      "function applyPhraseSearch",
      "function clearPhraseSearch",
      "function renderPhrases",
      '`/api/v1/phrases/${encodeURIComponent(slug)}`',
    ] as const;

    for (const marker of deletionCandidates) {
      expect(premium, `compatibility deletion candidate ${marker}`).toContain(marker);
    }
  });

  it("preserves live phrase lesson-domain behavior outside the route deletion surface", () => {
    const sharedLessonContracts = [
      'type LessonSource = WordSection | "phrases";',
      '{ value: "phrases", label: "Технические фразы"',
      "mixedLessonFallbackMessage",
      'exerciseKind: currentItem.kind === "phrase" ? "cloze" : "translation"',
    ] as const;

    for (const marker of sharedLessonContracts) {
      expect(premium, `shared phrase lesson contract ${marker}`).toContain(marker);
    }
  });
});
