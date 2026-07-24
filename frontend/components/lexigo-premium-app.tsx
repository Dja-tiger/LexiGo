"use client";

import type { FormEvent, MouseEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  failedResourceStatus,
  idleResourceStatus,
  isActiveLessonPayload,
  isItemsResponsePayload,
  isLearningItemPayload,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { normalizeProgressValue, rovingTargetIndex, type RovingNavigationAxis } from "../lib/accessibility-semantics";
import { apiUrl } from "../lib/api";
import {
  isAcceptedResponse,
  passwordRequirements,
  presentAuthFailure,
  validateAuthValues,
  type AuthField,
  type AuthFieldErrors,
  type AuthMode,
} from "../lib/auth-form";
import { csrfTokenFromCookie, isSessionPayload, refreshSession, type Session } from "../lib/auth-session";
import { sortCatalogEntries, type CatalogSortMode } from "../lib/catalog-sort";
import {
  catalogCountText,
  isCatalogMetadataPayload,
  type CatalogMetadata,
  type CatalogMetadataStatus,
} from "../lib/catalog-metadata";
import { CATALOG_PAGE_SIZE, catalogPageInfo, paginateCatalogEntries, type CatalogPageInfo } from "../lib/catalog-page";
import { EXPANDED_PHRASES } from "../lib/expanded-phrases";
import {
  lessonCompositionDescription,
  lessonCompositionFallbackMessage,
  lessonPriorityDescription,
  russianPlural,
  type LessonComposition,
} from "../lib/lesson-composition";
import { decideLessonAdvance, resolveActiveLessonIndex } from "../lib/lesson-flow";
import {
  buildLessonResultSnapshot,
  claimDailyGoalCelebration,
  clearLessonResultSnapshot,
  isDistinctLessonResultCandidate,
  readLessonResultSnapshot,
  resolveLessonResultContinuation,
  writeLessonResultSnapshot,
  type LessonResultContinuation,
  type LessonResultJudgement,
  type LessonResultSnapshot,
} from "../lib/lesson-result";
import {
  buildAnswerOptions,
  exerciseAnswer,
  judgeLearningAnswer,
  normalizePartOfSpeech,
  type LearningItem,
  type LessonSize,
  type WordSection,
} from "../lib/learning";
import { learningTermCopy, topicLabel } from "../lib/interface-copy";
import {
  navigationURL,
  PRIMARY_NAVIGATION,
  readPersistedNavigation as readNavigationCache,
  type AppView,
  type NavigationTarget,
  viewTitle,
  writePersistedNavigation as writeNavigationCache,
} from "../lib/navigation";
import {
  createNavigationHistoryState,
  navigationIdentity,
  navigationScrollBehavior,
  navigationScrollFromHistory,
  navigationTargetFromHistory,
  type NavigationScrollPosition,
} from "../lib/navigation-history";
import { createScrollSnapshotScheduler } from "../lib/navigation-scroll-snapshot";
import {
  consumeProductJourneyIntent,
  reportProductJourney,
  type ProductJourneyIntent,
} from "../lib/product-journey";
import {
  createNavigationTabStore,
  type PrimaryNavigationView,
} from "../lib/navigation-tabs";
import { phraseCatalogFilters, phraseCatalogTarget } from "../lib/phrase-navigation";
import {
  goalPercent,
  normalizedProgressModes,
  objectiveSuccessRate,
  type AnswerMode,
  type ProgressSummary,
  type ReviewRating,
} from "../lib/progress";
import {
  decodeJSON,
  failureFromResponse,
  fetchWithTimeout,
  RequestFailure,
} from "../lib/request-failure";
import { TECHNICAL_PHRASES } from "../lib/technical-phrases";
import { AsyncResourceNotice, AsyncSkeletonGrid, AsyncStatePanel } from "./async-state";
import { CatalogKindNavigation } from "./catalog-kind-navigation";
import { CalendarReminderIntegration } from "./calendar-reminder-integration";
import { CatalogPagination, CatalogSearchForm } from "./catalog-pagination";
import { DictionaryCatalog, type DictionaryFilters, type DictionaryPageResult } from "./dictionary-catalog";
import { ActiveLessonPresentation } from "./active-lesson-presentation";
import { LessonResultPresentation } from "./lesson-result-presentation";
import { LessonComposerProgressiveShell } from "./lesson-composer-progressive-shell";
import { SpeechPlayerButton } from "./speech-player-button";

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

type LessonItemResponse = APIItem & {
  position: number;
  rating?: ReviewRating;
  reviewedAt?: string;
};

type LessonSource = WordSection | "phrases";
type StudyMode = AnswerMode | "all";
type CollectionSource = Extract<WordSection, "daily-life" | "travel" | "data-engineering" | "backend" | "academic-technical-english">;
type CatalogKind = "phrases" | "all-items";

type PendingNavigationFocus = {
  identity: string;
  scroll: NavigationScrollPosition;
  behavior: ScrollBehavior;
};

type NavigationRequestOptions = {
  scroll?: NavigationScrollPosition;
  allowLessonExit?: boolean;
  intent?: ProductJourneyIntent;
};

type CollectionDefinition = {
  source: CollectionSource;
  label: string;
  shortLabel: string;
  description: string;
  symbol: string;
};

type LessonSessionResponse = {
  id: string;
  source: LessonSource;
  studyMode: AnswerMode;
  lessonSize: string;
  currentIndex: number;
  version: number;
  status: "active" | "completed" | "discarded";
  items: LessonItemResponse[];
  createdAt: string;
  updatedAt: string;
};

type LessonReviewResponse = {
  wordId: number;
  requestedRating: ReviewRating;
  effectiveRating: ReviewRating;
  correct?: boolean;
  judgementSource: "study" | "server" | "legacy_client";
  judgementReason: string;
  matchedAnswer?: string;
  reviewEventId: number;
  suggestionAvailable: boolean;
  lessonId: string;
  lessonCurrentIndex: number;
  lessonVersion: number;
  lastReviewedAt: string;
  lessonCompleted: boolean;
  lessonReviewedItems: number;
  lessonSkippedItems: number;
  lessonTotalItems: number;
};

type LessonPreviewResponse = {
  source: LessonSource;
  studyMode: AnswerMode;
  lessonSize: string;
  composition: LessonComposition;
};

type AuthorizedResult<T> = {
  activeSession: Session;
  data: T;
};

type CatalogBrowseQuery = {
  topic?: string;
  query?: string;
  sort?: CatalogSortMode;
};

type StartOverrides = {
  source?: LessonSource;
  size?: LessonSize;
  mode?: StudyMode;
  topic?: string;
  items?: LearningItem[];
  catalogQuery?: CatalogBrowseQuery;
  journeyIntent?: ProductJourneyIntent;
  previousResult?: LessonResultSnapshot;
};

type IconName =
  | "home"
  | "learn"
  | "phrases"
  | "library"
  | "progress"
  | "flame"
  | "bell"
  | "play"
  | "repeat"
  | "book"
  | "code"
  | "shuffle"
  | "chart"
  | "cube"
  | "bolt"
  | "spark"
  | "arrow"
  | "check"
  | "clock"
  | "user"
  | "volume"
  | "close";

const SORT_STORAGE_PREFIX = "lexigo.catalog.sort.";
const DEFAULT_PHRASE_CATALOG = Array.from(
  new Map([...TECHNICAL_PHRASES, ...EXPANDED_PHRASES].map((item) => [item.id, item])).values(),
);
const RECALL_COPY = learningTermCopy("recall");
const DUE_COPY = learningTermCopy("due");
const RETAINED_COPY = learningTermCopy("retained");
const CLOZE_COPY = learningTermCopy("cloze");
const CHUNK_COPY = learningTermCopy("chunk");

const COLLECTIONS: CollectionDefinition[] = [
  {
    source: "daily-life",
    label: "Бытовой английский",
    shortLabel: "Для жизни",
    description: "Дом, покупки, услуги, здоровье и повседневное общение",
    symbol: "A1",
  },
  {
    source: "travel",
    label: "Для путешествий",
    shortLabel: "Путешествия",
    description: "Аэропорт, отель, транспорт, документы и навигация",
    symbol: "✈",
  },
  {
    source: "data-engineering",
    label: "Инженерия данных",
    shortLabel: "Инженерия данных",
    description: "Моделирование, пайплайны, Kafka, качество и хранение данных",
    symbol: "DB",
  },
  {
    source: "backend",
    label: "Backend-разработка",
    shortLabel: "Backend",
    description: "API, архитектура, базы данных, конкурентность и надёжность",
    symbol: "</>",
  },
  {
    source: "academic-technical-english",
    label: "Academic Technical English",
    shortLabel: "Academic English",
    description: "Академическая техническая лексика для документации, исследований и инженерной коммуникации",
    symbol: "AC",
  },
];

const SOURCE_OPTIONS: Array<{
  value: LessonSource;
  label: string;
  hint: string;
  icon: IconName;
}> = [
  { value: "mixed", label: "Смешанная практика", hint: "Слова и фразы в детерминированном чередовании", icon: "shuffle" },
  { value: "noun", label: "Существительные", hint: "Системы, объекты и метрики", icon: "cube" },
  { value: "verb", label: "Глаголы", hint: "Действия, процессы и операции", icon: "bolt" },
  { value: "adjective", label: "Прилагательные", hint: "Состояния и характеристики", icon: "spark" },
  { value: "phrases", label: "Технические фразы", hint: `${CHUNK_COPY.label}: устойчивые выражения; ${CLOZE_COPY.label.toLocaleLowerCase("ru")}: задания с пропуском`, icon: "code" },
];

const MODE_OPTIONS: Array<{
  value: StudyMode;
  label: string;
  hint: string;
  icon: IconName;
}> = [
  {
    value: "study",
    label: "Простое изучение слов",
    hint: "Слово, перевод, пример и примечание видны сразу",
    icon: "book",
  },
  {
    value: "recall",
    label: RECALL_COPY.label,
    hint: RECALL_COPY.explanation,
    icon: "spark",
  },
  {
    value: "choice",
    label: "Выбрать вариант",
    hint: "Четыре варианта ответа для поддержки",
    icon: "check",
  },
];

const SIZE_OPTIONS: Array<{ value: LessonSize; label: string }> = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 60, label: "60" },
];

const GOAL_OPTIONS = [15, 30, 60];
const MODE_VALUES = MODE_OPTIONS.map((option) => option.value);
const SOURCE_VALUES: LessonSource[] = [
  ...SOURCE_OPTIONS.map((option) => option.value),
  ...COLLECTIONS.map((collection) => collection.source),
];
const SIZE_VALUES = SIZE_OPTIONS.map((option) => option.value);
const AUTH_TAB_VALUES: Array<Extract<AuthMode, "login" | "register">> = ["login", "register"];
const WORD_PREVIEW = {
  prompt: "incident",
  phonetic: "/ˈɪnsɪdənt/",
  answer: "инцидент, происшествие",
  example: "We need to identify the cause of the incident.",
};

function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") return <svg {...common}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === "learn") return <svg {...common}><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M7 9.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3V9.5"/><path d="M21 7v6"/></svg>;
  if (name === "phrases") return <svg {...common}><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>;
  if (name === "library") return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></svg>;
  if (name === "progress" || name === "chart") return <svg {...common}><path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/></svg>;
  if (name === "flame") return <svg {...common}><path d="M12 22c4 0 7-2.9 7-7 0-3.2-1.8-5.8-4.5-8.4.1 2.4-.8 3.8-2 4.7.1-3.7-1.7-6.7-4.4-9.3.1 4.4-3.1 6.5-3.1 10.8C5 18 8 22 12 22Z"/></svg>;
  if (name === "bell") return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7V5Z"/></svg>;
  if (name === "repeat") return <svg {...common}><path d="M20 7h-9a6 6 0 0 0-6 6v1"/><path d="m17 4 3 3-3 3"/><path d="M4 17h9a6 6 0 0 0 6-6v-1"/><path d="m7 20-3-3 3-3"/></svg>;
  if (name === "book") return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 11h6M8 15h7"/></svg>;
  if (name === "code") return <svg {...common}><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></svg>;
  if (name === "shuffle") return <svg {...common}><path d="M3 7h3c5 0 7 10 12 10h3"/><path d="m18 14 3 3-3 3"/><path d="M3 17h3c2 0 3.5-1.5 5-3.5"/><path d="M14 8.5C15 7.5 16.2 7 18 7h3"/><path d="m18 4 3 3-3 3"/></svg>;
  if (name === "cube") return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>;
  if (name === "bolt") return <svg {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  if (name === "volume") return <svg {...common}><path d="M5 10v4h4l5 4V6L9 10H5Z"/><path d="M17 9c1.4 1.5 1.4 4.5 0 6M19.5 6.5c3.1 3 3.1 8 0 11"/></svg>;
  if (name === "close") return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.3-4 4-6 8-6s6.7 2 8 6"/></svg>;
}

function CollectionCard({
  definition,
  variant,
  countText,
  selected = false,
  selectionProps,
  onSelect,
}: {
  definition: CollectionDefinition;
  variant: "home" | "selector" | "library";
  countText: string;
  selected?: boolean;
  selectionProps?: {
    role: "radio";
    "aria-checked": boolean;
    tabIndex: number;
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  };
  onSelect: () => void;
}) {
  const title = variant === "home" ? definition.shortLabel : definition.label;
  const hint = variant === "home" ? countText : definition.description;
  return (
    <button
      type="button"
      data-lexigo-collection={definition.source}
      data-lexigo-source={definition.source}
      data-lexigo-dictionary-source={variant === "library" ? definition.source : undefined}
      {...selectionProps}
      className={`lx-themed-${variant} lx-collection-${definition.source}${selected ? " selected" : ""}`}
      onClick={onSelect}
    >
      <span className="lx-themed-symbol">{definition.symbol}</span>
      <div><strong>{title}</strong><small>{hint}</small></div>
      {variant === "selector" ? <b data-catalog-count-state={countText === "Загрузка…" ? "loading" : undefined}>{countText}</b> : <span className="lx-themed-arrow" aria-hidden="true">→</span>}
    </button>
  );
}

function CatalogSortControl({
  kind,
  mode,
  onChange,
}: {
  kind: CatalogKind;
  mode: CatalogSortMode;
  onChange: (mode: CatalogSortMode) => void;
}) {
  const itemLabel = kind === "phrases" ? "фразы" : "слова";
  return (
    <div className="lx-catalog-sort" data-lexigo-sort-for={kind}>
      <div><strong>Сортировка</strong><small>Упорядочить {itemLabel} по английскому алфавиту</small></div>
      <label>
        <span className="lx-visually-hidden">Выберите порядок сортировки</span>
        <select
          aria-label="Сортировка каталога"
          value={mode}
          onChange={(event) => onChange(event.target.value as CatalogSortMode)}
        >
          <option value="default">Порядок обучения</option>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
        </select>
      </label>
    </div>
  );
}

function readStoredCatalogSort(kind: CatalogKind): CatalogSortMode {
  try {
    const value = window.localStorage.getItem(`${SORT_STORAGE_PREFIX}${kind}`);
    return value === "az" || value === "za" ? value : "default";
  } catch {
    return "default";
  }
}

