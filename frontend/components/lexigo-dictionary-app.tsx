"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  failedResourceStatus,
  isItemsResponsePayload,
  isLearningItemPayload,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { authorizedJSON, requestJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import {
  isCatalogMetadataPayload,
  type CatalogMetadata,
  type CatalogMetadataStatus,
} from "../lib/catalog-metadata";
import { CATALOG_PAGE_SIZE, catalogPageInfo } from "../lib/catalog-page";
import { normalizePartOfSpeech, type LearningItem } from "../lib/learning";
import {
  navigationURL,
  parseNavigationLocation,
  viewTitle,
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
import { reportProductJourney, type ProductJourneyIntent } from "../lib/product-journey";
import type { ProgressSummary } from "../lib/progress";
import { AsyncResourceNotice } from "./async-state";
import {
  DictionaryCatalog,
  type DictionaryFilters,
  type DictionaryPageResult,
  type DictionarySource,
} from "./dictionary-catalog";

type APIItem = {
  id: number;
  kind?: "word" | "phrase";
  slug?: string;
  lemma: string;
  translation: string;
  phonetic: string;
  partOfSpeech: string;
  topic: string;
  aliases?: string[];
  acceptedAnswers?: string[];
  examples: string[];
  note: string;
  cloze?: string;
  clozeAnswer?: string;
  status: string;
};

type ItemsResponse = {
  items: APIItem[];
  count: number;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

type DictionaryRouteAppProps = {
  initialSession: Session | null;
  onSessionUpdated: (session: Session) => void;
};

type PendingNavigation = {
  identity: string;
  scroll: NavigationScrollPosition;
};

function toLearningItem(item: APIItem): LearningItem {
  return {
    id: `word-${item.id}`,
    wordId: item.id,
    kind: "word",
    slug: item.slug,
    prompt: item.lemma,
    answer: item.translation,
    phonetic: item.phonetic,
    partOfSpeech: item.partOfSpeech,
    section: normalizePartOfSpeech(item.partOfSpeech),
    topic: item.topic,
    aliases: item.aliases,
    acceptedAnswers: item.acceptedAnswers,
    examples: item.examples,
    note: item.note,
    status: item.status,
    cloze: item.cloze,
    clozeAnswer: item.clozeAnswer,
  };
}

function navigationWithoutDetail(target: NavigationTarget): NavigationTarget {
  const result = { ...target };
  delete result.detail;
  return result;
}

function FlameIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22c4 0 7-2.9 7-7 0-3.2-1.8-5.8-4.5-8.4.1 2.4-.8 3.8-2 4.7.1-3.7-1.7-6.7-4.4-9.3.1 4.4-3.1 6.5-3.1 10.8C5 18 8 22 12 22Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

export function LexigoDictionaryApp({ initialSession, onSessionUpdated }: DictionaryRouteAppProps) {
  const session = initialSession;
  const [navigation, setNavigation] = useState<NavigationTarget>(() => parseNavigationLocation(window.location));
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null);
  const [metadataStatus, setMetadataStatus] = useState<CatalogMetadataStatus>("loading");
  const [metadataResourceStatus, setMetadataResourceStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(() => (
    initialSession ? loadingResourceStatus() : readyResourceStatus()
  ));
  const mainContentRef = useRef<HTMLElement | null>(null);
  const navigationRef = useRef(navigation);

  const adoptSession = useCallback((next: Session) => {
    if (initialSession?.tokens.accessToken !== next.tokens.accessToken) onSessionUpdated(next);
  }, [initialSession?.tokens.accessToken, onSessionUpdated]);

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
    const scheduleScrollSnapshot = () => scrollSnapshots.schedule();
    const flushScrollSnapshot = () => scrollSnapshots.flush();
    const flushScrollSnapshotWhenHidden = () => {
      if (document.visibilityState === "hidden") flushScrollSnapshot();
    };
    const syncNavigation = (event: PopStateEvent) => {
      const next = navigationTargetFromHistory(event.state, window.location.search);
      const scroll = navigationScrollFromHistory(event.state);
      navigationRef.current = next;
      setPendingNavigation({ identity: navigationIdentity(next), scroll });
      setNavigation(next);
      writePersistedNavigation(window.localStorage, next);
    };

    navigationRef.current = navigation;
    writePersistedNavigation(window.localStorage, navigation);
    window.addEventListener("popstate", syncNavigation);
    window.addEventListener("scroll", scheduleScrollSnapshot, { passive: true });
    window.addEventListener("pagehide", flushScrollSnapshot);
    document.addEventListener("visibilitychange", flushScrollSnapshotWhenHidden);
    return () => {
      flushScrollSnapshot();
      scrollSnapshots.cancel();
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", syncNavigation);
      window.removeEventListener("scroll", scheduleScrollSnapshot);
      window.removeEventListener("pagehide", flushScrollSnapshot);
      document.removeEventListener("visibilitychange", flushScrollSnapshotWhenHidden);
    };
  }, []);

  useLayoutEffect(() => {
    navigationRef.current = navigation;
    if (!pendingNavigation || pendingNavigation.identity !== navigationIdentity(navigation)) return;
    const frame = window.requestAnimationFrame(() => {
      mainContentRef.current?.focus({ preventScroll: true });
      window.scrollTo({
        left: pendingNavigation.scroll.x,
        top: pendingNavigation.scroll.y,
        behavior: "auto",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [navigation, pendingNavigation]);

  const loadMetadata = useCallback(async (signal?: AbortSignal) => {
    setMetadataStatus("loading");
    setMetadataResourceStatus(loadingResourceStatus());
    try {
      const result = await requestJSON<CatalogMetadata>(
        "/api/v1/catalog/metadata",
        { signal },
        undefined,
        isCatalogMetadataPayload,
      );
      if (signal?.aborted) return;
      setMetadata(result);
      setMetadataStatus("ready");
      setMetadataResourceStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setMetadata(null);
      setMetadataStatus("error");
      setMetadataResourceStatus(failedResourceStatus(error, "состав каталога"));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadMetadata(controller.signal), 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadMetadata]);

  const loadProgress = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setProgress(null);
      setProgressStatus(failedResourceStatus(error, "прогресс"));
    }
  }, [adoptSession]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (!session) {
        setProgress(null);
        setProgressStatus(readyResourceStatus());
        return;
      }
      void loadProgress(session, controller.signal);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadProgress, session]);

  const loadPage = useCallback(async (
    filters: DictionaryFilters,
    signal: AbortSignal,
  ): Promise<DictionaryPageResult> => {
    if (!session) throw new Error("Войдите, чтобы открыть словарь");
    const parameters = new URLSearchParams({
      kind: "word",
      page: String(filters.page),
      limit: String(CATALOG_PAGE_SIZE),
      sort: filters.sort,
    });
    if (filters.source) parameters.set("source", filters.source);
    if (filters.topic) parameters.set("topic", filters.topic);
    if (filters.query) parameters.set("query", filters.query);
    if (filters.status) parameters.set("status", filters.status);

    const result = await authorizedJSON<ItemsResponse>(
      session,
      `/api/v1/words?${parameters.toString()}`,
      { signal },
      isItemsResponsePayload,
    );
    adoptSession(result.activeSession);
    return {
      items: result.data.items.map(toLearningItem),
      info: catalogPageInfo(result.data),
    };
  }, [adoptSession, session]);

  const loadDetail = useCallback(async (wordID: number, signal: AbortSignal): Promise<LearningItem> => {
    if (!session) throw new Error("Войдите, чтобы открыть карточку слова");
    const result = await authorizedJSON<APIItem>(
      session,
      `/api/v1/words/${wordID}`,
      { signal },
      isLearningItemPayload,
    );
    adoptSession(result.activeSession);
    return toLearningItem(result.data);
  }, [adoptSession, session]);

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
    const state = createNavigationHistoryState(target, scroll);
    if (replace) window.history.replaceState(state, "", navigationURL(target));
    else window.history.pushState(state, "", navigationURL(target));
    window.dispatchEvent(new PopStateEvent("popstate", { state }));
  }, []);

  const configureLesson = useCallback((context: { source: DictionarySource; topic?: string }) => {
    navigate({
      view: "learn",
      source: context.source,
      ...(context.topic ? { topic: context.topic } : {}),
    }, false, { x: 0, y: 0 }, "catalog_configure_lesson");
  }, [navigate]);

  const initial = useMemo(() => session?.user.displayName.trim().charAt(0).toUpperCase()
    || session?.user.email.charAt(0).toUpperCase()
    || "L", [session]);

  return (
    <div className="lx-app" data-route-client-island="dictionary">
      <header className="lx-header">
        <div className="lx-header-tools">
          {session && progress ? <span className="lx-streak" aria-label={`Серия: ${progress.currentStreak} дней`}><FlameIcon /><span>{progress.currentStreak} дн.</span></span> : null}
          <button
            className="lx-icon-button"
            type="button"
            aria-label="Напоминание о занятии"
            onClick={() => document.querySelector<HTMLElement>(".lx-route-reminder-entry summary")?.click()}
          >
            <BellIcon />
          </button>
          <button
            className="lx-avatar"
            type="button"
            aria-label="Открыть профиль"
            onClick={() => navigate({ view: "profile" })}
          >
            {initial}
          </button>
        </div>
      </header>
      <div className="lx-app-shell">
        <main
          id="lexigo-main-content"
          ref={mainContentRef}
          className="lx-main-content"
          tabIndex={-1}
          aria-label={viewTitle("library")}
        >
          {session ? (
            <div className="lx-resource-stack">
              <AsyncResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgress(session)} />
              <AsyncResourceNotice label="Состав каталога" status={metadataResourceStatus} onRetry={() => void loadMetadata()} />
            </div>
          ) : null}
          <div className="lx-view">
            <DictionaryCatalog
              authenticated={Boolean(session)}
              navigation={navigation}
              metadata={metadata}
              metadataStatus={metadataStatus}
              progress={progress}
              loadPage={loadPage}
              loadDetail={loadDetail}
              onNavigate={navigate}
              onBackToResults={() => navigate(navigationWithoutDetail(navigation), true)}
              onConfigureLesson={configureLesson}
              onRequireAuthentication={() => navigate({ view: "profile" }, false, { x: 0, y: 0 }, "authentication")}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
