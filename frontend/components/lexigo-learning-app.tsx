"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiUrl } from "../lib/api";
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
  type AppView,
  type NavigationTarget,
  viewTitle,
} from "../lib/navigation";
import {
  goalPercent,
  ratingLabel,
  type AnswerMode,
  type ProgressSummary,
  type ReviewRating,
} from "../lib/progress";
import { TECHNICAL_PHRASES } from "../lib/technical-phrases";

type User = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

type Session = {
  user: User;
  tokens: TokenPair;
};

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

type LessonSessionResponse = {
  id: string;
  source: LessonSource;
  studyMode: AnswerMode;
  lessonSize: string;
  currentIndex: number;
  status: "active" | "completed" | "discarded";
  items: LessonItemResponse[];
  createdAt: string;
  updatedAt: string;
};

type LessonReviewResponse = {
  lessonId: string;
  lessonCurrentIndex: number;
  lessonCompleted: boolean;
};

type ErrorResponse = {
  error?: { message?: string };
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

const SESSION_KEY = "lexigo.session.v1";

const SOURCE_OPTIONS: Array<{ value: LessonSource; label: string; hint: string }> = [
  { value: "mixed", label: "Смешанный", hint: "Чередование частей речи и контекстов" },
  { value: "noun", label: "Существительные", hint: "Системы, объекты, метрики и понятия" },
  { value: "verb", label: "Глаголы", hint: "Действия, процессы и рабочие операции" },
  { value: "adjective", label: "Прилагательные", hint: "Состояния, свойства и характеристики" },
  { value: "phrases", label: "Технические фразы", hint: "Cloze practice и рабочие chunks" },
];

const LIBRARY_SECTIONS: Array<{ value: WordSection; label: string; count: number; description: string }> = [
  { value: "mixed", label: "Весь словарь", count: 579, description: "Все части речи с чередованием" },
  { value: "noun", label: "Существительные", count: 183, description: "Архитектура, данные и инфраструктура" },
  { value: "verb", label: "Глаголы", count: 159, description: "Действия, процессы и коммуникация" },
  { value: "adjective", label: "Прилагательные", count: 193, description: "Свойства систем и результатов" },
];

const SIZE_OPTIONS: Array<{ value: LessonSize; label: string }> = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 60, label: "60" },
  { value: "all", label: "Все" },
];

const MODE_OPTIONS: Array<{ value: StudyMode; label: string; hint: string }> = [
  { value: "recall", label: "Вспомнить самому", hint: "Основной active recall режим" },
  { value: "choice", label: "Выбрать вариант", hint: "Поддержка для новых элементов" },
  { value: "all", label: "Все и сразу", hint: "Справочник без изменения прогресса" },
];

const GOAL_OPTIONS = [15, 30, 60];

class APIError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function requestJSON<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(apiUrl(path), { ...init, headers });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as ErrorResponse;
      message = payload.error?.message ?? message;
    } catch {
      // Preserve HTTP status when an upstream response is not JSON.
    }
    throw new APIError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function authorizedRequest<T>(current: Session, path: string, init: RequestInit = {}): Promise<AuthorizedResult<T>> {
  try {
    return { activeSession: current, data: await requestJSON<T>(path, init, current.tokens.accessToken) };
  } catch (requestError) {
    if (!(requestError instanceof APIError) || requestError.status !== 401) throw requestError;
    const tokens = await requestJSON<TokenPair>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),
    });
    const refreshed = { ...current, tokens };
    storeSession(refreshed);
    return { activeSession: refreshed, data: await requestJSON<T>(path, init, refreshed.tokens.accessToken) };
  }
}

