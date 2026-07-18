"use client";

import type { FormEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  failedResourceStatus,
  idleResourceStatus,
  isActiveLessonPayload,
  isItemsResponsePayload,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
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
import { catalogCountText, catalogSummaryText, type CatalogMetadata, type CatalogMetadataStatus } from "../lib/catalog-metadata";
import { EXPANDED_PHRASES } from "../lib/expanded-phrases";
import {
  lessonCompositionDescription,
  lessonCompositionFallbackMessage,
  lessonPriorityDescription,
  type LessonComposition,
} from "../lib/lesson-composition";
import { decideLessonAdvance, resolveActiveLessonIndex, summarizePersistedLesson } from "../lib/lesson-flow";
import {
  buildAnswerOptions,
  exerciseAnswer,
  exercisePromptLabel,
  normalizeAnswer,
  normalizePartOfSpeech,
  prepareWordItems,
  takeLessonBlock,
  type LearningItem,
  type LessonSize,
  type WordSection,
} from "../lib/learning";
import {
  navigationURL,
  parseNavigation,
  PRIMARY_NAVIGATION,
  readPersistedNavigation as readNavigationCache,
  type AppView,
  type NavigationTarget,
  viewTitle,
  writePersistedNavigation as writeNavigationCache,
} from "../lib/navigation";
import {
  goalPercent,
  normalizedProgressModes,
  objectiveSuccessRate,
  ratingLabel,
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
import { CalendarReminderIntegration } from "./calendar-reminder-integration";

type APIItem = {
  id: number;
  kind?: "word" | "phrase";
  slug?: string;
  lemma: string;
  translation: string;
  phonetic: string;
  partOfSpeech: string;
  topic: string;
  examples: string[];
  note: string;
  cloze?: string;
  clozeAnswer?: string;
  status: string;
};

type ItemsResponse = {
  items: APIItem[];
  count: number;
};

type LessonItemResponse = APIItem & {
  position: number;
  rating?: ReviewRating;
  reviewedAt?: string;
};

type LessonSource = WordSection | "phrases";
type StudyMode = AnswerMode | "all";
type StudyView = "card" | "example" | "context";
type CollectionSource = Extract<WordSection, "daily-life" | "travel" | "data-engineering" | "backend">;
type CatalogKind = "phrases" | "all-items";

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

type StartOverrides = {
  source?: LessonSource;
  size?: LessonSize;
  mode?: StudyMode;
  items?: LearningItem[];
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
    label: "Data Engineer",
    shortLabel: "Data Engineer",
    description: "Моделирование, пайплайны, Kafka, качество и хранение данных",
    symbol: "DB",
  },
  {
    source: "backend",
    label: "Backend Development",
    shortLabel: "Backend",
    description: "API, архитектура, базы данных, конкурентность и надёжность",
    symbol: "</>",
  },
];

const STUDY_TABS: Array<{ value: StudyView; label: string; icon: IconName }> = [
  { value: "card", label: "Карточка", icon: "book" },
  { value: "example", label: "Пример", icon: "phrases" },
  { value: "context", label: "Контекст", icon: "library" },
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
  { value: "phrases", label: "Технические фразы", hint: "Рабочие chunks и cloze", icon: "code" },
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
    label: "Вспомнить самому",
    hint: "Введите перевод или восстановите пропуск",
    icon: "spark",
  },
  {
    value: "choice",
    label: "Выбрать вариант",
    hint: "Четыре варианта ответа для поддержки",
    icon: "check",
  },
  {
    value: "all",
    label: "Все и сразу",
    hint: "Открытый список без записи оценок",
    icon: "library",
  },
];

const SIZE_OPTIONS: Array<{ value: LessonSize; label: string }> = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 60, label: "60" },
  { value: "all", label: "Все" },
];

const GOAL_OPTIONS = [15, 30, 60];
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
  onSelect,
}: {
  definition: CollectionDefinition;
  variant: "home" | "selector" | "library";
  countText: string;
  selected?: boolean;
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
      className={`lx-themed-${variant} lx-collection-${definition.source}${selected ? " selected" : ""}`}
      aria-pressed={variant === "selector" ? selected : undefined}
      onClick={onSelect}
    >
      <span className="lx-themed-symbol">{definition.symbol}</span>
      <div><strong>{title}</strong><small>{hint}</small></div>
      {variant === "selector" ? <b data-catalog-count-state={countText === "Загрузка…" ? "loading" : undefined}>{countText}</b> : <span className="lx-themed-arrow" aria-hidden="true">→</span>}
    </button>
  );
}

