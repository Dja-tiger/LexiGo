"use client";

import { useLayoutEffect, type FormEvent, type MouseEvent } from "react";

import type { ResourceStatus } from "../lib/account-resources";
import type { CatalogPageInfo } from "../lib/catalog-page";
import { navigationURL } from "../lib/navigation";
import { phraseCatalogTarget, type PhraseCatalogFilters } from "../lib/phrase-navigation";
import { phraseStatusLabel, phraseTopicLabel, type PhraseItem } from "../lib/phrases";
import { AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";
import { CatalogKindNavigation } from "./catalog-kind-navigation";
import { CatalogPagination } from "./catalog-pagination";

export type PhrasesCatalogProps = {
  authenticated: boolean;
  duePhrases: number | null;
  filters: PhraseCatalogFilters;
  searchInput: string;
  items: PhraseItem[];
  info: CatalogPageInfo;
  topics: string[];
  status: ResourceStatus;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onTopicChange: (topic: string) => void;
  onSortChange: (sort: PhraseCatalogFilters["sort"]) => void;
  onPageChange: (page: number) => void;
  onReset: () => void;
  onRetry: () => void;
  onOpenPhrase: (item: PhraseItem, event: MouseEvent<HTMLAnchorElement>) => void;
  onConfigureLesson: () => void;
  onSwitchToWords: () => void;
  onRequireAuthentication: () => void;
};

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function submitSearch(event: FormEvent<HTMLFormElement>, onSubmit: () => void) {
  event.preventDefault();
  onSubmit();
}

function activeFilterCount(filters: PhraseCatalogFilters): number {
  return Number(Boolean(filters.query))
    + Number(filters.topic !== "all")
    + Number(filters.sort !== "default");
}

function visibleTopics(topics: string[], selected: string): string[] {
  const result = [...topics];
  if (selected !== "all" && !result.includes(selected)) result.unshift(selected);
  return result;
}

function ResultsSurface({
  authenticated,
  filters,
  items,
  info,
  status,
  onReset,
  onRetry,
  onOpenPhrase,
  onPageChange,
  onRequireAuthentication,
}: Pick<PhrasesCatalogProps,
  | "authenticated"
  | "filters"
  | "items"
  | "info"
  | "status"
  | "onReset"
  | "onRetry"
  | "onOpenPhrase"
  | "onPageChange"
  | "onRequireAuthentication"
>) {
  if (status.phase === "loading") {
    return <AsyncSkeletonGrid label="Загружаем каталог фраз" count={6} />;
  }

  if (status.phase === "error" && status.problem) {
    return (
      <AsyncStatePanel
        label="Каталог фраз: ошибка загрузки"
        kind="error"
        title={status.problem.title}
        message={status.problem.message}
        actionLabel={status.problem.retryable ? "Повторить" : undefined}
        onAction={status.problem.retryable ? onRetry : undefined}
        secondaryActionLabel={!authenticated ? "Войти" : undefined}
        onSecondaryAction={!authenticated ? onRequireAuthentication : undefined}
        reference={status.problem.correlationId || status.problem.code}
      />
    );
  }

  if (items.length === 0) {
    return (
      <AsyncStatePanel
        label="Каталог фраз пуст"
        kind="empty"
        title="По заданным условиям фразы не найдены"
        message={filters.query || filters.topic !== "all"
          ? "Сбросьте поиск или выберите другую тему. Текущие фильтры сохранены в адресе страницы."
          : "Каталог пока пуст. Новые формулировки появятся после синхронизации контента."}
        actionLabel="Сбросить фильтры"
        onAction={onReset}
      />
    );
  }

  const offset = (info.page - 1) * info.pageSize;
  return (
    <>
      <ol className="lx-phrases-results lx-phrase-grid" aria-label="Результаты каталога фраз">
        {items.map((item, index) => (
          <li
            key={`${item.wordId}:${item.slug}`}
            role="listitem"
            aria-posinset={offset + index + 1}
            aria-setsize={info.total}
          >
            <a
              href={navigationURL(phraseCatalogTarget(filters, item.slug))}
              aria-label={`${phraseTopicLabel(item.topic)} ${item.prompt} ${item.answer} Открыть карточку`}
              onClick={(event) => onOpenPhrase(item, event)}
            >
              <span className="lx-phrases-result-copy">
                <strong lang="en">{item.prompt}</strong>
                <span>{item.answer}</span>
                <small>{item.examples[0] || item.note || "Откройте карточку, чтобы увидеть контекст использования."}</small>
              </span>
              <span className="lx-phrases-result-meta">
                <i>{phraseTopicLabel(item.topic)}</i>
                <i data-phrase-status={item.status}>{phraseStatusLabel(item.status)}</i>
                <ArrowIcon />
              </span>
            </a>
          </li>
        ))}
      </ol>
      <CatalogPagination
        info={info}
        busy={false}
        onPageChange={onPageChange}
        label="Навигация по страницам фраз"
      />
    </>
  );
}

export function PhrasesCatalog(props: PhrasesCatalogProps) {
  const {
    authenticated,
    duePhrases,
    filters,
    searchInput,
    items,
    info,
    topics,
    status,
    onSearchInputChange,
    onSearchSubmit,
    onSearchClear,
    onTopicChange,
    onSortChange,
    onPageChange,
    onReset,
    onRetry,
    onOpenPhrase,
    onConfigureLesson,
    onSwitchToWords,
    onRequireAuthentication,
  } = props;
  const filterCount = activeFilterCount(filters);
  const topicOptions = visibleTopics(topics, filters.topic);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById("lexigo-main-content");
      main?.setAttribute("aria-label", "Технические фразы");
      main?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="lx-phrases-catalog" aria-labelledby="phrases-heading">
      <CatalogKindNavigation active="phrases" onSelect={(kind) => kind === "words" && onSwitchToWords()} />
      <header className="lx-phrases-heading">
        <div>
          <span className="lx-phrases-page-label">ФРАЗЫ</span>
          <h1 id="phrases-heading">Находите готовые формулировки</h1>
          <p>{info.total > 0
            ? `${info.total.toLocaleString("ru-RU")} фраз для рабочих и повседневных ситуаций`
            : "Рабочие и повседневные формулировки с контекстом и переводом"}</p>
        </div>
        {!authenticated ? (
          <button className="lx-phrases-sign-in" type="button" onClick={onRequireAuthentication}>
            Войти для синхронизации
          </button>
        ) : duePhrases !== null ? (
          <div className="lx-phrases-due-badge" role="status">
            <strong>{duePhrases}</strong>
            <span>{duePhrases} фраз готовы к повторению</span>
          </div>
        ) : null}
      </header>

      <form className="lx-phrases-search" role="search" aria-label="Поиск по фразам" onSubmit={(event) => submitSearch(event, onSearchSubmit)}>
        <label>
          <span className="lx-visually-hidden">Поиск по фразам</span>
          <SearchIcon />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Найти фразу или перевод"
            maxLength={120}
            enterKeyHint="search"
          />
        </label>
        <button className="lx-phrases-search-submit" type="submit">Найти</button>
        {searchInput ? (
          <button className="lx-phrases-search-clear" type="button" onClick={onSearchClear} aria-label="Очистить поиск">×</button>
        ) : null}
      </form>

      <nav className="lx-phrases-topic-chips" aria-label="Быстрый выбор темы">
        <button type="button" aria-pressed={filters.topic === "all"} onClick={() => onTopicChange("all")}>Все</button>
        {topicOptions.slice(0, 6).map((topic) => (
          <button key={topic} type="button" aria-pressed={filters.topic === topic} onClick={() => onTopicChange(topic)}>
            {phraseTopicLabel(topic)}
          </button>
        ))}
      </nav>

      <div className="lx-catalog-sort" data-lexigo-sort-for="phrases">
        <div>
          <strong>Сортировка</strong>
          <small>Упорядочить фразы по английскому алфавиту</small>
        </div>
        <label>
          <span className="lx-visually-hidden">Выберите порядок сортировки</span>
          <select
            aria-label="Сортировка каталога"
            value={filters.sort}
            onChange={(event) => onSortChange(event.target.value as PhraseCatalogFilters["sort"])}
          >
            <option value="default">Порядок обучения</option>
            <option value="az">A–Z</option>
            <option value="za">Z–A</option>
          </select>
        </label>
      </div>

      <div className="lx-phrases-workspace">
        <aside className="lx-phrases-filters" aria-label="Фильтры каталога фраз">
          <div className="lx-phrases-filter-heading">
            <h2>Фильтры</h2>
            {filterCount > 0 ? <span>{filterCount}</span> : null}
          </div>
          <fieldset>
            <legend>Тема</legend>
            <label><input type="radio" name="phrase-topic" value="all" checked={filters.topic === "all"} onChange={() => onTopicChange("all")} /> Все темы</label>
            {topicOptions.slice(0, 10).map((topic) => (
              <label key={topic}>
                <input
                  type="radio"
                  name="phrase-topic"
                  value={topic}
                  checked={filters.topic === topic}
                  onChange={() => onTopicChange(topic)}
                />
                {phraseTopicLabel(topic)}
              </label>
            ))}
          </fieldset>
          <button className="lx-phrases-reset" type="button" disabled={filterCount === 0} onClick={onReset}>Сбросить фильтры</button>
        </aside>

        <section className="lx-phrases-results-panel" id="phrase-catalog-results" aria-labelledby="phrases-results-heading">
          <div className="lx-phrases-results-heading">
            <div>
              <h2 id="phrases-results-heading">Готовые формулировки</h2>
              <p aria-live="polite">{status.phase === "loading" ? "Обновляем результаты…" : `${info.total.toLocaleString("ru-RU")} результатов`}</p>
            </div>
            <button className="lx-phrases-lesson-action" type="button" onClick={onConfigureLesson}>Урок по теме</button>
          </div>
          <ResultsSurface
            authenticated={authenticated}
            filters={filters}
            items={items}
            info={info}
            status={status}
            onReset={onReset}
            onRetry={onRetry}
            onOpenPhrase={onOpenPhrase}
            onPageChange={onPageChange}
            onRequireAuthentication={onRequireAuthentication}
          />
        </section>
      </div>
    </section>
  );
}
