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
  lesson@riorityDescription,
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
  { value: "mixed", label: "Смешанн