"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

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
import type { ProductJourneyIntent } from "../lib/product-journey";
import type { NavigationScrollPosition } from "../lib/navigation-history";
import type { ProgressSummary } from "../lib/progress";
import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";
import { CatalogKindNavigation } from "./catalog-kind-navigation";
import { CatalogPagination } from "./catalog-pagination";
import { SpeechPlayerButton } from "./speech-player-button";

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

function dictionaryFilters(navigation: NavigationTarget): DictionaryFilters {
  const source = navigation.source && navigation.source !== "phrases" && SOURCE_VALUES.has(navigation.source as DictionarySource)
    ? navigation.source as DictionarySource
    : "mixed";
  return {
    source,
    topic: navigation.topic ?? "",
    status: navigation.status ?? "",
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
  onNavigate,
  onBackToResults,
  onConfigureLesson,
  onRequireAuthentication,
}: DictionaryCatalogProps) {
  const filters = useMemo(() => dictionaryFilters(navigation), [navigation]);
  const [searchInput, setSearchInput] = useState(filters.query);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [pageInfo, setPageInfo] = useState<CatalogPageInfo>(EMPTY_PAGE);
  const [pageStatus, setPageStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [remoteDetail, setRemoteDetail] = useState<{ key: string; item: LearningItem } | null>(null);
  const [detailStatus, setDetailStatus] = useState<{ key: string; status: ResourceStatus }>({
    key: "",
    status: idleResourceStatus(),
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSearchInput(filters.query));
    return () => window.cancelAnimationFrame(frame);
  }, [filters.query]);

  useEffect(() => {
    if (!authenticated) return;
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
  }, [authenticated, filters, loadPage]);

  const localDetail = navigation.detail
    ? items.find((item) => String(item.wordId) === navigation.detail) ?? null
    : null;
  const selectedItem = localDetail
    ?? (remoteDetail && remoteDetail.key === navigation.detail ? remoteDetail.item : null);
  const activeDetailStatus = detailStatus.key === navigation.detail
    ? detailStatus.status
    : idleResourceStatus();

  useEffect(() => {
    if (!authenticated || !navigation.detail || localDetail) return;
    const detailKey = navigation.detail;
    const controller = new AbortController();

    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      const wordID = Number(detailKey);
      if (!Number.isSafeInteger(wordID) || wordID <= 0) {
        setDetailStatus({
          key: detailKey,
          status: failedResourceStatus(new Error("Некорректная ссылка на слово"), "карточку слова"),
        });
        return;
      }

      setDetailStatus({ key: detailKey, status: loadingResourceStatus() });
      try {
        const item = await loadDetail(wordID, controller.signal);
        if (controller.signal.aborted) return;
        setRemoteDetail({ key: detailKey, item });
        setDetailStatus({ key: detailKey, status: readyResourceStatus() });
      } catch (error) {
        if (controller.signal.aborted) return;
        setDetailStatus({ key: detailKey, status: failedResourceStatus(error, "карточку слова") });
      }
    }

    void run();
    return () => controller.abort();
  }, [authenticated, loadDetail, localDetail, navigation.detail]);

  const topics = useMemo(() => metadata?.topics
    .filter((entry) => (entry.words ?? entry.count) > 0)
    .map((entry) => entry.topic)
    .filter((topic, index, values) => values.indexOf(topic) === index)
    .sort((left, right) => topicLabel(left).localeCompare(topicLabel(right), "ru")) ?? [], [metadata]);

  function updateFilters(patch: Partial<DictionaryFilters>) {
    const next = { ...filters, ...patch };
    onNavigate(cleanTarget(next), false, undefined, "in_app_navigation");
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
    onNavigate(cleanTarget(filters, String(item.wordId)), false, undefined, "catalog_open_detail");
  }

  if (!authenticated) {
    return (
      <>
        <CatalogKindNavigation active="words" onSelect={() => onNavigate({ view: "phrases" }, false, undefined, "catalog_switch")} />
        <section className="lx-page-heading">
          <div><span>СЛОВАРЬ</span><h1>Каталог слов и терминов</h1><p>Ищите слова по английскому написанию, переводу и синонимам. Настройка урока находится в отдельном разделе «Обучение».</p></div>
        </section>
        <AsyncStatePanel
          label="Словарь доступен после входа"
          kind="empty"
          title="Войдите, чтобы открыть персональный каталог"
          message="Статусы изучения, материал для запланированного повторения и быстрый запуск урока привязаны к вашему аккаунту."
          actionLabel="Войти и открыть словарь"
          onAction={onRequireAuthentication}
        />
      </>
    );
  }

  if (navigation.detail) {
    const loading = !localDetail && (activeDetailStatus.phase === "loading" || (activeDetailStatus.phase === "idle" && !selectedItem));
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
  const activeFilters = activeFilterCount(filters);
  const filtersActive = activeFilters > 0;
  const catalogTotal = metadataStatus === "ready" && metadata ? metadata.totals.words : pageInfo.total;
  const catalogCount = catalogTotal > 0 ? wordCountLabel(catalogTotal) : "Каталог слов";
  const reviewQuickFilterActive = filters.status === "review";

  return (
    <section className="lx-dictionary-catalog" aria-labelledby="dictionary-catalog-title">
      <header className="lx-dictionary-heading">
        <h1 id="dictionary-catalog-title">Словарь</h1>
        <p className="lx-dictionary-count">{catalogCount}</p>
        <p className="lx-dictionary-description">Ищите, изучайте и управляйте материалом.</p>
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
            aria-pressed={!filtersActive}
            className={!filtersActive ? "active" : undefined}
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
        {activeFilters > 0 ? (
          <span role="status" aria-label={`Активных фильтров: ${activeFilters}`}>{activeFilters}</span>
        ) : null}
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
