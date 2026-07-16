"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { apiUrl } from "../lib/api";

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

const SESSION_KEY = "lexigo.session.v1";

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
      // Keep the HTTP status when the server did not return JSON.
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

export function LexigoApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [words, setWords] = useState<DueWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSession(readSession()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const currentWord = words[currentIndex];
  const newCount = useMemo(() => words.filter((word) => word.status === "new").length, [words]);
  const reviewCount = words.length - newCount;

  async function loadDueWords(current: Session): Promise<{ activeSession: Session; items: DueWord[] }> {
    try {
      const response = await requestJSON<DueResponse>(
        "/api/v1/words/due?limit=15",
        {},
        current.tokens.accessToken,
      );
      return { activeSession: current, items: response.items };
    } catch (requestError) {
      if (!(requestError instanceof APIError) || requestError.status !== 401) throw requestError;

      const tokens = await requestJSON<TokenPair>("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: current.tokens.refreshToken }),
      });
      const refreshed = { ...current, tokens };
      storeSession(refreshed);

      const response = await requestJSON<DueResponse>(
        "/api/v1/words/due?limit=15",
        {},
        refreshed.tokens.accessToken,
      );
      return { activeSession: refreshed, items: response.items };
    }
  }

  async function startLesson(activeSession = session) {
    if (!activeSession) {
      setAuthOpen(true);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await loadDueWords(activeSession);
      setSession(result.activeSession);
      storeSession(result.activeSession);
      setWords(result.items);
      setCurrentIndex(0);
      setRevealed(false);
      setLessonStarted(true);
      setLessonComplete(result.items.length === 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить слова");
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
      await startLesson(authenticated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось выполнить вход");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const current = session;
    setSession(null);
    storeSession(null);
    setWords([]);
    setCurrentIndex(0);
    setRevealed(false);
    setLessonStarted(false);
    setLessonComplete(false);

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

  function nextWord() {
    if (currentIndex + 1 >= words.length) {
      setLessonComplete(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setRevealed(false);
  }

  const cards = [
    {
      label: "Новые слова",
      value: words.length ? String(newCount) : "15",
      hint: words.length ? "в текущей сессии" : "дневной лимит",
    },
    {
      label: "Повторить",
      value: words.length ? String(reviewCount) : "—",
      hint: "слова со сроком повторения",
    },
    {
      label: "Прогресс",
      value: lessonStarted ? `${Math.min(currentIndex + 1, words.length)} / ${words.length}` : "0",
      hint: "текущий урок",
    },
    { label: "Словарь", value: "579", hint: "технических и академических слов" },
  ];

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AI ENGLISH COACH</p>
          <h1>LexiGo</h1>
          <p className="subtitle">Английский через интервальные повторения и реальные задачи Data Engineer.</p>
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

      <section className="grid" aria-label="Статистика">
        {cards.map((card) => (
          <article className="card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

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
                <input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Джалиль" />
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
                {busy ? "Подключение…" : authMode === "login" ? "Войти и начать" : "Создать аккаунт"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {!lessonStarted ? (
        <section className="lesson">
          <div>
            <p className="eyebrow">СЕГОДНЯ</p>
            <h2>Первый учебный цикл</h2>
            <p>Войдите или зарегистрируйтесь, чтобы получить 15 слов, срок изучения которых наступил.</p>
          </div>
          <button className="primary-button" type="button" disabled={busy} onClick={() => startLesson()}>
            {busy ? "Загрузка…" : session ? "Начать урок" : "Войти и начать"}
          </button>
        </section>
      ) : lessonComplete ? (
        <section className="lesson lesson-complete">
          <div>
            <p className="eyebrow">ГОТОВО</p>
            <h2>{words.length ? "Сессия просмотрена" : "Нет слов к повторению"}</h2>
            <p>
              {words.length
                ? `Вы просмотрели ${words.length} слов. Сохранение оценки ответа появится после добавления review endpoint.`
                : "Все назначенные слова пока изучены. Можно проверить снова позже."}
            </p>
          </div>
          <button className="primary-button" type="button" disabled={busy} onClick={() => startLesson()}>Обновить</button>
        </section>
      ) : currentWord ? (
        <section className="study-card" aria-live="polite">
          <div className="study-header">
            <div>
              <p className="eyebrow">СЛОВО {currentIndex + 1} ИЗ {words.length}</p>
              <p className="word-meta">{currentWord.partOfSpeech} · {currentWord.topic || "общая лексика"}</p>
            </div>
            <span className="badge">{currentWord.status === "new" ? "Новое" : "Повторение"}</span>
          </div>

          <div className="word-face">
            <h2 className="word-title">{currentWord.lemma}</h2>
            {currentWord.phonetic ? <p className="phonetic">{currentWord.phonetic}</p> : null}
            {revealed ? (
              <div className="answer-block">
                <strong>{currentWord.translation}</strong>
                {currentWord.examples.length ? (
                  <ul>{currentWord.examples.slice(0, 2).map((example) => <li key={example}>{example}</li>)}</ul>
                ) : null}
                {currentWord.note ? <p>{currentWord.note}</p> : null}
              </div>
            ) : (
              <p className="study-prompt">Вспомните перевод, затем откройте ответ.</p>
            )}
          </div>

          <div className="study-actions">
            <button className="primary-button" type="button" onClick={revealed ? nextWord : () => setRevealed(true)}>
              {revealed ? (currentIndex + 1 === words.length ? "Завершить" : "Следующее слово") : "Показать перевод"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="roadmap">
        <h2>Что уже работает</h2>
        <ol>
          <li>Регистрация, вход, refresh token и выход.</li>
          <li>Получение персональных слов из PostgreSQL.</li>
          <li>Просмотр карточек с переводом и примерами.</li>
          <li>Следующий этап — оценка ответа и сохранение интервального прогресса.</li>
        </ol>
      </section>
    </main>
  );
}
