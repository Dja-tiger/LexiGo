"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import {
  catalogStatusLabel,
  partOfSpeechLabel,
  topicLabel,
} from "../lib/interface-copy";
import type { WordSection } from "../lib/learning";
import type { CatalogSort, CatalogStatus, NavigationTarget } from "../lib/navigation";
import type { NavigationScrollPosition } from "../lib/navigation-history";
import type { ProductJourneyIntent } from "../lib/product-journey";
import type { Progress } from "../lib/progress";
import type { AsyncResourceStatus } from "../lib/resource-status";
import type { CatalogMetadata, CatalogPage, CatalogQuery, Word } from "../lib/types";
import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state-panel";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogKindNavigation } from "./catalog-kind-navigation";
import { SpeechPlayerButton } from "./speech-player";

type DictionarySource = WordSection;
type DictionaryFilters = {
  source: DictionarySource;
  topic: string;
  status: CatalogStatus | "";
  query: string;
  sort: CatalogSort;
  page: number;
};

type DictionaryStatusTone = "new" | "learning" | "review" | "mastered";

type DictionaryCatalogProps = {
  authenticated: boolean;
  navigation: NavigationTarget;
  metadata: CatalogMetadata | null;
  metadataStatus: "idle" | "loading" | "ready" | "error";
  progress: Progress | null;
  loadPage: (query: CatalogQuery, signal?: AbortSignal) => Promise<CatalogPage>;
  loadDetail: (id: number, signal?: AbortSignal) => Promise<Word>;
  onNavigate: (
    target: NavigationTarget,
    replace?: boolean,
    scroll?: NavigationScrollPosition,
    intent?: ProductJourneyIntent,
  ) => void;
  onBackToResults: () => void;
  onConfigureLesson: (context: { source: DictionarySource; topic?: string }) => void;
  onRequireAuthentication: () => void;
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

const CATALOG_PAGE_SIZE = 48;

function sectionLabel(source: DictionarySource): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source;
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

function filtersFromNavigation(navigation: NavigationTarget): DictionaryFilters {
  return {
    source: navigation.source && navigation.source !== "phrases" ? navigation.source : "mixed",
    topic: navigation.topic ?? "",
    status: navigation.status ?? "",
    query: navigation.query ?? "",
    sort: navigation.sort ?? "default",
    page: navigation.page ?? 1,
  };
}

function navigationFromFilters(filters: DictionaryFilters): NavigationTarget {
  return {
    view: "library",
    ...(filters.source !== "mixed" ? { source: filters.source } : {}),
    ...(filters.topic ? { topic: filters.topic } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.query ? { query: filters.query } : {}),
    ...(filters.sort !== "default" ? { sort: filters.sort } : {}),
    ...(filters.page > 1 ? { page: filters.page } : {}),
  };
}

function navigationWithoutDetail(navigation: NavigationTarget): NavigationTarget {
  const { detail: _detail, ...catalog } = navigation;
  return { ...catalog, view: "library" };
}

function sameFilters(left: DictionaryFilters, right: DictionaryFilters): boolean {
  return left.source === right.source
    && left.topic === right.topic
    && left.status === right.status
    && left.query === right.query
    && left.sort === right.sort
    && left.page === right.page;
}

function filterCount(filters: DictionaryFilters): number {
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
  onNavigate,
  onBackToResults,
  onConfigureLesson,
  onRequireAuthentication,
}: DictionaryCatalogProps) {
  const filters = useMemo(() => filtersFromNavigation(navigation), [navigation]);
  const [searchInput, setSearchInput] = useState(filters.query);
  const [items, setItems] = useState<Word[]>([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: CATALOG_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  });
  const [pageStatus, setPageStatus] = useState<AsyncResourceStatus>({ phase: "idle" });
  const [selectedItem, setSelectedItem] = useState<Word | null>(null);
  const [activeDetailStatus, setActiveDetailStatus] = useState<AsyncResourceStatus>({ phase: "idle" });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const resultsRef = useRef<HTMLElement | null>(null);
  const lastLoadedFiltersRef = useRef<DictionaryFilters | null>(null);

  useEffect(() => {
    setSearchInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    if (!authenticated || navigation.detail) return;
    if (lastLoadedFiltersRef.current && sameFilters(lastLoadedFiltersRef.current, filters)) return;
    lastLoadedFiltersRef.current = filters;
    const controller = new AbortController();
    setPageStatus({ phase: "loading" });

    void loadPage({
      kind: "word",
      page: filters.page,
      limit: CATALOG_PAGE_SIZE,
      sort: filters.sort,
      ...(filters.source !== "mixed" ? { source: filters.source } : {}),
      ...(filters.topic ? { topic: filters.topic } : {}),
      ...(filters.query ? { query: filters.query } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }, controller.signal).then((page) => {
      setItems(page.items);
      setPageInfo({
        page: page.page,
        pageSize: page.pageSize,
        total: page.total,
        totalPages: page.totalPages,
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      });
      setPageStatus({ phase: "ready" });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setPageStatus({
        phase: "error",
        problem: {
          title: "Не удалось загрузить словарь",
          message: error instanceof Error ? error.message : "Повторите запрос.",
          retryable: true,
        },
      });
    });

    return () => controller.abort();
  }, [authenticated, filters, loadPage, navigation.detail]);

  useEffect(() => {
    if (!authenticated || !navigation.detail) {
      setSelectedItem(null);
      setActiveDetailStatus({ phase: "idle" });
      return;
    }

    const wordId = Number(navigation.detail);
    if (!Number.isSafeInteger(wordId) || wordId <= 0) {
      setSelectedItem(null);
      setActiveDetailStatus({
        phase: "error",
        problem: {
          title: "Карточка слова не найдена",
          message: "Проверьте ссылку и вернитесь к результатам словаря.",
          retryable: false,
        },
      });
      return;
    }

    const cached = items.find((item) => item.id === wordId);
    if (cached) {
      setSelectedItem(cached);
      setActiveDetailStatus({ phase: "ready" });
      return;
    }

    const controller = new AbortController();
    setSelectedItem(null);
    setActiveDetailStatus({ phase: "loading" });
    void loadDetail(wordId, controller.signal).then((item) => {
      setSelectedItem(item);
      setActiveDetailStatus({ phase: "ready" });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setActiveDetailStatus({
        phase: "error",
        problem: {
          title: "Не удалось открыть слово",
          message: error instanceof Error ? error.message : "Вернитесь к результатам и попробуйте снова.",
          retryable: false,
        },
      });
    });
    return () => controller.abort();
  }, [authenticated, items, loadDetail, navigation.detail]);

  const topics = useMemo(() => {
    const available = metadata?.topics
      .filter((entry) => entry.words > 0)
      .map((entry) => entry.topic) ?? [];
    return [...new Set(available)].sort((left, right) => left.localeCompare(right, "ru"));
  }, [metadata]);

  function updateFilters(patch: Partial<DictionaryFilters>, replace = false) {
    const next = { ...filters, ...patch };
    onNavigate(navigationFromFilters(next), replace);
  }

  function resetFilters() {
    setSearchInput("");
    setFiltersExpanded(false);
    onNavigate({ view: "library" });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilters({ query: searchInput.trim(), page: 1 });
  }

  function retryPage() {
    lastLoadedFiltersRef.current = null;
    setPageStatus({ phase: "loading" });
    const controller = new AbortController();
    void loadPage({
      kind: "word",
      page: filters.page,
      limit: CATALOG_PAGE_SIZE,
      sort: filters.sort,
      ...(filters.source !== "mixed" ? { source: filters.source } : {}),
      ...(filters.topic ? { topic: filters.topic } : {}),
      ...(filters.query ? { query: filters.query } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }, controller.signal).then((page) => {
      lastLoadedFiltersRef.current = filters;
      setItems(page.items);
      setPageInfo({
        page: page.page,
        pageSize: page.pageSize,
        total: page.total,
        totalPages: page.totalPages,
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext,
      });
      setPageStatus({ phase: "ready" });
    }).catch((error) => {
      setPageStatus({
        phase: "error",
        problem: {
          title: "Не удалось загрузить словарь",
          message: error instanceof Error ? error.message : "Повторите запрос.",
          retryable: true,
        },
      });
    });
  }

  function openDetail(item: Word) {
    setSelectedItem(item);
    setActiveDetailStatus({ phase: "ready" });
    onNavigate({ ...navigationWithoutDetail(navigation), detail: String(item.id) });
  }

  function changePage(page: number) {
    updateFilters({ page });
    requestAnimationFrame(() => resultsRef.current?.focus({ preventScroll: false }));
  }

  if (!authenticated) {
    return (
      <>
        <CatalogKindNavigation active="words" onSelect={() => onNavigate({ view: "phrases" }, false, undefined, "catalog_switch")} />
        <AsyncStatePanel
          label="Словарь доступен после входа"
          kind="empty"
          title="Войдите, чтобы открыть словарь"
          message="Поиск, фильтры и персональные статусы слов синхронизируются с аккаунтом."
          actionLabel="Войти"
          onAction={onRequireAuthentication}
        />
      </>
    );
  }

  if (navigation.detail) {
    const loading = activeDetailStatus.phase === "loading";
    const problem = activeDetailStatus.problem;
    return (
      <section className="lx-dictionary-detail">
        <button className="lx-button ghost" type="button" onClick={onBackToResults}>← К результатам</button>
        {loading ? <AsyncSkeletonGrid label="Загружаем карточку слова" count={1} /> : null}
        {!loading && !selectedItem ? (
          <AsyncStatePanel
            label="Карточка слова недоступна"
            kind="error"
            title={problem?.title ?? "Не удалось открыть слово"}
            message={problem?.message ?? "Проверьте ссылку или вернитесь к результатам поиска."}
            reference={problem?.correlationId}
            actionLabel="К результатам"
            onAction={onBackToResults}
          />
        ) : null}
        {selectedItem ? (
          <article className="lx-dictionary-detail-card">
            <div className="lx-dictionary-detail-meta">
              <span>{topicLabel(selectedItem.topic)}</span>
              <span>{partOfSpeechLabel(selectedItem.partOfSpeech || "word")}</span>
              <span data-status={selectedItem.status}>{catalogStatusLabel(selectedItem.status)}</span>
            </div>
            <div className="lx-dictionary-detail-title">
              <div><h1 lang="en">{selectedItem.prompt}</h1>{selectedItem.phonetic ? <p>{selectedItem.phonetic}</p> : null}</div>
              <SpeechPlayerButton text={selectedItem.prompt}>Произнести</SpeechPlayerButton>
            </div>
            <strong className="lx-dictionary-translation" lang="ru">{selectedItem.answer}</strong>
            {selectedItem.aliases?.length ? <div className="lx-dictionary-detail-section"><h2>Другие варианты написания</h2><p>{selectedItem.aliases.join(", ")}</p></div> : null}
            {selectedItem.examples.length ? <div className="lx-dictionary-detail-section"><h2>Примеры</h2>{selectedItem.examples.map((example) => <p key={example} lang="en">{example}</p>)}</div> : null}
            {selectedItem.note ? <div className="lx-dictionary-detail-section"><h2>Контекст</h2><p>{selectedItem.note}</p></div> : null}
            <div className="lx-page-actions">
              <button className="lx-button primary" type="button" onClick={() => onConfigureLesson({ source: filters.source, topic: selectedItem.topic })}>
                Настроить урок по этой теме
              </button>
            </div>
          </article>
        ) : null}
      </section>
    );
  }

  const pending = pageStatus.phase === "loading" || pageStatus.phase === "idle";
  const problem = pageStatus.problem;
  const filtersActive = filterCount(filters) > 0;
  const activeFilters = filterCount(filters);
  const catalogTotal = metadataStatus === "ready" && metadata
    ? metadata.totals.words
    : pageInfo.total;
  const catalogCount = catalogTotal > 0
    ? `${catalogTotal.toLocaleString("ru-RU")} ${catalogTotal === 1 ? "слово" : "слов"}`
    : "Каталог слов";
  const allQuickFilterActive = !filtersActive;
  const reviewQuickFilterActive = filters.status === "review";

  return (
    <section className="lx-dictionary-catalog" aria-labelledby="dictionary-catalog-title">
      <header className="lx-dictionary-heading">
        <div>
          <h1 id="dictionary-catalog-title">Словарь</h1>
          <p className="lx-dictionary-count">{catalogCount}</p>
          <p className="lx-dictionary-description">Ищите, изучайте и управляйте материалом.</p>
        </div>
      </header>

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
          <button
            type="button"
            aria-pressed={allQuickFilterActive}
            className={allQuickFilterActive ? "active" : undefined}
            onClick={resetFilters}
          >
            Все
          </button>
          <button
            type="button"
            aria-current="page"
            onClick={() => updateFilters({ status: "", page: 1 })}
          >
            Слова
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ view: "phrases" }, false, undefined, "catalog_switch")}
          >
            Фразы
          </button>
          <button
            type="button"
            aria-pressed={reviewQuickFilterActive}
            className={reviewQuickFilterActive ? "active weak" : "weak"}
            onClick={() => updateFilters({ status: reviewQuickFilterActive ? "" : "review", page: 1 })}
          >
            Слабые
          </button>
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
        {activeFilters > 0 ? <span aria-label={`Активных фильтров: ${activeFilters}`}>{activeFilters}</span> : null}
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
            <select
              aria-label="Тема словаря"
              value={filters.topic}
              onChange={(event) => updateFilters({ topic: event.target.value, page: 1 })}
            >
              <option value="">Все темы</option>
              {topics.map((topic) => <option key={topic} value={topic}>{topicLabel(topic)}</option>)}
            </select>
          </label>

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

          <button
            className="lx-dictionary-reset"
            type="button"
            disabled={!filtersActive}
            onClick={resetFilters}
          >
            Сбросить фильтры
          </button>
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
            tabIndex={-1}
          >
            {items.map((item, index) => {
              const status = statusPresentation(item.status);
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
                      <span className="lx-visually-hidden">
                        {topicLabel(item.topic)}; {partOfSpeechLabel(item.partOfSpeech || "word")}
                      </span>
                    </span>
                    <span className="lx-dictionary-status" data-tone={status.tone}>{status.label}</span>
                  </button>
                </article>
              );
            })}
          </section>

          <CatalogPagination
            info={pageInfo}
            busy={pending}
            onPageChange={changePage}
            label="Навигация по страницам словаря"
          />
        </section>
      </div>
    </section>
  );
}