function sortLearningItems(items: readonly LearningItem[], mode: CatalogSortMode): LearningItem[] {
  const originalIndexes = new Map(items.map((item, index) => [item.id, index]));
  return sortCatalogEntries(
    items,
    (item) => item.prompt,
    (item) => originalIndexes.get(item.id) ?? 0,
    mode,
  );
}

function isStandaloneDisplayMode(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return navigatorWithStandalone.standalone === true
    || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

async function requestJSON<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
  validator: (value: unknown) => boolean = () => true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = csrfTokenFromCookie();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }
  const response = await fetchWithTimeout(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    const failure = await failureFromResponse(response);
    throw new RequestFailure(failure.kind, failure.message, {
      status: failure.status,
      code: failure.code,
      field: failure.field,
      correlationId: failure.correlationId,
      cause: failure,
    });
  }
  if (response.status === 204) return undefined as T;
  return decodeJSON<T>(response, validator, `${path} response`);
}

async function authorizedRequest<T>(
  current: Session,
  path: string,
  init: RequestInit = {},
  validator: (value: unknown) => boolean = () => true,
): Promise<AuthorizedResult<T>> {
  try {
    return {
      activeSession: current,
      data: await requestJSON<T>(path, init, current.tokens.accessToken, validator),
    };
  } catch (requestError) {
    if (!(requestError instanceof RequestFailure) || requestError.status !== 401) throw requestError;
    const refreshed = await refreshSession();
    return {
      activeSession: refreshed,
      data: await requestJSON<T>(path, init, refreshed.tokens.accessToken, validator),
    };
  }
}

function toLearningItem(item: APIItem): LearningItem {
  const kind = item.kind === "phrase" || item.partOfSpeech.toLowerCase() === "phrase" ? "phrase" : "word";
  const fallback = kind === "phrase"
    ? DEFAULT_PHRASE_CATALOG.find((phrase) => phrase.id === item.slug || phrase.prompt === item.lemma)
    : undefined;
  return {
    id: `${kind}-${item.id}`,
    wordId: item.id,
    kind,
    slug: item.slug || fallback?.id,
    prompt: item.lemma,
    answer: item.translation,
    phonetic: item.phonetic,
    partOfSpeech: item.partOfSpeech,
    section: kind === "phrase" ? "phrase" : normalizePartOfSpeech(item.partOfSpeech),
    topic: item.topic,
    aliases: item.aliases,
    acceptedAnswers: item.acceptedAnswers,
    examples: item.examples,
    note: item.note,
    status: item.status,
    cloze: item.cloze || fallback?.cloze,
    clozeAnswer: item.clozeAnswer,
  };
}

function itemKey(item: LearningItem): string {
  return item.slug || item.id;
}

function lessonSizeFromAPI(value: string): LessonSize {
  if (value === "all") return "all";
  const parsed = Number(value);
  return parsed === 15 || parsed === 60 ? parsed : 30;
}

function timezoneOffsetMinutes(): number {
  return new Date().getTimezoneOffset();
}

function sourceLabel(source: LessonSource): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label
    ?? COLLECTIONS.find((collection) => collection.source === source)?.label
    ?? source;
}

function formatAccountDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function nextDueLabel(nextDueAt?: string): string {
  if (!nextDueAt) return "Очередь пуста";
  const value = new Date(nextDueAt);
  if (Number.isNaN(value.getTime())) return "Будет рассчитано";
  return new Intl.DateTimeFormat("ru", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function navigationIcon(view: AppView): IconName {
  if (view === "learn") return "learn";
  if (view === "phrases") return "phrases";
  if (view === "library") return "library";
  if (view === "progress") return "progress";
  return "home";
}

type PrimaryNavigationProps = {
  className: string;
  ariaLabel: string;
  currentView: AppView;
  labelMode: "full" | "short";
  onNavigate: (view: PrimaryNavigationView) => void;
};

function PrimaryNavigation({
  className,
  ariaLabel,
  currentView,
  labelMode,
  onNavigate,
}: PrimaryNavigationProps) {
  return (
    <nav className={className} aria-label={ariaLabel}>
      {PRIMARY_NAVIGATION.map((entry) => (
        <button
          key={entry.view}
          type="button"
          data-navigation-view={entry.view}
          className={currentView === entry.view ? "active" : ""}
          aria-current={currentView === entry.view ? "page" : undefined}
          onClick={() => onNavigate(entry.view as PrimaryNavigationView)}
        >
          <Icon name={navigationIcon(entry.view)} />
          <span>{labelMode === "short" ? entry.shortLabel : entry.label}</span>
        </button>
      ))}
    </nav>
  );
}

function mixedLessonFallbackMessage(lesson: LessonSessionResponse): string {
  if (lesson.source !== "mixed" || lesson.items.length === 0) return "";
  const words = lesson.items.filter((item) => item.kind !== "phrase").length;
  const phrases = lesson.items.length - words;
  if (words === 0) return "Слова для этого режима закончились. Смешанная практика продолжится доступными фразами.";
  if (phrases === 0) return "Фразы для этого режима закончились. Смешанная практика продолжится доступными словами.";
  return "";
}

export function LexigoPremiumApp({ initialSession }: { initialSession: Session | null }) {
  const [navigation, setNavigation] = useState<NavigationTarget>({ view: "home" });
  const [returnView, setReturnView] = useState<AppView>("home");
  const [session, setSession] = useState<Session | null>(initialSession);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [catalogMetadata, setCatalogMetadata] = useState<CatalogMetadata | null>(null);
  const [catalogMetadataStatus, setCatalogMetadataStatus] = useState<CatalogMetadataStatus>("loading");
  const [catalogMetadataResourceStatus, setCatalogMetadataResourceStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [activeLessonStatus, setActiveLessonStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [hydratedUserID, setHydratedUserID] = useState("");
  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>([]);
  const [phraseCatalogStatus, setPhraseCatalogStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [remotePhraseDetail, setRemotePhraseDetail] = useState<{ slug: string; item: LearningItem } | null>(null);
  const [phraseDetailStatus, setPhraseDetailStatus] = useState<{ slug: string; status: ResourceStatus }>({
    slug: "",
    status: idleResourceStatus(),
  });
  const [phraseCatalogPageInfo, setPhraseCatalogPageInfo] = useState<CatalogPageInfo>(() => paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);
  const [phrasePage, setPhrasePage] = useState(1);
  const [phraseSearchInput, setPhraseSearchInput] = useState("");
  const [phraseSearch, setPhraseSearch] = useState("");

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});
  const [authFormError, setAuthFormError] = useState("");
  const [authNotice, setAuthNotice] = useState("");

  const [source, setSource] = useState<LessonSource>("mixed");
  const [lessonSize, setLessonSize] = useState<LessonSize>(30);
  const [studyMode, setStudyMode] = useState<StudyMode>("recall");
  const [mobileComposerExpanded, setMobileComposerExpanded] = useState(false);
  const [lessonTopic, setLessonTopic] = useState("");
  const [phraseTopic, setPhraseTopic] = useState("all");
  const [phraseSortMode, setPhraseSortMode] = useState<CatalogSortMode>("default");
  const [allItemsSortMode, setAllItemsSortMode] = useState<CatalogSortMode>("default");
  const [allItemsPageInfo, setAllItemsPageInfo] = useState<CatalogPageInfo>(() => paginateCatalogEntries([], 1).info);
  const [allItemsPage, setAllItemsPage] = useState(1);
  const [allItemsSearchInput, setAllItemsSearchInput] = useState("");
  const [allItemsSearch, setAllItemsSearch] = useState("");
  const [allItemsQuery, setAllItemsQuery] = useState<CatalogBrowseQuery>({});
  const [allItemsStatus, setAllItemsStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [items, setItems] = useState<LearningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [ratings, setRatings] = useState<Record<string, ReviewRating>>({});
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [serverLessonCompleted, setServerLessonCompleted] = useState(false);
  const [serverNextIndex, setServerNextIndex] = useState<number | null>(null);
  const [serverSkippedItems, setServerSkippedItems] = useState(0);
  const [lessonResult, setLessonResult] = useState<LessonResultSnapshot | null>(null);
  const [lessonResultContinuation, setLessonResultContinuation] = useState<LessonResultContinuation>({ kind: "checking" });
  const [lessonResultCelebrate, setLessonResultCelebrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<LessonReviewResponse | null>(null);
  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [suggestionError, setSuggestionError] = useState("");
  const [error, setError] = useState("");
  const [lessonQueueNotice, setLessonQueueNotice] = useState("");
  const [lessonPreview, setLessonPreview] = useState<LessonPreviewResponse | null>(null);
  const [previewingLesson, setPreviewingLesson] = useState(false);
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const reviewInFlightRef = useRef(false);
  const lessonCreateInFlightRef = useRef(false);
  const lessonJudgementsRef = useRef<Record<string, LessonResultJudgement>>({});
  const lessonProgressBeforeRef = useRef<number | null>(null);
  const latestProgressRef = useRef<ProgressSummary | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);
  const lessonAdvanceRef = useRef<HTMLButtonElement | null>(null);
  const navigationRef = useRef(navigation);
  const lessonNavigationLockRef = useRef(false);
  const announcementCounterRef = useRef(0);
  const [navigationTabs] = useState(createNavigationTabStore);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigationFocus | null>(null);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });
  const lessonFocusMode = navigation.view === "lesson" && lessonStarted;
  const lessonNavigationLocked = lessonFocusMode && !lessonComplete;

  const loadCatalogMetadataResource = useCallback(async (signal?: AbortSignal) => {
    setCatalogMetadataStatus("loading");
    setCatalogMetadataResourceStatus(loadingResourceStatus());
    try {
      const metadata = await requestJSON<CatalogMetadata>(
        "/api/v1/catalog/metadata",
        { signal },
        undefined,
        isCatalogMetadataPayload,
      );
      if (signal?.aborted) return;
      setCatalogMetadata(metadata);
      setCatalogMetadataStatus("ready");
      setCatalogMetadataResourceStatus(readyResourceStatus());
    } catch (metadataError) {
      if (signal?.aborted) return;
      console.error("catalog metadata request failed", metadataError);
      setCatalogMetadata(null);
      setCatalogMetadataStatus("error");
      setCatalogMetadataResourceStatus(failedResourceStatus(metadataError, "состав каталога"));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadCatalogMetadataResource(controller.signal);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadCatalogMetadataResource]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const applyNavigation = (
      next: NavigationTarget,
      scroll: NavigationScrollPosition = { x: 0, y: 0 },
    ) => {
      navigationRef.current = next;
      navigationTabs.remember(next, scroll);
      setNavigation(next);
      if (next.source) setSource(next.source);
      if (next.view === "learn") setLessonTopic(next.topic ?? "");
      writeNavigationCache(window.localStorage, next);
    };

    const persistCurrentEntry = () => {
      const current = navigationRef.current;
      const scroll = { x: window.scrollX, y: window.scrollY };
      navigationTabs.remember(current, scroll);
      window.history.replaceState(
        createNavigationHistoryState(current, scroll),
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

    const syncNavigationFromHistory = (event: PopStateEvent) => {
      const next = navigationTargetFromHistory(event.state, window.location.search);
      const scroll = navigationScrollFromHistory(event.state);
      const current = navigationRef.current;
      if (lessonNavigationLockRef.current && current.view === "lesson" && next.view !== "lesson") {
        const currentScroll = { x: window.scrollX, y: window.scrollY };
        window.history.pushState(
          createNavigationHistoryState(current, currentScroll),
          "",
          navigationURL(current),
        );
        setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти».");
        window.dispatchEvent(new Event("lexigo:request-lesson-exit"));
        setPendingNavigation({
          identity: navigationIdentity(current),
          scroll: currentScroll,
          behavior: "auto",
        });
        return;
      }
      reportProductJourney(current, next, consumeProductJourneyIntent() ?? "browser_history");
      setPendingNavigation({
        identity: navigationIdentity(next),
        scroll,
        behavior: "auto",
      });
      applyNavigation(next, scroll);
    };

    const explicitNavigation = window.location.search.length > 0;
    const restored = !explicitNavigation && isStandaloneDisplayMode()
      ? readNavigationCache(window.localStorage)
      : null;
    const initial = restored
      ?? navigationTargetFromHistory(window.history.state, window.location.search);
    window.history.replaceState(
      createNavigationHistoryState(initial, { x: window.scrollX, y: window.scrollY }),
      "",
      restored ? navigationURL(restored) : window.location.href,
    );
    applyNavigation(initial, { x: window.scrollX, y: window.scrollY });

    window.addEventListener("popstate", syncNavigationFromHistory);
    window.addEventListener("scroll", scheduleScrollSnapshot, { passive: true });
    window.addEventListener("pagehide", flushScrollSnapshot);
    document.addEventListener("visibilitychange", flushScrollSnapshotWhenHidden);
    return () => {
      flushScrollSnapshot();
      scrollSnapshots.cancel();
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", syncNavigationFromHistory);
      window.removeEventListener("scroll", scheduleScrollSnapshot);
      window.removeEventListener("pagehide", flushScrollSnapshot);
      document.removeEventListener("visibilitychange", flushScrollSnapshotWhenHidden);
    };
  }, [navigationTabs]);

  useEffect(() => {
    const target = new URL(window.location.href);
    const fragment = new URLSearchParams(target.hash.replace(/^#/, ""));
    const token = fragment.get("reset_token")?.trim()
      || target.searchParams.get("reset_token")?.trim()
      || "";
    if (!token) return;
    const timer = window.setTimeout(() => {
      target.searchParams.delete("reset_token");
      target.hash = "";
      window.history.replaceState(
        createNavigationHistoryState(
          { view: "profile" },
          { x: window.scrollX, y: window.scrollY },
        ),
        "",
        target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
      );
      setResetToken(token);
      setAuthMode("reset");
      setReturnView("profile");
      setAuthFieldErrors({});
      setAuthFormError("");
      setAuthNotice("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
      setPhraseSortMode(readStoredCatalogSort("phrases"));
      setAllItemsSortMode(readStoredCatalogSort("all-items"));
    }, 0);
    return () => window.clearTimeout(storageTimer);
  }, []);

  useEffect(() => {
    if (navigation.view !== "phrases") return;
    const timer = window.setTimeout(() => {
      const filters = phraseCatalogFilters(navigation);
      setPhraseTopic(filters.topic);
      setPhrasePage(filters.page);
      setPhraseSearchInput(filters.query);
      setPhraseSearch(filters.query);
      setPhraseSortMode(filters.sort);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [navigation]);

  useEffect(() => {
    if (!lessonStarted) return;
    const timer = window.setTimeout(() => setCardStartedAt(window.performance.now()), 0);
    return () => window.clearTimeout(timer);
  }, [lessonStarted, currentIndex, studyMode]);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);

  useEffect(() => {
    latestProgressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (
      !session
      || navigation.view !== "lesson"
      || lessonStarted
      || activeLesson
      || activeLessonStatus.phase !== "ready"
    ) return;

    let restored: LessonResultSnapshot | null = null;
    try {
      restored = readLessonResultSnapshot(window.sessionStorage, session.user.id);
    } catch {
      restored = null;
    }
    if (!restored) return;

    const restoredSource = SOURCE_VALUES.includes(restored.source as LessonSource)
      ? restored.source as LessonSource
      : "mixed";
    setSource(restoredSource);
    setStudyMode(restored.studyMode);
    setLessonSize(lessonSizeFromAPI(restored.lessonSize));
    setLessonTopic(restored.topic);
    setItems([]);
    setRatings({});
    lessonJudgementsRef.current = {};
    lessonProgressBeforeRef.current = restored.reviewsBefore;
    setLessonResult(restored);
    setLessonResultContinuation(resolveLessonResultContinuation({ snapshot: restored, previewTotal: null }));
    setLessonResultCelebrate(false);
    setLessonStarted(true);
    setLessonComplete(true);
    setServerLessonCompleted(true);
    setServerNextIndex(null);
    setServerSkippedItems(restored.skipped);
    setError("");
  }, [activeLesson, activeLessonStatus.phase, lessonStarted, navigation.view, session]);

  useEffect(() => {
    if (!session || !lessonResult || !lessonComplete || navigation.view !== "lesson") return;
    const immediate = resolveLessonResultContinuation({ snapshot: lessonResult, previewTotal: null });
    if (immediate.kind !== "checking") {
      setLessonResultContinuation(immediate);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLessonResultContinuation({ kind: "checking" });
    void authorizedRequest<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({
        source: lessonResult.source,
        studyMode: lessonResult.studyMode,
        lessonSize: lessonResult.lessonSize,
        ...(lessonResult.topic ? { topic: lessonResult.topic } : {}),
      }),
    }).then((result) => {
      if (cancelled) return;
      setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken
        ? current
        : result.activeSession);
      const sourceName = SOURCE_VALUES.includes(lessonResult.source as LessonSource)
        ? sourceLabel(lessonResult.source as LessonSource)
        : "Следующий учебный блок";
      setLessonResultContinuation(resolveLessonResultContinuation({
        snapshot: lessonResult,
        previewTotal: result.data.composition.total,
        nextTitle: sourceName,
        estimatedMinutes: Math.max(1, Math.round(result.data.composition.total / 2)),
      }));
    }).catch(() => {
      if (cancelled) return;
      setLessonResultContinuation(resolveLessonResultContinuation({ snapshot: lessonResult, previewTotal: 0 }));
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lessonComplete, lessonResult, navigation.view, session]);

  useEffect(() => {
    lessonNavigationLockRef.current = lessonNavigationLocked;
  }, [lessonNavigationLocked]);

  useEffect(() => {
    if (!lessonNavigationLocked) return;
    const preventAccidentalUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventAccidentalUnload);
    return () => window.removeEventListener("beforeunload", preventAccidentalUnload);
  }, [lessonNavigationLocked]);

  useLayoutEffect(() => {
    navigationRef.current = navigation;
    if (!pendingNavigation || pendingNavigation.identity !== navigationIdentity(navigation)) return;
    const pending = pendingNavigation;

    const frame = window.requestAnimationFrame(() => {
      mainContentRef.current?.focus({ preventScroll: true });
      window.scrollTo({
        left: pending.scroll.x,
        top: pending.scroll.y,
        behavior: pending.behavior,
      });
      announcementCounterRef.current += 1;
      setRouteAnnouncement({
        id: announcementCounterRef.current,
        message: `${viewTitle(navigation.view)}. Экран загружен.`,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [navigation, pendingNavigation]);

  const currentItem = items[currentIndex];
  const currentRating = currentItem ? ratings[currentItem.id] : undefined;
  const expectedAnswer = currentItem ? exerciseAnswer(currentItem) : "";
  const submittedAnswer = selectedAnswer || typedAnswer;
  const localJudgement = currentItem && submittedAnswer.trim()
    ? judgeLearningAnswer(currentItem, submittedAnswer)
    : null;
  const literalMatch = Boolean(localJudgement?.correct);
  const answerOptions = useMemo(
    () => (currentItem ? buildAnswerOptions(currentItem, items) : []),
    [currentItem, items],
  );
  const phraseTopics = useMemo(() => {
    const metadataTopics = catalogMetadata?.topics
      .filter((entry) => (entry.phrases ?? 0) > 0)
      .map((entry) => entry.topic) ?? [];
    const availableTopics = session
      ? [...metadataTopics, ...phraseCatalog.map((phrase) => phrase.topic)]
      : DEFAULT_PHRASE_CATALOG.map((phrase) => phrase.topic);
    return ["all", ...Array.from(new Set(availableTopics))
      .sort((left, right) => topicLabel(left).localeCompare(topicLabel(right), "ru"))];
  }, [catalogMetadata, phraseCatalog, session]);
  const guestPhrasePage = useMemo(() => {
    let available = phraseTopic === "all"
      ? DEFAULT_PHRASE_CATALOG
      : DEFAULT_PHRASE_CATALOG.filter((phrase) => phrase.topic === phraseTopic);
    const normalizedQuery = phraseSearch.trim().toLocaleLowerCase("en");
    if (normalizedQuery) {
      available = available.filter((phrase) => [phrase.prompt, phrase.answer, phrase.topic]
        .some((value) => value.toLocaleLowerCase("en").includes(normalizedQuery)));
    }
    return paginateCatalogEntries(sortLearningItems(available, phraseSortMode), phrasePage);
  }, [phrasePage, phraseSearch, phraseSortMode, phraseTopic]);
  const sortedVisiblePhrases = session ? phraseCatalog : guestPhrasePage.items;
  const activePhrasePageInfo = session ? phraseCatalogPageInfo : guestPhrasePage.info;
  const sortedAllItems = items;
  const selectedPhrase = navigation.detail
    ? phraseCatalog.find((phrase) => itemKey(phrase) === navigation.detail)
      ?? DEFAULT_PHRASE_CATALOG.find((phrase) => phrase.id === navigation.detail)
      ?? (remotePhraseDetail?.slug === navigation.detail ? remotePhraseDetail.item : undefined)
    : undefined;
  const successRate = objectiveSuccessRate(progress);

  function navigate(
    target: NavigationTarget,
    replace = false,
    options: NavigationRequestOptions = {},
  ) {
    if (
      lessonNavigationLocked
      && navigation.view === "lesson"
      && target.view !== "lesson"
      && !options.allowLessonExit
    ) {
      setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти».");
      setPendingNavigation({
        identity: navigationIdentity(navigation),
        scroll: { x: window.scrollX, y: window.scrollY },
        behavior: "auto",
      });
      return;
    }

    reportProductJourney(navigation, target, options.intent ?? "in_app_navigation");
    const currentScroll = { x: window.scrollX, y: window.scrollY };
    navigationTabs.remember(navigation, currentScroll);
    const targetScroll = options.scroll ?? { x: 0, y: 0 };
    const url = navigationURL(target);
    window.history.replaceState(
      createNavigationHistoryState(navigation, currentScroll),
      "",
      window.location.href,
    );

    const nextState = createNavigationHistoryState(target, targetScroll);
    if (replace) window.history.replaceState(nextState, "", url);
    else window.history.pushState(nextState, "", url);

    setPendingNavigation({
      identity: navigationIdentity(target),
      scroll: targetScroll,
      behavior: navigationScrollBehavior(window),
    });
    setNavigation(target);
    if (target.source) setSource(target.source);
    if (target.view === "learn") setLessonTopic(target.topic ?? "");
    writeNavigationCache(window.localStorage, target);
    setError("");
    if (target.view !== "lesson") setLessonQueueNotice("");
  }

  function navigatePrimary(view: PrimaryNavigationView) {
    if (navigation.view === view) return;
    const destination = navigationTabs.destination(view);
    navigate(destination.target, false, { scroll: destination.scroll, intent: "primary_navigation" });
  }

  function skipToMainContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const main = mainContentRef.current;
    if (!main) return;
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start", behavior: navigationScrollBehavior(window) });
  }

  function requestAuthentication(afterLogin: AppView) {
    setReturnView(afterLogin);
    navigate({ view: "profile" }, false, { intent: "authentication" });
  }

  const loadItems = useCallback(async (
    activeSession: Session,
    kind: "word" | "phrase" | "all",
    dueOnly: boolean,
    options: { source?: LessonSource; topic?: string; query?: string; status?: string; sort?: CatalogSortMode; page?: number; limit?: number } = {},
    signal?: AbortSignal,
  ) => {
    const endpoint = dueOnly ? "/api/v1/words/due" : "/api/v1/words";
    const parameters = new URLSearchParams({
      kind,
      page: String(options.page ?? 1),
      limit: String(options.limit ?? CATALOG_PAGE_SIZE),
      sort: options.sort ?? "default",
    });
    if (options.source) parameters.set("source", options.source);
    if (options.topic) parameters.set("topic", options.topic);
    if (options.query) parameters.set("query", options.query);
    if (options.status) parameters.set("status", options.status);
    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?${parameters.toString()}`,
      { signal },
      isItemsResponsePayload,
    );
    return {
      activeSession: result.activeSession,
      response: { ...result.data, items: result.data.items.map(toLearningItem) },
    };
  }, []);

  const loadDictionaryPage = useCallback(async (
    filters: DictionaryFilters,
    signal: AbortSignal,
  ): Promise<DictionaryPageResult> => {
    if (!session) throw new Error("Войдите, чтобы открыть словарь");
    const result = await loadItems(session, "word", false, {
      source: filters.source,
      topic: filters.topic,
      query: filters.query,
      status: filters.status,
      sort: filters.sort,
      page: filters.page,
    }, signal);
    setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken ? current : result.activeSession);
    return { items: result.response.items, info: catalogPageInfo(result.response) };
  }, [loadItems, session]);

  const loadDictionaryDetail = useCallback(async (
    wordID: number,
    signal: AbortSignal,
  ): Promise<LearningItem> => {
    if (!session) throw new Error("Войдите, чтобы открыть карточку слова");
    const result = await authorizedRequest<APIItem>(
      session,
      `/api/v1/words/${wordID}`,
      { signal },
      isLearningItemPayload,
    );
    setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken ? current : result.activeSession);
    return toLearningItem(result.data);
  }, [session]);

  const loadProgressResource = useCallback(async (
    activeSession: Session,
    signal?: AbortSignal,
    adoptSession = true,
  ): Promise<Session | null> => {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return null;
      latestProgressRef.current = result.data;
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      if (adoptSession) setSession(result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      setProgressStatus(failedResourceStatus(requestError, "прогресс"));
      return null;
    }
  }, []);

  const loadPhraseCatalogResource = useCallback(async (
    activeSession: Session,
    options: { page: number; topic: string; query: string; sort: CatalogSortMode },
    signal?: AbortSignal,
    adoptSession = true,
  ): Promise<Session | null> => {
    setPhraseCatalogStatus(loadingResourceStatus());
    try {
      const result = await loadItems(activeSession, "phrase", false, {
        source: "phrases",
        page: options.page,
        topic: options.topic === "all" ? "" : options.topic,
        query: options.query,
        sort: options.sort,
      }, signal);
      if (signal?.aborted) return null;
      setPhraseCatalog(result.response.items);
      setPhraseCatalogPageInfo(catalogPageInfo(result.response));
      setPhrasePage(catalogPageInfo(result.response).page);
      setPhraseCatalogStatus(readyResourceStatus());
      if (adoptSession) {
        setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken ? current : result.activeSession);
      }
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      setPhraseCatalogStatus(failedResourceStatus(requestError, "каталог фраз"));
      return null;
    }
  }, [loadItems]);

  const loadPhraseDetailResource = useCallback(async (
    activeSession: Session,
    slug: string,
    signal?: AbortSignal,
  ): Promise<Session | null> => {
    setPhraseDetailStatus({ slug, status: loadingResourceStatus() });
    try {
      const result = await authorizedRequest<APIItem>(
        activeSession,
        `/api/v1/phrases/${encodeURIComponent(slug)}`,
        { signal },
        (value) => isLearningItemPayload(value)
          && (value as APIItem).kind === "phrase"
          && (value as APIItem).slug === slug,
      );
      if (signal?.aborted) return null;
      setRemotePhraseDetail({ slug, item: toLearningItem(result.data) });
      setPhraseDetailStatus({ slug, status: readyResourceStatus() });
      setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken ? current : result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      setRemotePhraseDetail((current) => current?.slug === slug ? null : current);
      setPhraseDetailStatus({ slug, status: failedResourceStatus(requestError, "карточку фразы") });
      return null;
    }
  }, []);

  const loadActiveLessonResource = useCallback(async (
    activeSession: Session,
    signal?: AbortSignal,
    adoptSession = true,
  ): Promise<Session | null> => {
    setActiveLessonStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<LessonSessionResponse>(
        activeSession,
        "/api/v1/lessons/active",
        { signal },
        isActiveLessonPayload,
      );
      if (signal?.aborted) return null;
      setActiveLesson(result.data);
      setActiveLessonStatus(readyResourceStatus());
      if (adoptSession) setSession(result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      if (requestError instanceof RequestFailure && requestError.status === 404) {
        setActiveLesson(null);
        setActiveLessonStatus(readyResourceStatus());
        return activeSession;
      }
      setActiveLessonStatus(failedResourceStatus(requestError, "незавершённый урок"));
      return null;
    }
  }, []);

  useEffect(() => {
    if (!session || hydratedUserID === session.user.id) return;
    let cancelled = false;
    const controller = new AbortController();
    const activeSession = session;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setProgress(null);
      setActiveLesson(null);
      setPhraseCatalog([]);
      setRemotePhraseDetail(null);
      setPhraseDetailStatus({ slug: "", status: idleResourceStatus() });
      setPhraseCatalogPageInfo(paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);
      setPhrasePage(1);
      setPhraseCatalogStatus(idleResourceStatus());
      void Promise.all([
        loadProgressResource(activeSession, controller.signal, false),
        loadActiveLessonResource(activeSession, controller.signal, false),
      ]).then((sessions) => {
        if (cancelled) return;
        setHydratedUserID(activeSession.user.id);
        const refreshed = sessions.find((candidate) => candidate?.tokens.accessToken !== activeSession.tokens.accessToken);
        if (refreshed) setSession(refreshed);
      });
    }, 0);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    session,
    hydratedUserID,
    loadActiveLessonResource,
    loadProgressResource,
  ]);

  useEffect(() => {
    if (!session || navigation.view !== "phrases" || navigation.detail) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadPhraseCatalogResource(session, {
        page: phrasePage,
        topic: phraseTopic,
        query: phraseSearch,
        sort: phraseSortMode,
      }, controller.signal);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    loadPhraseCatalogResource,
    navigation.detail,
    navigation.view,
    phrasePage,
    phraseSearch,
    phraseSortMode,
    phraseTopic,
    session,
  ]);

  useEffect(() => {
    if (!session || navigation.view !== "phrases" || !navigation.detail) return;
    const slug = navigation.detail;
    const availableLocally = phraseCatalog.some((phrase) => itemKey(phrase) === slug)
      || DEFAULT_PHRASE_CATALOG.some((phrase) => phrase.id === slug);
    if (availableLocally || remotePhraseDetail?.slug === slug) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadPhraseDetailResource(session, slug, controller.signal);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    loadPhraseDetailResource,
    navigation.detail,
    navigation.view,
    phraseCatalog,
    remotePhraseDetail?.slug,
    session,
  ]);

  useEffect(() => {
    if (!session || navigation.view !== "learn" || studyMode === "all") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewingLesson(true);
      void authorizedRequest<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {
        method: "POST",
        body: JSON.stringify({ source, studyMode, lessonSize: String(lessonSize), ...(lessonTopic ? { topic: lessonTopic } : {}) }),
      }).then((result) => {
        if (cancelled) return;
        setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken ? current : result.activeSession);
        setLessonPreview(result.data);
      }).catch(() => {
        if (!cancelled) setLessonPreview(null);
      }).finally(() => {
        if (!cancelled) setPreviewingLesson(false);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lessonSize, lessonTopic, navigation.view, session, source, studyMode]);

  async function refreshProgress(activeSession: Session): Promise<{ activeSession: Session; progress: ProgressSummary }> {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        {},
        isProgressSummaryPayload,
      );
      latestProgressRef.current = result.data;
      setSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      return { activeSession: result.activeSession, progress: result.data };
    } catch (requestError) {
      setProgressStatus(failedResourceStatus(requestError, "прогресс"));
      throw requestError;
    }
  }

  function updateCatalogSort(kind: CatalogKind, mode: CatalogSortMode) {
    if (kind === "phrases") setPhraseSortMode(mode);
    else setAllItemsSortMode(mode);
    try {
      window.localStorage.setItem(`${SORT_STORAGE_PREFIX}${kind}`, mode);
    } catch {
      // Sorting remains available for the current session when storage is restricted.
    }
  }

  function selectRovingControl<T extends string | number>(
    event: React.KeyboardEvent<HTMLButtonElement>,
    values: readonly T[],
    currentValue: T,
    onSelect: (value: T) => void,
    axis: RovingNavigationAxis = "both",
  ) {
    const currentIndex = values.findIndex((value) => value === currentValue);
    const nextIndex = rovingTargetIndex(currentIndex, values.length, event.key, axis);
    if (nextIndex === null) return;
    const nextValue = values[nextIndex];
    if (nextValue === undefined) return;

    event.preventDefault();
    const group = event.currentTarget.closest<HTMLElement>('[role="radiogroup"], [role="tablist"]');
    const controls = Array.from(
      group?.querySelectorAll<HTMLButtonElement>('[role="radio"], [role="tab"]') ?? [],
    );
    controls[nextIndex]?.focus();
    onSelect(nextValue);
  }

  function handleAuthTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    mode: Extract<AuthMode, "login" | "register">,
  ) {
    selectRovingControl(event, AUTH_TAB_VALUES, mode, switchAuthMode, "horizontal");
  }

  function resetCardState(mode = studyMode, rated = false) {
    setRevealed(rated || mode === "study");
    setSelectedAnswer("");
    setTypedAnswer("");
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
  }

  function applyLesson(lesson: LessonSessionResponse) {
    const lessonItems = lesson.items.map(toLearningItem);
    const restoredRatings: Record<string, ReviewRating> = {};
    const restoredJudgements: Record<string, LessonResultJudgement> = {};
    lesson.items.forEach((item, index) => {
      const learningItem = lessonItems[index];
      if (item.rating && learningItem) {
        restoredRatings[learningItem.id] = item.rating;
        restoredJudgements[learningItem.id] = { mode: lesson.studyMode, correct: null };
      }
    });
    const candidate = lessonItems[lesson.currentIndex];
    const safeIndex = resolveActiveLessonIndex(
      lesson.currentIndex,
      lessonItems.length,
      Boolean(candidate && restoredRatings[candidate.id]),
    );
    if (safeIndex === null || !Number.isInteger(lesson.version) || lesson.version <= 0) {
      setActiveLesson(null);
      clearLessonState();
      setError("Сервер вернул некорректную позицию урока. Обновите страницу или начните новый блок.");
      return false;
    }
    const presentationMode = lesson.studyMode;
    if (session) {
      try {
        clearLessonResultSnapshot(window.sessionStorage, session.user.id);
      } catch {
        // A new active server lesson still replaces the transient result in memory.
      }
    }
    setLessonResult(null);
    setLessonResultContinuation({ kind: "checking" });
    setLessonResultCelebrate(false);
    lessonJudgementsRef.current = restoredJudgements;
    lessonProgressBeforeRef.current = latestProgressRef.current?.reviewsToday ?? null;
    setActiveLesson(lesson);
    setSource(lesson.source);
    setStudyMode(presentationMode);
    setLessonSize(lessonSizeFromAPI(lesson.lessonSize));
    setItems(lessonItems);
    setRatings(restoredRatings);
    setCurrentIndex(safeIndex);
    resetCardState(presentationMode, Boolean(lessonItems[safeIndex] && restoredRatings[lessonItems[safeIndex].id]));
    setLessonComplete(lessonItems.length === 0);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setServerSkippedItems(0);
    setLessonStarted(true);
    return true;
  }

  async function resynchronizeActiveLesson(message: string) {
    if (!session) return;
    try {
      const result = await authorizedRequest<LessonSessionResponse>(session, "/api/v1/lessons/active");
      setSession(result.activeSession);
      if (applyLesson(result.data)) {
        navigate({ view: "lesson", source: result.data.source }, true);
        setError(message);
      } else {
        navigate({ view: "learn" }, true);
      }
    } catch (requestError) {
      if (requestError instanceof RequestFailure && requestError.status === 404) {
        setActiveLesson(null);
        clearLessonState();
        navigate({ view: "learn" }, true);
        setError("Активный урок уже завершён или сброшен на другом устройстве.");
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Не удалось синхронизировать урок");
    }
  }

  async function resumeLesson() {
    if (!session) {
      requestAuthentication("home");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await authorizedRequest<LessonSessionResponse>(session, "/api/v1/lessons/active");
      setSession(result.activeSession);
      if (applyLesson(result.data)) navigate({ view: "lesson", source: result.data.source });
      else navigate({ view: "learn" }, true);
    } catch (requestError) {
      if (requestError instanceof RequestFailure && requestError.status === 404) {
        setActiveLesson(null);
        setError("Незавершённый урок отсутствует. Начните новый блок.");
        navigate({ view: "learn" }, true);
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось продолжить урок");
      }
    } finally {
      setBusy(false);
    }
  }

  async function discardActiveLesson() {
    if (!session || !activeLesson) return;
    setBusy(true);
    setError("");
    try {
      const result = await authorizedRequest<void>(session, `/api/v1/lessons/${activeLesson.id}`, {
        method: "DELETE",
        headers: { "If-Match": `"${activeLesson.version}"` },
      });
      setSession(result.activeSession);
      setActiveLesson(null);
      clearLessonState();
      navigate({ view: "learn" });
    } catch (requestError) {
      if (requestError instanceof RequestFailure && requestError.status === 409) {
        await resynchronizeActiveLesson("Урок изменён на другом устройстве. Показана актуальная позиция.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось сбросить урок");
      }
    } finally {
      setBusy(false);
    }
  }

  async function loadCatalogBrowsePage(
    activeSession: Session | null,
    resolvedSource: LessonSource,
    requestedPage: number,
    query: CatalogBrowseQuery,
  ): Promise<Session | null> {
    setAllItemsStatus(loadingResourceStatus());
    try {
      if (!activeSession && resolvedSource === "phrases") {
        let available = query.topic
? DEFAULT_PHRASE_CATALOG.filter((item) => item.topic === query.topic)
: DEFAULT_PHRASE_CATALOG;
        const normalizedQuery = query.query?.trim().toLocaleLowerCase("en") ?? "";
        if (normalizedQuery) {
available = available.filter((item) => [item.prompt, item.answer, item.topic]
  .some((value) => value.toLocaleLowerCase("en").includes(normalizedQuery)));
        }
        const page = paginateCatalogEntries(sortLearningItems(available, query.sort ?? "default"), requestedPage);
        setItems(page.items);
        setAllItemsPage(page.info.page);
        setAllItemsPageInfo(page.info);
        setAllItemsStatus(readyResourceStatus());
        return null;
      }
      if (!activeSession) throw new Error("Войдите, чтобы открыть каталог слов");
      const kind = resolvedSource === "phrases" ? "phrase" : resolvedSource === "mixed" ? "all" : "word";
      const result = await loadItems(activeSession, kind, false, {
        source: resolvedSource,
        page: requestedPage,
        topic: query.topic,
        query: query.query,
        sort: query.sort ?? "default",
      });
      setItems(result.response.items);
      const info = catalogPageInfo(result.response);
      setAllItemsPage(info.page);
      setAllItemsPageInfo(info);
      setAllItemsStatus(readyResourceStatus());
      setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken ? current : result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      setAllItemsStatus(failedResourceStatus(requestError, "страницу каталога"));
      throw requestError;
    }
  }

  async function startLesson(activeSession = session, overrides: StartOverrides = {}) {
    if (lessonCreateInFlightRef.current) return;
    const resolvedSource = overrides.source ?? source;
    const resolvedSize = overrides.size ?? lessonSize;
    const resolvedMode = overrides.mode ?? studyMode;
    const resolvedTopic = overrides.topic?.trim() ?? lessonTopic.trim();
    setSource(resolvedSource);
    setLessonSize(resolvedSize);
    setStudyMode(resolvedMode);
    setLessonTopic(resolvedTopic);

    if (resolvedMode !== "all" && !activeSession) {
      requestAuthentication(resolvedSource === "phrases" ? "phrases" : "learn");
      return;
    }
    if (resolvedSource !== "phrases" && !activeSession) {
      requestAuthentication("learn");
      return;
    }

    lessonCreateInFlightRef.current = true;
    setBusy(true);
    setError("");
    setLessonQueueNotice("");
    try {
      const currentSession = activeSession;
      if (resolvedMode !== "all") {
        const explicitItems = overrides.items?.filter((item) => typeof item.wordId === "number") ?? [];
        if (overrides.items && explicitItems.length !== overrides.items.length) {
          throw new Error("Выбранные элементы ещё не синхронизированы с сервером");
        }
        lessonProgressBeforeRef.current = latestProgressRef.current?.reviewsToday ?? null;
        const result = await authorizedRequest<LessonSessionResponse>(
          currentSession as Session,
          "/api/v1/lessons",
          {
            method: "POST",
            body: JSON.stringify({
              source: resolvedSource,
              studyMode: resolvedMode,
              lessonSize: String(resolvedSize),
              ...(resolvedTopic ? { topic: resolvedTopic } : {}),
              ...(overrides.items ? { wordIds: explicitItems.map((item) => item.wordId) } : {}),
            }),
          },
        );
        if (overrides.previousResult && !isDistinctLessonResultCandidate(overrides.previousResult, {
          id: result.data.id,
          itemIds: result.data.items.map((item) => item.id),
        })) {
          throw new Error("Следующий урок совпал с завершённым блоком. Обновите очередь и повторите попытку.");
        }
        try {
          clearLessonResultSnapshot(window.sessionStorage, result.activeSession.user.id);
        } catch {
          // The new active server lesson remains authoritative when storage is restricted.
        }
        setSession(result.activeSession);
        if (applyLesson(result.data)) {
          setLessonQueueNotice(mixedLessonFallbackMessage(result.data));
          navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });
        }
        return;
      }

      const browseQuery = overrides.catalogQuery ?? {};
      setAllItemsQuery(browseQuery);
      setAllItemsSearchInput(browseQuery.query ?? "");
      setAllItemsSearch(browseQuery.query ?? "");
      setAllItemsSortMode(browseQuery.sort ?? "default");
      await loadCatalogBrowsePage(currentSession, resolvedSource, 1, browseQuery);
      setActiveLesson(null);
      setCurrentIndex(0);
      setRatings({});
      resetCardState(resolvedMode);
      setLessonStarted(true);
      setLessonComplete(false);
      setServerLessonCompleted(false);
      setServerNextIndex(null);
      setServerSkippedItems(0);
      navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сформировать учебный блок");
    } finally {
      lessonCreateInFlightRef.current = false;
      setBusy(false);
    }
  }
  function clearAuthFieldError(field: AuthField) {
    setAuthFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setAuthFormError("");
  }

  function switchAuthMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthFieldErrors({});
    setAuthFormError("");
    setAuthNotice("");
    setPassword("");
    setPasswordConfirmation("");
    setPasswordVisible(false);
  }

  function focusFirstAuthError(errors: AuthFieldErrors) {
    const order: AuthField[] = ["displayName", "email", "password", "passwordConfirmation", "token"];
    const field = order.find((candidate) => Boolean(errors[candidate]));
    if (!field) return;
    window.requestAnimationFrame(() => document.getElementById(`auth-${field}`)?.focus());
  }

  function removeResetTokenFromURL() {
    const target = new URL(window.location.href);
    target.searchParams.delete("reset_token");
    target.hash = "";
    window.history.replaceState(
      { lexigo: true, view: "profile" },
      "",
      target.pathname + (target.searchParams.size ? `?${target.searchParams.toString()}` : ""),
    );
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { displayName, email, password, passwordConfirmation, token: resetToken };
    const validationErrors = validateAuthValues(authMode, values);
    if (Object.keys(validationErrors).length > 0) {
      setAuthFieldErrors(validationErrors);
      setAuthFormError("Исправьте отмеченные поля.");
      focusFirstAuthError(validationErrors);
      return;
    }

    setBusy(true);
    setError("");
    setAuthFieldErrors({});
    setAuthFormError("");
    setAuthNotice("");
    try {
      if (authMode === "forgot") {
        await requestJSON<{ accepted: true }>(
          "/api/v1/auth/password-reset/request",
          { method: "POST", body: JSON.stringify({ email: email.trim() }) },
          undefined,
          isAcceptedResponse,
        );
        setAuthNotice("Если аккаунт существует, письмо со ссылкой отправлено. Проверьте также папку «Спам».");
        return;
      }

      if (authMode === "reset") {
        await requestJSON<void>("/api/v1/auth/password-reset/confirm", {
          method: "POST",
          body: JSON.stringify({ token: resetToken, newPassword: password }),
        });
        setPassword("");
        setPasswordConfirmation("");
        setResetToken("");
        removeResetTokenFromURL();
        setAuthMode("login");
        setAuthNotice("Пароль изменён. Войдите с новым паролем.");
        return;
      }

      const authenticated = await requestJSON<Session>(`/api/v1/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(authMode === "register" ? { displayName: displayName.trim() } : {}),
        }),
      }, undefined, isSessionPayload);
      setSession(authenticated);
      setPassword("");
      setPasswordConfirmation("");
      setHydratedUserID("");
      navigate({ view: returnView === "profile" ? "home" : returnView });
    } catch (requestError) {
      const presentation = presentAuthFailure(requestError);
      setAuthFieldErrors(presentation.fieldErrors);
      setAuthFormError(presentation.formError);
      focusFirstAuthError(presentation.fieldErrors);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      await requestJSON<void>("/api/v1/auth/logout", { method: "POST" });
      try {
        clearLessonResultSnapshot(window.sessionStorage, session.user.id);
      } catch {
        // Logout still clears in-memory state when storage is restricted.
      }
      setSession(null);
      setProgress(null);
      setProgressStatus(idleResourceStatus());
      setActiveLesson(null);
      setActiveLessonStatus(idleResourceStatus());
      setPhraseCatalog([]);
      setRemotePhraseDetail(null);
      setPhraseDetailStatus({ slug: "", status: idleResourceStatus() });
      setPhraseCatalogPageInfo(paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);
      setPhrasePage(1);
      setPhraseSearchInput("");
      setPhraseSearch("");
      setPhraseCatalogStatus(idleResourceStatus());
      setHydratedUserID("");
      clearLessonState();
      navigate({ view: "home" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось завершить выход");
    } finally {
      setBusy(false);
    }
  }

  async function updateDailyGoal(dailyGoal: number) {
    if (!session) {
      requestAuthentication("progress");
      return;
    }
    setBusy(true);
    try {
      const result = await authorizedRequest<ProgressSummary>(
        session,
        `/api/v1/progress/goal?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        { method: "PUT", body: JSON.stringify({ dailyGoal }) },
      );
      setSession(result.activeSession);
      setProgress(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить дневную цель");
    } finally {
      setBusy(false);
    }
  }

  function clearLessonState() {
    setItems([]);
    setCurrentIndex(0);
    setRevealed(false);
    setSelectedAnswer("");
    setTypedAnswer("");
    setRatings({});
    setLessonStarted(false);
    setLessonComplete(false);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setServerSkippedItems(0);
    setLessonResult(null);
    setLessonResultContinuation({ kind: "checking" });
    setLessonResultCelebrate(false);
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
    lessonJudgementsRef.current = {};
    lessonProgressBeforeRef.current = null;
    reviewInFlightRef.current = false;
    setError("");
    setLessonQueueNotice("");
  }

  function saveAndExitLesson(target: PrimaryNavigationView = "home") {
    clearLessonState();
    navigate({ view: target }, true, { allowLessonExit: true, intent: "lesson_exit" });
  }

  function moveToServerIndex(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= items.length || !items[index]) {
      setError("Сервер вернул недопустимую позицию урока. Выполнена повторная синхронизация.");
      void resynchronizeActiveLesson("Урок синхронизирован с сервером.");
      return;
    }
    const target = items[index];
    setCurrentIndex(index);
    setServerNextIndex(null);
    resetCardState(studyMode, Boolean(ratings[target.id]));
  }

  function nextItem() {
    const decision = decideLessonAdvance({
      currentIndex,
      itemCount: items.length,
      reviewPersisted: Boolean(currentRating),
      reviewSaving: reviewing,
      serverCompleted: serverLessonCompleted,
      serverNextIndex,
    });
    if (!decision.canAdvance) {
      setError(decision.reason === "completion_not_confirmed"
        ? "Сервер ещё не подтвердил завершение урока. Повторите попытку."
        : "Сначала сохраните оценку текущей карточки.");
      return;
    }
    setError("");
    if (decision.kind === "results") {
      setLessonComplete(true);
      return;
    }
    moveToServerIndex(decision.nextIndex);
  }

  async function rateCurrent(
    rating: ReviewRating,
    submittedAt: number,
    restoreFocusAfterSave = false,
  ) {
    if (!currentItem || currentRating || reviewInFlightRef.current) return;
    if (!session || !activeLesson || currentItem.wordId === undefined) {
      requestAuthentication("lesson");
      return;
    }
    reviewInFlightRef.current = true;
    setReviewing(true);
    setError("");
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
    let reviewPersisted = false;
    try {
      const reviewMode: AnswerMode = studyMode === "all" ? "study" : studyMode;
      const path = `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`;
      const result = await authorizedRequest<LessonReviewResponse>(session, path, {
        method: "POST",
        body: JSON.stringify({
          lessonVersion: activeLesson.version,
          rating,
          responseMs: Math.max(0, Math.round(submittedAt - cardStartedAt)),
          answerMode: reviewMode,
          answerRevealed: revealed || reviewMode === "study",
          ...(reviewMode === "study" ? {} : { submittedAnswer }),
          timezoneOffsetMinutes: timezoneOffsetMinutes(),
        }),
      });
      const nextRatings = { ...ratings, [currentItem.id]: rating };
      const nextJudgements = {
        ...lessonJudgementsRef.current,
        [currentItem.id]: {
          mode: reviewMode,
          correct: typeof result.data.correct === "boolean" ? result.data.correct : null,
        },
      } satisfies Record<string, LessonResultJudgement>;
      lessonJudgementsRef.current = nextJudgements;
      setSession(result.activeSession);
      setRatings(nextRatings);
      setReviewFeedback(result.data);
      reviewPersisted = true;
      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);
      setServerSkippedItems(result.data.lessonSkippedItems);
      if (result.data.lessonCompleted) {
        setActiveLesson(null);
      } else {
        setActiveLesson((current) => current ? {
          ...current,
          currentIndex: result.data.lessonCurrentIndex,
          version: result.data.lessonVersion,
          items: current.items.map((item) => item.id === currentItem.wordId
            ? { ...item, rating, reviewedAt: result.data.lastReviewedAt }
            : item),
        } : current);
      }

      let completionProgress = latestProgressRef.current;
      let syncPending = false;
      try {
        const refreshed = await refreshProgress(result.activeSession);
        completionProgress = refreshed.progress;
      } catch {
        syncPending = true;
        setError("Оценка сохранена, но статистика обновится после следующей синхронизации.");
      }

      if (result.data.lessonCompleted) {
        const completedSnapshot = buildLessonResultSnapshot({
          userId: result.activeSession.user.id,
          lessonId: activeLesson.id,
          source: activeLesson.source,
          studyMode: activeLesson.studyMode,
          lessonSize: activeLesson.lessonSize,
          topic: lessonTopic,
          itemIds: activeLesson.items.map((item) => item.id),
          judgements: nextJudgements,
          ratings: nextRatings,
          skipped: result.data.lessonSkippedItems,
          dueNow: completionProgress?.dueNow ?? 0,
          dailyGoal: completionProgress?.dailyGoal ?? 0,
          reviewsBefore: lessonProgressBeforeRef.current,
          reviewsAfter: completionProgress?.reviewsToday ?? null,
          syncPending,
        });
        let celebrate = false;
        try {
          writeLessonResultSnapshot(window.sessionStorage, completedSnapshot);
          celebrate = claimDailyGoalCelebration(window.sessionStorage, completedSnapshot);
        } catch {
          // In-memory result remains available when storage is restricted.
        }
        setLessonResult(completedSnapshot);
        setLessonResultContinuation(resolveLessonResultContinuation({
          snapshot: completedSnapshot,
          previewTotal: null,
        }));
        setLessonResultCelebrate(celebrate);
      }
    } catch (requestError) {
      if (requestError instanceof RequestFailure && (
        requestError.status === 409
        || requestError.code === "lesson_item_not_found"
        || requestError.code === "active_lesson_not_found"
      )) {
        await resynchronizeActiveLesson("Урок изменён на другом устройстве. Показана актуальная карточка.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
      }
    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
      if (reviewPersisted && restoreFocusAfterSave) {
        window.requestAnimationFrame(() => lessonAdvanceRef.current?.focus({ preventScroll: true }));
      }
    }
  }

  async function submitAnswerSuggestion() {
    if (!session || !currentItem || currentItem.wordId === undefined || !reviewFeedback) return;
    const answer = submittedAnswer.trim();
    if (!answer || !reviewFeedback.suggestionAvailable || reviewFeedback.reviewEventId <= 0) return;

    setSuggestionStatus("submitting");
    setSuggestionError("");
    try {
      const result = await authorizedRequest(session, `/api/v1/words/${currentItem.wordId}/answer-suggestions`, {
        method: "POST",
        body: JSON.stringify({
          reviewEventId: reviewFeedback.reviewEventId,
          exerciseKind: currentItem.kind === "phrase" ? "cloze" : "translation",
          submittedAnswer: answer,
        }),
      });
      setSession(result.activeSession);
      setSuggestionStatus("submitted");
    } catch (requestError) {
      setSuggestionStatus("error");
      setSuggestionError(requestError instanceof Error ? requestError.message : "Не удалось отправить вариант на проверку");
    }
  }
  function renderHeader() {
    const initial = session?.user.displayName?.trim().charAt(0).toUpperCase()
      || session?.user.email.charAt(0).toUpperCase()
      || "L";

    if (lessonFocusMode) return null;

    return (
      <header className="lx-header">
        <button className="lx-brand" type="button" onClick={() => navigatePrimary("home")}>
          <span className="lx-logo-mark"><span>L</span></span>
          <strong>LexiGo</strong>
        </button>
        <PrimaryNavigation
          className="lx-nav lx-primary-navigation"
          ariaLabel="Основная навигация"
          currentView={navigation.view}
          labelMode="full"
          onNavigate={navigatePrimary}
        />
        <div className="lx-header-tools">
          {session && progress ? (
            <button className="lx-streak" type="button" aria-current={navigation.view === "progress" ? "page" : undefined} onClick={() => navigatePrimary("progress")}>
              <Icon name="flame" />
              <span>{progress.currentStreak} дн.</span>
            </button>
          ) : null}
          <button className="lx-icon-button" type="button" aria-label="Уведомления" onClick={() => setCalendarOpen(true)}>
            <Icon name="bell" />
          </button>
          <button className="lx-avatar" type="button" onClick={() => navigate({ view: "profile" })} aria-label="Открыть профиль" aria-current={navigation.view === "profile" ? "page" : undefined}>
            {initial}
          </button>
        </div>
      </header>
    );
  }

  function renderResumeStrip() {
    if (!session || !activeLesson || lessonStarted) return null;
    const reviewed = activeLesson.items.filter((item) => item.rating).length;
    return (
      <section className="lx-resume-strip">
        <div className="lx-resume-icon"><Icon name="play" /></div>
        <div>
          <span>Незавершённый урок</span>
          <strong>{sourceLabel(activeLesson.source)} · {activeLesson.currentIndex + 1} из {activeLesson.items.length}</strong>
          <small>{reviewed} элементов уже оценено</small>
        </div>
        <div className="lx-resume-actions">
          <button className="lx-button ghost" type="button" disabled={busy} onClick={discardActiveLesson}>Сбросить</button>
          <button className="lx-button primary" type="button" disabled={busy} onClick={resumeLesson}>Продолжить урок</button>
        </div>
      </section>
    );
  }

  function renderHome() {
    const progressPending = Boolean(session && (progressStatus.phase === "idle" || progressStatus.phase === "loading"));
    const dueNow = progress?.dueNow ?? 0;
    const nextAction = activeLesson
      ? {
          eyebrow: "НЕЗАВЕРШЁННЫЙ УРОК",
          title: "Продолжите с сохранённой позиции",
          description: `${sourceLabel(activeLesson.source)} · карточка ${activeLesson.currentIndex + 1} из ${activeLesson.items.length}.`,
          label: "Продолжить урок",
          action: () => void resumeLesson(),
        }
      : session && progress && dueNow > 0
        ? {
            eyebrow: "СЕЙЧАС ЛУЧШЕ ПОВТОРИТЬ",
            title: `${dueNow} ${russianPlural(dueNow, "элемент готов", "элемента готовы", "элементов готовы")} к повторению`,
            description: DUE_COPY.explanation,
            label: "Повторить сейчас",
            action: () => void startLesson(session, { source: "mixed", size: 30, mode: "recall", journeyIntent: "home_next_action" }),
          }
        : session && progress
          ? {
              eyebrow: "СЛЕДУЮЩИЙ ШАГ",
              title: "Добавьте новые слова в учебный цикл",
              description: "Откройте короткий блок знакомства: ответы будут видны сразу, а самостоятельное воспроизведение начнётся на следующих повторениях.",
              label: "Начать изучение",
              action: () => void startLesson(session, { source: "mixed", size: 15, mode: "study", journeyIntent: "home_next_action" }),
            }
          : {
              eyebrow: progressPending && session ? "СИНХРОНИЗИРУЕМ ПЛАН" : "ПЕРВЫЙ ШАГ",
              title: session ? "Настройте урок под текущую задачу" : "Соберите первый учебный блок",
              description: session ? "Пока очередь загружается, можно выбрать режим, раздел и размер урока." : "Выберите формат обучения и посмотрите состав до регистрации и запуска.",
              label: "Настроить урок",
              action: () => navigate({ view: "learn" }, false, { intent: "home_next_action" }),
            };

    return (
      <>
        <section className="lx-home-next-action" aria-label="Следующее рекомендуемое действие">
          <article className="lx-hero-card">
            <div className="lx-home-next-action-copy">
              <span>{nextAction.eyebrow}</span>
              <h1>{nextAction.title}</h1>
              <p>{nextAction.description}</p>
              <button className="lx-button primary large" type="button" data-journey-intent="home_next_action" onClick={nextAction.action}>
                <Icon name={activeLesson ? "play" : dueNow > 0 ? "repeat" : "learn"} />
                {nextAction.label}
              </button>
            </div>
            <div className="lx-hero-art" aria-hidden="true">
              <div className="lx-word-preview">
                <span>{WORD_PREVIEW.phonetic}</span>
                <strong>{WORD_PREVIEW.prompt}</strong>
                <p>{WORD_PREVIEW.answer}</p>
                <small>{WORD_PREVIEW.example}</small>
              </div>
            </div>
          </article>
          <aside className="lx-progress-panel" aria-label="Краткий прогресс" aria-busy={progressPending || undefined}>
            <div className="lx-panel-heading"><div><span>Учебный статус</span><strong>{progress ? `${progress.reviewsToday} из ${progress.dailyGoal}` : progressPending ? "Загружаем…" : session ? "Недоступно" : "После входа"}</strong></div><Icon name="chart" /></div>
            {progress ? (
              <>
                <div className="lx-progress-ring" role="progressbar" aria-label="Выполнение дневной цели" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizeProgressValue(goalPercent(progress))} aria-valuetext={`${progress.reviewsToday} из ${progress.dailyGoal} ответов`}><span>{goalPercent(progress)}%</span></div>
                <div className="lx-progress-list"><div><span>{DUE_COPY.label}</span><strong>{progress.dueNow}</strong></div><div><span>{RETAINED_COPY.label} за неделю</span><strong>{progress.retainedItemsWeek}</strong></div><div><span>Серия</span><strong>{progress.currentStreak} дн.</strong></div></div>
              </>
            ) : progressPending ? (
              <>
                <div className="lx-progress-ring" aria-hidden="true"><span>—</span></div>
                <div className="lx-progress-list" role="status" aria-live="polite" aria-label="Загрузка краткого прогресса"><div><span>{DUE_COPY.label}</span><strong>—</strong></div><div><span>{RETAINED_COPY.label} за неделю</span><strong>—</strong></div><div><span>Серия</span><strong>—</strong></div></div>
              </>
            ) : (
              <AsyncStatePanel label={!session ? "Персональный прогресс доступен после входа" : "Краткий прогресс недоступен"} kind={!session ? "empty" : "error"} title={!session ? "Войдите, чтобы видеть учебную очередь" : progressStatus.problem?.title ?? "Прогресс недоступен"} message={!session ? "Материал к повторению, дневная цель и серия синхронизируются с аккаунтом." : progressStatus.problem?.message ?? "Получаем материал к повторению и дневную цель."} reference={progressStatus.problem?.correlationId} actionLabel={!session ? "Войти" : progressStatus.problem?.retryable ? "Повторить" : undefined} onAction={!session ? () => requestAuthentication("home") : progressStatus.problem?.retryable ? () => void loadProgressResource(session) : undefined} compact focusResult={false} />
            )}
            <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "progress" }, false, { intent: "in_app_navigation" })}>Открыть прогресс</button>
          </aside>
        </section>

        <section className="lx-home-paths" aria-label="Назначение основных разделов">
          <article><span>Обучение</span><h2>Настройте урок</h2><p>Режим, раздел, размер и предварительный состав настраиваются на одном экране.</p><button className="lx-button ghost" type="button" data-journey-intent="home_configure_lesson" onClick={() => navigate({ view: "learn" }, false, { intent: "home_configure_lesson" })}>Настроить урок</button></article>
          <article><span>Словарь</span><h2>Найдите материал</h2><p>Ищите слова, термины и рабочие фразы, открывайте карточки и сохраняйте контекст.</p><button className="lx-button ghost" type="button" data-journey-intent="home_find_material" onClick={() => navigate({ view: "library" }, false, { intent: "home_find_material" })}>Найти материал</button></article>
          <article><span>Прогресс</span><h2>Проверьте результат</h2><p>Материал к повторению, закреплённые знания, объективная успешность и дневная цель собраны отдельно.</p><button className="lx-button ghost" type="button" onClick={() => navigate({ view: "progress" }, false, { intent: "in_app_navigation" })}>Посмотреть результат</button></article>
        </section>
      </>
    );
  }

  function selectLessonSource(nextSource: LessonSource) {
    setSource(nextSource);
    setLessonTopic("");
  }

  function renderLearn() {
    const matchingLessonPreview = lessonPreview
      && lessonPreview.source === source
      && lessonPreview.studyMode === studyMode
      && lessonPreview.lessonSize === String(lessonSize)
      ? lessonPreview
      : null;
    const selectedModeLabel = studyMode === "study"
      ? "Изучение"
      : studyMode === "recall"
        ? "Воспроизведение"
        : studyMode === "choice"
          ? "Варианты"
          : "Список";
    const selectedSizeLabel = lessonSize === "all" ? "Все элементы" : `${lessonSize} элементов`;
    const estimatedMinutes = lessonSize === 15
      ? "≈7м"
      : lessonSize === 30
        ? "≈14м"
        : lessonSize === 60
          ? "≈28м"
          : "—";
    const lessonPreviewPending = Boolean(session && studyMode !== "all" && (previewingLesson || !matchingLessonPreview));
    const lessonStartDisabled = busy || Boolean(session && studyMode !== "all" && (!matchingLessonPreview || matchingLessonPreview.composition.total === 0));
    return (
      <>
        <section className="lx-page-heading">
          <div><span>ОБУЧЕНИЕ</span><h1>Соберите один сфокусированный урок</h1><p>Здесь находятся только параметры учебной сессии: режим, раздел, размер и предварительный состав.</p></div>
          <div className="lx-heading-badge"><Icon name="learn"/><span>{session && progress ? `${DUE_COPY.label}: ${progress.dueNow}` : "Прогресс сохраняется после входа"}</span></div>
        </section>
        {renderResumeStrip()}
        {lessonTopic ? <section className="lx-composer-context" aria-label="Контекст из каталога"><div><span>Перенесено из словаря</span><strong>{sourceLabel(source)} · {topicLabel(lessonTopic)}</strong><small>Раздел и тема уже выбраны; повторная настройка не требуется.</small></div><button className="lx-button ghost" type="button" onClick={() => { setLessonTopic(""); navigate({ view: "learn", source }, true, { intent: "in_app_navigation" }); }}>Очистить тему</button></section> : null}
        <LessonComposerProgressiveShell
          expanded={mobileComposerExpanded}
          sourceLabel={sourceLabel(source)}
          modeLabel={selectedModeLabel}
          sizeLabel={selectedSizeLabel}
          dueCount={matchingLessonPreview?.composition.due}
          newCount={matchingLessonPreview?.composition.new}
          estimatedMinutes={estimatedMinutes}
          previewPending={lessonPreviewPending}
          startDisabled={lessonStartDisabled}
          startLabel={studyMode === "all" ? "Открыть список" : "Начать рекомендуемый урок"}
          busy={busy}
          onToggle={() => setMobileComposerExpanded((current) => !current)}
          onStart={() => void startLesson(session, { topic: lessonTopic, journeyIntent: "lesson_start" })}
        >
          <section className="lx-setup-card">
          <div className="lx-setup-block">
            <div className="lx-block-heading"><span>1</span><div><strong>Выберите режим</strong><small>Рекомендуемый режим — объективное воспроизведение без подсказки</small></div></div>
            <div className="lx-mode-selector" role="radiogroup" aria-label="Режим обучения" aria-orientation="vertical">
              {MODE_OPTIONS.map((option) => {
                const selected = studyMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    className={selected ? "selected" : ""}
                    onClick={() => setStudyMode(option.value)}
                    onKeyDown={(event) => selectRovingControl(event, MODE_VALUES, option.value, setStudyMode, "vertical")}
                  >
                    <span><Icon name={option.icon}/></span><div><strong>{option.label}</strong><small>{option.hint}</small></div><i><Icon name="check" size={14}/></i>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="lx-setup-block">
            <div className="lx-block-heading"><span>2</span><div><strong>Выберите раздел</strong><small>Можно начать со всех слов или сфокусироваться на части речи</small></div></div>
            <div className="lx-source-selector" role="radiogroup" aria-label="Раздел обучения">
              {SOURCE_OPTIONS.map((option) => {
                const selected = source === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    data-lexigo-source={option.value}
                    className={selected ? "selected" : ""}
                    onClick={() => selectLessonSource(option.value)}
                    onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, selectLessonSource)}
                  >
                    <span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span>
                    <div><strong>{option.label}</strong><small>{option.hint}</small></div>
                    <b data-catalog-count-state={catalogMetadataStatus}>{catalogCountText(catalogMetadata, catalogMetadataStatus, option.value, ["элемент", "элемента", "элементов"])}</b>
                  </button>
                );
              })}
              {COLLECTIONS.map((definition) => {
                const selected = source === definition.source;
                return (
                  <CollectionCard
                    key={definition.source}
                    definition={definition}
                    variant="selector"
                    countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["элемент", "элемента", "элементов"])}
                    selected={selected}
                    selectionProps={{
                      role: "radio",
                      "aria-checked": selected,
                      tabIndex: selected ? 0 : -1,
                      onKeyDown: (event) => selectRovingControl(event, SOURCE_VALUES, definition.source, selectLessonSource),
                    }}
                    onSelect={() => selectLessonSource(definition.source)}
                  />
                );
              })}
            </div>
          </div>
          <div className="lx-setup-footer">
            <fieldset><legend id="lesson-size-label">Размер урока</legend><div className="lx-size-control" role="radiogroup" aria-labelledby="lesson-size-label" aria-orientation="horizontal">{SIZE_OPTIONS.map((option) => {
      const selected = lessonSize === option.value;
      return <button key={String(option.value)} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} className={selected ? "selected" : ""} onClick={() => setLessonSize(option.value)} onKeyDown={(event) => selectRovingControl(event, SIZE_VALUES, option.value, setLessonSize, "horizontal")}>{option.label}</button>;
    })}</div></fieldset>
            <div className="lx-setup-actions">
              {studyMode === "all" ? (
                <div className="lx-lesson-preview"><span>Состав списка</span><strong>Все доступные элементы раздела</strong><small>Справочный режим открывает список без создания учебной сессии.</small></div>
              ) : !session ? (
                <div className="lx-lesson-preview"><span>Состав урока</span><strong>Войдите для расчёта</strong><small>При расчёте учитываются материал к повторению и доступные фразы.</small></div>
              ) : previewingLesson || !matchingLessonPreview ? (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>Рассчитываем…</strong><small>Проверяем материал к повторению, новые элементы и доступность слов и фраз.</small></div>
              ) : (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>{lessonCompositionDescription(matchingLessonPreview.composition)}</strong><small>{lessonPriorityDescription(matchingLessonPreview.composition)}</small>{lessonCompositionFallbackMessage(matchingLessonPreview.composition) ? <em>{lessonCompositionFallbackMessage(matchingLessonPreview.composition)}</em> : null}</div>
              )}
              <div className="lx-setup-submit"><p>{studyMode === "study" ? "Слово, перевод и пример будут видны сразу." : studyMode === "all" ? "Откроется справочный список без оценок." : "Ответы будут сохранены в интервальную очередь."}</p><button className="lx-button primary large" type="button" disabled={lessonStartDisabled} onClick={() => startLesson(session, { topic: lessonTopic, journeyIntent: "lesson_start" })}><Icon name="play"/>{busy ? "Формируем…" : studyMode === "all" ? "Открыть список" : "Начать урок"}</button></div>
            </div>
          </div>
          </section>
        </LessonComposerProgressiveShell>
      </>
    );
  }

  function openPhraseDetail(phrase: LearningItem) {
    navigate(
      phraseCatalogTarget(phraseCatalogFilters(navigation), itemKey(phrase)),
      false,
      { intent: "catalog_open_detail" },
    );
  }

  function backToPhraseCatalog() {
    const destination = navigationTabs.destination("library");
    navigate(phraseCatalogTarget(phraseCatalogFilters(navigation)), true, { scroll: destination.scroll });
  }

  function changePhrasePage(page: number) {
    setPhrasePage(page);
    navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), page }));
    window.requestAnimationFrame(() => document.getElementById("phrase-catalog-results")?.scrollIntoView({ block: "start", behavior: navigationScrollBehavior(window) }));
  }

  function applyPhraseSearch() {
    const query = phraseSearchInput.trim();
    setPhrasePage(1);
    setPhraseSearch(query);
    navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), query, page: 1 }));
  }

  function clearPhraseSearch() {
    setPhraseSearchInput("");
    setPhraseSearch("");
    setPhrasePage(1);
    navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), query: "", page: 1 }));
  }

  async function changeAllItemsPage(page: number, query = allItemsQuery) {
    setBusy(true);
    setError("");
    try {
      await loadCatalogBrowsePage(session, source, page, query);
      window.requestAnimationFrame(() => document.getElementById("all-items-results")?.scrollIntoView({ block: "start", behavior: navigationScrollBehavior(window) }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить страницу каталога");
    } finally {
      setBusy(false);
    }
  }

  function applyAllItemsSearch() {
    const query = { ...allItemsQuery, query: allItemsSearchInput.trim() };
    setAllItemsSearch(query.query ?? "");
    setAllItemsQuery(query);
    void changeAllItemsPage(1, query);
  }

  function clearAllItemsSearch() {
    setAllItemsSearchInput("");
    setAllItemsSearch("");
    const query = { ...allItemsQuery, query: "" };
    setAllItemsQuery(query);
    void changeAllItemsPage(1, query);
  }

  function changeAllItemsSort(mode: CatalogSortMode) {
    updateCatalogSort("all-items", mode);
    const query = { ...allItemsQuery, sort: mode };
    setAllItemsQuery(query);
    void changeAllItemsPage(1, query);
  }

  function renderPhrases() {
    const openCatalog = (kind: "words" | "phrases") => {
      if (kind === "words") navigate({ view: "library" }, false, { intent: "catalog_switch" });
    };
    if (navigation.detail && !selectedPhrase) {
      const activeStatus = phraseDetailStatus.slug === navigation.detail
        ? phraseDetailStatus.status
        : idleResourceStatus();
      const loading = Boolean(session) && (activeStatus.phase === "idle" || activeStatus.phase === "loading");
      return (
        <>
          <CatalogKindNavigation active="phrases" onSelect={openCatalog} />
          <section className="lx-detail-card">
            <button className="lx-button ghost" type="button" onClick={backToPhraseCatalog}>← Все фразы</button>
            {loading ? <AsyncSkeletonGrid label="Загружаем карточку фразы" count={1} /> : null}
            {!session ? (
              <AsyncStatePanel
                label="Карточка фразы доступна после входа"
                kind="empty"
                title="Войдите, чтобы открыть персональную фразу"
                message="Персональный каталог и текущий статус изучения доступны только владельцу аккаунта."
                actionLabel="Войти"
                onAction={() => requestAuthentication("phrases")}
              />
            ) : !loading ? (
              <AsyncStatePanel
                label="Карточка фразы недоступна"
                kind="error"
                title={activeStatus.problem?.title ?? "Фраза не найдена"}
                message={activeStatus.problem?.message ?? "Проверьте ссылку или вернитесь к каталогу фраз."}
                reference={activeStatus.problem?.correlationId}
                actionLabel="К каталогу фраз"
                onAction={backToPhraseCatalog}
              />
            ) : null}
          </section>
        </>
      );
    }
    if (selectedPhrase) {
      return (
        <>
          <CatalogKindNavigation active="phrases" onSelect={openCatalog} />
          <section className="lx-detail-card">
            <button className="lx-button ghost" type="button" onClick={backToPhraseCatalog}>← Все фразы</button>
            <div className="lx-detail-content">
              <span>{topicLabel(selectedPhrase.topic)}</span>
              <div className="lx-detail-speech-row">
                <h1 lang="en">{selectedPhrase.prompt}</h1>
                <SpeechPlayerButton text={selectedPhrase.prompt}><Icon name="volume" /></SpeechPlayerButton>
              </div>
              <strong lang="ru">{selectedPhrase.answer}</strong>
              {selectedPhrase.cloze ? <div><small>{CLOZE_COPY.label}</small><p>{CLOZE_COPY.explanation}</p><p lang="en">{selectedPhrase.cloze}</p></div> : null}
              {selectedPhrase.examples[0] ? <div><small>Рабочий пример</small><p lang="en">{selectedPhrase.examples[0]}</p></div> : null}
              {selectedPhrase.note ? <div><small>Как использовать</small><p>{selectedPhrase.note}</p></div> : null}
              <div className="lx-page-actions"><button className="lx-button primary" type="button" onClick={() => navigate({ view: "learn", source: "phrases", topic: selectedPhrase.topic }, false, { intent: "catalog_configure_lesson" })}>Настроить урок по этой теме</button><small>Тип материала и тема будут перенесены в «Обучение».</small></div>
            </div>
          </section>
        </>
      );
    }
    const phrasesPending = Boolean(session && (phraseCatalogStatus.phase === "idle" || phraseCatalogStatus.phase === "loading"));
    const phrasePageInfo = activePhrasePageInfo;
    return (
      <>
        <CatalogKindNavigation active="phrases" onSelect={openCatalog} />
        <section className="lx-page-heading"><div><span>РАБОЧИЕ ФРАЗЫ</span><h1>Находите готовые формулировки</h1><p>Ищите формулировки для инцидентов, архитектурных обсуждений, инженерии данных, производительности и релизов. Настройка учебной сессии находится в разделе «Обучение».</p></div><div className="lx-heading-badge"><Icon name="phrases"/><span>{progress ? `${progress.duePhrases} фраз готовы к повторению` : progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загружаем очередь…" : "Очередь недоступна"}</span></div></section>
        <div className="lx-topic-filter" role="radiogroup" aria-label="Тема фраз" aria-orientation="horizontal">{phraseTopics.map((topic) => {
          const selected = phraseTopic === topic;
          return <button key={topic} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} className={selected ? "selected" : ""} onClick={() => { setPhraseTopic(topic); setPhrasePage(1); navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), topic, page: 1 })); }} onKeyDown={(event) => selectRovingControl(event, phraseTopics, topic, (next) => { setPhraseTopic(next); setPhrasePage(1); navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), topic: next, page: 1 })); }, "horizontal")}>{topic === "all" ? "Все темы" : topicLabel(topic)}</button>;
        })}</div>
        <CatalogSearchForm value={phraseSearchInput} onChange={setPhraseSearchInput} onSubmit={applyPhraseSearch} onClear={clearPhraseSearch} label="Поиск по каталогу фраз" />
        <CatalogSortControl kind="phrases" mode={phraseSortMode} onChange={(mode) => { updateCatalogSort("phrases", mode); setPhrasePage(1); navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), sort: mode, page: 1 })); }} />
        {session && phraseCatalogStatus.phase === "error" && phraseCatalogStatus.problem ? <AsyncStatePanel label="Каталог фраз недоступен" kind="error" title={phraseCatalogStatus.problem.title} message={phraseCatalogStatus.problem.message} reference={phraseCatalogStatus.problem.correlationId} actionLabel={phraseCatalogStatus.problem.retryable ? "Повторить" : undefined} onAction={phraseCatalogStatus.problem.retryable ? () => void loadPhraseCatalogResource(session, { page: phrasePage, topic: phraseTopic, query: phraseSearch, sort: phraseSortMode }) : undefined} /> : null}
        {phrasesPending && sortedVisiblePhrases.length === 0 ? <AsyncSkeletonGrid label="Загружаем каталог фраз" /> : null}
        {!phrasesPending && sortedVisiblePhrases.length === 0 ? <AsyncStatePanel label="Каталог фраз пуст" kind="empty" title="По заданным условиям фразы не найдены" message="Сбросьте поиск или выберите другую тему." actionLabel="Сбросить фильтры" onAction={() => {
          setPhraseTopic("all");
          setPhraseSearchInput("");
          setPhraseSearch("");
          setPhrasePage(1);
          navigate(phraseCatalogTarget({ ...phraseCatalogFilters(navigation), topic: "all", query: "", page: 1 }));
        }} /> : null}
        <CatalogPagination info={phrasePageInfo} busy={phrasesPending} onPageChange={changePhrasePage} />
        <section id="phrase-catalog-results" className="lx-phrase-grid" role="list" aria-label="Результаты каталога фраз" aria-busy={phrasesPending}>{sortedVisiblePhrases.map((phrase, index) => {
          const detailTarget = phraseCatalogTarget(phraseCatalogFilters(navigation), itemKey(phrase));
          return <div key={itemKey(phrase)} role="listitem" aria-posinset={(phrasePageInfo.page - 1) * phrasePageInfo.pageSize + index + 1} aria-setsize={phrasePageInfo.total}><a href={navigationURL(detailTarget)} onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            openPhraseDetail(phrase);
          }}><span>{topicLabel(phrase.topic)}</span><strong lang="en">{phrase.prompt}</strong><small lang="ru">{phrase.answer}</small><em>Открыть карточку <Icon name="arrow" size={15}/></em></a></div>;
        })}</section>
        <CatalogPagination info={phrasePageInfo} busy={phrasesPending} onPageChange={changePhrasePage} label="Навигация под списком фраз" />
        <div className="lx-page-actions"><button className="lx-button primary" type="button" disabled={phrasePageInfo.total === 0} onClick={() => navigate({ view: "learn", source: "phrases", ...(phraseTopic !== "all" ? { topic: phraseTopic } : {}) }, false, { intent: "catalog_configure_lesson" })}>Настроить урок по текущей теме</button><small>Фразы остаются каталогом; режим и размер выбираются на следующем экране.</small></div>
      </>
    );
  }

  function renderLibrary() {
    const dictionarySource: LessonSource = navigation.source && navigation.source !== "phrases"
      ? navigation.source
      : "mixed";
    return (
      <DictionaryCatalog
        authenticated={Boolean(session)}
        navigation={navigation}
        metadata={catalogMetadata}
        metadataStatus={catalogMetadataStatus}
        progress={progress}
        loadPage={loadDictionaryPage}
        loadDetail={loadDictionaryDetail}
        onNavigate={(target, replace, scroll, intent) => navigate(target, replace, { scroll, intent })}
        onBackToResults={() => {
          const destination = navigationTabs.destination("library");
          const target = { ...navigation };
          delete target.detail;
          navigate(target, true, { scroll: destination.target.detail ? { x: 0, y: 0 } : destination.scroll, intent: "in_app_navigation" });
        }}
        onConfigureLesson={({ source: selectedSource, topic }) => {
          navigate({ view: "learn", source: selectedSource || dictionarySource, ...(topic ? { topic } : {}) }, false, { intent: "catalog_configure_lesson" });
        }}
        onRequireAuthentication={() => requestAuthentication("library")}
      />
    );
  }

  function renderProgress() {
    if (!session) {
      return <section className="lx-empty"><span>ПРОГРЕСС</span><h1>Войдите, чтобы видеть результат обучения</h1><p>Дневная цель, материал к повторению, закреплённые знания и серия синхронизируются между устройствами.</p><button className="lx-button primary" type="button" onClick={() => requestAuthentication("progress")}>Войти и открыть прогресс</button></section>;
    }
    if (!progress) {
      const problem = progressStatus.problem;
      const loading = progressStatus.phase === "loading" || progressStatus.phase === "idle";
      return <AsyncStatePanel label={loading ? "Загрузка прогресса" : "Прогресс недоступен"} kind={loading ? "loading" : "error"} title={loading ? "Загружаем прогресс…" : problem?.title ?? "Прогресс недоступен"} message={problem?.message ?? "Получаем очередь, дневную цель и статистику обучения."} reference={problem?.correlationId} actionLabel={problem?.retryable ? "Повторить загрузку" : undefined} onAction={problem?.retryable ? () => void loadProgressResource(session) : undefined} focusResult={!loading} />;
    }
    const modes = normalizedProgressModes(progress);
    const progressIsEmpty = progress.reviewsTotal === 0 && progress.masteredWords === 0 && progress.masteredPhrases === 0;
    const cards = [
      { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% цели`, color: "purple" },
      { label: "Объективная успешность", value: `${successRate}%`, hint: `${progress.objectiveSuccessfulToday ?? progress.successfulToday} из ${progress.objectiveReviewsToday ?? progress.reviewsToday} попыток`, color: "green" },
      { label: RETAINED_COPY.label, value: String(progress.retainedItemsWeek), hint: `${progress.retainedWordsWeek} слов · ${progress.retainedPhrasesWeek} фраз`, color: "blue" },
      { label: "Текущая серия", value: `${progress.currentStreak} дн.`, hint: `рекорд ${progress.longestStreak}`, color: "orange" },
    ];
    return (
      <>
        <section className="lx-page-heading"><div><span>ПРОГРЕСС</span><h1>Смотрите, что действительно сохранилось</h1><p>{RETAINED_COPY.explanation}</p></div><div className="lx-heading-badge"><Icon name="progress"/><span>Следующее повторение: {nextDueLabel(progress.nextDueAt)}</span></div></section>
        {progressIsEmpty ? <AsyncStatePanel label="Прогресс пока пуст" kind="empty" title="Начните первый учебный блок" message="После первой сохранённой оценки здесь появятся очередь, серия и объективная успешность." actionLabel="Настроить урок" onAction={() => navigate({ view: "learn" })} compact /> : null}
        <section className="lx-stat-grid">{cards.map((card) => <article key={card.label}><span>{card.label}</span><strong className={card.color}>{card.value}</strong><small>{card.hint}</small></article>)}</section>
        <section className="lx-summary-panel" aria-label="Попытки по режимам">
          <div><span>Изучение</span><strong>{modes.study.attemptsToday}</strong><small>ответ показан сразу · без самостоятельного воспроизведения</small></div>
          <div><span>{RECALL_COPY.label}</span><strong>{modes.recall.successfulToday} / {modes.recall.attemptsToday}</strong><small>{RECALL_COPY.explanation}</small></div>
          <div><span>Выбор варианта</span><strong>{modes.choice.successfulToday} / {modes.choice.attemptsToday}</strong><small>объективно верные сегодня</small></div>
          <div><span>Без указанного режима</span><strong>{modes.legacy.attemptsTotal}</strong><small>Исторические события, сохранённые до появления точного режима.</small></div>
        </section>
        <section className="lx-progress-detail"><div className="lx-detail-main"><span>Дневная цель</span><h2>{progress.reviewsToday >= progress.dailyGoal ? "Цель выполнена" : "Продолжайте учебный цикл"}</h2><div className="lx-goal-track large" role="progressbar" aria-label="Выполнение дневной цели" aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalizeProgressValue(goalPercent(progress))} aria-valuetext={`${progress.reviewsToday} из ${progress.dailyGoal} ответов`}><span style={{ width: `${goalPercent(progress)}%` }}/></div><div className="lx-goal-options" role="radiogroup" aria-label="Дневная цель" aria-orientation="horizontal">{GOAL_OPTIONS.map((goal, index) => {
        const selected = progress.dailyGoal === goal;
        const fallbackTabStop = !GOAL_OPTIONS.includes(progress.dailyGoal) && index === 0;
        return <button key={goal} type="button" role="radio" aria-checked={selected} tabIndex={selected || fallbackTabStop ? 0 : -1} className={selected ? "selected" : ""} disabled={busy} onClick={() => updateDailyGoal(goal)} onKeyDown={(event) => selectRovingControl(event, GOAL_OPTIONS, progress.dailyGoal, updateDailyGoal, "horizontal")}>{goal}</button>;
      })}</div></div><div className="lx-queue-list"><div><span>Слова к повторению</span><strong>{progress.dueWords}</strong></div><div><span>Фразы к повторению</span><strong>{progress.duePhrases}</strong></div><div><span>Освоено слов</span><strong>{progress.masteredWords}</strong></div><div><span>Освоено фраз</span><strong>{progress.masteredPhrases}</strong></div></div></section>
      </>
    );
  }

  function renderProfile() {
    if (!session) {
      const resetMode = authMode === "reset";
      const forgotMode = authMode === "forgot";
      const registrationMode = authMode === "register";
      const passwordMode = authMode === "login" || registrationMode || resetMode;
      const requirements = passwordRequirements(password);
      const title = resetMode
        ? "Создайте новый пароль"
        : forgotMode
          ? "Восстановите доступ"
          : "Сохраняйте прогресс на всех устройствах";
      const description = resetMode
        ? "Ссылка одноразовая. После смены пароля активные сессии на других устройствах будут завершены."
        : forgotMode
          ? "Укажите email аккаунта. Ответ не раскрывает, зарегистрирован ли адрес."
          : "Аккаунт нужен для интервальной очереди, продолжения уроков и недельной аналитики.";
      const submitLabel = busy
        ? "Отправляем…"
        : resetMode
          ? "Сохранить новый пароль"
          : forgotMode
            ? "Отправить ссылку"
            : authMode === "login"
              ? "Войти"
              : "Создать аккаунт";
      const passwordDescriptionID = authMode === "login" ? undefined : "auth-password-requirements";

      return (
        <section className="lx-auth-card">
          <div className="lx-auth-heading">
            <span>АККАУНТ</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          {!resetMode && !forgotMode ? (
            <div className="lx-auth-tabs" role="tablist" aria-label="Режим аккаунта" aria-orientation="horizontal">
              <button
                id="auth-mode-tab-login"
                type="button"
                role="tab"
                aria-selected={authMode === "login"}
                aria-controls="auth-mode-panel"
                tabIndex={authMode === "login" ? 0 : -1}
                className={authMode === "login" ? "active" : ""}
                onClick={() => switchAuthMode("login")}
                onKeyDown={(event) => handleAuthTabKeyDown(event, "login")}
              >
                Вход
              </button>
              <button
                id="auth-mode-tab-register"
                type="button"
                role="tab"
                aria-selected={registrationMode}
                aria-controls="auth-mode-panel"
                tabIndex={registrationMode ? 0 : -1}
                className={registrationMode ? "active" : ""}
                onClick={() => switchAuthMode("register")}
                onKeyDown={(event) => handleAuthTabKeyDown(event, "register")}
              >
                Регистрация
              </button>
            </div>
          ) : null}

          {authNotice ? <p className="lx-auth-notice" role="status" aria-live="polite">{authNotice}</p> : null}
          {authFormError ? <p className="lx-auth-form-error" role="alert">{authFormError}</p> : null}

          <form
      id={!resetMode && !forgotMode ? "auth-mode-panel" : undefined}
      role={!resetMode && !forgotMode ? "tabpanel" : undefined}
      aria-labelledby={!resetMode && !forgotMode ? `auth-mode-tab-${registrationMode ? "register" : "login"}` : undefined}
      onSubmit={submitAuth}
      noValidate
      aria-label={resetMode ? "Новый пароль" : forgotMode ? "Восстановление пароля" : registrationMode ? "Регистрация" : "Вход"}
    >
            {registrationMode ? (
              <label htmlFor="auth-displayName">
                <span>Имя</span>
                <input
                  id="auth-displayName"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  value={displayName}
                  aria-invalid={Boolean(authFieldErrors.displayName)}
                  aria-describedby={authFieldErrors.displayName ? "auth-displayName-error" : undefined}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    clearAuthFieldError("displayName");
                  }}
                  placeholder="Как к вам обращаться"
                />
                {authFieldErrors.displayName ? <small id="auth-displayName-error" className="lx-field-error" role="alert">{authFieldErrors.displayName}</small> : null}
              </label>
            ) : null}

            {!resetMode ? (
              <label htmlFor="auth-email">
                <span>Email</span>
                <input
                  id="auth-email"
                  name="username"
                  type="email"
                  inputMode="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  value={email}
                  aria-invalid={Boolean(authFieldErrors.email)}
                  aria-describedby={authFieldErrors.email ? "auth-email-error" : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearAuthFieldError("email");
                  }}
                  placeholder="name@example.com"
                />
                {authFieldErrors.email ? <small id="auth-email-error" className="lx-field-error" role="alert">{authFieldErrors.email}</small> : null}
              </label>
            ) : null}

            {passwordMode ? (
              <div className="lx-auth-field">
                <label htmlFor="auth-password">{resetMode ? "Новый пароль" : "Пароль"}</label>
                <span className="lx-password-control">
                  <input
                    id="auth-password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    required
                    minLength={authMode === "login" ? undefined : 10}
                    maxLength={72}
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    value={password}
                    aria-invalid={Boolean(authFieldErrors.password)}
                    aria-describedby={[passwordDescriptionID, authFieldErrors.password ? "auth-password-error" : ""].filter(Boolean).join(" ") || undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearAuthFieldError("password");
                      if (passwordConfirmation) clearAuthFieldError("passwordConfirmation");
                    }}
                  />
                  <button
                    type="button"
                    className="lx-password-toggle"
                    aria-pressed={passwordVisible}
                    aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setPasswordVisible((current) => !current)}
                  >
                    {passwordVisible ? "Скрыть" : "Показать"}
                  </button>
                </span>
                {authFieldErrors.password ? <small id="auth-password-error" className="lx-field-error" role="alert">{authFieldErrors.password}</small> : null}
              </div>
            ) : null}

            {(registrationMode || resetMode) ? (
              <>
                <ul id="auth-password-requirements" className="lx-password-requirements" aria-label="Требования к паролю" aria-live="polite">
                  {requirements.map((requirement) => (
                    <li
                      key={requirement.id}
                      className={requirement.met ? "met" : ""}
                      aria-label={`${requirement.label}: ${requirement.met ? "выполнено" : "не выполнено"}`}
                    >
                      <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>{requirement.label}
                    </li>
                  ))}
                </ul>
                <label htmlFor="auth-passwordConfirmation">
                  <span>Повторите пароль</span>
                  <input
                    id="auth-passwordConfirmation"
                    name="password-confirmation"
                    type={passwordVisible ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    aria-invalid={Boolean(authFieldErrors.passwordConfirmation)}
                    aria-describedby={authFieldErrors.passwordConfirmation ? "auth-passwordConfirmation-error" : undefined}
                    onChange={(event) => {
                      setPasswordConfirmation(event.target.value);
                      clearAuthFieldError("passwordConfirmation");
                    }}
                  />
                  {authFieldErrors.passwordConfirmation ? <small id="auth-passwordConfirmation-error" className="lx-field-error" role="alert">{authFieldErrors.passwordConfirmation}</small> : null}
                </label>
              </>
            ) : null}

            {authFieldErrors.token ? <p id="auth-token" className="lx-field-error lx-token-error" role="alert" tabIndex={-1}>{authFieldErrors.token}</p> : null}

            {authMode === "login" ? (
              <button className="lx-auth-link" type="button" onClick={() => switchAuthMode("forgot")}>Забыли пароль?</button>
            ) : null}

            <div className="lx-auth-actions">
              <button
                className="lx-button ghost"
                type="button"
                onClick={() => {
                  if (forgotMode || resetMode) switchAuthMode("login");
                  else navigate({ view: "home" });
                }}
              >
                {forgotMode || resetMode ? "К входу" : "Отмена"}
              </button>
              <button className="lx-button primary" type="submit" disabled={busy}>{submitLabel}</button>
            </div>
          </form>
        </section>
      );
    }
    const profileProgressPending = progressStatus.phase === "idle" || progressStatus.phase === "loading";
    return <><section className="lx-page-heading"><div><span>ПРОФИЛЬ</span><h1>{session.user.displayName || "Ваш аккаунт"}</h1><p>Настройки обучения и синхронизация между устройствами.</p></div><div className="lx-heading-badge"><Icon name="user"/><span>{session.user.email}</span></div></section>{profileProgressPending ? <AsyncStatePanel label="Загрузка настроек профиля" kind="loading" title="Синхронизируем настройки" message="Получаем дневную цель и состояние учебной очереди." compact focusResult={false} /> : progressStatus.phase === "error" && progressStatus.problem ? <AsyncStatePanel label="Настройки профиля недоступны" kind="error" title={progressStatus.problem.title} message={progressStatus.problem.message} reference={progressStatus.problem.correlationId} actionLabel={progressStatus.problem.retryable ? "Повторить" : undefined} onAction={progressStatus.problem.retryable ? () => void loadProgressResource(session) : undefined} compact /> : null}<section className="lx-profile-grid"><article><span>Email</span><strong>{session.user.email}</strong><small>используется для входа</small></article><article><span>Аккаунт создан</span><strong>{formatAccountDate(session.user.createdAt)}</strong><small>история хранится на сервере</small></article><article><span>Дневная цель</span><strong>{progress ? progress.dailyGoal : "—"}</strong><small>{progress ? "ответов в день" : "данные не загружены"}</small></article><article><span>Активный урок</span><strong>{activeLessonStatus.phase === "loading" || activeLessonStatus.phase === "idle" ? "…" : activeLesson ? "Есть" : "Нет"}</strong><small>{activeLesson ? sourceLabel(activeLesson.source) : activeLessonStatus.phase === "error" ? "состояние недоступно" : "можно начать новый"}</small></article></section><section className="lx-page-actions"><button className="lx-button ghost" type="button" onClick={logout}>Выйти</button><button className="lx-button primary" type="button" onClick={() => navigate({ view: "progress" })}>Открыть прогресс</button></section></>;
  }

  function renderAllItems() {
    const loading = allItemsStatus.phase === "loading" || allItemsStatus.phase === "idle";
    return (
      <section className="lx-all-items">
        <div className="lx-lesson-top"><button className="lx-button ghost" type="button" onClick={() => navigate({ view: source === "phrases" ? "phrases" : "learn", source })}>← Назад</button><strong>{allItemsPageInfo.total.toLocaleString("ru-RU")} элементов · {sourceLabel(source)}</strong></div>
        <CatalogSearchForm value={allItemsSearchInput} onChange={setAllItemsSearchInput} onSubmit={applyAllItemsSearch} onClear={clearAllItemsSearch} label="Поиск по открытому каталогу" />
        <CatalogSortControl kind="all-items" mode={allItemsSortMode} onChange={changeAllItemsSort} />
        {allItemsStatus.phase === "error" && allItemsStatus.problem ? <AsyncStatePanel label="Каталог недоступен" kind="error" title={allItemsStatus.problem.title} message={allItemsStatus.problem.message} reference={allItemsStatus.problem.correlationId} actionLabel={allItemsStatus.problem.retryable ? "Повторить" : undefined} onAction={allItemsStatus.problem.retryable ? () => void changeAllItemsPage(allItemsPage) : undefined} /> : null}
        {loading && sortedAllItems.length === 0 ? <AsyncSkeletonGrid label="Загружаем страницу каталога" /> : null}
        {!loading && sortedAllItems.length === 0 ? <AsyncStatePanel label="Каталог пуст" kind="empty" title="По заданным условиям ничего не найдено" message={allItemsSearch ? "Сбросьте поиск или измените раздел." : "В этом разделе пока нет доступных элементов."} actionLabel={allItemsSearch ? "Сбросить поиск" : undefined} onAction={allItemsSearch ? clearAllItemsSearch : undefined} /> : null}
        <CatalogPagination info={allItemsPageInfo} busy={loading || busy} onPageChange={(page) => void changeAllItemsPage(page)} />
        <div id="all-items-results" role="list" aria-label="Страница элементов каталога" aria-busy={loading}>{sortedAllItems.map((item, index) => <article key={item.id} role="listitem" aria-posinset={(allItemsPageInfo.page - 1) * allItemsPageInfo.pageSize + index + 1} aria-setsize={allItemsPageInfo.total}><span>{(allItemsPageInfo.page - 1) * allItemsPageInfo.pageSize + index + 1}</span><div><small>{item.partOfSpeech} · {item.topic}</small><h3 lang="en">{item.prompt}</h3>{item.cloze ? <p lang="en">{item.cloze}</p> : null}<strong lang="ru">{item.answer}</strong>{item.examples[0] ? <p lang="en">{item.examples[0]}</p> : null}</div></article>)}</div>
        <CatalogPagination info={allItemsPageInfo} busy={loading || busy} onPageChange={(page) => void changeAllItemsPage(page)} label="Навигация под открытым каталогом" />
      </section>
    );
  }

  function leaveLessonResult(target: "home" | "progress") {
    clearLessonState();
    navigate({ view: target }, false, { allowLessonExit: true, intent: "in_app_navigation" });
  }

  function startNextLessonFromResult() {
    if (!session || !lessonResult) return;
    const resultSource = SOURCE_VALUES.includes(lessonResult.source as LessonSource)
      ? lessonResult.source as LessonSource
      : "mixed";
    void startLesson(session, {
      source: resultSource,
      size: lessonSizeFromAPI(lessonResult.lessonSize),
      mode: lessonResult.studyMode,
      topic: lessonResult.topic,
      previousResult: lessonResult,
      journeyIntent: "lesson_start",
    });
  }

  function startDueReviewFromResult() {
    if (!session) return;
    void startLesson(session, {
      source: "mixed",
      size: 30,
      mode: "recall",
      journeyIntent: "lesson_start",
    });
  }

  function renderLesson() {
    if (!lessonStarted) {
      if (activeLessonStatus.phase === "idle" || activeLessonStatus.phase === "loading") {
        return <AsyncStatePanel label="Загрузка активного урока" kind="loading" title="Проверяем незавершённый урок…" message="Синхронизируем текущую позицию и сохранённые оценки." focusResult={false} />;
      }
      if (activeLessonStatus.phase === "error" && activeLessonStatus.problem && session) {
        return <AsyncStatePanel label="Активный урок недоступен" kind="error" title={activeLessonStatus.problem.title} message={activeLessonStatus.problem.message} reference={activeLessonStatus.problem.correlationId} actionLabel={activeLessonStatus.problem.retryable ? "Повторить" : undefined} onAction={activeLessonStatus.problem.retryable ? () => void loadActiveLessonResource(session) : undefined} />;
      }
      return activeLesson
        ? <AsyncStatePanel label="Сохранённый активный урок" kind="success" title="Урок сохранён" message={`${sourceLabel(activeLesson.source)} · позиция ${activeLesson.currentIndex + 1} из ${activeLesson.items.length}`} actionLabel="Продолжить урок" onAction={() => void resumeLesson()} />
        : <AsyncStatePanel label="Активный урок отсутствует" kind="empty" title="Активного урока нет" message="Выберите режим, раздел и размер блока." actionLabel="Настроить урок" onAction={() => navigate({ view: "learn" })} />;
    }
    if (studyMode === "all") return renderAllItems();
    if (lessonComplete && lessonResult) return (
      <LessonResultPresentation
        snapshot={lessonResult}
        continuation={lessonResultContinuation}
        sourceLabel={SOURCE_VALUES.includes(lessonResult.source as LessonSource)
          ? sourceLabel(lessonResult.source as LessonSource)
          : "Учебный блок"}
        busy={busy}
        celebrate={lessonResultCelebrate}
        onHome={() => leaveLessonResult("home")}
        onProgress={() => leaveLessonResult("progress")}
        onNextLesson={startNextLessonFromResult}
        onDueReview={startDueReviewFromResult}
        onStay={() => setLessonQueueNotice("Результат сохранён и останется доступен на этом экране.")}
      />
    );
    if (lessonComplete) return <AsyncStatePanel label="Результат урока недоступен" kind="error" title="Не удалось восстановить итог" message="Ответы сохранены, но представление результата не сформировано. Откройте прогресс для проверки." actionLabel="Открыть прогресс" onAction={() => leaveLessonResult("progress")} />;
    if (!currentItem) return <AsyncStatePanel label="Ошибка учебной карточки" kind="error" title="Карточка урока недоступна" message="Серверная сессия не содержит ожидаемую текущую карточку." actionLabel="Синхронизировать урок" onAction={() => void resynchronizeActiveLesson("Урок синхронизирован с сервером.")} />;

    const lessonPercent = Math.round(((currentIndex + 1) / items.length) * 100);
    const advanceDecision = decideLessonAdvance({
      currentIndex,
      itemCount: items.length,
      reviewPersisted: Boolean(currentRating),
      reviewSaving: reviewing,
      serverCompleted: serverLessonCompleted,
      serverNextIndex,
    });

    return (
      <ActiveLessonPresentation
        mode={studyMode}
        item={currentItem}
        currentIndex={currentIndex}
        itemCount={items.length}
        progressPercent={normalizeProgressValue(lessonPercent)}
        typedAnswer={typedAnswer}
        selectedAnswer={selectedAnswer}
        expectedAnswer={expectedAnswer}
        answerOptions={answerOptions}
        revealed={revealed}
        localCorrect={literalMatch}
        currentRating={currentRating}
        reviewing={reviewing}
        reviewFeedback={reviewFeedback}
        suggestionStatus={suggestionStatus}
        suggestionError={suggestionError}
        advance={advanceDecision}
        advanceButtonRef={lessonAdvanceRef}
        onTypedAnswerChange={setTypedAnswer}
        onReveal={() => setRevealed(true)}
        onChoice={(answer) => {
          setSelectedAnswer(answer);
          setRevealed(true);
        }}
        onRate={(rating, submittedAt, restoreFocusAfterSave) => {
          void rateCurrent(rating, submittedAt, restoreFocusAfterSave);
        }}
        onAdvance={nextItem}
        onExit={() => saveAndExitLesson()}
        onSubmitSuggestion={() => void submitAnswerSuggestion()}
      />
    );
  }

  const view = navigation.view === "home" ? renderHome()
    : navigation.view === "learn" ? renderLearn()
      : navigation.view === "phrases" ? renderPhrases()
        : navigation.view === "library" ? renderLibrary()
          : navigation.view === "progress" ? renderProgress()
            : navigation.view === "profile" ? renderProfile()
              : renderLesson();

  return (
    <div className={`lx-app${lessonFocusMode ? " lx-lesson-focus-mode" : ""}`}>
      <a className="lx-skip-link" href="#lexigo-main-content" onClick={skipToMainContent}>
        Перейти к основному содержимому
      </a>
      {renderHeader()}
      <div className="lx-app-shell">
        {!lessonFocusMode ? (
          <PrimaryNavigation
            className="lx-navigation-rail lx-primary-navigation"
            ariaLabel="Навигация по разделам"
            currentView={navigation.view}
            labelMode="full"
            onNavigate={navigatePrimary}
          />
        ) : null}
        <main
        id="lexigo-main-content"
        ref={mainContentRef}
        className="lx-main-content"
        tabIndex={-1}
        aria-label={viewTitle(navigation.view)}
      >
        {error ? <AsyncStatePanel label="Ошибка текущего действия" kind="error" title="Действие не выполнено" message={error} compact /> : null}
        {session ? <div className="lx-resource-stack">
          {navigation.view !== "progress" ? <AsyncResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgressResource(session)} /> : null}
          <AsyncResourceNotice label="Состав каталога" status={catalogMetadataResourceStatus} onRetry={() => void loadCatalogMetadataResource()} />
          <AsyncResourceNotice label="Каталог фраз" status={phraseCatalogStatus} onRetry={() => void loadPhraseCatalogResource(session, { page: phrasePage, topic: phraseTopic, query: phraseSearch, sort: phraseSortMode })} />
          <AsyncResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLessonResource(session)} />
        </div> : null}
        {lessonQueueNotice ? <p className="lx-queue-notice" role="status">{lessonQueueNotice}</p> : null}
        <div className="lx-view">
          {view}
          <CalendarReminderIntegration
            open={calendarOpen}
            showCard={navigation.view === "progress" && Boolean(session && progress)}
            onOpen={() => setCalendarOpen(true)}
            onClose={() => setCalendarOpen(false)}
          />
        </div>
        </main>
      </div>
      {!lessonFocusMode ? (
        <PrimaryNavigation
          className="lx-mobile-nav lx-primary-navigation"
          ariaLabel="Мобильная навигация"
          currentView={navigation.view}
          labelMode="short"
          onNavigate={navigatePrimary}
        />
      ) : null}
      {routeAnnouncement.message ? (
        <p
          key={routeAnnouncement.id}
          className="lx-route-announcement"
          data-announcement-id={routeAnnouncement.id}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {routeAnnouncement.message}
        </p>
      ) : null}
    </div>
  );
}
