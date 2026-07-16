"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiUrl } from "../lib/api";
import {
  buildAnswerOptions,
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

type DueWord = {
  id: number;
  lemma: string;
  translation: string;
  phonetic: string;
  partOfSpeech: string;
  topic: string;
  examples: string[];
  note: string;
  status: string;
};

type DueResponse = {
  items: DueWord[];
  count: number;
};

type LessonItemResponse = DueWord & {
  position: number;
  rating?: ReviewRating;
  reviewedAt?: string;
};

type LessonSessionResponse = {
  id: string;
  source: WordSection;
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
  error?: {
    message?: string;
  };
};

type LessonSource = WordSection | "phrases";
type StudyMode = AnswerMode | "all";

type StartOverrides = {
  source?: LessonSource;
  size?: LessonSize;
  mode?: StudyMode;
  items?: LearningItem[];
};

type AuthorizedResult<T> = {
  activeSession: Session;
  data: T;
};

type DashboardCard = {
  label: string;
  value: string;
  hint: string;
  target: NavigationTarget;
};

const SESSION_KEY = "lexigo.session.v1";

const SOURCE_OPTIONS: Array<{ value: LessonSource; label: string; hint: string }> = [
  { value: "mixed", label: "Смешанный", hint: "Чередование частей речи и контекстов" },
  { value: "noun", label: "Существительные", hint: "Системы, объекты, метрики и понятия" },
  { value: "verb", label: "Глаголы", hint: "Действия, процессы и рабочие операции" },
  { value: "adjective", label: "Прилагательные", hint: "Состояния, свойства и характеристики" },
  { value: "phrases", label: "Технические фразы", hint: "Готовые chunks для рабочих ситуаций" },
];

const LIBRARY_SECTIONS: Array<{
  value: WordSection;
  label: string;
  count: number;
  description: string;
}> = [
  { value: "mixed", label: "Весь словарь", count: 579, description: "Все части речи с чередованием в уроке" },
  { value: "noun", label: "Существительные", count: 183, description: "Архитектура, данные, сервисы и инфраструктура" },
  { value: "verb", label: "Глаголы", count: 159, description: "Действия для разработки, анализа и коммуникации" },
  { value: "adjective", label: "Прилагательные", count: 193, description: "Свойства систем, процессов и результатов" },
];

const SIZE_OPTIONS: Array<{ value: LessonSize; label: string }> = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 60, label: "60" },
  { value: "all", label: "Все" },
];

const MODE_OPTIONS: Array<{ value: StudyMode; label: string; hint: string }> = [
  { value: "recall", label: "Вспомнить самому", hint: "Основной режим активного воспроизведения" },
  { value: "choice", label: "Выбрать вариант", hint: "Поддерживающий режим для новых элементов" },
  { value: "all", label: "Все и сразу", hint: "Справочный список без записи прогресса" },
];

const GOAL_OPTIONS = [15, 30, 60];

class APIError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
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
      // Preserve the HTTP status when the response body is not JSON.
    }
    throw new APIError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
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
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

async function authorizedRequest<T>(current: Session, path: string, init: RequestInit = {}): Promise<AuthorizedResult<T>> {
  try {
    return {
      activeSession: current,
      data: await requestJSON<T>(path, init, current.tokens.accessToken),
    };
  } catch (requestError) {
    if (!(requestError instanceof APIError) || requestError.status !== 401) throw requestError;
    const tokens = await requestJSON<TokenPair>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),
    });
    const refreshed = { ...current, tokens };
    storeSession(refreshed);
    return {
      activeSession: refreshed,
      data: await requestJSON<T>(path, init, refreshed.tokens.accessToken),
    };
  }
}