function AccountResourceNotice({
  label,
  status,
  onRetry,
}: {
  label: string;
  status: ResourceStatus;
  onRetry: () => void;
}) {
  if (status.phase !== "error" || !status.problem) return null;
  return (
    <section className={`lx-resource-notice ${status.problem.kind}`} role="alert" aria-label={`${label}: ошибка загрузки`}>
      <div><strong>{status.problem.title}</strong><span>{status.problem.message}</span></div>
      {status.problem.retryable ? <button type="button" onClick={onRetry}>Повторить</button> : null}
    </section>
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
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [activeLessonStatus, setActiveLessonStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [hydratedUserID, setHydratedUserID] = useState("");
  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>(DEFAULT_PHRASE_CATALOG);
  const [phraseCatalogStatus, setPhraseCatalogStatus] = useState<ResourceStatus>(idleResourceStatus);

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
  const [studyMode, setStudyMode] = useState<StudyMode>("study");
  const [studyView, setStudyView] = useState<StudyView>("card");
  const [phraseTopic, setPhraseTopic] = useState("all");
  const [phraseSortMode, setPhraseSortMode] = useState<CatalogSortMode>("default");
  const [allItemsSortMode, setAllItemsSortMode] = useState<CatalogSortMode>("default");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [speechNotice, setSpeechNotice] = useState<{ message: string; error: boolean } | null>(null);

  const [items, setItems] = useState<LearningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [ratings, setRatings] = useState<Record<string, ReviewRating>>({});
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [serverLessonCompleted, setServerLessonCompleted] = useState(false);
  const [serverNextIndex, setServerNextIndex] = useState<number | null>(null);
  const [serverSkippedItems, setServerSkippedItems] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [lessonQueueNotice, setLessonQueueNotice] = useState("");
  const [lessonPreview, setLessonPreview] = useState<LessonPreviewResponse | null>(null);
  const [previewingLesson, setPreviewingLesson] = useState(false);
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const reviewInFlightRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    requestJSON<CatalogMetadata>("/api/v1/catalog/metadata", { signal: controller.signal })
      .then((metadata) => {
        setCatalogMetadata(metadata);
        setCatalogMetadataStatus("ready");
      })
      .catch((metadataError) => {
        if (controller.signal.aborted) return;
        console.error("catalog metadata request failed", metadataError);
        setCatalogMetadata(null);
        setCatalogMetadataStatus("error");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const applyNavigation = (next: NavigationTarget) => {
      setNavigation(next);
      if (next.source) setSource(next.source);
      writeNavigationCache(window.localStorage, next);
    };
    const syncNavigationFromURL = () => applyNavigation(parseNavigation(window.location.search));

    const explicitNavigation = window.location.search.length > 0;
    const restored = !explicitNavigation && isStandaloneDisplayMode()
      ? readNavigationCache(window.localStorage)
      : null;
    if (restored) {
      window.history.replaceState({ lexigo: true, ...restored }, "", navigationURL(restored));
      applyNavigation(restored);
    } else {
      syncNavigationFromURL();
    }

    window.addEventListener("popstate", syncNavigationFromURL);
    return () => {
      window.removeEventListener("popstate", syncNavigationFromURL);
    };
  }, []);

  useEffect(() => {
    const target = new URL(window.location.href);
    const fragment = new URLSearchParams(target.hash.replace(/^#/, ""));
    const token = fragment.get("reset_token")?.trim()
      || target.searchParams.get("reset_token")?.trim()
      || "";
    if (!token) return;
    const timer = window.setTimeout(() => {
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
    return () => {
      window.clearTimeout(storageTimer);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!lessonStarted) return;
    const timer = window.setTimeout(() => setCardStartedAt(window.performance.now()), 0);
    return () => window.clearTimeout(timer);
  }, [lessonStarted, currentIndex, studyMode]);

  useEffect(() => {
    if (!speechNotice) return;
    const timer = window.setTimeout(() => setSpeechNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [speechNotice]);

  useEffect(() => {
    if (!speakingText) return;
    const wordCount = Math.max(1, speakingText.trim().split(/\s+/).length);
    const timeoutMs = Math.min(10_000, Math.max(1_500, wordCount * 700));
    const timer = window.setTimeout(() => setSpeakingText(""), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [speakingText]);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);

  const currentItem = items[currentIndex];
  const currentRating = currentItem ? ratings[currentItem.id] : undefined;
  const expectedAnswer = currentItem ? exerciseAnswer(currentItem) : "";
  const literalMatch = Boolean(
    currentItem && typedAnswer.trim() && normalizeAnswer(typedAnswer) === normalizeAnswer(expectedAnswer),
  );
  const answerOptions = useMemo(
    () => (currentItem ? buildAnswerOptions(currentItem, items) : []),
    [currentItem, items],
  );
  const phraseTopics = useMemo(
    () => ["all", ...Array.from(new Set(phraseCatalog.map((phrase) => phrase.topic)))],
    [phraseCatalog],
  );
  const visiblePhrases = useMemo(
    () => phraseTopic === "all" ? phraseCatalog : phraseCatalog.filter((phrase) => phrase.topic === phraseTopic),
    [phraseCatalog, phraseTopic],
  );
  const sortedVisiblePhrases = useMemo(
    () => sortLearningItems(visiblePhrases, phraseSortMode),
    [visiblePhrases, phraseSortMode],
  );
  const sortedAllItems = useMemo(
    () => sortLearningItems(items, allItemsSortMode),
    [items, allItemsSortMode],
  );
  const selectedPhrase = navigation.detail
    ? phraseCatalog.find((phrase) => itemKey(phrase) === navigation.detail)
      ?? DEFAULT_PHRASE_CATALOG.find((phrase) => phrase.id === navigation.detail)
    : undefined;
  const ratingValues = Object.values(ratings);
  const lessonSummary = summarizePersistedLesson(ratings, items.length);
  const overallPercent = progress && catalogMetadata && catalogMetadata.totals.items > 0
    ? Math.round(((progress.masteredWords + progress.masteredPhrases) / catalogMetadata.totals.items) * 100)
    : 0;
  const successRate = objectiveSuccessRate(progress);

  function navigate(target: NavigationTarget, replace = false) {
    const url = navigationURL(target);
    if (replace) window.history.replaceState({ lexigo: true, ...target }, "", url);
    else window.history.pushState({ lexigo: true, ...target }, "", url);
    setNavigation(target);
    if (target.source) setSource(target.source);
    writeNavigationCache(window.localStorage, target);
    setError("");
    if (target.view !== "lesson") setLessonQueueNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function requestAuthentication(afterLogin: AppView) {
    setReturnView(afterLogin);
    navigate({ view: "profile" });
  }

  const loadItems = useCallback(async (
    activeSession: Session,
    kind: "word" | "phrase",
    dueOnly: boolean,
    signal?: AbortSignal,
  ) => {
    const endpoint = dueOnly ? "/api/v1/words/due" : "/api/v1/words";
    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
      { signal },
      isItemsResponsePayload,
    );
    return { activeSession: result.activeSession, items: result.data.items.map(toLearningItem) };
  }, []);

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
    signal?: AbortSignal,
    adoptSession = true,
  ): Promise<Session | null> => {
    setPhraseCatalogStatus(loadingResourceStatus());
    try {
      const result = await loadItems(activeSession, "phrase", false, signal);
      if (signal?.aborted) return null;
      setPhraseCatalog(result.items);
      setPhraseCatalogStatus(readyResourceStatus());
      if (adoptSession) setSession(result.activeSession);
      return result.activeSession;
    } catch (requestError) {
      if (signal?.aborted) return null;
      setPhraseCatalogStatus(failedResourceStatus(requestError, "каталог фраз"));
      return null;
    }
  }, [loadItems]);

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
      setPhraseCatalog(DEFAULT_PHRASE_CATALOG);
      void Promise.all([
        loadProgressResource(activeSession, controller.signal, false),
        loadPhraseCatalogResource(activeSession, controller.signal, false),
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
    loadPhraseCatalogResource,
    loadProgressResource,
  ]);

  useEffect(() => {
    if (!session || navigation.view !== "learn" || studyMode === "all") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewingLesson(true);
      void authorizedRequest<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {
        method: "POST",
        body: JSON.stringify({ source, studyMode, lessonSize: String(lessonSize) }),
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
  }, [navigation.view, session, source, studyMode, lessonSize]);

  async function refreshProgress(activeSession: Session): Promise<Session> {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        {},
        isProgressSummaryPayload,
      );
      setSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      return result.activeSession;
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

  function showSpeechNotice(message: string, speechError = false) {
    setSpeechNotice({ message, error: speechError });
  }

  function pronounceText(text: string) {
    const value = text.trim();
    if (!value) {
      showSpeechNotice("Не удалось определить слово или фразу для озвучивания", true);
      return;
    }
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      showSpeechNotice("Озвучивание не поддерживается этим браузером", true);
      return;
    }
    if (speakingText === value) {
      window.speechSynthesis.cancel();
      setSpeakingText("");
      showSpeechNotice("Озвучивание остановлено");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(value);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb"))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us"))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
      ?? null;
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingText((current) => current === value ? "" : current);
    utterance.onerror = () => {
      setSpeakingText((current) => current === value ? "" : current);
      showSpeechNotice("Не удалось воспроизвести произношение", true);
    };

    setSpeakingText(value);
    showSpeechNotice(`Воспроизводим: ${value}`);
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingText("");
      showSpeechNotice("Не удалось воспроизвести произношение", true);
    }
  }

  function handleStudyTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, view: StudyView) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const currentIndex = STUDY_TABS.findIndex((tab) => tab.value === view);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + STUDY_TABS.length) % STUDY_TABS.length;
    const buttons = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    setStudyView(STUDY_TABS[nextIndex].value);
    buttons[nextIndex]?.focus();
  }

  function resetCardState(mode = studyMode, rated = false) {
    setStudyView("card");
    setRevealed(rated || mode === "study");
    setShowChoices(!rated && mode === "choice");
    setSelectedAnswer("");
    setTypedAnswer("");
  }

  function applyLesson(lesson: LessonSessionResponse) {
    const lessonItems = lesson.items.map(toLearningItem);
    const restoredRatings: Record<string, ReviewRating> = {};
    lesson.items.forEach((item, index) => {
      if (item.rating && lessonItems[index]) restoredRatings[lessonItems[index].id] = item.rating;
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

  async function startLesson(activeSession = session, overrides: StartOverrides = {}) {
    const resolvedSource = overrides.source ?? source;
    const resolvedSize = overrides.size ?? lessonSize;
    const resolvedMode = overrides.mode ?? studyMode;
    setSource(resolvedSource);
    setLessonSize(resolvedSize);
    setStudyMode(resolvedMode);

    if (resolvedMode !== "all" && !activeSession) {
      requestAuthentication(resolvedSource === "phrases" ? "phrases" : "learn");
      return;
    }
    if (resolvedSource !== "phrases" && !activeSession) {
      requestAuthentication("learn");
      return;
    }

    setBusy(true);
    setError("");
    setLessonQueueNotice("");
    try {
      let currentSession = activeSession;
      if (resolvedMode !== "all") {
        const explicitItems = overrides.items?.filter((item) => typeof item.wordId === "number") ?? [];
        if (overrides.items && explicitItems.length !== overrides.items.length) {
          throw new Error("Выбранные элементы ещё не синхронизированы с сервером");
        }
        const result = await authorizedRequest<LessonSessionResponse>(
          currentSession as Session,
          "/api/v1/lessons",
          {
            method: "POST",
            body: JSON.stringify({
              source: resolvedSource,
              studyMode: resolvedMode,
              lessonSize: String(resolvedSize),
              ...(overrides.items ? { wordIds: explicitItems.map((item) => item.wordId) } : {}),
            }),
          },
        );
        setSession(result.activeSession);
        if (applyLesson(result.data)) {
          setLessonQueueNotice(mixedLessonFallbackMessage(result.data));
          navigate({ view: "lesson", source: resolvedSource });
        }
        return;
      }

      let available: LearningItem[];
      if (resolvedSource === "phrases") {
        available = overrides.items ?? phraseCatalog;
      } else if (resolvedSource === "mixed") {
        const wordsResult = await loadItems(currentSession as Session, "word", false);
        currentSession = wordsResult.activeSession;
        const phrasesResult = await loadItems(currentSession, "phrase", false);
        currentSession = phrasesResult.activeSession;
        available = [...prepareWordItems(wordsResult.items, "mixed"), ...phrasesResult.items];
      } else {
        const result = await loadItems(currentSession as Session, "word", false);
        currentSession = result.activeSession;
        available = prepareWordItems(result.items, resolvedSource);
      }

      const lessonItems = takeLessonBlock(available, resolvedSize);
      setSession(currentSession as Session);
      setActiveLesson(null);
      setItems(lessonItems);
      setCurrentIndex(0);
      setRatings({});
      resetCardState(resolvedMode);
      setLessonStarted(true);
      setLessonComplete(lessonItems.length === 0);
      setServerLessonCompleted(false);
      setServerNextIndex(null);
      setServerSkippedItems(0);
      navigate({ view: "lesson", source: resolvedSource });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сформировать учебный блок");
    } finally {
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
      setSession(null);
      setProgress(null);
      setProgressStatus(idleResourceStatus());
      setActiveLesson(null);
      setActiveLessonStatus(idleResourceStatus());
      setPhraseCatalog(DEFAULT_PHRASE_CATALOG);
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
    setShowChoices(false);
    setSelectedAnswer("");
    setTypedAnswer("");
    setRatings({});
    setLessonStarted(false);
    setLessonComplete(false);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setServerSkippedItems(0);
    reviewInFlightRef.current = false;
    setError("");
    setLessonQueueNotice("");
  }

  function saveAndExitLesson() {
    clearLessonState();
    navigate({ view: "home" });
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

  function handleRatingClick(event: MouseEvent<HTMLButtonElement>) {
    const rating = event.currentTarget.dataset.rating;
    if (rating === "again" || rating === "almost" || rating === "known") {
      void rateCurrent(rating, event.timeStamp);
    }
  }

  async function rateCurrent(rating: ReviewRating, submittedAt: number) {
    if (!currentItem || currentRating || reviewInFlightRef.current) return;
    if (!session || !activeLesson || currentItem.wordId === undefined) {
      requestAuthentication("lesson");
      return;
    }
    reviewInFlightRef.current = true;
    setReviewing(true);
    setError("");
    try {
      const correct = selectedAnswer
        ? normalizeAnswer(selectedAnswer) === normalizeAnswer(expectedAnswer)
        : typedAnswer.trim()
          ? literalMatch
          : undefined;
      const reviewMode: AnswerMode = studyMode === "all" ? "study" : studyMode;
      const path = activeLesson
        ? `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`
        : `/api/v1/words/${currentItem.wordId}/review`;
      const result = await authorizedRequest<LessonReviewResponse>(session, path, {
        method: "POST",
        body: JSON.stringify({
          lessonVersion: activeLesson.version,
          rating,
          responseMs: Math.max(0, Math.round(submittedAt - cardStartedAt)),
          answerMode: reviewMode,
          answerRevealed: revealed || reviewMode === "study",
          ...(reviewMode === "study" ? {} : { correct }),
          timezoneOffsetMinutes: timezoneOffsetMinutes(),
        }),
      });
      setSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);
      setServerSkippedItems(result.data.lessonSkippedItems);
      if (activeLesson) {
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
      }
      try {
        await refreshProgress(result.activeSession);
      } catch {
        setError("Оценка сохранена, но статистика обновится после следующей синхронизации.");
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
    }
  }

  function renderHeader() {
    const initial = session?.user.displayName?.trim().charAt(0).toUpperCase()
      || session?.user.email.charAt(0).toUpperCase()
      || "L";
    return (
      <header className="lx-header">
        <button className="lx-brand" type="button" onClick={() => navigate({ view: "home" })}>
          <span className="lx-logo-mark"><span>L</span></span>
          <strong>LexiGo</strong>
        </button>
        <nav className="lx-nav" aria-label="Основная навигация">
          {PRIMARY_NAVIGATION.map((entry) => (
            <button
              key={entry.view}
              type="button"
              className={navigation.view === entry.view ? "active" : ""}
              onClick={() => navigate({ view: entry.view })}
            >
              <Icon name={navigationIcon(entry.view)} />
              <span>{entry.label}</span>
            </button>
          ))}
        </nav>
        <div className="lx-header-tools">
          {session && progress ? (
            <button className="lx-streak" type="button" onClick={() => navigate({ view: "progress" })}>
              <Icon name="flame" />
              <span>{progress.currentStreak} дн.</span>
            </button>
          ) : null}
          <button className="lx-icon-button" type="button" aria-label="Уведомления" onClick={() => setCalendarOpen(true)}>
            <Icon name="bell" />
          </button>
          <button className="lx-avatar" type="button" onClick={() => navigate({ view: "profile" })} aria-label="Открыть профиль">
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
    const dueNow = !session ? "—" : progress ? progress.dueNow : progressPending ? "…" : "—";
    const retained = !session ? "—" : progress ? progress.retainedItemsWeek : progressPending ? "…" : "—";
    const dailyPercent = goalPercent(progress);
    const progressPanelStatus = !session
      ? "Войдите для персональной статистики"
      : progress
        ? "Актуальные данные аккаунта"
        : progressPending
          ? "Загружаем данные аккаунта…"
          : "Статистика временно недоступна";
    const dueBreakdown = !session
      ? "После входа"
      : progress
        ? `${progress.dueWords} слов · ${progress.duePhrases} фраз`
        : progressPending
          ? "Загружаем очередь…"
          : "Очередь недоступна";
    const streakValue = !session ? "—" : progress ? progress.currentStreak : progressPending ? "…" : "—";
    const streakHint = !session ? "Сохраняется" : progress ? `Рекорд ${progress.longestStreak}` : progressPending ? "Загружаем серию…" : "Серия недоступна";
    const overallProgressLabel = !session
      ? "—"
      : !progress
        ? progressPending ? "…" : "—"
        : catalogMetadataStatus === "loading"
          ? "…"
          : catalogMetadata
            ? `${overallPercent}%`
            : "—";
    const goalSummary = !session
      ? "Войдите в аккаунт"
      : progress
        ? `${progress.reviewsToday} / ${progress.dailyGoal}`
        : progressPending
          ? "Загружаем цель…"
          : "Цель недоступна";
    const goalPercentLabel = !session ? "—" : progress ? `${dailyPercent}%` : progressPending ? "…" : "—";
    const heroAction = activeLesson ? resumeLesson : () => startLesson(session, { mode: "study", source: "mixed", size: 30 });
    return (
      <>
        <section className="lx-dashboard-top">
          <article className="lx-hero-card">
            <div className="lx-hero-copy">
              <span className="lx-kicker">ТЕХНИЧЕСКИЙ АНГЛИЙСКИЙ</span>
              <h1>Продолжайте учиться<br/>каждый день <em>✦</em></h1>
              <p>Регулярная практика помогает быстрее понимать документацию, обсуждать архитектуру и увереннее писать рабочие сообщения.</p>
              <div className="lx-hero-actions">
                <button className="lx-button primary large" type="button" disabled={busy} onClick={heroAction}>
                  <Icon name="play" />
                  {activeLesson ? "Продолжить урок" : "Начать изучение"}
                </button>
                <button className="lx-button ghost large" type="button" disabled={busy} onClick={() => startLesson(session, { mode: "recall", source: "mixed", size: 30 })}>
                  <Icon name="repeat" />
                  Начать повторение
                </button>
              </div>
            </div>
            <div className="lx-hero-art" aria-hidden="true">
              <div className="lx-orbit orbit-one" />
              <div className="lx-orbit orbit-two" />
              <div className="lx-floating-card"><span>Aa</span><i>★</i></div>
              <div className="lx-book-base"><span/><span/><span/></div>
              <div className="lx-glow" />
            </div>
          </article>

          <article className="lx-progress-panel">
            <div className="lx-panel-heading">
              <div><span>Ваш прогресс</span><small>{progressPanelStatus}</small></div>
              <button type="button" onClick={() => navigate({ view: "progress" })}>Подробнее <Icon name="arrow" size={16}/></button>
            </div>
            <div className="lx-progress-stats">
              <button type="button" onClick={() => navigate({ view: "learn" })}>
                <span>К повторению</span><strong className="purple">{dueNow}</strong><small>{dueBreakdown}</small>
              </button>
              <button type="button" onClick={() => navigate({ view: "progress" })}>
                <span>Серия дней</span><strong className="orange">{streakValue}</strong><small>{streakHint}</small>
              </button>
              <button type="button" onClick={() => navigate({ view: "progress" })}>
                <span>Сохранено за неделю</span><strong className="blue">{retained}</strong><small>Retained items</small>
              </button>
              <button type="button" className="lx-ring-stat" onClick={() => navigate({ view: "library" })}>
                <span>Общий прогресс</span>
                <div className="lx-progress-ring" style={{ "--progress": `${progress && catalogMetadata ? overallPercent : 0}%` } as React.CSSProperties}><strong>{overallProgressLabel}</strong></div>
                <small>Освоенные элементы</small>
              </button>
            </div>
            <div className="lx-goal-row">
              <div><span>Цель на сегодня</span><strong>{goalSummary}</strong></div>
              <div className="lx-goal-track"><span style={{ width: `${dailyPercent}%` }}/></div>
              <b>{goalPercentLabel}</b>
            </div>
          </article>
        </section>

        {renderResumeStrip()}

        <section className="lx-section-heading">
          <div><span>Режимы обучения</span><h2>Выберите удобный формат</h2></div>
        </section>
        <section className="lx-learning-layout">
          <div className="lx-mode-grid">
            <button className="lx-mode-card featured" type="button" onClick={() => startLesson(session, { mode: "study", source: "mixed", size: 30 })}>
              <span className="lx-mode-icon purple"><Icon name="book" /></span>
              <strong>Простое изучение слов</strong>
              <p>Вы видите слово, перевод, пример использования и примечание одновременно.</p>
              <em>Начать <Icon name="arrow" size={16}/></em>
            </button>
            <button className="lx-mode-card" type="button" onClick={() => navigate({ view: "phrases" })}>
              <span className="lx-mode-icon blue"><Icon name="code" /></span>
              <strong>Технические фразы</strong>
              <p>Изучайте профессиональные формулировки из реальных рабочих ситуаций.</p>
              <em>Открыть <Icon name="arrow" size={16}/></em>
            </button>
            <button className="lx-mode-card" type="button" onClick={() => startLesson(session, { mode: "recall", source: "mixed", size: 30 })}>
              <span className="lx-mode-icon green"><Icon name="shuffle" /></span>
              <strong>Смешанная практика</strong>
              <p>Слова и фразы чередуются для более устойчивого запоминания.</p>
              <em>Начать <Icon name="arrow" size={16}/></em>
            </button>
            <button className="lx-mode-card" type="button" onClick={() => navigate({ view: "progress" })}>
              <span className="lx-mode-icon violet"><Icon name="chart" /></span>
              <strong>Аналитика прогресса</strong>
              <p>Смотрите очередь, retained items, серию и освоенные материалы.</p>
              <em>Открыть <Icon name="arrow" size={16}/></em>
            </button>
          </div>

          <article className="lx-word-preview">
            <div className="lx-preview-heading"><span>Пример карточки слова</span><button type="button" className={speakingText === WORD_PREVIEW.prompt ? "speaking" : ""} aria-label={`${speakingText === WORD_PREVIEW.prompt ? "Остановить произношение" : "Произнести"}: ${WORD_PREVIEW.prompt}`} onClick={() => pronounceText(WORD_PREVIEW.prompt)}><Icon name="volume" /></button></div>
            <h3>{WORD_PREVIEW.prompt}</h3>
            <p className="lx-preview-phonetic">{WORD_PREVIEW.phonetic}</p>
            <dl><dt>Перевод</dt><dd>{WORD_PREVIEW.answer}</dd><dt>Пример</dt><dd>{WORD_PREVIEW.example}</dd></dl>
            <button className="lx-preview-action" type="button" onClick={() => startLesson(session, { mode: "study", source: "mixed", size: 30 })}>Открыть простое изучение <Icon name="arrow" size={16}/></button>
            <div className="lx-dots"><i className="active"/><i/><i/><i/><i/></div>
          </article>
        </section>

        <section className="lx-section-heading inline">
          <div><span>Разделы для изучения</span><h2>Соберите урок по теме</h2></div>
          <button type="button" onClick={() => navigate({ view: "library" })}>Все разделы <Icon name="arrow" size={16}/></button>
        </section>
        <section className="lx-section-grid">
          {SOURCE_OPTIONS.filter((option) => option.value !== "mixed").map((option) => (
            <button key={option.value} type="button" onClick={() => navigate(option.value === "phrases" ? { view: "phrases" } : { view: "learn", source: option.value })}>
              <span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span>
              <div><strong>{option.label}</strong><small>{catalogCountText(
                      catalogMetadata,
                      catalogMetadataStatus,
                      option.value,
                      option.value === "mixed"
                        ? ["элемент", "элемента", "элементов"]
                        : option.value === "phrases"
                          ? ["фраза", "фразы", "фраз"]
                          : ["слово", "слова", "слов"],
                    )}</small></div>
              <Icon name="arrow" size={17}/>
            </button>
          ))}
          {COLLECTIONS.map((definition) => (
            <CollectionCard
              key={definition.source}
              definition={definition}
              variant="home"
              countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["слово и термин", "слова и термина", "слов и терминов"])}
              onSelect={() => navigate({ view: "learn", source: definition.source })}
            />
          ))}
        </section>
      </>
    );
  }

  function renderLearn() {
    const matchingLessonPreview = lessonPreview
      && lessonPreview.source === source
      && lessonPreview.studyMode === studyMode
      && lessonPreview.lessonSize === String(lessonSize)
      ? lessonPreview
      : null;
    return (
      <>
        <section className="lx-page-heading">
          <div><span>ОБУЧЕНИЕ</span><h1>Настройте урок под текущую задачу</h1><p>Для спокойного знакомства выберите простое изучение. Для проверки знаний — active recall или варианты.</p></div>
          <div className="lx-heading-badge"><Icon name="learn"/><span>{session && progress ? `${progress.dueNow} элементов готовы` : "Прогресс сохраняется после входа"}</span></div>
        </section>
        {renderResumeStrip()}
        <section className="lx-setup-card">
          <div className="lx-setup-block">
            <div className="lx-block-heading"><span>1</span><div><strong>Выберите режим</strong><small>Главный режим — простое изучение с открытой карточкой</small></div></div>
            <div className="lx-mode-selector">
              {MODE_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={studyMode === option.value ? "selected" : ""} onClick={() => setStudyMode(option.value)}>
                  <span><Icon name={option.icon}/></span><div><strong>{option.label}</strong><small>{option.hint}</small></div><i><Icon name="check" size={14}/></i>
                </button>
              ))}
            </div>
          </div>
          <div className="lx-setup-block">
            <div className="lx-block-heading"><span>2</span><div><strong>Выберите раздел</strong><small>Можно начать со всех слов или сфокусироваться на части речи</small></div></div>
            <div className="lx-source-selector">
              {SOURCE_OPTIONS.map((option) => (
                <button key={option.value} type="button" data-lexigo-source={option.value} aria-pressed={source === option.value} className={source === option.value ? "selected" : ""} onClick={() => setSource(option.value)}>
                  <span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span>
                  <div><strong>{option.label}</strong><small>{option.hint}</small></div>
                  <b data-catalog-count-state={catalogMetadataStatus}>{catalogCountText(catalogMetadata, catalogMetadataStatus, option.value, ["элемент", "элемента", "элементов"])}</b>
                </button>
              ))}
              {COLLECTIONS.map((definition) => (
                <CollectionCard
                  key={definition.source}
                  definition={definition}
                  variant="selector"
                  countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["элемент", "элемента", "элементов"])}
                  selected={source === definition.source}
                  onSelect={() => setSource(definition.source)}
                />
              ))}
            </div>
          </div>
          <div className="lx-setup-footer">
            <fieldset><legend>Размер урока</legend><div className="lx-size-control">{SIZE_OPTIONS.map((option) => <button key={String(option.value)} type="button" className={lessonSize === option.value ? "selected" : ""} onClick={() => setLessonSize(option.value)}>{option.label}</button>)}</div></fieldset>
            <div className="lx-setup-actions">
              {studyMode === "all" ? (
                <div className="lx-lesson-preview"><span>Состав списка</span><strong>Все доступные элементы раздела</strong><small>Справочный режим не создаёт server lesson session.</small></div>
              ) : !session ? (
                <div className="lx-lesson-preview"><span>Состав урока</span><strong>Войдите для расчёта</strong><small>Composer учитывает вашу due-очередь и доступные фразы.</small></div>
              ) : previewingLesson || !matchingLessonPreview ? (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>Рассчитываем…</strong><small>Проверяем due, new и доступность обоих типов.</small></div>
              ) : (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>{lessonCompositionDescription(matchingLessonPreview.composition)}</strong><small>{lessonPriorityDescription(matchingLessonPreview.composition)}</small>{lessonCompositionFallbackMessage(matchingLessonPreview.composition) ? <em>{lessonCompositionFallbackMessage(matchingLessonPreview.composition)}</em> : null}</div>
              )}
              <div className="lx-setup-submit"><p>{studyMode === "study" ? "Слово, перевод и пример будут видны сразу." : studyMode === "all" ? "Откроется справочный список без оценок." : "Ответы будут сохранены в интервальную очередь."}</p><button className="lx-button primary large" type="button" disabled={busy || Boolean(session && studyMode !== "all" && (!matchingLessonPreview || matchingLessonPreview.composition.total === 0))} onClick={() => startLesson()}><Icon name="play"/>{busy ? "Формируем…" : studyMode === "all" ? "Открыть список" : "Начать урок"}</button></div>
            </div>
          </div>
        </section>
      </>
    );
  }

  function startSelectedPhraseLesson() {
    if (!selectedPhrase) return;
    void startLesson(session, { source: "phrases", size: 15, mode: "study", items: [selectedPhrase] });
  }

  function renderPhrases() {
    if (selectedPhrase) {
      return (
        <section className="lx-detail-card">
          <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "phrases" })}>← Все фразы</button>
          <div className="lx-detail-content"><span>{selectedPhrase.topic}</span><h1>{selectedPhrase.prompt}</h1><strong>{selectedPhrase.answer}</strong>{selectedPhrase.cloze ? <div><small>Cloze practice</small><p>{selectedPhrase.cloze}</p></div> : null}{selectedPhrase.examples[0] ? <div><small>Рабочий пример</small><p>{selectedPhrase.examples[0]}</p></div> : null}{selectedPhrase.note ? <div><small>Как использовать</small><p>{selectedPhrase.note}</p></div> : null}<div className="lx-hero-actions"><button className="lx-button primary" type="button" onClick={startSelectedPhraseLesson}>Изучить эту фразу</button><button className="lx-button ghost" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall" })}>Повторить due-фразы</button></div></div>
        </section>
      );
    }
    return (
      <>
        <section className="lx-page-heading"><div><span>ТЕХНИЧЕСКИЕ ФРАЗЫ</span><h1>Готовые формулировки для работы</h1><p>Incident updates, architecture review, data engineering, performance и release communication. <span data-catalog-count-state={catalogMetadataStatus}>{catalogCountText(catalogMetadata, catalogMetadataStatus, "phrases", ["фраза", "фразы", "фраз"])} в каталоге.</span></p></div><div className="lx-heading-badge"><Icon name="phrases"/><span>{progress ? `${progress.duePhrases} фраз готовы к повторению` : progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загружаем очередь…" : "Очередь недоступна"}</span></div></section>
        <div className="lx-topic-filter">{phraseTopics.map((topic) => <button key={topic} type="button" className={phraseTopic === topic ? "selected" : ""} onClick={() => setPhraseTopic(topic)}>{topic === "all" ? "Все темы" : topic}</button>)}</div>
        <CatalogSortControl kind="phrases" mode={phraseSortMode} onChange={(mode) => updateCatalogSort("phrases", mode)} />
        <section className="lx-phrase-grid">{sortedVisiblePhrases.map((phrase) => <button key={itemKey(phrase)} type="button" onClick={() => navigate({ view: "phrases", detail: itemKey(phrase) })}><span>{phrase.topic}</span><strong>{phrase.prompt}</strong><small>{phrase.answer}</small><em>Открыть карточку <Icon name="arrow" size={15}/></em></button>)}</section>
        <div className="lx-page-actions"><button className="lx-button ghost" type="button" onClick={() => startLesson(session, { source: "phrases", size: "all", mode: "all", items: sortedVisiblePhrases })}>Посмотреть выбранные</button><button className="lx-button primary" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "study", items: sortedVisiblePhrases })}>Изучать выбранную тему</button></div>
      </>
    );
  }

  function renderLibrary() {
    return (
      <>
        <section className="lx-page-heading"><div><span>СЛОВАРЬ</span><h1>Материалы, организованные по учебной задаче</h1><p>{catalogSummaryText(catalogMetadata, catalogMetadataStatus)}</p></div><div className="lx-heading-badge"><Icon name="library"/><span>{progress ? `${progress.masteredWords + progress.masteredPhrases} освоено` : "Откройте раздел"}</span></div></section>
        <section className="lx-library-grid">
          {SOURCE_OPTIONS.map((option) => <button key={option.value} type="button" data-lexigo-dictionary-source={option.value} aria-label={`Открыть раздел: ${option.label}`} onClick={() => option.value === "phrases" ? navigate({ view: "phrases" }) : navigate({ view: "learn", source: option.value })}><span className={`lx-section-icon ${option.value}`}><Icon name={option.icon}/></span><strong>{option.label}</strong><small>{catalogCountText(
                      catalogMetadata,
                      catalogMetadataStatus,
                      option.value,
                      option.value === "mixed"
                        ? ["элемент", "элемента", "элементов"]
                        : option.value === "phrases"
                          ? ["фраза", "фразы", "фраз"]
                          : ["слово", "слова", "слов"],
                    )}</small><p>{option.hint}</p><em>Открыть <Icon name="arrow" size={15}/></em></button>)}
          {COLLECTIONS.map((definition) => (
            <CollectionCard
              key={definition.source}
              definition={definition}
              variant="library"
              countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["слово и термин", "слова и термина", "слов и терминов"])}
              onSelect={() => navigate({ view: "learn", source: definition.source })}
            />
          ))}
        </section>
        {session && progress ? <section className="lx-summary-panel"><div><span>Освоено слов</span><strong>{progress.masteredWords}</strong><small>{catalogMetadataStatus === "ready" && catalogMetadata ? `из ${catalogMetadata.totals.words.toLocaleString("ru-RU")}` : catalogMetadataStatus === "loading" ? "каталог загружается" : "общее количество недоступно"}</small></div><div><span>Освоено фраз</span><strong>{progress.masteredPhrases}</strong><small>{catalogMetadataStatus === "ready" && catalogMetadata ? `из ${catalogMetadata.totals.phrases.toLocaleString("ru-RU")}` : catalogMetadataStatus === "loading" ? "каталог загружается" : "общее количество недоступно"}</small></div><div><span>Due-слова</span><strong>{progress.dueWords}</strong><small>готовы сейчас</small></div><div><span>Due-фразы</span><strong>{progress.duePhrases}</strong><small>готовы сейчас</small></div></section> : null}
      </>
    );
  }

  function renderProgress() {
    if (!session) {
      return <section className="lx-empty"><span>ПРОГРЕСС</span><h1>Войдите, чтобы видеть результат обучения</h1><p>Дневная цель, due-очередь, retained items и серия синхронизируются между устройствами.</p><button className="lx-button primary" type="button" onClick={() => requestAuthentication("progress")}>Войти и открыть прогресс</button></section>;
    }
    if (!progress) {
      const problem = progressStatus.problem;
      return <section className="lx-empty"><span>ПРОГРЕСС</span><h1>{progressStatus.phase === "loading" || progressStatus.phase === "idle" ? "Загружаем прогресс…" : problem?.title ?? "Прогресс недоступен"}</h1><p>{problem?.message ?? "Данные появятся после синхронизации аккаунта."}</p>{problem?.retryable ? <button className="lx-button primary" type="button" onClick={() => void loadProgressResource(session)}>Повторить загрузку</button> : null}</section>;
    }
    const modes = normalizedProgressModes(progress);
    const cards = [
      { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% цели`, color: "purple" },
      { label: "Объективная успешность", value: `${successRate}%`, hint: `${progress.objectiveSuccessfulToday ?? progress.successfulToday} из ${progress.objectiveReviewsToday ?? progress.reviewsToday} попыток`, color: "green" },
      { label: "Retained items", value: String(progress.retainedItemsWeek), hint: `${progress.retainedWordsWeek} слов · ${progress.retainedPhrasesWeek} фраз`, color: "blue" },
      { label: "Текущая серия", value: `${progress.currentStreak} дн.`, hint: `рекорд ${progress.longestStreak}`, color: "orange" },
    ];
    return (
      <>
        <section className="lx-page-heading"><div><span>ПРОГРЕСС</span><h1>Смотрите, что действительно сохранилось</h1><p>Retained item засчитывается после повторного успешного воспроизведения.</p></div><div className="lx-heading-badge"><Icon name="progress"/><span>Следующее повторение: {nextDueLabel(progress.nextDueAt)}</span></div></section>
        <section className="lx-stat-grid">{cards.map((card) => <article key={card.label}><span>{card.label}</span><strong className={card.color}>{card.value}</strong><small>{card.hint}</small></article>)}</section>
        <section className="lx-summary-panel" aria-label="Попытки по режимам">
          <div><span>Изучение</span><strong>{modes.study.attemptsToday}</strong><small>показ ответа · не active recall</small></div>
          <div><span>Recall</span><strong>{modes.recall.successfulToday} / {modes.recall.attemptsToday}</strong><small>объективно верные сегодня</small></div>
          <div><span>Выбор варианта</span><strong>{modes.choice.successfulToday} / {modes.choice.attemptsToday}</strong><small>объективно верные сегодня</small></div>
          <div><span>Legacy</span><strong>{modes.legacy.attemptsTotal}</strong><small>исторические события без точного режима</small></div>
        </section>
        <section className="lx-progress-detail"><div className="lx-detail-main"><span>Дневная цель</span><h2>{progress.reviewsToday >= progress.dailyGoal ? "Цель выполнена" : "Продолжайте учебный цикл"}</h2><div className="lx-goal-track large"><span style={{ width: `${goalPercent(progress)}%` }}/></div><div className="lx-goal-options">{GOAL_OPTIONS.map((goal) => <button key={goal} type="button" className={progress.dailyGoal === goal ? "selected" : ""} disabled={busy} onClick={() => updateDailyGoal(goal)}>{goal}</button>)}</div></div><div className="lx-queue-list"><div><span>Слова к повторению</span><strong>{progress.dueWords}</strong></div><div><span>Фразы к повторению</span><strong>{progress.duePhrases}</strong></div><div><span>Освоено слов</span><strong>{progress.masteredWords}</strong></div><div><span>Освоено фраз</span><strong>{progress.masteredPhrases}</strong></div></div></section>
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
            <div className="lx-auth-tabs" role="tablist" aria-label="Режим аккаунта">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "login"}
                className={authMode === "login" ? "active" : ""}
                onClick={() => switchAuthMode("login")}
              >
                Вход
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={registrationMode}
                className={registrationMode ? "active" : ""}
                onClick={() => switchAuthMode("register")}
              >
                Регистрация
              </button>
            </div>
          ) : null}

          {authNotice ? <p className="lx-auth-notice" role="status" aria-live="polite">{authNotice}</p> : null}
          {authFormError ? <p className="lx-auth-form-error" role="alert">{authFormError}</p> : null}

          <form onSubmit={submitAuth} noValidate aria-label={resetMode ? "Новый пароль" : forgotMode ? "Восстановление пароля" : registrationMode ? "Регистрация" : "Вход"}>
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
    return <><section className="lx-page-heading"><div><span>ПРОФИЛЬ</span><h1>{session.user.displayName || "Ваш аккаунт"}</h1><p>Настройки обучения и синхронизация между устройствами.</p></div><div className="lx-heading-badge"><Icon name="user"/><span>{session.user.email}</span></div></section><section className="lx-profile-grid"><article><span>Email</span><strong>{session.user.email}</strong><small>используется для входа</small></article><article><span>Аккаунт создан</span><strong>{formatAccountDate(session.user.createdAt)}</strong><small>история хранится на сервере</small></article><article><span>Дневная цель</span><strong>{progress?.dailyGoal ?? 30}</strong><small>ответов в день</small></article><article><span>Активный урок</span><strong>{activeLesson ? "Есть" : "Нет"}</strong><small>{activeLesson ? sourceLabel(activeLesson.source) : "можно начать новый"}</small></article></section><section className="lx-page-actions"><button className="lx-button ghost" type="button" onClick={logout}>Выйти</button><button className="lx-button primary" type="button" onClick={() => navigate({ view: "progress" })}>Открыть прогресс</button></section></>;
  }

  function renderAllItems() {
    return (
      <section className="lx-all-items">
        <div className="lx-lesson-top"><button className="lx-button ghost" type="button" onClick={() => navigate({ view: source === "phrases" ? "phrases" : "learn", source })}>← Назад</button><strong>{items.length} элементов · {sourceLabel(source)}</strong></div>
        <CatalogSortControl kind="all-items" mode={allItemsSortMode} onChange={(mode) => updateCatalogSort("all-items", mode)} />
        <div>{sortedAllItems.map((item, index) => <article key={item.id}><span>{index + 1}</span><div><small>{item.partOfSpeech} · {item.topic}</small><h3>{item.prompt}</h3>{item.cloze ? <p>{item.cloze}</p> : null}<strong>{item.answer}</strong>{item.examples[0] ? <p>{item.examples[0]}</p> : null}</div></article>)}</div>
      </section>
    );
  }

  function renderLesson() {
    if (!lessonStarted) {
      return activeLesson
        ? <section className="lx-empty"><span>АКТИВНЫЙ УРОК</span><h1>Урок сохранён</h1><p>{sourceLabel(activeLesson.source)} · позиция {activeLesson.currentIndex + 1} из {activeLesson.items.length}</p><div className="lx-hero-actions"><button className="lx-button primary" type="button" onClick={resumeLesson}>Продолжить урок</button><button className="lx-button ghost" type="button" onClick={() => navigate({ view: "learn" })}>К настройкам</button></div></section>
        : <section className="lx-empty"><span>УРОК</span><h1>Активного урока нет</h1><p>Выберите режим, раздел и размер блока.</p><button className="lx-button primary" type="button" onClick={() => navigate({ view: "learn" })}>Настроить урок</button></section>;
    }
    if (studyMode === "all") return renderAllItems();
    if (lessonComplete) return <section className="lx-empty"><span>СЕССИЯ ЗАВЕРШЕНА</span><h1>{items.length ? "Результаты сохранены" : "Нет доступных элементов"}</h1><p>{items.length ? `Знал: ${lessonSummary.known}. Почти: ${lessonSummary.almost}. Не знал: ${lessonSummary.again}. Пропущено: ${Math.max(lessonSummary.skipped, serverSkippedItems)}.` : "Измените раздел или дождитесь следующего интервала."}</p><div className="lx-hero-actions"><button className="lx-button ghost" type="button" onClick={() => { clearLessonState(); navigate({ view: "progress" }); }}>К прогрессу</button><button className="lx-button primary" type="button" disabled={busy} onClick={() => startLesson()}>Следующий блок</button></div></section>;
    if (!currentItem) return null;

    const lessonPercent = Math.round(((currentIndex + 1) / items.length) * 100);
    const remaining = Math.max(0, items.length - ratingValues.length);
    const relatedItems = items.filter((item) => item.id !== currentItem.id && Boolean(ratings[item.id])).slice(0, 3);
    const advanceDecision = decideLessonAdvance({
      currentIndex,
      itemCount: items.length,
      reviewPersisted: Boolean(currentRating),
      reviewSaving: reviewing,
      serverCompleted: serverLessonCompleted,
      serverNextIndex,
    });
    const phraseCloze = currentItem.kind === "phrase" && currentItem.cloze;
    const simpleStudy = studyMode === "study";

    return (
      <section className="lx-lesson-page">
        <div className="lx-lesson-progress"><strong>{currentItem.kind === "phrase" ? "Фраза" : "Слово"} {currentIndex + 1} из {items.length}</strong><div className="lx-goal-track"><span style={{ width: `${lessonPercent}%` }}/></div><span>{lessonPercent}% урока</span><button className="lx-button ghost" type="button" onClick={saveAndExitLesson}>Сохранить и выйти</button></div>
        <div className="lx-lesson-layout">
          <main className="lx-study-column" data-study-view={studyView}>
            <div className="lx-study-tabs" role="tablist" aria-label="Представление учебной карточки">
              {STUDY_TABS.map((tab) => {
                const selected = studyView === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    className={selected ? "active" : ""}
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setStudyView(tab.value)}
                    onKeyDown={(event) => handleStudyTabKeyDown(event, tab.value)}
                  >
                    <Icon name={tab.icon}/>{tab.label}
                  </button>
                );
              })}
            </div>
            <article className={`lx-main-word-card ${simpleStudy ? "simple" : "test"}`}>
              <div className="lx-word-header"><div><span>{currentItem.kind === "phrase" ? "Техническая фраза" : currentItem.partOfSpeech}</span><small>{currentItem.topic || "Общая лексика"}</small></div><b>{currentRating ? ratingLabel(currentRating) : currentItem.status === "new" ? "Новое" : "Повторение"}</b></div>
              {simpleStudy ? (
                <div className="lx-simple-word">
                  <div className="lx-word-title-row"><div><h1>{currentItem.prompt}</h1>{currentItem.phonetic ? <p>{currentItem.phonetic}</p> : null}</div><button type="button" className={speakingText === currentItem.prompt ? "speaking" : ""} aria-label={`${speakingText === currentItem.prompt ? "Остановить произношение" : "Произнести"}: ${currentItem.prompt}`} onClick={() => pronounceText(currentItem.prompt)}><Icon name="volume"/></button></div>
                  <dl><dt>Перевод</dt><dd>{currentItem.answer}</dd>{currentItem.examples[0] ? <><dt>Пример</dt><dd className="example">{currentItem.examples[0]}</dd></> : null}{currentItem.note ? <><dt>Примечание</dt><dd className="note">{currentItem.note}</dd></> : null}</dl>
                  {currentItem.cloze ? <div className="lx-cloze-note"><span>Тренировка пропуска</span><strong>{currentItem.cloze}</strong></div> : null}
                </div>
              ) : (
                <div className="lx-test-word">
                  {phraseCloze && !revealed ? <><span>ВОССТАНОВИТЕ АНГЛИЙСКИЙ ПРОПУСК</span><h1>{currentItem.cloze}</h1></> : <><span>{currentItem.kind === "phrase" ? "ТЕХНИЧЕСКАЯ ФРАЗА" : "ПЕРЕВЕДИТЕ СЛОВО"}</span><h1>{currentItem.prompt}</h1>{currentItem.phonetic ? <p>{currentItem.phonetic}</p> : null}</>}
                  {!revealed && studyMode === "recall" ? <div className="lx-recall-box"><label htmlFor="premium-answer">{exercisePromptLabel(currentItem)}</label><input id="premium-answer" value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && typedAnswer.trim()) setRevealed(true); }} placeholder={currentItem.kind === "phrase" ? "Например: root" : "Ваш ответ"} autoComplete="off"/><div><button className="lx-button ghost" type="button" onClick={() => setShowChoices((value) => !value)}>{showChoices ? "Скрыть варианты" : "Показать варианты"}</button><button className="lx-button primary" type="button" onClick={() => setRevealed(true)}>{typedAnswer.trim() ? "Сверить ответ" : "Показать ответ"}</button></div></div> : null}
                  {!revealed && showChoices ? <div className="lx-answer-grid">{answerOptions.map((answer) => <button key={answer} type="button" onClick={() => { setSelectedAnswer(answer); setRevealed(true); }}>{answer}</button>)}</div> : null}
                  {revealed ? <div className="lx-answer-reveal">{currentItem.kind === "phrase" ? <><h2>{currentItem.prompt}</h2><span>Пропуск: {expectedAnswer}</span></> : null}<strong>{currentItem.answer}</strong>{typedAnswer.trim() ? <p className={literalMatch ? "success" : "error"}>{literalMatch ? "Ответ совпал." : `Ваш ответ: ${typedAnswer}. Правильно: ${expectedAnswer}`}</p> : null}{selectedAnswer ? <p className={normalizeAnswer(selectedAnswer) === normalizeAnswer(expectedAnswer) ? "success" : "error"}>{normalizeAnswer(selectedAnswer) === normalizeAnswer(expectedAnswer) ? "Верный вариант." : `Вы выбрали: ${selectedAnswer}. Правильно: ${expectedAnswer}`}</p> : null}{currentItem.examples[0] ? <blockquote>{currentItem.examples[0]}</blockquote> : null}{currentItem.note ? <small>{currentItem.note}</small> : null}</div> : null}
                </div>
              )}
            </article>

            <div className="lx-lesson-navigation"><button className="lx-button ghost" type="button" disabled title="Активный урок проходит в серверном порядке">← Предыдущее недоступно</button><button className="lx-button primary wide" type="button" disabled={!advanceDecision.canAdvance} onClick={nextItem}>{advanceDecision.label} <Icon name="arrow"/></button></div>

            {(simpleStudy || revealed) ? currentRating ? <div className="lx-rating-row" role="status"><span>Оценка сохранена: {ratingLabel(currentRating)}. Используйте единственную кнопку перехода выше.</span></div> : <div className="lx-rating-row" aria-busy={reviewing}><span>Насколько уверенно вы знаете элемент?</span><div><button className="again" type="button" disabled={reviewing} data-rating="again" onClick={handleRatingClick}>Не знал</button><button className="almost" type="button" disabled={reviewing} data-rating="almost" onClick={handleRatingClick}>Почти</button><button className="known" type="button" disabled={reviewing} data-rating="known" onClick={handleRatingClick}>{reviewing ? "Сохраняем…" : "Знал"}</button></div></div> : null}

            {relatedItems.length ? <section className="lx-related"><div><span>Уже оценённые элементы</span><small>Просмотр доступен после завершения урока</small></div><div>{relatedItems.map((item) => <article key={item.id} aria-label={`${item.prompt}: уже оценено`}><strong>{item.prompt}</strong><small>{item.answer}</small><span>Сохранено</span></article>)}</div></section> : null}
          </main>

          <aside className="lx-lesson-stats">
            <h2>Статистика урока</h2>
            <div><span className="purple"><Icon name="spark"/></span><p>Новые элементы<strong>{items.filter((item) => item.status === "new").length}</strong></p></div>
            <div><span className="orange"><Icon name="repeat"/></span><p>На повторении<strong>{items.filter((item) => item.status !== "new").length}</strong></p></div>
            <div><span className="green"><Icon name="check"/></span><p>Оценено<strong>{ratingValues.length}</strong></p></div>
            <div><span className="blue"><Icon name="clock"/></span><p>Осталось<strong>{remaining}</strong></p></div>
            <button type="button" onClick={() => navigate({ view: "progress" })}><Icon name="bolt"/><span><strong>Продолжайте</strong><small>Каждая оценка обновляет вашу интервальную очередь.</small></span><Icon name="arrow" size={16}/></button>
          </aside>
        </div>
      </section>
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
    <main className="lx-app">
      {renderHeader()}
      {error ? <p className="lx-error" role="alert">{error}</p> : null}
      {session ? <div className="lx-resource-stack">
        {navigation.view !== "progress" ? <AccountResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgressResource(session)} /> : null}
        <AccountResourceNotice label="Каталог фраз" status={phraseCatalogStatus} onRetry={() => void loadPhraseCatalogResource(session)} />
        <AccountResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLessonResource(session)} />
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
      <nav className="lx-mobile-nav" aria-label="Мобильная навигация">
        {PRIMARY_NAVIGATION.map((entry) => <button key={entry.view} type="button" className={navigation.view === entry.view ? "active" : ""} onClick={() => navigate({ view: entry.view })}><Icon name={navigationIcon(entry.view)}/><span>{entry.shortLabel}</span></button>)}
      </nav>
      {speechNotice ? <div className={`lx-speech-toast visible${speechNotice.error ? " error" : ""}`} role="status">{speechNotice.message}</div> : null}
    </main>
  );
}