function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function storeSession(session: Session | null) {
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

function toLearningItem(item: APIItem): LearningItem {
  const kind = item.kind === "phrase" || item.partOfSpeech.toLowerCase() === "phrase" ? "phrase" : "word";
  const fallback = kind === "phrase"
    ? TECHNICAL_PHRASES.find((phrase) => phrase.id === item.slug || phrase.prompt === item.lemma)
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

function sourceLabel(source: LessonSource): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source;
}

function formatAccountDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function LexigoLearningApp() {
  const [navigation, setNavigation] = useState<NavigationTarget>({ view: "home" });
  const [returnView, setReturnView] = useState<AppView>("home");
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [hydratedUserID, setHydratedUserID] = useState("");
  const [phraseCatalog, setPhraseCatalog] = useState<LearningItem[]>(TECHNICAL_PHRASES);

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [source, setSource] = useState<LessonSource>("mixed");
  const [lessonSize, setLessonSize] = useState<LessonSize>(30);
  const [studyMode, setStudyMode] = useState<StudyMode>("recall");
  const [phraseTopic, setPhraseTopic] = useState("all");

  const [items, setItems] = useState<LearningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [ratings, setRatings] = useState<Record<string, ReviewRating>>({});
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const cardStartedAt = useRef(Date.now());

  useEffect(() => {
    const syncNavigation = () => {
      const next = parseNavigation(window.location.search);
      setNavigation(next);
      if (next.source) setSource(next.source);
    };
    syncNavigation();
    window.addEventListener("popstate", syncNavigation);
    const timer = window.setTimeout(() => setSession(readSession()), 0);
    return () => {
      window.removeEventListener("popstate", syncNavigation);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);

  useEffect(() => {
    if (!session || hydratedUserID === session.user.id) return;
    let cancelled = false;
    void hydrateAccount(session).then(() => {
      if (!cancelled) setHydratedUserID(session.user.id);
    });
    return () => {
      cancelled = true;
    };
  }, [session, hydratedUserID]);

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
  const ratingValues = Object.values(ratings);
  const knownCount = ratingValues.filter((rating) => rating === "known").length;
  const almostCount = ratingValues.filter((rating) => rating === "almost").length;
  const againCount = ratingValues.filter((rating) => rating === "again").length;
  const successRate = progress && progress.reviewsToday > 0
    ? Math.round((progress.successfulToday / progress.reviewsToday) * 100)
    : 0;
  const phraseTopics = useMemo(
    () => ["all", ...Array.from(new Set(phraseCatalog.map((phrase) => phrase.topic)))],
    [phraseCatalog],
  );
  const visiblePhrases = useMemo(
    () => phraseTopic === "all" ? phraseCatalog : phraseCatalog.filter((phrase) => phrase.topic === phraseTopic),
    [phraseCatalog, phraseTopic],
  );
  const selectedPhrase = navigation.detail
    ? phraseCatalog.find((phrase) => itemKey(phrase) === navigation.detail)
      ?? TECHNICAL_PHRASES.find((phrase) => phrase.id === navigation.detail)
    : undefined;

  function navigate(target: NavigationTarget, replace = false) {
    const url = navigationURL(target);
    if (replace) window.history.replaceState({ lexigo: true, ...target }, "", url);
    else window.history.pushState({ lexigo: true, ...target }, "", url);
    setNavigation(target);
    if (target.source) setSource(target.source);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function requestAuthentication(afterLogin: AppView) {
    setReturnView(afterLogin);
    navigate({ view: "profile" });
  }

  async function loadItems(activeSession: Session, kind: "word" | "phrase", dueOnly: boolean) {
    const endpoint = dueOnly ? "/api/v1/words/due" : "/api/v1/words";
    const result = await authorizedRequest<ItemsResponse>(
      activeSession,
      `${endpoint}?kind=${kind}&limit=1000`,
    );
    return { activeSession: result.activeSession, items: result.data.items.map(toLearningItem) };
  }

  async function hydrateAccount(activeSession: Session) {
    setError("");
    try {
      const progressResult = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
      );
      let currentSession = progressResult.activeSession;
      setProgress(progressResult.data);

      const phrasesResult = await loadItems(currentSession, "phrase", false);
      currentSession = phrasesResult.activeSession;
      setPhraseCatalog(phrasesResult.items);

      try {
        const lessonResult = await authorizedRequest<LessonSessionResponse>(currentSession, "/api/v1/lessons/active");
        currentSession = lessonResult.activeSession;
        setActiveLesson(lessonResult.data);
      } catch (lessonError) {
        if (lessonError instanceof APIError && lessonError.status === 404) setActiveLesson(null);
        else throw lessonError;
      }

      setSession(currentSession);
      storeSession(currentSession);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить данные аккаунта");
    }
  }

  async function refreshProgress(activeSession: Session): Promise<Session> {
    const result = await authorizedRequest<ProgressSummary>(
      activeSession,
      `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
    );
    setSession(result.activeSession);
    storeSession(result.activeSession);
    setProgress(result.data);
    return result.activeSession;
  }

  function resetCardState(mode = studyMode, rated = false) {
    setRevealed(rated);
    setShowChoices(!rated && mode === "choice");
    setSelectedAnswer("");
    setTypedAnswer("");
    cardStartedAt.current = Date.now();
  }

  function applyLesson(lesson: LessonSessionResponse) {
    const lessonItems = lesson.items.map(toLearningItem);
    const restoredRatings: Record<string, ReviewRating> = {};
    lesson.items.forEach((item, index) => {
      if (item.rating && lessonItems[index]) restoredRatings[lessonItems[index].id] = item.rating;
    });
    const safeIndex = Math.min(Math.max(lesson.currentIndex, 0), Math.max(lessonItems.length - 1, 0));
    setActiveLesson(lesson);
    setSource(lesson.source);
    setStudyMode(lesson.studyMode);
    setLessonSize(lessonSizeFromAPI(lesson.lessonSize));
    setItems(lessonItems);
    setRatings(restoredRatings);
    setCurrentIndex(safeIndex);
    resetCardState(lesson.studyMode, Boolean(lessonItems[safeIndex] && restoredRatings[lessonItems[safeIndex].id]));
    setLessonComplete(lessonItems.length === 0);
    setLessonStarted(true);
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
      storeSession(result.activeSession);
      applyLesson(result.data);
      navigate({ view: "lesson", source: result.data.source });
    } catch (requestError) {
      if (requestError instanceof APIError && requestError.status === 404) {
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
      const result = await authorizedRequest<void>(session, `/api/v1/lessons/${activeLesson.id}`, { method: "DELETE" });
      setSession(result.activeSession);
      storeSession(result.activeSession);
      setActiveLesson(null);
      clearLessonState();
      navigate({ view: "learn" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сбросить урок");
    } finally {
      setBusy(false);
    }
  }

  function resolveSelectedPhrases(requested: LearningItem[]): LearningItem[] {
    const requestedKeys = new Set(requested.map(itemKey));
    return phraseCatalog.filter((phrase) => requestedKeys.has(itemKey(phrase)));
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
    try {
      let available: LearningItem[];
      let currentSession = activeSession;

      if (resolvedMode === "all" && resolvedSource === "phrases") {
        available = overrides.items ?? phraseCatalog;
      } else if (resolvedSource === "phrases") {
        if (overrides.items?.length) {
          available = resolveSelectedPhrases(overrides.items);
        } else {
          const result = await loadItems(currentSession as Session, "phrase", true);
          currentSession = result.activeSession;
          available = result.items;
        }
      } else {
        const result = await loadItems(currentSession as Session, "word", true);
        currentSession = result.activeSession;
        available = prepareWordItems(result.items, resolvedSource);
      }

      const lessonItems = takeLessonBlock(available, resolvedSize);
      if (resolvedMode !== "all" && lessonItems.length > 0) {
        const result = await authorizedRequest<LessonSessionResponse>(
          currentSession as Session,
          "/api/v1/lessons",
          {
            method: "POST",
            body: JSON.stringify({
              source: resolvedSource,
              studyMode: resolvedMode,
              lessonSize: String(resolvedSize),
              wordIds: lessonItems.map((item) => item.wordId),
            }),
          },
        );
        setSession(result.activeSession);
        storeSession(result.activeSession);
        applyLesson(result.data);
      } else {
        setActiveLesson(null);
        setItems(lessonItems);
        setCurrentIndex(0);
        setRatings({});
        resetCardState(resolvedMode);
        setLessonStarted(true);
        setLessonComplete(lessonItems.length === 0);
      }
      navigate({ view: "lesson", source: resolvedSource });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сформировать учебный блок");
    } finally {
      setBusy(false);
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const authenticated = await requestJSON<Session>(`/api/v1/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify({ email, password, ...(authMode === "register" ? { displayName } : {}) }),
      });
      setSession(authenticated);
      storeSession(authenticated);
      setPassword("");
      setHydratedUserID("");
      await hydrateAccount(authenticated);
      setHydratedUserID(authenticated.user.id);
      navigate({ view: returnView === "profile" ? "home" : returnView });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось выполнить вход");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const current = session;
    setSession(null);
    setProgress(null);
    setActiveLesson(null);
    setPhraseCatalog(TECHNICAL_PHRASES);
    setHydratedUserID("");
    storeSession(null);
    clearLessonState();
    navigate({ view: "home" });
    if (!current) return;
    try {
      await requestJSON<void>("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),
      });
    } catch {
      // Local logout is complete even if token revocation is temporarily unavailable.
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
      storeSession(result.activeSession);
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
    setError("");
  }

  function saveAndExitLesson() {
    clearLessonState();
    navigate({ view: "home" });
  }

  function moveToIndex(index: number) {
    const target = items[index];
    setCurrentIndex(index);
    resetCardState(studyMode, Boolean(target && ratings[target.id]));
  }

  function previousItem() {
    if (currentIndex === 0) {
      saveAndExitLesson();
      return;
    }
    moveToIndex(currentIndex - 1);
  }

  function nextItem() {
    if (currentIndex + 1 >= items.length) {
      setLessonComplete(true);
      if (session) void refreshProgress(session).catch(() => undefined);
      return;
    }
    moveToIndex(currentIndex + 1);
  }

  async function rateCurrent(rating: ReviewRating) {
    if (!currentItem || currentRating) return;
    if (!session || currentItem.wordId === undefined) {
      requestAuthentication("lesson");
      return;
    }
    setReviewing(true);
    setError("");
    try {
      const correct = selectedAnswer
        ? normalizeAnswer(selectedAnswer) === normalizeAnswer(expectedAnswer)
        : typedAnswer.trim()
          ? literalMatch
          : undefined;
      const path = activeLesson
        ? `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`
        : `/api/v1/words/${currentItem.wordId}/review`;
      const result = await authorizedRequest<LessonReviewResponse>(session, path, {
        method: "POST",
        body: JSON.stringify({
          rating,
          responseMs: Math.max(0, Date.now() - cardStartedAt.current),
          answerMode: studyMode === "choice" ? "choice" : "recall",
          correct,
          timezoneOffsetMinutes: timezoneOffsetMinutes(),
        }),
      });
      setSession(result.activeSession);
      storeSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      if (activeLesson) {
        if (result.data.lessonCompleted) setActiveLesson(null);
        else setActiveLesson((current) => current ? { ...current, currentIndex: result.data.lessonCurrentIndex } : current);
      }
      await refreshProgress(result.activeSession);
      nextItem();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
    } finally {
      setReviewing(false);
    }
  }

  function renderResumePanel() {
    if (!session || !activeLesson || lessonStarted) return null;
    return (
      <section className="setup-panel resume-panel">
        <div className="section-heading">
          <div><p className="eyebrow">НЕЗАВЕРШЁННЫЙ УРОК</p><h2>Продолжите с сохранённой позиции</h2></div>
          <p>{sourceLabel(activeLesson.source)} · {activeLesson.studyMode === "recall" ? "active recall" : "варианты"}</p>
        </div>
        <div className="progress-wrap">
          <div className="progress-meta"><span>{Math.min(activeLesson.currentIndex + 1, activeLesson.items.length)} из {activeLesson.items.length}</span><span>{activeLesson.items.filter((item) => item.rating).length} оценено</span></div>
          <div className="progress-track"><span style={{ width: `${activeLesson.items.length ? (activeLesson.currentIndex / activeLesson.items.length) * 100 : 0}%` }} /></div>
        </div>
        <div className="setup-actions"><button className="secondary-button" type="button" disabled={busy} onClick={discardActiveLesson}>Сбросить</button><button className="primary-button large-button" type="button" disabled={busy} onClick={resumeLesson}>Продолжить урок</button></div>
      </section>
    );
  }

  function renderHome() {
    const dashboard = session && progress
      ? [
          { label: "К повторению", value: String(progress.dueNow), hint: `${progress.dueWords} слов · ${progress.duePhrases} фраз`, target: { view: "learn" } as NavigationTarget },
          { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% цели`, target: { view: "progress" } as NavigationTarget },
          { label: "Retained за неделю", value: String(progress.retainedItemsWeek), hint: `${progress.retainedPhrasesWeek} технических фраз`, target: { view: "progress" } as NavigationTarget },
          { label: "Освоено", value: String(progress.masteredWords + progress.masteredPhrases), hint: `${progress.masteredWords} слов · ${progress.masteredPhrases} фраз`, target: { view: "library" } as NavigationTarget },
        ]
      : [
          { label: "Словарь", value: "579", hint: "технических и академических слов", target: { view: "library" } as NavigationTarget },
          { label: "Технические фразы", value: String(TECHNICAL_PHRASES.length), hint: "с постоянным прогрессом после входа", target: { view: "phrases" } as NavigationTarget },
          { label: "Первый урок", value: "30", hint: "рекомендуемый блок", target: { view: "learn" } as NavigationTarget },
          { label: "Прогресс", value: "—", hint: "синхронизируется между устройствами", target: { view: "profile" } as NavigationTarget },
        ];
    return (
      <>
        <section className="product-hero">
          <div><p className="eyebrow">TECHNICAL ENGLISH TRAINER</p><h1>Английский, который нужен в работе</h1><p className="subtitle">Слова и технические фразы используют одну интервальную очередь и сохраняются между устройствами.</p><div className="hero-actions"><button className="primary-button large-button" type="button" onClick={() => navigate({ view: "learn" })}>Начать обучение</button><button className="secondary-button large-button" type="button" onClick={() => navigate({ view: "phrases" })}>Открыть фразы</button></div></div>
          <div className="hero-roadmap"><span>Следующий полезный шаг</span><strong>{activeLesson ? "Продолжить сохранённый урок" : progress?.duePhrases ? `Повторить ${progress.duePhrases} технических фраз` : "Собрать короткий учебный блок"}</strong><small>Открытие карточки не засчитывается. Прогресс меняется только после ответа и оценки.</small></div>
        </section>
        <section className="grid" aria-label="Прогресс и быстрые переходы">{dashboard.map((card) => <button className="card interactive-card" type="button" key={card.label} onClick={() => navigate(card.target)}><span>{card.label}</span><strong>{card.value}</strong><small>{card.hint}</small><em>Открыть →</em></button>)}</section>
        {renderResumePanel()}
        <section className="phrases-panel"><div className="section-heading"><div><p className="eyebrow">TECHNICAL PHRASES</p><h2>Рабочие chunks с интервальными повторениями</h2></div><p>После входа каждая оценка сохраняется в PostgreSQL и назначает следующую дату повторения.</p></div><div className="phrase-preview-grid">{phraseCatalog.slice(0, 6).map((phrase) => <button className="phrase-preview phrase-button" type="button" key={itemKey(phrase)} onClick={() => navigate({ view: "phrases", detail: itemKey(phrase) })}><span>{phrase.topic}</span><strong>{phrase.prompt}</strong><small>{phrase.answer}</small><em>Подробнее →</em></button>)}</div></section>
      </>
    );
  }

  function renderLearn() {
    return (
      <>
        <section className="view-heading"><div><p className="eyebrow">ОБУЧЕНИЕ</p><h1>Соберите урок под текущую задачу</h1></div><p>Для фраз active recall означает восстановление английского пропуска. Для слов — воспроизведение перевода или смысла.</p></section>
        {renderResumePanel()}
        <section className="setup-panel">
          <div className="section-heading"><div><p className="eyebrow">НОВЫЙ УРОК</p><h2>Раздел, объём и формат</h2></div><p>Оценённые слова и фразы попадут в одну персональную интервальную очередь.</p></div>
          <fieldset className="option-group"><legend>Раздел</legend><div className="source-grid">{SOURCE_OPTIONS.map((option) => <button key={option.value} type="button" className={`option-card ${source === option.value ? "selected" : ""}`} onClick={() => setSource(option.value)}><strong>{option.label}</strong><span>{option.hint}</span></button>)}</div></fieldset>
          <div className="lesson-controls">
            <fieldset className="option-group compact-group"><legend>Размер блока</legend><div className="segmented-control">{SIZE_OPTIONS.map((option) => <button key={String(option.value)} type="button" className={lessonSize === option.value ? "selected" : ""} onClick={() => setLessonSize(option.value)}>{option.label}</button>)}</div></fieldset>
            <fieldset className="option-group mode-group"><legend>Формат</legend><div className="mode-options">{MODE_OPTIONS.map((option) => <button key={option.value} type="button" className={studyMode === option.value ? "selected" : ""} onClick={() => setStudyMode(option.value)}><strong>{option.label}</strong><span>{option.hint}</span></button>)}</div></fieldset>
          </div>
          <div className="setup-actions"><p>{session && progress ? `${source === "phrases" ? progress.duePhrases : progress.dueWords} элементов доступны сейчас.` : studyMode === "all" && source === "phrases" ? "Каталог можно открыть без входа; сохранение оценок требует аккаунт." : "Для сохранения прогресса требуется вход."}</p><button className="primary-button large-button" type="button" disabled={busy} onClick={() => startLesson()}>{busy ? "Формируем…" : studyMode === "all" ? "Открыть список" : "Начать урок"}</button></div>
        </section>
      </>
    );
  }

  function renderPhrases() {
    if (selectedPhrase) {
      return (
        <section className="phrase-detail-panel"><button className="secondary-button" type="button" onClick={() => navigate({ view: "phrases" })}>← Все фразы</button><div className="phrase-detail-content"><p className="eyebrow">{selectedPhrase.topic}</p><h1>{selectedPhrase.prompt}</h1><strong>{selectedPhrase.answer}</strong>{selectedPhrase.cloze ? <div className="detail-callout"><span>Cloze practice</span><p>{selectedPhrase.cloze}</p><small>Ожидаемый тип ответа: недостающий английский фрагмент.</small></div> : null}{selectedPhrase.examples[0] ? <div className="detail-callout"><span>Рабочий пример</span><p>{selectedPhrase.examples[0]}</p></div> : null}{selectedPhrase.note ? <div className="detail-callout"><span>Как использовать</span><p>{selectedPhrase.note}</p></div> : null}<div className="hero-actions"><button className="primary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: 15, mode: "recall", items: [selectedPhrase] })}>Потренировать эту фразу</button><button className="secondary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall" })}>Повторить due-фразы</button></div></div></section>
      );
    }
    return (
      <>
        <section className="view-heading"><div><p className="eyebrow">TECHNICAL PHRASES</p><h1>Формулировки для реальной технической работы</h1></div><p>{session ? "Статусы и интервалы синхронизируются с аккаунтом." : "Каталог доступен без входа; оценки сохраняются после авторизации."}</p></section>
        <div className="topic-filter" aria-label="Темы технических фраз">{phraseTopics.map((topic) => <button type="button" key={topic} className={phraseTopic === topic ? "selected" : ""} onClick={() => setPhraseTopic(topic)}>{topic === "all" ? "Все темы" : topic}</button>)}</div>
        <section className="phrase-catalog-grid">{visiblePhrases.map((phrase) => <button className="phrase-preview phrase-button" type="button" key={itemKey(phrase)} onClick={() => navigate({ view: "phrases", detail: itemKey(phrase) })}><span>{phrase.topic}</span><strong>{phrase.prompt}</strong><small>{phrase.answer}</small><em>{session ? `${phrase.status === "new" ? "Новая" : phrase.status} · ` : ""}Открыть →</em></button>)}</section>
        <div className="catalog-actions"><button className="secondary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: "all", mode: "all", items: visiblePhrases })}>Посмотреть выбранные</button><button className="primary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall", items: visiblePhrases })}>Тренировать тему</button></div>
      </>
    );
  }

  function renderLibrary() {
    return (
      <>
        <section className="view-heading"><div><p className="eyebrow">БИБЛИОТЕКА</p><h1>579 слов и {progress?.totalPhrases ?? TECHNICAL_PHRASES.length} технических фраз</h1></div><p>Контент разделён явно, а дневная цель и retained metric учитывают оба типа learning items.</p></section>
        <section className="library-grid">{LIBRARY_SECTIONS.map((section) => <button type="button" key={section.value} onClick={() => navigate({ view: "learn", source: section.value })}><span>{section.count}</span><strong>{section.label}</strong><small>{section.description}</small><em>Собрать урок →</em></button>)}<button type="button" onClick={() => navigate({ view: "phrases" })}><span>{progress?.totalPhrases ?? TECHNICAL_PHRASES.length}</span><strong>Технические фразы</strong><small>Сценарии, cloze и интервалы</small><em>Открыть каталог →</em></button></section>
        {session && progress ? <section className="setup-panel"><div className="section-heading"><div><p className="eyebrow">СОСТОЯНИЕ</p><h2>Освоение контента</h2></div><p>Слова и фразы показаны отдельно, чтобы рост одной категории не скрывал другую.</p></div><div className="grid"><article className="card"><span>Освоено слов</span><strong>{progress.masteredWords}</strong><small>из {progress.totalWords}</small></article><article className="card"><span>Освоено фраз</span><strong>{progress.masteredPhrases}</strong><small>из {progress.totalPhrases}</small></article><article className="card"><span>Due-слова</span><strong>{progress.dueWords}</strong><small>готовы сейчас</small></article><article className="card"><span>Due-фразы</span><strong>{progress.duePhrases}</strong><small>готовы сейчас</small></article></div></section> : null}
      </>
    );
  }

  function renderProgress() {
    if (!session || !progress) return <section className="empty-state-panel"><p className="eyebrow">ПРОГРЕСС</p><h1>Прогресс привязан к аккаунту</h1><p>Войдите, чтобы видеть интервалы слов и технических фраз на всех устройствах.</p><button className="primary-button" type="button" onClick={() => requestAuthentication("progress")}>Войти</button></section>;
    const cards = [
      { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% цели` },
      { label: "Успешность", value: `${successRate}%`, hint: `${progress.successfulToday} успешных ответов` },
      { label: "Retained items", value: String(progress.retainedItemsWeek), hint: `${progress.retainedWordsWeek} слов · ${progress.retainedPhrasesWeek} фраз` },
      { label: "Текущая серия", value: `${progress.currentStreak} дн.`, hint: `рекорд ${progress.longestStreak}` },
    ];
    return (
      <>
        <section className="view-heading"><div><p className="eyebrow">ПРОГРЕСС</p><h1>Измеряем повторно воспроизведённые знания</h1></div><p>Retained item засчитывается, когда слово или фраза успешно вспоминаются снова после более раннего успешного review.</p></section>
        <section className="grid progress-grid">{cards.map((card) => <article className="card" key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.hint}</small></article>)}</section>
        <section className="setup-panel"><div className="section-heading"><div><p className="eyebrow">ДНЕВНАЯ ЦЕЛЬ</p><h2>{progress.reviewsToday >= progress.dailyGoal ? "Цель выполнена" : "Продолжайте учебный цикл"}</h2></div><p>Слова и фразы учитываются одинаково только после оценки.</p></div><div className="progress-wrap"><div className="progress-meta"><span>{progress.reviewsToday} ответов</span><span>{progress.dailyGoal} цель</span></div><div className="progress-track"><span style={{ width: `${goalPercent(progress)}%` }} /></div></div><fieldset className="option-group compact-group"><legend>Изменить цель</legend><div className="segmented-control">{GOAL_OPTIONS.map((goal) => <button key={goal} type="button" className={progress.dailyGoal === goal ? "selected" : ""} disabled={busy} onClick={() => updateDailyGoal(goal)}>{goal}</button>)}</div></fieldset></section>
        <section className="setup-panel"><div className="section-heading"><div><p className="eyebrow">ОЧЕРЕДЬ</p><h2>{progress.dueNow ? `${progress.dueNow} элементов готовы сейчас` : "Очередь пуста"}</h2></div><p>Следующее повторение: {nextDueLabel(progress.nextDueAt)}</p></div><div className="grid"><article className="card"><span>Слова</span><strong>{progress.dueWords}</strong><small>due сейчас</small></article><article className="card"><span>Фразы</span><strong>{progress.duePhrases}</strong><small>due сейчас</small></article><article className="card"><span>Освоено слов</span><strong>{progress.masteredWords}</strong><small>из {progress.totalWords}</small></article><article className="card"><span>Освоено фраз</span><strong>{progress.masteredPhrases}</strong><small>из {progress.totalPhrases}</small></article></div></section>
      </>
    );
  }

  function renderProfile() {
    if (!session) return <section className="auth-panel profile-auth"><div className="section-heading"><div><p className="eyebrow">АККАУНТ</p><h2>Сохраняйте слова и фразы</h2></div><p>Аккаунт нужен для due-очереди, history, retained metrics и возобновления уроков.</p></div><div className="auth-tabs"><button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Вход</button><button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Регистрация</button></div><form className="auth-form" onSubmit={submitAuth}>{authMode === "register" ? <label>Имя<input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label> : null}<label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Пароль<input type="password" required minLength={10} maxLength={72} autoComplete={authMode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label><div className="form-actions"><button className="secondary-button" type="button" onClick={() => navigate({ view: "home" })}>Отмена</button><button className="primary-button" type="submit" disabled={busy}>{busy ? "Подключение…" : authMode === "login" ? "Войти" : "Создать аккаунт"}</button></div></form></section>;
    return <><section className="view-heading"><div><p className="eyebrow">ПРОФИЛЬ</p><h1>{session.user.displayName || "Ваш аккаунт"}</h1></div><p>Прогресс слов и фраз синхронизируется между устройствами.</p></section><section className="profile-grid"><article><span>Email</span><strong>{session.user.email}</strong><small>используется для входа</small></article><article><span>Аккаунт создан</span><strong>{formatAccountDate(session.user.createdAt)}</strong><small>история хранится на сервере</small></article><article><span>Дневная цель</span><strong>{progress?.dailyGoal ?? 30}</strong><small>ответов</small></article><article><span>Активный урок</span><strong>{activeLesson ? "Есть" : "Нет"}</strong><small>{activeLesson ? sourceLabel(activeLesson.source) : "можно начать новый"}</small></article></section><section className="setup-panel"><div className="setup-actions"><button className="secondary-button" type="button" onClick={logout}>Выйти</button><button className="primary-button" type="button" onClick={() => navigate({ view: "progress" })}>Открыть прогресс</button></div></section></>;
  }

  function renderLesson() {
    if (!lessonStarted) return activeLesson
      ? <section className="empty-state-panel"><p className="eyebrow">АКТИВНЫЙ УРОК</p><h1>Урок сохранён</h1><p>{sourceLabel(activeLesson.source)} · позиция {activeLesson.currentIndex + 1} из {activeLesson.items.length}</p><div className="hero-actions"><button className="primary-button" type="button" onClick={resumeLesson}>Продолжить</button><button className="secondary-button" type="button" onClick={() => navigate({ view: "learn" })}>К настройкам</button></div></section>
      : <section className="empty-state-panel"><p className="eyebrow">УРОК</p><h1>Активного урока нет</h1><button className="primary-button" type="button" onClick={() => navigate({ view: "learn" })}>Настроить урок</button></section>;

    if (studyMode === "all") return <section className="all-items-panel"><div className="study-toolbar"><button className="secondary-button" type="button" onClick={() => navigate({ view: source === "phrases" ? "phrases" : "learn", source })}>← Назад</button><span>{items.length} элементов · {sourceLabel(source)}</span></div><div className="all-items-list">{items.map((item, index) => <article className="all-item" key={item.id}><div className="all-item-number">{index + 1}</div><div><p className="item-tags">{item.partOfSpeech} · {item.topic}</p><h3>{item.prompt}</h3>{item.cloze ? <p className="cloze-line">{item.cloze}</p> : null}<strong>{item.answer}</strong>{item.examples[0] ? <p>{item.examples[0]}</p> : null}</div></article>)}</div></section>;

    if (lessonComplete) return <section className="lesson lesson-complete"><div><p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p><h2>{items.length ? "Результаты сохранены" : "Нет due-элементов"}</h2><p>{items.length ? `Знал: ${knownCount}. Почти: ${almostCount}. Не знал: ${againCount}.` : "Выберите другой раздел или дождитесь следующего интервала."}</p></div><div className="completion-actions"><button className="secondary-button" type="button" onClick={() => { clearLessonState(); navigate({ view: "progress" }); }}>К прогрессу</button><button className="primary-button" type="button" disabled={busy} onClick={() => startLesson()}>Следующий блок</button></div></section>;
    if (!currentItem) return null;

    const phraseCloze = currentItem.kind === "phrase" && currentItem.cloze;
    return (
      <section className="study-card" aria-live="polite">
        <div className="study-toolbar"><button className="secondary-button" type="button" onClick={previousItem}>← Назад</button><div className="progress-wrap"><div className="progress-meta"><span>{currentIndex + 1} / {items.length}</span><span>{ratingValues.length} оценено</span></div><div className="progress-track"><span style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }} /></div></div><button className="secondary-button" type="button" onClick={saveAndExitLesson}>{activeLesson ? "Сохранить и выйти" : "Завершить"}</button></div>
        <div className="study-header"><div><p className="eyebrow">{currentItem.kind === "phrase" ? "ТЕХНИЧЕСКАЯ ФРАЗА" : "СЛОВО"}</p><p className="word-meta">{currentItem.partOfSpeech} · {currentItem.topic}</p></div><span className="badge">{currentRating ? ratingLabel(currentRating) : currentItem.status === "new" ? "Новое" : "Повторение"}</span></div>
        <div className="word-face">
          {phraseCloze && !revealed ? <><p className="cloze-label">ВОССТАНОВИТЕ АНГЛИЙСКИЙ ПРОПУСК</p><h2 className="phrase-cloze">{currentItem.cloze}</h2></> : <h2 className={currentItem.kind === "phrase" ? "phrase-title" : "word-title"}>{currentItem.prompt}</h2>}
          {!revealed && studyMode === "recall" ? <div className="recall-area"><label htmlFor="typed-answer">{exercisePromptLabel(currentItem)}</label><input id="typed-answer" value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && typedAnswer.trim()) setRevealed(true); }} placeholder={currentItem.kind === "phrase" ? "Например: root" : "Ваш ответ"} autoComplete="off" /><div className="recall-actions"><button className="secondary-button" type="button" onClick={() => setShowChoices((value) => !value)}>{showChoices ? "Скрыть варианты" : "Показать варианты"}</button><button className="primary-button" type="button" onClick={() => setRevealed(true)}>{typedAnswer.trim() ? "Сверить ответ" : "Показать ответ"}</button></div></div> : null}
          {!revealed && showChoices ? <div className="answer-options" role="group" aria-label="Варианты ответа">{answerOptions.map((answer) => <button key={answer} type="button" onClick={() => { setSelectedAnswer(answer); setRevealed(true); }}>{answer}</button>)}</div> : null}
          {revealed ? <div className="answer-block">{currentItem.kind === "phrase" ? <><h3>{currentItem.prompt}</h3><p className="match-message success">Пропуск: {expectedAnswer}</p></> : null}<strong>{currentItem.answer}</strong>{typedAnswer.trim() ? <p className={literalMatch ? "match-message success" : "match-message error"}>{literalMatch ? "Ответ совпал." : `Ваш ответ: ${typedAnswer}. Правильно: ${expectedAnswer}`}</p> : null}{selectedAnswer ? <p className={normalizeAnswer(selectedAnswer) === normalizeAnswer(expectedAnswer) ? "match-message success" : "match-message error"}>{normalizeAnswer(selectedAnswer) === normalizeAnswer(expectedAnswer) ? "Верный вариант." : `Вы выбрали: ${selectedAnswer}. Правильно: ${expectedAnswer}`}</p> : null}{currentItem.examples.length ? <ul>{currentItem.examples.slice(0, 2).map((example) => <li key={example}>{example}</li>)}</ul> : null}{currentItem.note ? <p>{currentItem.note}</p> : null}</div> : null}
        </div>
        {revealed ? currentRating ? <div className="rating-panel"><span>Оценка сохранена: {ratingLabel(currentRating)}</span><button className="primary-button" type="button" onClick={nextItem}>{currentIndex + 1 === items.length ? "К результатам" : "Дальше"}</button></div> : <div className="rating-panel"><span>Насколько уверенно вспомнили?</span><div className="rating-actions"><button className="rating-again" type="button" disabled={reviewing} onClick={() => rateCurrent("again")}>Не знал</button><button className="rating-almost" type="button" disabled={reviewing} onClick={() => rateCurrent("almost")}>Почти</button><button className="rating-known" type="button" disabled={reviewing} onClick={() => rateCurrent("known")}>{reviewing ? "Сохраняем…" : "Знал"}</button></div></div> : null}
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
    <main className="shell">
      <header className="app-header"><button className="brand-button" type="button" onClick={() => navigate({ view: "home" })}><span>TECHNICAL ENGLISH TRAINER</span><strong>LexiGo</strong></button><nav className="top-navigation" aria-label="Основная навигация">{PRIMARY_NAVIGATION.map((entry) => <button key={entry.view} type="button" className={navigation.view === entry.view ? "active" : ""} onClick={() => navigate({ view: entry.view })}>{entry.label}</button>)}</nav><div className="header-actions">{session ? <button className="secondary-button" type="button" onClick={() => navigate({ view: "profile" })}>{session.user.displayName || session.user.email}</button> : <button className="secondary-button" type="button" onClick={() => requestAuthentication(navigation.view)}>Войти</button>}</div></header>
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      {view}
      <nav className="mobile-navigation" aria-label="Мобильная навигация">{PRIMARY_NAVIGATION.map((entry) => <button key={entry.view} type="button" className={navigation.view === entry.view ? "active" : ""} onClick={() => navigate({ view: entry.view })}>{entry.shortLabel}</button>)}</nav>
    </main>
  );
}
