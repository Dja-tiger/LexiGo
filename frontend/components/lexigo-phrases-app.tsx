"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import {
  failedResourceStatus,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { authenticationURL } from "../lib/auth-return";
import { authorizedJSON, requestJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import { isCatalogMetadataPayload, type CatalogMetadata } from "../lib/catalog-metadata";
import {
  CATALOG_PAGE_SIZE,
  catalogPageInfo,
  paginateCatalogEntries,
  type CatalogPageInfo,
} from "../lib/catalog-page";
import { sortCatalogEntries } from "../lib/catalog-sort";
import { EXPANDED_PHRASES } from "../lib/expanded-phrases";
import type { LearningItem } from "../lib/learning";
import {
  navigationURL,
  parseNavigationLocation,
  writePersistedNavigation,
  type NavigationTarget,
} from "../lib/navigation";
import {
  createNavigationHistoryState,
  navigationIdentity,
  navigationScrollFromHistory,
  navigationTargetFromHistory,
  type NavigationScrollPosition,
} from "../lib/navigation-history";
import { createScrollSnapshotScheduler } from "../lib/navigation-scroll-snapshot";
import {
  readNavigationScrollSnapshot,
  removeNavigationScrollSnapshot,
  scheduleNavigationScrollRestoration,
  writeNavigationScrollSnapshot,
} from "../lib/navigation-scroll-restoration";
import { phraseCatalogFilters, phraseCatalogTarget, type PhraseCatalogFilters } from "../lib/phrase-navigation";
import {
  isPhraseItemPayload,
  isPhraseItemsResponsePayload,
  phraseFromAPI,
  phraseSlug,
  type PhraseAPIItem,
  type PhraseCatalogResult,
  type PhraseItem,
  type PhraseItemsResponse,
} from "../lib/phrases";
import type { ProgressSummary } from "../lib/progress";
import { reportProductJourney, type ProductJourneyIntent } from "../lib/product-journey";
import { TECHNICAL_PHRASES } from "../lib/technical-phrases";
import { PhraseDetailPresentation } from "./phrase-detail-presentation";
import { PhrasesCatalog } from "./phrases-catalog";

type LexigoPhrasesAppProps = {
  initialSession: Session | null;
  onSessionUpdated: (session: Session) => void;
};

type PendingNavigation = {
  identity: string;
  scroll: NavigationScrollPosition;
};

const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";
const EMPTY_PAGE_INFO: CatalogPageInfo = {
  total: 0,
  page: 1,
  pageSize: CATALOG_PAGE_SIZE,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

const GUEST_PHRASES: PhraseItem[] = [...TECHNICAL_PHRASES, ...EXPANDED_PHRASES]
  .filter((item) => item.kind === "phrase")
  .map((item, index) => guestPhrase(item, index));

function guestPhrase(item: LearningItem, index: number): PhraseItem {
  return {
    ...item,
    kind: "phrase",
    slug: phraseSlug(item),
    wordId: item.wordId ?? 900_000 + index,
  };
}

function navigationWithoutDetail(target: NavigationTarget): NavigationTarget {
  const next = { ...target };
  delete next.detail;
  return next;
}

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || event.currentTarget.target === "_blank";
}

function guestCatalog(filters: PhraseCatalogFilters): PhraseCatalogResult {
  const query = filters.query.toLocaleLowerCase("ru-RU");
  const filtered = GUEST_PHRASES.filter((item) => {
    if (filters.topic !== "all" && item.topic !== filters.topic) return false;
    if (!query) return true;
    return [item.prompt, item.answer, item.topic, ...item.examples]
      .some((value) => value.toLocaleLowerCase("ru-RU").includes(query));
  });
  const indexByID = new Map(GUEST_PHRASES.map((item, index) => [item.id, index]));
  const ordered = sortCatalogEntries(
    filtered,
    (item) => item.prompt,
    (item) => indexByID.get(item.id) ?? Number.MAX_SAFE_INTEGER,
    filters.sort,
  );
  return paginateCatalogEntries(ordered, filters.page, CATALOG_PAGE_SIZE);
}

function phraseTopics(metadata: CatalogMetadata | null, items: PhraseItem[], selected: string): string[] {
  const topics = new Set<string>();
  metadata?.topics.forEach((entry) => {
    if ((entry.phrases ?? 0) > 0 && entry.topic.trim()) topics.add(entry.topic.trim());
  });
  items.forEach((item) => {
    if (item.topic.trim()) topics.add(item.topic.trim());
  });
  if (selected !== "all") topics.add(selected);
  return [...topics].sort((left, right) => left.localeCompare(right, "ru", { sensitivity: "base" }));
}

export function LexigoPhrasesApp({ initialSession, onSessionUpdated }: LexigoPhrasesAppProps) {
  const router = useRouter();
  const session = initialSession;
  const [initialNavigationState] = useState(() => {
    const target = parseNavigationLocation(window.location);
    const identity = navigationIdentity(target);
    const historyScroll = navigationScrollFromHistory(window.history.state);
    const fallbackScroll = readNavigationScrollSnapshot(window.sessionStorage, identity);
    const scroll = historyScroll.x === 0 && historyScroll.y === 0
      ? fallbackScroll ?? historyScroll
      : historyScroll;
    return {
      target,
      pending: scroll.x === 0 && scroll.y === 0 ? null : { identity, scroll },
    } satisfies { target: NavigationTarget; pending: PendingNavigation | null };
  });
  const [navigation, setNavigation] = useState<NavigationTarget>(initialNavigationState.target);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(initialNavigationState.pending);
  const initialFilters = phraseCatalogFilters(initialNavigationState.target);
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [catalogItems, setCatalogItems] = useState<PhraseItem[]>([]);
  const [pageInfo, setPageInfo] = useState<CatalogPageInfo>(EMPTY_PAGE_INFO);
  const [catalogStatus, setCatalogStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null);
  const [duePhrases, setDuePhrases] = useState<number | null>(null);
  const [detail, setDetail] = useState<PhraseItem | null>(null);
  const [detailStatus, setDetailStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const mainContentRef = useRef<HTMLElement | null>(null);
  const navigationRef = useRef(navigation);
  const searchInputRef = useRef(searchInput);
  const committedQueryRef = useRef(initialFilters.query);
  const filters = useMemo(() => phraseCatalogFilters(navigation), [navigation]);
  const detailSlug = navigation.detail?.trim() || "";

  const adoptSession = useCallback((next: Session) => {
    if (initialSession?.tokens.accessToken !== next.tokens.accessToken) onSessionUpdated(next);
  }, [initialSession?.tokens.accessToken, onSessionUpdated]);

  useEffect(() => {
    searchInputRef.current = searchInput;
  }, [searchInput]);

  useEffect(() => {
    const previousCommitted = committedQueryRef.current;
    committedQueryRef.current = filters.query;
    if (searchInputRef.current === previousCommitted) setSearchInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const persistCurrentEntry = () => {
      const current = navigationRef.current;
      window.history.replaceState(
        createNavigationHistoryState(current, { x: window.scrollX, y: window.scrollY }),
        "",
        window.location.href,
      );
    };
    const scrollSnapshots = createScrollSnapshotScheduler(
      persistCurrentEntry,
      {
        setTimeout: (callback, delayMilliseconds) => window.setTimeout(callback, delayMilliseconds),
        clearTimeout: (timerID) => window.clearTimeout(timerID),
      },
    );
    const syncNavigation = (event: PopStateEvent) => {
      const next = navigationTargetFromHistory(event.state, window.location.search);
      const scroll = navigationScrollFromHistory(event.state);
      navigationRef.current = next;
      setPendingNavigation({ identity: navigationIdentity(next), scroll });
      setNavigation(next);
      writePersistedNavigation(window.localStorage, next);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") scrollSnapshots.flush();
    };

    navigationRef.current = navigation;
    writePersistedNavigation(window.localStorage, navigation);
    window.addEventListener("popstate", syncNavigation);
    window.addEventListener("scroll", scrollSnapshots.schedule, { passive: true });
    window.addEventListener("pagehide", scrollSnapshots.flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      scrollSnapshots.flush();
      scrollSnapshots.cancel();
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", syncNavigation);
      window.removeEventListener("scroll", scrollSnapshots.schedule);
      window.removeEventListener("pagehide", scrollSnapshots.flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, [navigation]);

  useLayoutEffect(() => {
    navigationRef.current = navigation;
    if (!pendingNavigation || pendingNavigation.identity !== navigationIdentity(navigation)) return;
    const pending = pendingNavigation;
    mainContentRef.current?.focus({ preventScroll: true });
    return scheduleNavigationScrollRestoration(
      pending.scroll,
      {
        readPosition: () => ({ x: window.scrollX, y: window.scrollY }),
        writePosition: (position) => window.scrollTo({ left: position.x, top: position.y, behavior: "auto" }),
        requestFrame: (callback) => window.requestAnimationFrame(callback),
        cancelFrame: (frameID) => window.cancelAnimationFrame(frameID),
      },
      (result) => {
        if (result.restored) removeNavigationScrollSnapshot(window.sessionStorage, pending.identity);
        setPendingNavigation((current) => current === pending ? null : current);
      },
    );
  }, [navigation, pendingNavigation]);

  const navigate = useCallback((
    target: NavigationTarget,
    replace = false,
    scroll: NavigationScrollPosition = { x: 0, y: 0 },
    intent: ProductJourneyIntent = "in_app_navigation",
  ) => {
    const current = navigationRef.current;
    const currentScroll = { x: window.scrollX, y: window.scrollY };
    reportProductJourney(current, target, intent);
    window.history.replaceState(
      createNavigationHistoryState(current, currentScroll),
      "",
      window.location.href,
    );

    const url = navigationURL(target);
    if (target.view !== "phrases") {
      writeNavigationScrollSnapshot(window.sessionStorage, navigationIdentity(current), currentScroll);
      window.dispatchEvent(new Event(PRODUCT_ROUTE_GRAPH_EVENT));
      router.push(url, { scroll: false });
      return;
    }

    const state = createNavigationHistoryState(target, scroll);
    if (replace) window.history.replaceState(state, "", url);
    else window.history.pushState(state, "", url);
    navigationRef.current = target;
    setPendingNavigation({ identity: navigationIdentity(target), scroll });
    setNavigation(target);
    writePersistedNavigation(window.localStorage, target);
  }, [router]);

  const requireAuthentication = useCallback(() => {
    const current = navigationRef.current;
    const target: NavigationTarget = { view: "profile" };
    const currentScroll = { x: window.scrollX, y: window.scrollY };
    reportProductJourney(current, target, "authentication");
    window.history.replaceState(
      createNavigationHistoryState(current, currentScroll),
      "",
      window.location.href,
    );
    writeNavigationScrollSnapshot(window.sessionStorage, navigationIdentity(current), currentScroll);
    window.dispatchEvent(new Event(PRODUCT_ROUTE_GRAPH_EVENT));
    router.push(authenticationURL(current), { scroll: false });
  }, [router]);

  const loadMetadata = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await requestJSON<CatalogMetadata>(
        "/api/v1/catalog/metadata",
        { signal },
        undefined,
        isCatalogMetadataPayload,
      );
      if (!signal?.aborted) setMetadata(result);
    } catch {
      if (!signal?.aborted) setMetadata(null);
    }
  }, []);

  const loadProgress = useCallback(async (signal?: AbortSignal) => {
    if (!session) {
      setDuePhrases(null);
      return;
    }
    try {
      const result = await authorizedJSON<ProgressSummary>(
        session,
        `/api/v1/progress?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setDuePhrases(result.data.duePhrases);
    } catch {
      if (!signal?.aborted) setDuePhrases(null);
    }
  }, [adoptSession, session]);

  useEffect(() => {
    if (detailSlug) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadMetadata(controller.signal);
      void loadProgress(controller.signal);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [detailSlug, loadMetadata, loadProgress]);

  const loadCatalog = useCallback(async (activeFilters: PhraseCatalogFilters, signal?: AbortSignal) => {
    setCatalogStatus(loadingResourceStatus());
    try {
      if (!session) {
        const result = guestCatalog(activeFilters);
        if (signal?.aborted) return;
        setCatalogItems(result.items);
        setPageInfo(result.info);
        setCatalogStatus(readyResourceStatus());
        return;
      }
      const parameters = new URLSearchParams({
        kind: "phrase",
        source: "phrases",
        page: String(activeFilters.page),
        limit: String(CATALOG_PAGE_SIZE),
        sort: activeFilters.sort,
      });
      if (activeFilters.topic !== "all") parameters.set("topic", activeFilters.topic);
      if (activeFilters.query) parameters.set("query", activeFilters.query);
      const result = await authorizedJSON<PhraseItemsResponse>(
        session,
        `/api/v1/words?${parameters.toString()}`,
        { signal },
        isPhraseItemsResponsePayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setCatalogItems(result.data.items.map(phraseFromAPI));
      setPageInfo(catalogPageInfo(result.data));
      setCatalogStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setCatalogItems([]);
      setPageInfo(EMPTY_PAGE_INFO);
      setCatalogStatus(failedResourceStatus(error, "каталог фраз"));
    }
  }, [adoptSession, session]);

  useEffect(() => {
    if (detailSlug) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadCatalog(filters, controller.signal), 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [detailSlug, filters, loadCatalog]);

  const loadDetail = useCallback(async (slug: string, signal?: AbortSignal) => {
    setDetailStatus(loadingResourceStatus());
    setDetail(null);
    try {
      if (!session) {
        const item = GUEST_PHRASES.find((candidate) => candidate.slug === slug || candidate.id === slug);
        if (!item) throw new Error("Фраза недоступна в демо-каталоге");
        if (signal?.aborted) return;
        setDetail(item);
        setDetailStatus(readyResourceStatus());
        return;
      }
      const result = await authorizedJSON<PhraseAPIItem>(
        session,
        `/api/v1/phrases/${encodeURIComponent(slug)}`,
        { signal },
        isPhraseItemPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setDetail(phraseFromAPI(result.data));
      setDetailStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setDetail(null);
      setDetailStatus(failedResourceStatus(error, "карточку фразы"));
    }
  }, [adoptSession, session]);

  useEffect(() => {
    if (!detailSlug) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadDetail(detailSlug, controller.signal), 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [detailSlug, loadDetail]);

  const updateFilters = useCallback((next: Partial<PhraseCatalogFilters>, replace = false) => {
    const current = phraseCatalogFilters(navigationRef.current);
    navigate(phraseCatalogTarget({ ...current, ...next }), replace);
  }, [navigate]);

  const configureLesson = useCallback(() => {
    if (!session) {
      requireAuthentication();
      return;
    }
    const topic = detail?.topic || (filters.topic !== "all" ? filters.topic : "");
    navigate({ view: "learn", source: "phrases", ...(topic ? { topic } : {}) }, false, { x: 0, y: 0 }, "lesson_start");
  }, [detail?.topic, filters.topic, navigate, requireAuthentication, session]);

  const topics = useMemo(
    () => phraseTopics(metadata, catalogItems, filters.topic),
    [catalogItems, filters.topic, metadata],
  );

  return (
    <div className="lx-app" data-route-client-island="phrases">
      <div className="lx-app-shell">
        <main
          id="lexigo-main-content"
          ref={mainContentRef}
          className="lx-main-content"
          tabIndex={-1}
          aria-label={detailSlug ? "Карточка фразы" : "Технические фразы"}
        >
          <div className="lx-view">
            {detailSlug ? (
              <PhraseDetailPresentation
                authenticated={Boolean(session)}
                phrase={detail}
                status={detailStatus}
                onBack={() => navigate(navigationWithoutDetail(navigationRef.current), true)}
                onRetry={() => void loadDetail(detailSlug)}
                onConfigureLesson={configureLesson}
                onRequireAuthentication={requireAuthentication}
              />
            ) : (
              <PhrasesCatalog
                authenticated={Boolean(session)}
                duePhrases={duePhrases}
                filters={filters}
                searchInput={searchInput}
                items={catalogItems}
                info={pageInfo}
                topics={topics}
                status={catalogStatus}
                onSearchInputChange={setSearchInput}
                onSearchSubmit={() => updateFilters({ query: searchInput.trim(), page: 1 })}
                onSearchClear={() => {
                  setSearchInput("");
                  updateFilters({ query: "", page: 1 });
                }}
                onTopicChange={(topic) => updateFilters({ topic, page: 1 })}
                onSortChange={(sort) => updateFilters({ sort, page: 1 })}
                onPageChange={(page) => updateFilters({ page })}
                onReset={() => {
                  setSearchInput("");
                  navigate(phraseCatalogTarget({ topic: "all", query: "", sort: "default", page: 1 }));
                }}
                onRetry={() => void loadCatalog(filters)}
                onOpenPhrase={(item, event) => {
                  if (shouldUseNativeNavigation(event)) return;
                  event.preventDefault();
                  navigate(phraseCatalogTarget(filters, item.slug));
                }}
                onConfigureLesson={configureLesson}
                onSwitchToWords={() => navigate({ view: "library" })}
                onRequireAuthentication={requireAuthentication}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
