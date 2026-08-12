"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  failedResourceStatus,
  idleResourceStatus,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import type { CatalogMetadata, CatalogMetadataStatus } from "../lib/catalog-metadata";
import { CATALOG_PAGE_SIZE, type CatalogPageInfo } from "../lib/catalog-page";
import { catalogStatusLabel, partOfSpeechLabel, topicLabel } from "../lib/interface-copy";
import type { LearningItem, WordSection } from "../lib/learning";
import type { CatalogSort, CatalogStatus, NavigationTarget } from "../lib/navigation";
import type { NavigationScrollPosition } from "../lib/navigation-history";
import type { ProductJourneyIntent } from "../lib/product-journey";
import type { ProgressSummary } from "../lib/progress";
import { isWordDetailItem, type WordDetailItem } from "../lib/word-detail";
import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";
import { CatalogKindNavigation } from "./catalog-kind-navigation";
import { CatalogPagination } from "./catalog-pagination";
import { WordDetailRoute } from "./word-detail-route";

export type DictionarySource = WordSection;

export type DictionaryFilters = {
  source: DictionarySource;
  topic: string;
  status: CatalogStatus | "";
  query: string;
  sort: CatalogSort;
  page: number;
};

export type DictionaryPageResult = {
  items: LearningItem[];
  info: CatalogPageInfo;
};

type DictionaryCatalogProps = {
  authenticated: boolean;
  navigation: NavigationTarget;
  metadata: CatalogMetadata | null;
  metadataStatus: CatalogMetadataStatus;
  progress: ProgressSummary | null;
  loadPage: (filters: DictionaryFilters, signal: AbortSignal) => Promise<DictionaryPageResult>;
  loadDetail: (wordID: number, signal: AbortSignal) => Promise<LearningItem>;
  loadRelatedPhrases?: (item: WordDetailItem, signal: AbortSignal) => Promise<LearningItem[]>;
  onStartPractice?: (item: WordDetailItem) => Promise<void>;
  onNavigate: (
    target: NavigationTarget,
    replace?: boolean,
    scroll?: NavigationScrollPosition,
    intent?: ProductJourneyIntent,
  ) => void;
  onBackToResults: () => void;
  onConfigureLesson?: (context: { source: DictionarySource; topic?: string }) => void;
  onRequireAuthentication: () => void;
};

type DictionaryStatusTone = "new" | "learning" | "review" | "mastered";

const EMPTY_PAGE: CatalogPageInfo = {
  total: 0,
  page: 1,
  pageSize: CATALOG_PAGE_SIZE,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

const SOURCE_OPTIONS: Array<{ value: DictionarySource; label: string }> = [
  { value: "mixed", label: "Все разделы" },
  { value: "noun", label: "Существительные" },
  { value: "verb", label: "Глаголы" },
  { value: "adjective", label: "Прилагательные" },
  { value: "daily-life", label: "Повседневная жизнь" },
  { value: "travel", label: "Путешествия" },
  { value: "data-engineering", label: "Инженерия данных" },
  { value: "backend", label: "Backend-разработка" },
  { value: "academic-technical-english", label: "Технический английский" },
];

const SOURCE_VALUES = new Set(SOURCE_OPTIONS.map((option) => option.value));

const STATUS_OPTIONS: Array<{ value: CatalogStatus | ""; label: string }> = [
  { value: "", label: "Все статусы" },
  { value: "new", label: "Новое" },
  { value: "learning", label: "В работе" },
  { value: "review", label: "К повторению" },
  { value: "mastered", label: "Готово" },
];

const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: "default", label: "Порядок обучения" },
  { value: "az", label: "По алфавиту A–Z" },
  { value: "za", label: "По алфавиту Z–A" },
];

function dictionaryFilters(navigation: NavigationTarget, authenticated: boolean): DictionaryFilters {
  const source = navigation.source
    && navigation.source !== "phrases"
    && SOURCE_VALUES.has(navigation.source as DictionarySource)
    ? navigation.source as DictionarySource
    : "mixed";
  return {
    source,
    topic: navigation.topic ?? "",
    status: authenticated ? navigation.status ?? "" : "",
    query: navigation.query ?? "",
    sort: navigation.sort ?? "default",
    page: navigation.page ?? 1,
  };
}

function cleanTarget(filters: DictionaryFilters, detail?: string): NavigationTarget {
  return {
    view: "library",
    ...(filters.source !== "mixed" ? { source: filters.source } : {}),
    ...(filters.topic ? { topic: filters.topic } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.query ? { query: filters.query } : {}),
    ...(filters.sort !== "default" ? { sort: filters.sort } : {}),
    ...(filters.page > 1 ? { page: filters.page } : {}),
    ...(detail ? { detail } : {}),
  };
}

function wordCountLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14
    ? "слов"
    : last === 1
      ? "слово"
      : last >= 2 && last <= 4
        ? "слова"
        : "слов";
  return `${count.toLocaleString("ru-RU")} ${noun}`;
}

function statusPresentation(status: string): { label: string; tone: DictionaryStatusTone } {
  switch (status) {
    case "mastered":
      return { label: "Готово", tone: "mastered" };
    case "review":
      return { label: "К повторению", tone: "review" };
    case "learning":
      return { label: "В работе", tone: "learning" };
    default:
      return { label: catalogStatusLabel(status), tone: "new" };
  }
}

function activeFilterCount(filters: DictionaryFilters): number {
  return Number(filters.source !== "mixed")
    + Number(Boolean(filters.topic))
    + Number(Boolean(filters.status))
    + Number(Boolean(filters.query))
    + Number(filters.sort !== "default");
}

export function DictionaryCatalog({
  authenticated,
  navigation,
  metadata,
  metadataStatus,
  loadPage,
  loadDetail,
  loadRelatedPhrases,
  onStartPractice,
  onNavigate,
  onBackToResults,
  onRequireAuthentication,
}: DictionaryCatalogProps) {
  const filters = useMemo(() => dictionaryFilters(navigation, authenticated), [authenticated, navigation]);
  const [searchInput, setSearchInput] = useState(filters.query);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [pageInfo, setPageInfo] = useState<CatalogPageInfo>(EMPTY_PAGE);
  const [pageStatus, setPageStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const resultsRef = useRef<HTMLElement | null>(null);
  const detailOpenedFromCatalogRef = useRef(false);
  const lastSyncedFilterQueryRef = useRef(filters.query);

  useEffect(() => {
    if (lastSyncedFilterQueryRef.current === filters.query) return;
    lastSyncedFilterQueryRef.current = filters.query;
    const frame = window.requestAnimationFrame(() => setSearchInput(filters.query));
    return () => window.cancelAnimationFrame(frame);
  }, [filters.query]);

  useEffect(() => {
    if (authenticated || !navigation.status) return;
    onNavigate(cleanTarget(filters, navigation.detail), true, undefined, "in_app_navigation");
  }, [authenticated, filters, navigation.detail, navigation.status, onNavigate]);

  useEffect(() => {
    if (navigation.detail) return;
    const controller = new AbortController();

    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setPageStatus(loadingResourceStatus());
      try {
        const result = await loadPage(filters, controller.signal);
        if (controller.signal.aborted) return;
        setItems(result.items);
        setPageInfo(result.info);
        setPageStatus(readyResourceStatus());
      } catch (error) {
        if (controller.signal.aborted) return;
        setItems([]);
        setPageInfo(EMPTY_PAGE);
        setPageStatus(failedResourceStatus(error, "словарь"));
      }
    }

    void run();
    return () => controller.abort();
  }, [filters, loadPage, navigation.detail]);

  const loadCanonicalDetail = useCallback(async (
    wordID: number,
    signal: AbortSignal,
  ): Promise<LearningItem> => {
    const item = await loadDetail(wordID, signal);
    if (authenticated && !isWordDetailItem(item)) {
      throw new Error("Карточка слова не содержит обязательные данные интервального повторения");
    }
    return item;
  }, [authenticated, loadDetail]);

  const topics = useMemo(() => metadata?.topics
    .filter((entry) => (entry.words ?? entry.count) > 0)
    .map((entry) => entry.topic)
    .filter((topic, index, values) => values.indexOf(topic) === index)
    .sort((left, right) => topicLabel(left).localeCompare(topicLabel(right), "ru")) ?? [], [metadata]);

  function updateFilters(patch: Partial<DictionaryFilters>) {
    onNavigate(cleanTarget({ ...filters, ...patch }), false, undefined, "in_app_navigation");
  }

  function resetFilters() {
    setSearchInput("");
    setFiltersExpanded(false);
    onNavigate({ view: "library" }, false, undefined, "in_app_navigation");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ query: searchInput.trim(), page: 1 });
  }

  function retryPage() {
    const controller = new AbortController();
    setPageStatus(loadingResourceStatus());
    void loadPage(filters, controller.signal).then((result) => {
      setItems(result.items);
      setPageInfo(result.info);
      setPageStatus(readyResourceStatus());
    }).catch((error) => setPageStatus(failedResourceStatus(error, "словарь")));
  }

  function changePage(page: number) {
    updateFilters({ page });
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start", behavior: "auto" }));
  }

  function openDetail(item: LearningItem) {
    if (!item.wordId) return;
    detailOpenedFromCatalogRef.current = true;
    onNavigate(cleanTarget(filters, String(item.wordId)), false, undefined, "catalog_open_detail");
  }

  function backFromDetail() {
    if (detailOpenedFromCatalogRef.current && window.history.length > 1) {
      window.history.back();
      return;
    }
    onBackToResults();
  }

  if (navigation.detail) {
    if (!loadRelatedPhrases || !onStartPractice) {
      return (
        <section className="lx-word-detail" aria-label="Карточка слова">
          <button className="lx-word-detail-back" type="button" onClick={backFromDetail}>← Словарь</button>
          <AsyncStatePanel
            label="Карточка слова недоступна в устаревшем графе"
            kind="error"
            title="Откройте канонический маршрут слова"
            message="Word Detail загружается только через выделенный Dictionary route island."
            actionLabel="Вернуться в словарь"
            onAction={backFromDetail}
          />
        </section>
      );
    }
    return (
      <WordDetailRoute
        authenticated={authenticated}
        detailKey={navigation.detail}
        loadDetail={loadCanonicalDetail}
        loadRelatedPhrases={loadRelatedPhrases}
        onStartPractice={onStartPractice}
        onBack={backFromDetail}
        onOpenPhrase={(phrase) => {
          if (!phrase.slug) return;
          onNavigate({ view: "phrases", detail: phrase.slug }, false, undefined, "catalog_open_detail");
        }}
        onRequireAuthentication={onRequireAuthentication}
      />
    );
  }

  const pending = pageStatus.phase === "loading" || pageStatus.phase === "idle";
  const problem = pageStatus.problem;
  const activeFilters = activeFilterCount(filters);
  const filtersActive = activeFilters > 0;
  const catalogTotal = metadataStatus === "ready" && metadata ? metadata.totals.words : pageInfo.total;
  const catalogCount = catalogTotal > 0 ? wordCountLabel(catalogTotal) : "Каталог слов";
  const reviewQuickFilterActive = filters.status === "review";
  const showCatalogKindNavigation = pending || items.length > 0;

  return (
    <>
      {showCatalogKindNavigation ? (
        <CatalogKindNavigation
          active="words"
          onSelect={() => onNavigate({ view: "phrases" }, false, undefined, "catalog_switch")}
        />
      ) : null}
      <section className="lx-dictionary-catalog" aria-labelledby="dictionary-catalog-title">
        <header className="lx-dictionary-heading">
          <h1 id="dictionary-catalog-title">Словарь</h1>
          <p className="lx-dictionary-count">{catalogCount}</p>
          <p className="lx-dictionary-description">Ищите, изучайте и управляйте материалом.</p>
        </header>

        {!authenticated ? (
          <div className="lx-word-detail-inline-status" role="note">
            Демо-режим: слова и карточки доступны для просмотра. Статусы, интервалы и прогресс не сохраняются без аккаунта.
            <button type="button" onClick={onRequireAuthentication}>Войти и сохранять прогресс</button>
          </div>
        ) : null}

        <div className="lx-dictionary-command-bar">
          <form className="lx-dictionary-search" role="search" aria-label="Поиск по словарю" onSubmit={submitSearch}>
            <span className="lx-dictionary-search-icon" aria-hidden="true">⌕</span>
            <label>
              <span className="lx-visually-hidden">Поиск по словарю</span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Найдите слово или фразу"
                maxLength={120}
              />
            </label>
            <button className="lx-visually-hidden" type="submit">Найти</button>
            {searchInput ? (
              <button
                className="lx-dictionary-search-clear"
                type="button"
                aria-label="Очистить поиск"
                onClick={() => {
                  setSearchInput("");
                  updateFilters({ query: "", page: 1 });
                }}
              >
                ×
              </button>
            ) : null}
          </form>

          <nav className="lx-dictionary-quick-filters" aria-label="Быстрые фильтры словаря">
            <button type="button" aria-pressed={!filtersActive} className={!filtersActive ? "active" : undefined} onClick={resetFilters}>Все</button>
            <button type="button" aria-current="page" onClick={() => updateFilters({ status: "", page: 1 })}>Слова</button>
            <button type="button" onClick={() => onNavigate({ view: "phrases" }, false, undefined, "catalog_switch")}>Фразы</button>
            {authenticated ? (
              <button
                type="button"
                aria-pressed={reviewQuickFilterActive}
                className={reviewQuickFilterActive ? "active weak" : "weak"}
                onClick={() => updateFilters({ status: reviewQuickFilterActive ? "" : "review", page: 1 })}
              >
                Слабые
              </button>
            ) : null}
          </nav>
        </div>

        <button
          className="lx-dictionary-filter-toggle"
          type="button"
          aria-expanded={filtersExpanded}
          aria-controls="dictionary-filter-panel"
          onClick={() => setFiltersExpanded((expanded) => !expanded)}
        >
          <span>Фильтры и сортировка</span>
          {activeFilters > 0 ? <span role="status" aria-label={`Активных фильтров: ${activeFilters}`}>{activeFilters}</span> : null}
        </button>

        <div className="lx-dictionary-workspace">
          <aside
            id="dictionary-filter-panel"
            className="lx-dictionary-filter-panel"
            data-expanded={filtersExpanded ? "true" : "false"}
            aria-label="Фильтры словаря"
          >
            <h2>Фильтры</h2>
            <fieldset>
              <legend>Разделы</legend>
              <div className="lx-dictionary-filter-stack">
                {SOURCE_OPTIONS.map((option) => {
                  const selected = filters.source === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      className={selected ? "active" : undefined}
                      onClick={() => updateFilters({ source: option.value, page: 1 })}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="lx-dictionary-topic-filter">
              <span>Тема</span>
              <select aria-label="Тема словаря" value={filters.topic} onChange={(event) => updateFilters({ topic: event.target.value, page: 1 })}>
                <option value="">Все темы</option>
                {topics.map((topic) => <option key={topic} value={topic}>{topicLabel(topic)}</option>)}
              </select>
            </label>

            {authenticated ? (
              <fieldset>
                <legend>Статус</legend>
                <div className="lx-dictionary-filter-grid">
                  {STATUS_OPTIONS.map((option) => {
                    const selected = filters.status === option.value;
                    return (
                      <button
                        key={option.value || "all"}
                        type="button"
                        aria-pressed={selected}
                        className={selected ? "active" : undefined}
                        onClick={() => updateFilters({ status: option.value, page: 1 })}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <fieldset>
              <legend>Сортировка</legend>
              <div className="lx-dictionary-filter-stack">
                {SORT_OPTIONS.map((option) => {
                  const selected = filters.sort === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      className={selected ? "active" : undefined}
                      onClick={() => updateFilters({ sort: option.value, page: 1 })}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button className="lx-dictionary-reset" type="button" disabled={!filtersActive} onClick={resetFilters}>Сбросить фильтры</button>
          </aside>

          <section className="lx-dictionary-results-panel" aria-labelledby="dictionary-results-title">
            <h2 id="dictionary-results-title">Результаты</h2>
            {pageStatus.phase === "error" ? (
              <AsyncStatePanel
                label="Словарь недоступен"
                kind="error"
                title={problem?.title ?? "Не удалось загрузить словарь"}
                message={problem?.message ?? "Повторите запрос."}
                reference={problem?.correlationId}
                actionLabel={problem?.retryable ? "Повторить" : undefined}
                onAction={problem?.retryable ? retryPage : undefined}
              />
            ) : null}
            {pending && items.length === 0 ? <AsyncSkeletonGrid label="Загружаем слова" /> : null}
            {!pending && pageStatus.phase === "ready" && items.length === 0 ? (
              <AsyncStatePanel
                label="Слова не найдены"
                kind="empty"
                title="По заданным условиям слов нет"
                message="Измените поисковый запрос или сбросьте фильтры."
                actionLabel="Сбросить фильтры"
                onAction={resetFilters}
              />
            ) : null}

            <section
              ref={resultsRef}
              id="dictionary-results"
              className="lx-dictionary-results"
              role="list"
              aria-label="Результаты словаря"
              aria-busy={pending}
            >
              {items.map((item, index) => {
                const status = authenticated ? statusPresentation(item.status) : null;
                return (
                  <article
                    key={item.id}
                    role="listitem"
                    aria-posinset={(pageInfo.page - 1) * pageInfo.pageSize + index + 1}
                    aria-setsize={pageInfo.total}
                    className="lx-dictionary-result"
                  >
                    <button type="button" onClick={() => openDetail(item)} aria-label={`Открыть карточку: ${item.prompt}`}>
                      <span className="lx-dictionary-result-copy">
                        <strong lang="en">{item.prompt}</strong>
                        <span lang="ru">{item.answer}</span>
                        <span className="lx-visually-hidden">{topicLabel(item.topic)}; {partOfSpeechLabel(item.partOfSpeech || "word")}</span>
                      </span>
                      {status ? <span className="lx-dictionary-status" data-tone={status.tone}>{status.label}</span> : null}
                    </button>
                  </article>
                );
              })}
            </section>

            <CatalogPagination info={pageInfo} busy={pending} onPageChange={changePage} label="Навигация по страницам словаря" />
          </section>
        </div>
      </section>
    </>
  );
}
