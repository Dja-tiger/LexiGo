"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  failedResourceStatus,
  idleResourceStatus,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import type { CatalogMetadata, CatalogMetadataStatus } from "../lib/catalog-metadata";
import { CATALOG_PAGE_SIZE, type CatalogPageInfo } from "../lib/catalog-page";
import type { LearningItem, WordSection } from "../lib/learning";
import type { CatalogSort, CatalogStatus, NavigationTarget } from "../lib/navigation";
import type { NavigationScrollPosition } from "../lib/navigation-history";
import type { ProgressSummary } from "../lib/progress";
import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";
import { CatalogPagination, CatalogSearchForm } from "./catalog-pagination";
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
  ) => void;
  onBackToResults: () => void;
  onStartLesson: (items: LearningItem[], mode: "study" | "recall") => void;
  onRequireAuthentication: () => void;
};

const EMPTY_PAGE: CatalogPageInfo = {
  total: 0,
  page: 1,
  pageSize: CATALOG_PAGE_SIZE,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

const SOURCE_OPTIONS: Array<{ value: DictionarySource; label: string }> = [
  { value: "mixed", label: "Все слова" },
  { value: "noun", label: "Существительные" },
  { value: "verb", label: "Глаголы" },
  { value: "adjective", label: "Прилагательные" },
  { value: "daily-life", label: "Бытовой английский" },
  { value: "travel", label: "Путешествия" },
  { value: "data-engineering", label: "Data Engineering" },
  { value: "backend", label: "Backend Development" },
];

const SOURCE_VALUES = new Set(SOURCE_OPTIONS.map((option) => option.value));

const STATUS_OPTIONS: Array<{ value: CatalogStatus | ""; label: string }> = [
  { value: "", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "learning", label: "Изучаются" },
  { value: "review", label: "На повторении" },
  { value: "mastered", label: "Освоены" },
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

function statusLabel(status: string): string {
  if (status === "new") return "Новое";
  if (status === "learning") return "Изучается";
  if (status === "review") return "На повторении";
  if (status === "mastered") return "Освоено";
  return status || "Статус не указан";
}

function sectionLabel(source: DictionarySource): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? "Все слова";
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

export function DictionaryCatalog({
  authenticated,
  navigation,
  metadata,
  metadataStatus,
  progress,
  loadPage,
  loadDetail,
  onNavigate,
  onBackToResults,
  onStartLesson,
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
    .sort((left, right) => left.localeCompare(right, "en")) ?? [], [metadata]);

  function updateFilters(patch: Partial<DictionaryFilters>) {
    const next = { ...filters, ...patch };
    onNavigate(cleanTarget(next));
  }

  function resetFilters() {
    setSearchInput("");
    onNavigate({ view: "library" });
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
    onNavigate(cleanTarget(filters, String(item.wordId)));
  }

  if (!authenticated) {
    return (
      <>
        <section className="lx-page-heading">
          <div><span>СЛОВАРЬ</span><h1>Каталог слов и терминов</h1><p>Ищите слова по английскому написанию, переводу и синонимам, затем открывайте карточку или запускайте урок.</p></div>
        </section>
        <AsyncStatePanel
          label="Словарь доступен после входа"
          kind="empty"
          title="Войдите, чтобы открыть персональный каталог"
          message="Статусы изучения, due-очередь и быстрый запуск урока привязаны к вашему аккаунту."
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
              <span>{selectedItem.topic}</span>
              <span>{selectedItem.partOfSpeech || "word"}</span>
              <span data-status={selectedItem.status}>{statusLabel(selectedItem.status)}</span>
            </div>
            <div className="lx-dictionary-detail-title">
              <div><h1 lang="en">{selectedItem.prompt}</h1>{selectedItem.phonetic ? <p>{selectedItem.phonetic}</p> : null}</div>
              <SpeechPlayerButton text={selectedItem.prompt}>Произнести</SpeechPlayerButton>
            </div>
            <strong className="lx-dictionary-translation" lang="ru">{selectedItem.answer}</strong>
            {selectedItem.aliases?.length ? <div className="lx-dictionary-detail-section"><h2>Также ищется как</h2><p>{selectedItem.aliases.join(", ")}</p></div> : null}
            {selectedItem.examples.length ? <div className="lx-dictionary-detail-section"><h2>Примеры</h2>{selectedItem.examples.map((example) => <p key={example} lang="en">{example}</p>)}</div> : null}
            {selectedItem.note ? <div className="lx-dictionary-detail-section"><h2>Контекст</h2><p>{selectedItem.note}</p></div> : null}
            <div className="lx-page-actions">
              <button className="lx-button primary" type="button" onClick={() => onStartLesson([selectedItem], selectedItem.status === "new" ? "study" : "recall")}>
                {selectedItem.status === "new" ? "Изучить это слово" : "Повторить это слово"}
              </button>
            </div>
          </article>
        ) : null}
      </section>
    );
  }

  const pending = pageStatus.phase === "loading" || pageStatus.phase === "idle";
  const problem = pageStatus.problem;
  const filtersActive = filters.source !== "mixed" || Boolean(filters.topic || filters.status || filters.query) || filters.sort !== "default";

  return (
    <>
      <section className="lx-page-heading">
        <div>
          <span>СЛОВАРЬ</span>
          <h1>Каталог слов и терминов</h1>
          <p>Поиск по английскому слову, переводу и aliases. Фильтры и текущая страница сохраняются в адресе.</p>
        </div>
        <div className="lx-heading-badge"><span>{progress ? `${progress.masteredWords} слов освоено` : metadataStatus === "ready" && metadata ? `${metadata.totals.words} слов` : "Каталог"}</span></div>
      </section>

      <section className="lx-dictionary-toolbar" aria-label="Фильтры словаря">
        <label><span>Раздел</span><select aria-label="Раздел словаря" value={filters.source} onChange={(event) => updateFilters({ source: event.target.value as DictionarySource, page: 1 })}>{SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label><span>Тема</span><select aria-label="Тема словаря" value={filters.topic} onChange={(event) => updateFilters({ topic: event.target.value, page: 1 })}><option value="">Все темы</option>{topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select></label>
        <label><span>Статус</span><select aria-label="Статус изучения" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value as CatalogStatus | "", page: 1 })}>{STATUS_OPTIONS.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}</select></label>
        <label><span>Сортировка</span><select aria-label="Сортировка словаря" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as CatalogSort, page: 1 })}><option value="default">Порядок обучения</option><option value="az">A–Z</option><option value="za">Z–A</option></select></label>
      </section>

      <CatalogSearchForm
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={() => updateFilters({ query: searchInput.trim(), page: 1 })}
        onClear={() => { setSearchInput(""); updateFilters({ query: "", page: 1 }); }}
        label="Поиск по словарю"
      />
      <div className="lx-dictionary-filter-summary">
        <p><strong>{sectionLabel(filters.source)}</strong>{filters.topic ? ` · ${filters.topic}` : ""}{filters.status ? ` · ${statusLabel(filters.status)}` : ""}</p>
        {filtersActive ? <button className="lx-button ghost" type="button" onClick={resetFilters}>Сбросить все фильтры</button> : null}
      </div>

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

      <CatalogPagination info={pageInfo} busy={pending} onPageChange={changePage} label="Навигация над результатами словаря" />
      <section ref={resultsRef} id="dictionary-results" className="lx-dictionary-results" role="list" aria-label="Результаты словаря" aria-busy={pending}>
        {items.map((item, index) => (
          <article key={item.id} role="listitem" aria-posinset={(pageInfo.page - 1) * pageInfo.pageSize + index + 1} aria-setsize={pageInfo.total} className="lx-dictionary-result">
            <button type="button" onClick={() => openDetail(item)} aria-label={`Открыть карточку: ${item.prompt}`}>
              <div className="lx-dictionary-result-heading"><span>{item.topic}</span><span data-status={item.status}>{statusLabel(item.status)}</span></div>
              <strong lang="en">{item.prompt}</strong>
              <small lang="ru">{item.answer}</small>
              <p>{item.partOfSpeech || "word"}{item.phonetic ? ` · ${item.phonetic}` : ""}</p>
              <em>Открыть карточку →</em>
            </button>
          </article>
        ))}
      </section>
      <CatalogPagination info={pageInfo} busy={pending} onPageChange={changePage} label="Навигация под результатами словаря" />

      <div className="lx-page-actions">
        <button className="lx-button primary" type="button" disabled={pending || items.length === 0} onClick={() => onStartLesson(items, filters.status === "review" || filters.status === "mastered" ? "recall" : "study")}>
          {filters.status === "review" || filters.status === "mastered" ? "Повторить текущую страницу" : "Изучить текущую страницу"}
        </button>
        <small>В урок попадут только показанные {items.length.toLocaleString("ru-RU")} элементов; весь каталог не загружается.</small>
      </div>
    </>
  );
}
