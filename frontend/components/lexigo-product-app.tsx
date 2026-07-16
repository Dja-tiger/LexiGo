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
  goalPercent,
  ratingLabel,
  type AnswerMode,
  type ProgressSummary,
  type ReviewRating,
  type ReviewResult,
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
};

type AuthorizedResult<T> = {
  activeSession: Session;
  data: T;
};

const SESSION_KEY = "lexigo.session.v1";

const SOURCE_OPTIONS: Array<{ value: LessonSource; label: string; hint: string }> = [
  { value: "mixed", label: "Смешанный", hint: "Части речи чередуются, чтобы тренировать выбор в контексте" },
  { value: "noun", label: "Существительные", hint: "Системы, объекты, метрики и технические понятия" },
  { value: "verb", label: "Глаголы", hint: "Действия, процессы и рабочие операции" },
  { value: "adjective", label: "Прилагательные", hint: "Состояния, свойства и характеристики" },
  { value: "phrases", label: "Технические фразы", hint: "Готовые chunks для инцидентов, встреч и релизов" },
];

const SIZE_OPTIONS: Array<{ value: LessonSize; label: string }> = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 60, label: "60" },
  { value: "all", label: "Все" },
];

const MODE_OPTIONS: Array<{ value: StudyMode; label: string; hint: string }> = [
  { value: "recall", label: "Вспомнить самому", hint: "Основной режим: сначала сформулируйте ответ" },
  { value: "choice", label: "Выбрать вариант", hint: "Поддерживающий режим для менее знакомых слов" },
  { value: "all", label: "Все и сразу", hint: "Открытый справочный список без записи прогресса" },
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
      // Keep the HTTP status when the response does not contain JSON.
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

export function LexigoProductApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [source, setSource] = useState<LessonSource>("mixed");
  const [lessonSize, setLessonSize] = useState<LessonSize>(30);
  const [studyMode, setStudyMode] = useState<StudyMode>("recall");

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
    const timer = window.setTimeout(() => setSession(readSession()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!session || progress) return;
    let cancelled = false;
    void authorizedRequest<ProgressSummary>(
      session,
      `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
    )
      .then((result) => {
        if (cancelled) return;
        setSession(result.activeSession);
        storeSession(result.activeSession);
        setProgress(result.data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить прогресс");
      });
    return () => {
      cancelled = true;
    };
  }, [session, progress]);

  const currentItem = items[currentIndex];
  const currentRating = currentItem ? ratings[currentItem.id] : undefined;
  const answerOptions = useMemo(
    () => (currentItem ? buildAnswerOptions(currentItem, items) : []),
    [currentItem, items],
  );
  const ratingValues = Object.values(ratings);
  const knownCount = ratingValues.filter((rating) => rating === "known").length;
  const almostCount = ratingValues.filter((rating) => rating === "almost").length;
  const againCount = ratingValues.filter((rating) => rating === "again").length;
  const literalMatch = Boolean(
    currentItem && typedAnswer && normalizeAnswer(typedAnswer) === normalizeAnswer(currentItem.answer),
  );

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

  async function startLesson(activeSession = session, overrides: StartOverrides = {}) {
    const resolvedSource = overrides.source ?? source;
    const resolvedSize = overrides.size ?? lessonSize;
    const resolvedMode = overrides.mode ?? studyMode;

    setSource(resolvedSource);
    setLessonSize(resolvedSize);
    setStudyMode(resolvedMode);

    if (resolvedSource !== "phrases" && !activeSession) {
      setAuthOpen(true);
      return;
    }

    setBusy(true);
    setError("");
    try {
      let available: LearningItem[];
      if (resolvedSource === "phrases") {
        available = TECHNICAL_PHRASES;
      } else {
        const result = await fetchDueWords(activeSession as Session);
        setSession(result.activeSession);
        storeSession(result.activeSession);
        available = prepareWordItems(result.data, resolvedSource);
      }

      const lessonItems = takeLessonBlock(available, resolvedSize);
      setItems(lessonItems);
      setCurrentIndex(0);
      setRatings({});
      resetCardState(resolvedMode);
      setLessonStarted(true);
      setLessonComplete(lessonItems.length === 0);
      setAuthOpen(false);
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
      setAuthOpen(false);
      setPassword("");
      await refreshProgress(authenticated);
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
    storeSession(null);
    closeLesson();
    if (!current) return;
    try {
      await requestJSON<void>("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),
      });
    } catch {
      // Local logout is complete even when the network request fails.
    }
  }

  async function updateDailyGoal(dailyGoal: number) {
    if (!session) {
      setAuthOpen(true);
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

  function closeLesson() {
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

  function moveToIndex(index: number) {
    const target = items[index];
    setCurrentIndex(index);
    resetCardState(studyMode, Boolean(target && ratings[target.id]));
  }

  function previousItem() {
    if (currentIndex === 0) {
      closeLesson();
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
      setAuthOpen(true);
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
      const result = await authorizedRequest<ReviewResult>(
        session,
        `/api/v1/words/${currentItem.wordId}/review`,
        {
          method: "POST",
          body: JSON.stringify({
            rating,
            responseMs: Math.max(0, Date.now() - cardStartedAt.current),
            answerMode: studyMode === "choice" ? "choice" : "recall",
            correct,
            timezoneOffsetMinutes: timezoneOffsetMinutes(),
          }),
        },
      );
      setSession(result.activeSession);
      storeSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
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

  const dashboardCards = session && progress
    ? [
        { label: "Нужно повторить", value: String(progress.dueNow), hint: `Следующее: ${nextDueLabel(progress.nextDueAt)}` },
        { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% дневной цели` },
        { label: "Серия", value: `${progress.currentStreak} дн.`, hint: `лучший результат: ${progress.longestStreak}` },
        { label: "Освоено", value: String(progress.masteredWords), hint: `из ${progress.totalWords} слов` },
      ]
    : [
        { label: "Словарь", value: "579", hint: "технических и академических слов" },
        { label: "Технические фразы", value: String(TECHNICAL_PHRASES.length), hint: "для рабочих ситуаций" },
        { label: "Блок", value: lessonSize === "all" ? "Все" : String(lessonSize), hint: "настраивается перед уроком" },
        { label: "Прогресс", value: "—", hint: "появится после входа" },
      ];

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">TECHNICAL ENGLISH TRAINER</p>
          <h1>LexiGo</h1>
          <p className="subtitle">Учебный цикл с активным воспроизведением, интервальными повторениями и рабочими техническими фразами.</p>
        </div>
        <div className="account-actions">
          {session ? (
            <>
              <span className="account-name">{session.user.displayName || session.user.email}</span>
              <button className="secondary-button" type="button" onClick={logout}>Выйти</button>
            </>
          ) : (
            <button className="secondary-button" type="button" onClick={() => setAuthOpen(true)}>Войти</button>
          )}
        </div>
      </header>

      <section className="grid" aria-label="Прогресс обучения">
        {dashboardCards.map((card) => (
          <article className="card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

      {session && progress && !lessonStarted ? (
        <section className="setup-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ДНЕВНАЯ ЦЕЛЬ</p>
              <h2>{progress.reviewsToday >= progress.dailyGoal ? "Цель на сегодня выполнена" : "Сформируйте устойчивую привычку"}</h2>
            </div>
            <p>Засчитываются только оценённые ответы. Просмотр карточки без оценки не увеличивает прогресс.</p>
          </div>
          <div className="progress-wrap">
            <div className="progress-meta">
              <span>{progress.reviewsToday} ответов</span>
              <span>{progress.dailyGoal} цель</span>
            </div>
            <div className="progress-track"><span style={{ width: `${goalPercent(progress)}%` }} /></div>
          </div>
          <fieldset className="option-group compact-group">
            <legend>Изменить дневную цель</legend>
            <div className="segmented-control">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  className={progress.dailyGoal === goal ? "selected" : ""}
                  disabled={busy}
                  onClick={() => updateDailyGoal(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      ) : null}

      {error ? <p className="error-message" role="alert">{error}</p> : null}

      {authOpen && !session ? (
        <section className="auth-panel" aria-label="Авторизация">
          <div className="auth-tabs" role="tablist" aria-label="Режим авторизации">
            <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Вход</button>
            <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Регистрация</button>
          </div>
          <form className="auth-form" onSubmit={submitAuth}>
            {authMode === "register" ? (
              <label>
                Имя
                <input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ваше имя" />
              </label>
            ) : null}
            <label>
              Email
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              Пароль
              <input
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                required
                minLength={10}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="От 10 до 72 символов"
              />
            </label>
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={() => setAuthOpen(false)}>Отмена</button>
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? "Подключение…" : authMode === "login" ? "Войти" : "Создать аккаунт"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!lessonStarted ? (
        <>
          <section className="setup-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">НОВЫЙ УРОК</p>
                <h2>Выберите полезный объём на сейчас</h2>
              </div>
              <p>По умолчанию используются 30 due-элементов. Смешанный режим чередует части речи, а не выдаёт однотипные серии.</p>
            </div>

            <fieldset className="option-group">
              <legend>Раздел</legend>
              <div className="source-grid">
                {SOURCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`option-card ${source === option.value ? "selected" : ""}`}
                    onClick={() => setSource(option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="setup-row">
              <fieldset className="option-group compact-group">
                <legend>Размер блока</legend>
                <div className="segmented-control">
                  {SIZE_OPTIONS.map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      className={lessonSize === option.value ? "selected" : ""}
                      onClick={() => setLessonSize(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="option-group mode-group">
                <legend>Формат</legend>
                <div className="mode-options">
                  {MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={studyMode === option.value ? "selected" : ""}
                      onClick={() => setStudyMode(option.value)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="setup-actions">
              <p>{source === "phrases" ? "Технические фразы доступны без входа; их прогресс пока хранится только в сессии." : session ? `${progress?.dueNow ?? 0} слов доступны к повторению сейчас.` : "Для персональной очереди и сохранения прогресса требуется вход."}</p>
              <button className="primary-button large-button" type="button" disabled={busy} onClick={() => startLesson()}>
                {busy ? "Формируем блок…" : studyMode === "all" ? "Открыть весь блок" : "Начать урок"}
              </button>
            </div>
          </section>

          <section className="phrases-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TOP TECHNICAL PHRASES</p>
                <h2>Учите рабочие формулировки целиком</h2>
              </div>
              <p>Фразы сгруппированы по инцидентам, troubleshooting, архитектуре, data engineering, delivery и release-коммуникации.</p>
            </div>
            <div className="phrase-preview-grid">
              {TECHNICAL_PHRASES.slice(0, 6).map((phrase) => (
                <article className="phrase-preview" key={phrase.id}>
                  <span>{phrase.topic}</span>
                  <strong>{phrase.prompt}</strong>
                  <small>{phrase.answer}</small>
                </article>
              ))}
            </div>
            <div className="phrase-actions">
              <button className="secondary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: "all", mode: "all" })}>Посмотреть все фразы</button>
              <button className="primary-button" type="button" onClick={() => startLesson(session, { source: "phrases", size: 30, mode: "recall" })}>Тренировать фразы</button>
            </div>
          </section>
        </>
      ) : studyMode === "all" ? (
        <section className="all-items-panel">
          <div className="study-toolbar">
            <button className="secondary-button" type="button" onClick={closeLesson}>← Назад к настройкам</button>
            <span>{items.length} элементов · {SOURCE_OPTIONS.find((option) => option.value === source)?.label}</span>
          </div>
          <div className="all-items-list">
            {items.map((item, index) => (
              <article className="all-item" key={item.id}>
                <div className="all-item-number">{index + 1}</div>
                <div>
                  <p className="item-tags">{item.partOfSpeech} · {item.topic || "общая лексика"}</p>
                  <h3>{item.prompt}</h3>
                  {item.cloze ? <p className="cloze-line">{item.cloze}</p> : null}
                  <strong>{item.answer}</strong>
                  {item.examples[0] ? <p>{item.examples[0]}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : lessonComplete ? (
        <section className="lesson lesson-complete">
          <div>
            <p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p>
            <h2>{items.length ? "Результаты сохранены" : "Нет элементов для выбранного раздела"}</h2>
            <p>
              {items.length
                ? `Знал: ${knownCount}. Почти: ${almostCount}. Не знал: ${againCount}. ${session && progress ? `Сегодня выполнено ${progress.reviewsToday} из ${progress.dailyGoal}.` : ""}`
                : "Измените раздел, размер блока или откройте технические фразы."}
            </p>
          </div>
          <div className="completion-actions">
            <button className="secondary-button" type="button" onClick={closeLesson}>К настройкам</button>
            <button className="primary-button" type="button" disabled={busy} onClick={() => startLesson()}>Следующий блок</button>
          </div>
        </section>
      ) : currentItem ? (
        <section className="study-card" aria-live="polite">
          <div className="study-toolbar">
            <button className="secondary-button" type="button" onClick={previousItem}>← Назад</button>
            <div className="progress-wrap" aria-label={`Элемент ${currentIndex + 1} из ${items.length}`}>
              <div className="progress-meta">
                <span>{currentIndex + 1} / {items.length}</span>
                <span>{ratingValues.length} оценено</span>
              </div>
              <div className="progress-track"><span style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }} /></div>
            </div>
            <button className="secondary-button" type="button" onClick={closeLesson}>Завершить</button>
          </div>

          <div className="study-header">
            <div>
              <p className="eyebrow">{currentItem.kind === "phrase" ? "ТЕХНИЧЕСКАЯ ФРАЗА" : "СЛОВО"}</p>
              <p className="word-meta">{currentItem.partOfSpeech} · {currentItem.topic || "общая лексика"}</p>
            </div>
            <span className="badge">{currentRating ? ratingLabel(currentRating) : currentItem.status === "new" ? "Новое" : "Повторение"}</span>
          </div>

          <div className="word-face">
            {currentItem.kind === "phrase" && currentItem.cloze && !revealed ? (
              <>
                <p className="cloze-label">Восстановите пропуск</p>
                <h2 className="phrase-cloze">{currentItem.cloze}</h2>
              </>
            ) : (
              <h2 className={currentItem.kind === "phrase" ? "phrase-title" : "word-title"}>{currentItem.prompt}</h2>
            )}
            {currentItem.phonetic ? <p className="phonetic">{currentItem.phonetic}</p> : null}

            {!revealed && studyMode === "recall" ? (
              <div className="recall-area">
                <label htmlFor="typed-answer">Введите перевод или смысл своими словами</label>
                <input
                  id="typed-answer"
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && typedAnswer.trim()) setRevealed(true);
                  }}
                  placeholder="Ваш ответ"
                  autoComplete="off"
                />
                <div className="recall-actions">
                  <button className="secondary-button" type="button" onClick={() => setShowChoices((value) => !value)}>
                    {showChoices ? "Скрыть варианты" : "Посмотреть варианты ответов"}
                  </button>
                  <button className="primary-button" type="button" onClick={() => setRevealed(true)}>
                    {typedAnswer.trim() ? "Сверить ответ" : "Показать ответ"}
                  </button>
                </div>
              </div>
            ) : null}

            {!revealed && showChoices ? (
              <div className="answer-options" role="group" aria-label="Варианты ответов">
                {answerOptions.map((answer) => (
                  <button key={answer} type="button" onClick={() => chooseAnswer(answer)}>{answer}</button>
                ))}
              </div>
            ) : null}

            {revealed ? (
              <div className="answer-block">
                {currentItem.kind === "phrase" ? <h3>{currentItem.prompt}</h3> : null}
                <strong>{currentItem.answer}</strong>
                {typedAnswer.trim() ? (
                  <p className={literalMatch ? "match-message success" : "match-message"}>
                    {literalMatch ? "Ответ совпал с эталоном." : `Ваш ответ: ${typedAnswer}`}
                  </p>
                ) : null}
                {selectedAnswer ? (
                  <p className={selectedAnswer === currentItem.answer ? "match-message success" : "match-message error"}>
                    {selectedAnswer === currentItem.answer ? "Верный вариант." : `Вы выбрали: ${selectedAnswer}`}
                  </p>
                ) : null}
                {currentItem.examples.length ? (
                  <ul>{currentItem.examples.slice(0, 2).map((example) => <li key={example}>{example}</li>)}</ul>
                ) : null}
                {currentItem.note ? <p>{currentItem.note}</p> : null}
              </div>
            ) : null}
          </div>

          {revealed ? (
            currentRating ? (
              <div className="rating-panel">
                <span>Оценка сохранена: {ratingLabel(currentRating)}</span>
                <button className="primary-button" type="button" onClick={nextItem}>
                  {currentIndex + 1 === items.length ? "К результатам" : "Дальше"}
                </button>
              </div>
            ) : (
              <div className="rating-panel">
                <span>Насколько уверенно вспомнили?</span>
                <div className="rating-actions">
                  <button className="rating-again" type="button" disabled={reviewing} onClick={() => rateCurrent("again")}>Не знал</button>
                  <button className="rating-almost" type="button" disabled={reviewing} onClick={() => rateCurrent("almost")}>Почти</button>
                  <button className="rating-known" type="button" disabled={reviewing} onClick={() => rateCurrent("known")}>{reviewing ? "Сохраняем…" : "Знал"}</button>
                </div>
              </div>
            )
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