function toLearningItem(word: DueWord): LearningItem {
  return {
    id: `word-${word.id}`,
    wordId: word.id,
    kind: "word",
    prompt: word.lemma,
    answer: word.translation,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    section: normalizePartOfSpeech(word.partOfSpeech),
    topic: word.topic,
    examples: word.examples,
    note: word.note,
    status: word.status,
  };
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

export function LexigoProductApp() {
  const [navigation, setNavigation] = useState<NavigationTarget>({ view: "home" });
  const [returnView, setReturnView] = useState<AppView>("home");
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [hydratedUserID, setHydratedUserID] = useState("");

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
  const answerOptions = useMemo(
    () => (currentItem ? buildAnswerOptions(currentItem, items) : []),
    [currentItem, items],
  );
  const phraseTopics = useMemo(
    () => ["all", ...Array.from(new Set(TECHNICAL_PHRASES.map((phrase) => phrase.topic)))],
    [],
  );
  const visiblePhrases = useMemo(
    () => phraseTopic === "all" ? TECHNICAL_PHRASES : TECHNICAL_PHRASES.filter((phrase) => phrase.topic === phraseTopic),
    [phraseTopic],
  );
  const selectedPhrase = navigation.detail
    ? TECHNICAL_PHRASES.find((phrase) => phrase.id === navigation.detail)
    : undefined;
  const ratingValues = Object.values(ratings);
  const knownCount = ratingValues.filter((rating) => rating === "known").length;
  const almostCount = ratingValues.filter((rating) => rating === "almost").length;
  const againCount = ratingValues.filter((rating) => rating === "again").length;
  const literalMatch = Boolean(
    currentItem && typedAnswer && normalizeAnswer(typedAnswer) === normalizeAnswer(currentItem.answer),
  );
  const successRate = progress && progress.reviewsToday > 0
    ? Math.round((progress.successfulToday / progress.reviewsToday) * 100)
    : 0;

  function navigate(target: NavigationTarget, replace = false) {
    if (typeof window !== "undefined") {
      if (replace) {
        window.history.replaceState({ lexigo: true, ...target }, "", navigationURL(target));
      } else {
        window.history.pushState({ lexigo: true, ...target }, "", navigationURL(target));
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setNavigation(target);
    if (target.source) setSource(target.source);
    setError("");
  }

  function requestAuthentication(afterLogin: AppView) {
    setReturnView(afterLogin);
    navigate({ view: "profile" });
  }

  async function hydrateAccount(activeSession: Session) {
    setError("");
    try {
      const progressResult = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
      );
      setSession(progressResult.activeSession);
      storeSession(progressResult.activeSession);
      setProgress(progressResult.data);

      try {
        const lessonResult = await authorizedRequest<LessonSessionResponse>(
          progressResult.activeSession,
          "/api/v1/lessons/active",
        );
        setSession(lessonResult.activeSession);
        storeSession(lessonResult.activeSession);
        setActiveLesson(lessonResult.data);
      } catch (lessonError) {
        if (lessonError instanceof APIError && lessonError.status === 404) {
          setActiveLesson(null);
        } else {
          throw lessonError;
        }
      }
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

  async function fetchDueWords(activeSession: Session): Promise<AuthorizedResult<LearningItem[]>> {
    const result = await authorizedRequest<DueResponse>(activeSession, "/api/v1/words/due?limit=1000");
    return {
      activeSession: result.activeSession,
      data: result.data.items.map(toLearningItem),
    };
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
    lesson.items.forEach((item) => {
      if (item.rating) restoredRatings[`word-${item.id}`] = item.rating;
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
      navigate({ view: "lesson" });
    } catch (requestError) {
      if (requestError instanceof APIError && requestError.status === 404) {
        setActiveLesson(null);
        setError("Незавершённый урок уже отсутствует. Начните новый блок.");
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
      });
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

  async function startLesson(activeSession = session, overrides: StartOverrides = {}) {
    const resolvedSource = overrides.source ?? source;
    const resolvedSize = overrides.size ?? lessonSize;
    const resolvedMode = overrides.mode ?? studyMode;

    setSource(resolvedSource);
    setLessonSize(resolvedSize);
    setStudyMode(resolvedMode);

    if (resolvedSource !== "phrases" && !activeSession) {
      requestAuthentication("learn");
      return;
    }

    setBusy(true);
    setError("");
    try {
      let available: LearningItem[];
      let authenticatedSession = activeSession;
      if (resolvedSource === "phrases") {
        available = overrides.items ?? TECHNICAL_PHRASES;
      } else {
        const result = await fetchDueWords(activeSession as Session);
        authenticatedSession = result.activeSession;
        setSession(result.activeSession);
        storeSession(result.activeSession);
        available = prepareWordItems(result.data, resolvedSource);
      }

      const lessonItems = takeLessonBlock(available, resolvedSize);
      if (resolvedSource !== "phrases" && resolvedMode !== "all" && lessonItems.length > 0) {
        const result = await authorizedRequest<LessonSessionResponse>(
          authenticatedSession as Session,
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
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить учебный блок");
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
        body: JSON.stringify({
          email,
          password,
          ...(authMode === "register" ? { displayName } : {}),
        }),
      });
      setSession(authenticated);
      storeSession(authenticated);
      setHydratedUserID("");
      setPassword("");
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
      // Local logout is complete even if the network request fails.
    }
  }

  async function updateDailyGoal(dailyGoal: number) {
    if (!session) {
      requestAuthentication("progress");
      return;
    }
    setBusy(true);
    setError("");
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
      navigate({ view: source === "phrases" ? "phrases" : "learn", source });
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
    if (currentItem.kind === "phrase") {
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      nextItem();
      return;
    }
    if (!session || currentItem.wordId === undefined) {
      requestAuthentication("lesson");
      return;
    }

    setReviewing(true);
    setError("");
    try {
      const correct = selectedAnswer
        ? selectedAnswer === currentItem.answer
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
        if (result.data.lessonCompleted) {
          setActiveLesson(null);
        } else {
          setActiveLesson((current) => current ? { ...current, currentIndex: result.data.lessonCurrentIndex } : current);
        }
      }
      await refreshProgress(result.activeSession);
      nextItem();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
    } finally {
      setReviewing(false);
    }
  }

  function chooseAnswer(answer: string) {
    setSelectedAnswer(answer);
    setRevealed(true);
  }

  const dashboardCards: DashboardCard[] = session && progress
    ? [
        { label: "Нужно повторить", value: String(progress.dueNow), hint: `Следующее: ${nextDueLabel(progress.nextDueAt)}`, target: { view: "learn" } },
        { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% дневной цели`, target: { view: "progress" } },
        { label: "Серия", value: `${progress.currentStreak} дн.`, hint: `лучший результат: ${progress.longestStreak}`, target: { view: "progress", detail: "streak" } },
        { label: "Освоено", value: String(progress.masteredWords), hint: `из ${progress.totalWords} слов`, target: { view: "library", detail: "mastered" } },
      ]
    : [
        { label: "Словарь", value: "579", hint: "технических и академических слов", target: { view: "library" } },
        { label: "Технические фразы", value: String(TECHNICAL_PHRASES.length), hint: "для рабочих ситуаций", target: { view: "phrases" } },
        { label: "Первый урок", value: "30", hint: "рекомендуемый стартовый блок", target: { view: "learn" } },
        { label: "Прогресс", value: "—", hint: "войдите, чтобы сохранять результат", target: { view: "profile" } },
      ];

  function renderResumePanel() {
    if (!session || !activeLesson || lessonStarted) return null;
    return (
      <section className="setup-panel resume-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">НЕЗАВЕРШЁННЫЙ УРОК</p>
            <h2>Продолжите с того места, где остановились</h2>
          </div>
          <p>{sourceLabel(activeLesson.source)} · {activeLesson.studyMode === "recall" ? "самостоятельный ответ" : "варианты ответа"}</p>
        </div>
        <div className="progress-wrap">
          <div className="progress-meta">
            <span>{Math.min(activeLesson.currentIndex + 1, activeLesson.items.length)} из {activeLesson.items.length}</span>
            <span>{activeLesson.items.filter((item) => item.rating).length} оценено</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${activeLesson.items.length ? (activeLesson.currentIndex / activeLesson.items.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="setup-actions">
          <button className="secondary-button" type="button" disabled={busy} onClick={discardActiveLesson}>Сбросить урок</button>
          <button className="primary-button large-button" type="button" disabled={busy} onClick={resumeLesson}>
            {busy ? "Загружаем…" : "Продолжить урок"}
          </button>
        </div>
      </section>
    );
  }

  function renderAuthentication() {
    return (
      <section className="auth-panel profile-auth" aria-label="Авторизация">
        <div className="section-heading">
          <div><p className="eyebrow">АККАУНТ</p><h2>Сохраняйте прогресс между устройствами</h2></div>
          <p>Аккаунт нужен для персональной очереди, интервальных повторений и продолжения незавершённых уроков.</p>
        </div>
        <div className="auth-tabs" role="tablist" aria-label="Режим авторизации">
          <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Вход</button>
          <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Регистрация</button>
        </div>
        <form className="auth-form" onSubmit={submitAuth}>
          {authMode === "register" ? (
            <label>Имя<input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ваше имя" /></label>
          ) : null}
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>
            Пароль
            <input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} required minLength={10} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="От 10 до 72 символов" />
          </label>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => navigate({ view: "home" })}>На главную</button>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "Подключение…" : authMode === "login" ? "Войти" : "Создать аккаунт"}</button>
          </div>
        </form>
      </section>
    );
  }

  function renderHome() {
    return (
      <>
        <section className="product-hero">
          <div>
            <p className="eyebrow">TECHNICAL ENGLISH TRAINER</p>
            <h1>Английский, который нужен в работе</h1>
            <p className="subtitle">Повторяйте слова, осваивайте технические фразы и возвращайтесь к незавершённому уроку с любого устройства.</p>
            <div className="hero-actions">
              <button className="primary-button large-button" type="button" onClick={() => navigate({ view: "learn" })}>Начать обучение</button>
              <button className="secondary-button large-button" type="button" onClick={() => navigate({ view: "phrases" })}>Открыть technical phrases</button>
            </div>
          </div>
          <div className="hero-roadmap">
            <span>Следующий полезный шаг</span>
            <strong>{activeLesson ? "Продолжить начатый урок" : progress?.dueNow ? `Повторить ${progress.dueNow} слов` : "Выбрать первый учебный блок"}</strong>
            <small>LexiGo не засчитывает простой просмотр: прогресс меняется только после ответа и оценки.</small>
          </div>
        </section>

        <section className="grid" aria-label="Навигация по прогрессу">
          {dashboardCards.map((card) => (
            <button className="card interactive-card" type="button" key={card.label} onClick={() => navigate(card.target)}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.hint}</small>
              <em>Открыть →</em>
            </button>
          ))}
        </section>

        {renderResumePanel()}

        <section className="setup-panel">
          <div className="section-heading">
            <div><p className="eyebrow">КАРТА ПРОДУКТА</p><h2>Выберите задачу, а не случайный экран</h2></div>
            <p>Каждый блок ведёт в отдельный раздел и создаёт запись в истории браузера. Back и Forward возвращают предыдущий экран приложения.</p>
          </div>
          <div className="product-action-grid">
            <button type="button" onClick={() => navigate({ view: "learn" })}><span>01</span><strong>Повторить слова</strong><small>Персональная due-очередь и интервальные повторения</small></button>
            <button type="button" onClick={() => navigate({ view: "phrases" })}><span>02</span><strong>Выучить рабочие фразы</strong><small>Инциденты, архитектура, delivery и коммуникация</small></button>
            <button type="button" onClick={() => navigate({ view: "library" })}><span>03</span><strong>Разобрать словарь</strong><small>Существительные, глаголы и прилагательные</small></button>
            <button type="button" onClick={() => navigate({ view: "progress" })}><span>04</span><strong>Проверить прогресс</strong><small>Цель, серия, успешность и состояние словаря</small></button>
          </div>
        </section>

        <section className="phrases-panel">
          <div className="section-heading">
            <div><p className="eyebrow">TOP TECHNICAL PHRASES</p><h2>Фразы, которые можно применить сегодня</h2></div>
            <p>Нажмите на карточку, чтобы открыть перевод, пример и пояснение использования.</p>
          </div>
          <div className="phrase-preview-grid">
            {TECHNICAL_PHRASES.slice(0, 6).map((phrase) => (
              <button className="phrase-preview phrase-button" type="button" key={phrase.id} onClick={() => navigate({ view: "phrases", detail: phrase.id })}>
                <span>{phrase.topic}</span><strong>{phrase.prompt}</strong><small>{phrase.answer}</small><em>Подробнее →</em>
              </button>
            ))}
          </div>
          <div className="phrase-actions"><button className="primary-button" type="button" onClick={() => navigate({ view: "phrases" })}>Все технические фразы</button></div>
        </section>
      </>
    );
  }

  function renderLearn() {
    return (
      <>
        <section className="view-heading">
          <div><p className="eyebrow">ОБУЧЕНИЕ</p><h1>Соберите урок под текущую задачу</h1></div>
          <p>По умолчанию используется active recall. Варианты ответа остаются поддержкой, а не заменой самостоятельного воспроизведения.</p>
        </section>
        {renderResumePanel()}
        <section className="setup-panel">
          <div className="section-heading">
            <div><p className="eyebrow">НОВЫЙ УРОК</p><h2>Выберите раздел, объём и формат</h2></div>
            <p>Новый урок заменит незавершённый. Смешанный режим чередует части речи и снижает эффект механического угадывания.</p>
          </div>
          <fieldset className="option-group">
            <legend>Раздел</legend>
            <div className="source-grid">
              {SOURCE_OPTIONS.map((option) => (
                <button key={option.value} type="button" className={`option-card ${source === option.value ? "selected" : ""}`} onClick={() => setSource(option.value)}>
                  <strong>{option.label}</strong><span>{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="lesson-controls">
            <fieldset className="option-group compact-group">
              <legend>Размер блока</legend>
              <div className="segmented-control">
                {SIZE_OPTIONS.map((option) => (
                  <button key={String(option.value)} type="button" className={lessonSize === option.value ? "selected" : ""} onClick={() => setLessonSize(option.value)}>{option.label}</button>
                ))}
              </div>
            </fieldset>
            <fieldset className="option-group mode-group">
              <legend>Формат</legend>
              <div className="mode-options">
                {MODE_OPTIONS.map((option) => (
                  <button key={option.value} type="button" className={studyMode === option.value ? "selected" : ""} onClick={() => setStudyMode(option.value)}>
                    <strong>{option.label}</strong><span>{option.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="setup-actions">
            <p>{source === "phrases" ? "Технические фразы доступны без входа; их прогресс пока хранится в текущей сессии." : session ? `${progress?.dueNow ?? 0} слов доступны к повторению сейчас.` : "Для персональной очереди и сохранения результата требуется вход."}</p>
            <button className="primary-button large-button" type="button" disabled={busy} onClick={() => startLesson()}>{busy ? "Формируем блок…" : studyMode === "all" ? "Открыть весь блок" : "Начать урок"}</button>
          </div>
        </section>
      </>
    );
  }

  function renderPhrases() {
    if (selectedPhrase) {
      return (
        <section className="phrase-detail-panel">
          <button className="secondary-button" type="button" onClick={() => navigate({ view: "phrases" })}>← Все фразы</button>
          <div className="phrase-detail-content">
            <p className="eyebrow">{selectedPhrase.topic}</p>
            <h1>{selectedPhrase.prompt}</h1>
            <strong>{selectedPhrase.answer}</strong>
            {selectedPhrase.cloze ? <div className="detail-callout"><span>Cloze practice</span><p>{selectedPhrase.cloze}</p></div> : null}
            {selectedPhrase.examples[0] ? <div className="detail-callout"><span>Рабочий пример</span><p>{selectedPhrase.examples[0]}</p></div> : null}
            {selectedPhrase.note ? <div className="detail-callout"><span>Как использовать</span><p>{selectedPhrase.note}</p></div> : null}
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: 15, mode: "recall", items: [selectedPhrase] })}>Потренировать эту фразу</button>
              <button className="secondary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall" })}>Начать блок фраз</button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="view-heading">
          <div><p className="eyebrow">TECHNICAL PHRASES</p><h1>Готовые формулировки для технической работы</h1></div>
          <p>Изучайте не отдельные слова, а chunks, которые можно использовать в incident thread, design review, code review и status update.</p>
        </section>
        <div className="topic-filter" aria-label="Темы технических фраз">
          {phraseTopics.map((topic) => (
            <button type="button" key={topic} className={phraseTopic === topic ? "selected" : ""} onClick={() => setPhraseTopic(topic)}>{topic === "all" ? "Все темы" : topic}</button>
          ))}
        </div>
        <section className="phrase-catalog-grid">
          {visiblePhrases.map((phrase) => (
            <button className="phrase-preview phrase-button" type="button" key={phrase.id} onClick={() => navigate({ view: "phrases", detail: phrase.id })}>
              <span>{phrase.topic}</span><strong>{phrase.prompt}</strong><small>{phrase.answer}</small><em>Открыть карточку →</em>
            </button>
          ))}
        </section>
        <div className="catalog-actions">
          <button className="secondary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: "all", mode: "all", items: visiblePhrases })}>Посмотреть выбранные сразу</button>
          <button className="primary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall", items: visiblePhrases })}>Тренировать выбранную тему</button>
        </div>
      </>
    );
  }

  function renderLibrary() {
    return (
      <>
        <section className="view-heading">
          <div><p className="eyebrow">СЛОВАРЬ</p><h1>579 слов, организованных по учебной задаче</h1></div>
          <p>Выберите часть речи и перейдите к настройке урока. Полный каталог остаётся единым, а интервальная очередь персональна для аккаунта.</p>
        </section>
        <section className="library-grid">
          {LIBRARY_SECTIONS.map((section) => (
            <button type="button" key={section.value} onClick={() => navigate({ view: "learn", source: section.value })}>
              <span>{section.count}</span><strong>{section.label}</strong><small>{section.description}</small><em>Собрать урок →</em>
            </button>
          ))}
          <button type="button" onClick={() => navigate({ view: "phrases" })}>
            <span>{TECHNICAL_PHRASES.length}</span><strong>Технические фразы</strong><small>Готовые формулировки для рабочих ситуаций</small><em>Открыть каталог →</em>
          </button>
        </section>
        {session && progress ? (
          <section className="setup-panel">
            <div className="section-heading"><div><p className="eyebrow">ВАШЕ СОСТОЯНИЕ</p><h2>Как распределены слова сейчас</h2></div><p>Эти показатели меняются только после сохранённых ответов.</p></div>
            <div className="status-list">
              {[{ label: "Новые", value: progress.newWords }, { label: "Изучаются", value: progress.learningWords }, { label: "На повторении", value: progress.reviewWords }, { label: "Освоены", value: progress.masteredWords }].map((entry) => (
                <div className="status-row" key={entry.label}><span>{entry.label}</span><div><i style={{ width: `${progress.totalWords ? (entry.value / progress.totalWords) * 100 : 0}%` }} /></div><strong>{entry.value}</strong></div>
              ))}
            </div>
          </section>
        ) : null}
      </>
    );
  }

  function renderProgress() {
    if (!session || !progress) {
      return (
        <section className="empty-state-panel">
          <p className="eyebrow">ПРОГРЕСС</p><h1>Прогресс привязан к аккаунту</h1><p>Войдите, чтобы видеть дневную цель, серию, очередь повторений и состояние словаря на всех устройствах.</p>
          <button className="primary-button" type="button" onClick={() => requestAuthentication("progress")}>Войти и открыть прогресс</button>
        </section>
      );
    }

    return (
      <>
        <section className="view-heading">
          <div><p className="eyebrow">ПРОГРЕСС</p><h1>Измеряем результат, а не количество открытых карточек</h1></div>
          <p>Главный сигнал — сохранённые ответы и последующие успешные повторения.</p>
        </section>
        <section className="grid progress-grid">
          {[{ label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% цели` }, { label: "Успешность", value: `${successRate}%`, hint: `${progress.successfulToday} успешных ответов` }, { label: "Текущая серия", value: `${progress.currentStreak} дн.`, hint: `рекорд ${progress.longestStreak}` }, { label: "Всего ответов", value: String(progress.reviewsTotal), hint: `${progress.masteredWords} слов освоено` }].map((card) => (
            <article className="card" key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.hint}</small></article>
          ))}
        </section>
        <section className="setup-panel">
          <div className="section-heading"><div><p className="eyebrow">ДНЕВНАЯ ЦЕЛЬ</p><h2>{progress.reviewsToday >= progress.dailyGoal ? "Цель выполнена" : "Продолжайте учебный цикл"}</h2></div><p>Просмотр без оценки не увеличивает прогресс.</p></div>
          <div className="progress-wrap"><div className="progress-meta"><span>{progress.reviewsToday} ответов</span><span>{progress.dailyGoal} цель</span></div><div className="progress-track"><span style={{ width: `${goalPercent(progress)}%` }} /></div></div>
          <fieldset className="option-group compact-group"><legend>Изменить дневную цель</legend><div className="segmented-control">{GOAL_OPTIONS.map((goal) => <button key={goal} type="button" className={progress.dailyGoal === goal ? "selected" : ""} disabled={busy} onClick={() => updateDailyGoal(goal)}>{goal}</button>)}</div></fieldset>
        </section>
        <section className="setup-panel">
          <div className="section-heading"><div><p className="eyebrow">ОЧЕРЕДЬ</p><h2>{progress.dueNow ? `${progress.dueNow} слов готовы к повторению` : "Очередь на сейчас пуста"}</h2></div><p>Следующее повторение: {nextDueLabel(progress.nextDueAt)}</p></div>
          <div className="setup-actions"><p>Начните короткий блок, чтобы поддержать ритм без перегрузки.</p><button className="primary-button" type="button" onClick={() => navigate({ view: "learn" })}>Перейти к уроку</button></div>
        </section>
      </>
    );
  }

  function renderProfile() {
    if (!session) return renderAuthentication();
    return (
      <>
        <section className="view-heading"><div><p className="eyebrow">ПРОФИЛЬ</p><h1>{session.user.displayName || "Ваш аккаунт"}</h1></div><p>Настройки обучения и синхронизация между устройствами.</p></section>
        <section className="profile-grid">
          <article><span>Email</span><strong>{session.user.email}</strong><small>Используется для входа</small></article>
          <article><span>Аккаунт создан</span><strong>{formatAccountDate(session.user.createdAt)}</strong><small>Прогресс хранится на сервере</small></article>
          <article><span>Дневная цель</span><strong>{progress?.dailyGoal ?? 30}</strong><small>ответов в день</small></article>
          <article><span>Незавершённый урок</span><strong>{activeLesson ? "Есть" : "Нет"}</strong><small>{activeLesson ? `${activeLesson.currentIndex + 1} из ${activeLesson.items.length}` : "Можно начать новый"}</small></article>
        </section>
        <section className="setup-panel"><div className="section-heading"><div><p className="eyebrow">УПРАВЛЕНИЕ</p><h2>Аккаунт и учебный маршрут</h2></div><p>Выход удаляет токены с устройства, но не удаляет сохранённый прогресс.</p></div><div className="setup-actions"><button className="secondary-button" type="button" onClick={logout}>Выйти из аккаунта</button><button className="primary-button" type="button" onClick={() => navigate({ view: "progress" })}>Открыть прогресс</button></div></section>
      </>
    );
  }

  function renderLesson() {
    if (!lessonStarted) {
      return activeLesson ? (
        <section className="empty-state-panel"><p className="eyebrow">АКТИВНЫЙ УРОК</p><h1>Урок сохранён</h1><p>Продолжите с текущей позиции или вернитесь к выбору раздела.</p><div className="hero-actions"><button className="primary-button" type="button" disabled={busy} onClick={resumeLesson}>Продолжить урок</button><button className="secondary-button" type="button" onClick={() => navigate({ view: "learn" })}>К настройкам</button></div></section>
      ) : (
        <section className="empty-state-panel"><p className="eyebrow">УРОК</p><h1>Активного урока нет</h1><p>Выберите раздел, размер блока и формат обучения.</p><button className="primary-button" type="button" onClick={() => navigate({ view: "learn" })}>Настроить урок</button></section>
      );
    }

    if (studyMode === "all") {
      return (
        <section className="all-items-panel">
          <div className="study-toolbar"><button className="secondary-button" type="button" onClick={() => navigate({ view: source === "phrases" ? "phrases" : "learn", source })}>← Назад</button><span>{items.length} элементов · {sourceLabel(source)}</span></div>
          <div className="all-items-list">{items.map((item, index) => <article className="all-item" key={item.id}><div className="all-item-number">{index + 1}</div><div><p className="item-tags">{item.partOfSpeech} · {item.topic || "общая лексика"}</p><h3>{item.prompt}</h3>{item.cloze ? <p className="cloze-line">{item.cloze}</p> : null}<strong>{item.answer}</strong>{item.examples[0] ? <p>{item.examples[0]}</p> : null}</div></article>)}</div>
        </section>
      );
    }

    if (lessonComplete) {
      return (
        <section className="lesson lesson-complete"><div><p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p><h2>{items.length ? "Результаты сохранены" : "Нет элементов для выбранного раздела"}</h2><p>{items.length ? `Знал: ${knownCount}. Почти: ${almostCount}. Не знал: ${againCount}. ${session && progress ? `Сегодня выполнено ${progress.reviewsToday} из ${progress.dailyGoal}.` : ""}` : "Измените раздел, размер блока или откройте технические фразы."}</p></div><div className="completion-actions"><button className="secondary-button" type="button" onClick={() => { clearLessonState(); navigate({ view: "progress" }); }}>К прогрессу</button><button className="primary-button" type="button" disabled={busy} onClick={() => startLesson()}>Следующий блок</button></div></section>
      );
    }

    if (!currentItem) return null;
    return (
      <section className="study-card" aria-live="polite">
        <div className="study-toolbar">
          <button className="secondary-button" type="button" onClick={previousItem}>← Назад</button>
          <div className="progress-wrap" aria-label={`Элемент ${currentIndex + 1} из ${items.length}`}><div className="progress-meta"><span>{currentIndex + 1} / {items.length}</span><span>{ratingValues.length} оценено</span></div><div className="progress-track"><span style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }} /></div></div>
          <button className="secondary-button" type="button" onClick={saveAndExitLesson}>{activeLesson ? "Сохранить и выйти" : "Завершить"}</button>
        </div>
        <div className="study-header"><div><p className="eyebrow">{currentItem.kind === "phrase" ? "ТЕХНИЧЕСКАЯ ФРАЗА" : "СЛОВО"}</p><p className="word-meta">{currentItem.partOfSpeech} · {currentItem.topic || "общая лексика"}</p></div><span className="badge">{currentRating ? ratingLabel(currentRating) : currentItem.status === "new" ? "Новое" : "Повторение"}</span></div>
        <div className="word-face">
          {currentItem.kind === "phrase" && currentItem.cloze && !revealed ? <><p className="cloze-label">Восстановите пропуск</p><h2 className="phrase-cloze">{currentItem.cloze}</h2></> : <h2 className={currentItem.kind === "phrase" ? "phrase-title" : "word-title"}>{currentItem.prompt}</h2>}
          {currentItem.phonetic ? <p className="phonetic">{currentItem.phonetic}</p> : null}
          {!revealed && studyMode === "recall" ? <div className="recall-area"><label htmlFor="typed-answer">Введите перевод или смысл своими словами</label><input id="typed-answer" value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && typedAnswer.trim()) setRevealed(true); }} placeholder="Ваш ответ" autoComplete="off" /><div className="recall-actions"><button className="secondary-button" type="button" onClick={() => setShowChoices((value) => !value)}>{showChoices ? "Скрыть варианты" : "Посмотреть варианты ответов"}</button><button className="primary-button" type="button" onClick={() => setRevealed(true)}>{typedAnswer.trim() ? "Сверить ответ" : "Показать ответ"}</button></div></div> : null}
          {!revealed && showChoices ? <div className="answer-options" role="group" aria-label="Варианты ответов">{answerOptions.map((answer) => <button key={answer} type="button" onClick={() => chooseAnswer(answer)}>{answer}</button>)}</div> : null}
          {revealed ? <div className="answer-block">{currentItem.kind === "phrase" ? <h3>{currentItem.prompt}</h3> : null}<strong>{currentItem.answer}</strong>{typedAnswer.trim() ? <p className={literalMatch ? "match-message success" : "match-message"}>{literalMatch ? "Ответ совпал с эталоном." : `Ваш ответ: ${typedAnswer}`}</p> : null}{selectedAnswer ? <p className={selectedAnswer === currentItem.answer ? "match-message success" : "match-message error"}>{selectedAnswer === currentItem.answer ? "Верный вариант." : `Вы выбрали: ${selectedAnswer}`}</p> : null}{currentItem.examples.length ? <ul>{currentItem.examples.slice(0, 2).map((example) => <li key={example}>{example}</li>)}</ul> : null}{currentItem.note ? <p>{currentItem.note}</p> : null}</div> : null}
        </div>
        {revealed ? currentRating ? <div className="rating-panel"><span>Оценка сохранена: {ratingLabel(currentRating)}</span><button className="primary-button" type="button" onClick={nextItem}>{currentIndex + 1 === items.length ? "К результатам" : "Дальше"}</button></div> : <div className="rating-panel"><span>Насколько уверенно вспомнили?</span><div className="rating-actions"><button className="rating-again" type="button" disabled={reviewing} onClick={() => rateCurrent("again")}>Не знал</button><button className="rating-almost" type="button" disabled={reviewing} onClick={() => rateCurrent("almost")}>Почти</button><button className="rating-known" type="button" disabled={reviewing} onClick={() => rateCurrent("known")}>{reviewing ? "Сохраняем…" : "Знал"}</button></div></div> : null}
      </section>
    );
  }

  function renderCurrentView() {
    switch (navigation.view) {
      case "learn":
        return renderLearn();
      case "phrases":
        return renderPhrases();
      case "library":
        return renderLibrary();
      case "progress":
        return renderProgress();
      case "profile":
        return renderProfile();
      case "lesson":
        return renderLesson();
      default:
        return renderHome();
    }
  }

  return (
    <main className="shell product-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => navigate({ view: "home" })} aria-label="LexiGo — на главную">
          <span className="brand-mark">LG</span><span><strong>LexiGo</strong><small>Technical English</small></span>
        </button>
        <nav className="primary-nav" aria-label="Основная навигация">
          {PRIMARY_NAVIGATION.map((item) => <button type="button" key={item.view} className={navigation.view === item.view ? "active" : ""} aria-current={navigation.view === item.view ? "page" : undefined} onClick={() => navigate({ view: item.view })}>{item.label}</button>)}
        </nav>
        <div className="account-actions">
          {session ? <button className="account-button" type="button" onClick={() => navigate({ view: "profile" })}><span>{session.user.displayName || session.user.email}</span><small>Профиль</small></button> : <button className="secondary-button" type="button" onClick={() => requestAuthentication(navigation.view)}>Войти</button>}
        </div>
      </header>

      {error ? <p className="error-message" role="alert">{error}</p> : null}
      <div className="view-container" key={navigation.view}>{renderCurrentView()}</div>

      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {PRIMARY_NAVIGATION.map((item) => <button type="button" key={item.view} className={navigation.view === item.view ? "active" : ""} onClick={() => navigate({ view: item.view })}>{item.shortLabel}</button>)}
      </nav>
    </main>
  );
}
