"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  csrfTokenFromCookie,
  isSessionPayload,
  refreshSession,
  type Session,
} from "../lib/auth-session";
import {
  enqueueLessonReview,
  listLessonReviews,
  parseLessonReviewEndpoint,
  parseLessonReviewPayload,
  pruneSyncedLessonReviews,
  reviewOutboxSummary,
  reviewResponseDisposition,
  updateLessonReview,
  type ReviewOutboxRecord,
  type ReviewOutboxSummary,
} from "../lib/review-outbox";

const EMPTY_SUMMARY: ReviewOutboxSummary = {
  pending: 0,
  failed: 0,
  synced: 0,
  latestSyncedAt: "",
};

const REVIEW_SYNCED_EVENT = "lexigo:lesson-reviews-synced";
const SESSION_RESTORED_EVENT = "lexigo:session-restored";
const REVIEW_QUEUED_EVENT = "lexigo:lesson-review-queued";
const BACKGROUND_RELOAD_DELAY_MS = 1500;

type ErrorPayload = {
  code: string;
  message: string;
};

type AuthSessionAction = "adopt" | "clear";
type ConnectivityTone = "offline" | "pending" | "failed" | "synced";

type ConnectivityCopy = {
  title: string;
  message: string;
  tone: ConnectivityTone;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function responseError(response: Response): Promise<ErrorPayload> {
  try {
    const value: unknown = await response.clone().json();
    if (!isRecord(value)) return { code: `http_${response.status}`, message: response.statusText };
    const source = isRecord(value.error) ? value.error : value;
    return {
      code: typeof source.code === "string" ? source.code : `http_${response.status}`,
      message: typeof source.message === "string" ? source.message : response.statusText,
    };
  } catch {
    return { code: `http_${response.status}`, message: response.statusText };
  }
}

function queuedResponse(message: string, code = "lesson_review_queued"): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status: 503,
    headers: { "Content-Type": "application/json", "X-Lexigo-Review-Queued": "true" },
  });
}

function offlineLessonStartResponse(): Response {
  return new Response(JSON.stringify({
    error: {
      code: "lesson_start_offline",
      message: "Нет подключения к сети. Начните новый урок после восстановления соединения.",
    },
  }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

function conflictResponse(message: string): Response {
  return new Response(JSON.stringify({ error: { code: "lesson_review_already_queued", message } }), {
    status: 409,
    headers: { "Content-Type": "application/json" },
  });
}

function requestWithIdempotency(request: Request, idempotencyKey: string): Request {
  const headers = new Headers(request.headers);
  headers.set("Idempotency-Key", idempotencyKey);
  return new Request(request, { headers });
}

function authorizationToken(request: Request): string {
  const authorization = request.headers.get("Authorization")?.trim() ?? "";
  return authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
}

function authSessionAction(request: Request): AuthSessionAction | null {
  if (request.method.toUpperCase() !== "POST") return null;
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/v1/auth/logout") return "clear";
  if (
    pathname === "/api/v1/auth/login"
    || pathname === "/api/v1/auth/register"
    || pathname === "/api/v1/auth/refresh"
  ) {
    return "adopt";
  }
  return null;
}

function isNetworkLessonStart(request: Request): boolean {
  return request.method.toUpperCase() === "POST"
    && new URL(request.url).pathname === "/api/v1/lessons";
}

function currentNetworkFailureCode(): "network_offline" | "network_request_failed" {
  return navigator.onLine === false ? "network_offline" : "network_request_failed";
}

function pluralized(count: number, one: string, few: string, many: string): string {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  const last = count % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function bannerCopy(
  online: boolean,
  summary: ReviewOutboxSummary,
  syncing: boolean,
  recoverySynced: boolean,
  connectionRestored: boolean,
): ConnectivityCopy | null {
  if (summary.failed > 0) {
    return {
      title: "Требуется синхронизация урока",
      message: `${summary.failed} ${pluralized(summary.failed, "ответ конфликтует", "ответа конфликтуют", "ответов конфликтуют")} с серверным состоянием. Автоматическая повторная отправка остановлена.`,
      tone: "failed",
    };
  }
  if (!online) {
    return {
      title: "Нет подключения к сети",
      message: summary.pending > 0
        ? `${summary.pending} ${pluralized(summary.pending, "ответ сохранён", "ответа сохранены", "ответов сохранены")} на устройстве и будет отправлен после восстановления сети.`
        : "Новый сетевой урок не запускается. Оценку открытой карточки можно безопасно сохранить на устройстве.",
      tone: "offline",
    };
  }
  if (syncing || summary.pending > 0) {
    return {
      title: syncing ? "Синхронизируем ответы…" : "Ответ ожидает синхронизации",
      message: `${summary.pending} ${pluralized(summary.pending, "ответ сохранён", "ответа сохранены", "ответов сохранены")} в локальной очереди этого устройства.`,
      tone: "pending",
    };
  }
  if (recoverySynced) {
    return {
      title: "Ответ синхронизирован",
      message: "Прогресс и позиция урока подтверждены сервером.",
      tone: "synced",
    };
  }
  if (connectionRestored) {
    return {
      title: "Подключение восстановлено",
      message: "LexiGo снова может загружать материалы и синхронизировать локальную очередь.",
      tone: "synced",
    };
  }
  return null;
}

function formattedSyncTime(value: string): string {
  if (!value) return "Синхронизации ещё не было";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Время синхронизации недоступно";
  return `Последняя синхронизация: ${new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

export function ReviewOutboxRuntime({ session: initialSession }: { session: Session | null }) {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);
  const [summary, setSummary] = useState<ReviewOutboxSummary>(EMPTY_SUMMARY);
  const [syncing, setSyncing] = useState(false);
  const [recoverySynced, setRecoverySynced] = useState(false);
  const [connectionRestored, setConnectionRestored] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [activeUserID, setActiveUserID] = useState(initialSession?.user.id ?? "");
  const sessionRef = useRef(initialSession);
  const originalFetchRef = useRef<typeof globalThis.fetch | null>(null);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const reloadScheduledRef = useRef(false);

  const refreshSummary = useCallback(async () => {
    const userId = sessionRef.current?.user.id;
    if (!userId) {
      setSummary(EMPTY_SUMMARY);
      return;
    }
    try {
      await pruneSyncedLessonReviews();
      setSummary(await reviewOutboxSummary(userId));
    } catch (error) {
      console.error("[LexiGo] Review outbox summary failed", error);
    }
  }, []);

  const scheduleStateReload = useCallback(() => {
    if (reloadScheduledRef.current) return;
    reloadScheduledRef.current = true;
    window.dispatchEvent(new CustomEvent(REVIEW_SYNCED_EVENT));
    window.setTimeout(() => window.location.reload(), BACKGROUND_RELOAD_DELAY_MS);
  }, []);

  const syncPendingReviews = useCallback((): Promise<void> => {
    if (syncInFlightRef.current) return syncInFlightRef.current;
    const currentSession = sessionRef.current;
    const originalFetch = originalFetchRef.current;
    if (!currentSession || !originalFetch || navigator.onLine === false) return Promise.resolve();

    const synchronization = (async () => {
      let synchronized = 0;
      try {
        const records = (await listLessonReviews(currentSession.user.id))
          .filter((record) => record.status === "pending");
        if (records.length === 0) {
          await refreshSummary();
          return;
        }

        setRecoverySynced(false);
        setConnectionRestored(false);
        setSyncing(true);
        let activeSession = currentSession;
        for (const record of records) {
          let response = await sendQueuedReview(originalFetch, record, activeSession);
          if (response.status === 401) {
            try {
              activeSession = await refreshSession({ redirectOnInvalid: false });
              sessionRef.current = activeSession;
              setActiveUserID(activeSession.user.id);
              window.dispatchEvent(new Event(SESSION_RESTORED_EVENT));
              if (activeSession.user.id !== record.userId) break;
              response = await sendQueuedReview(originalFetch, record, activeSession);
            } catch (error) {
              await updateLessonReview(record.operationKey, {
                status: "pending",
                attempts: record.attempts + 1,
                lastErrorCode: "session_refresh_failed",
                lastErrorMessage: error instanceof Error ? error.message : "Session refresh failed",
              });
              break;
            }
          }

          const disposition = reviewResponseDisposition(response.status);
          if (disposition === "synced") {
            await updateLessonReview(record.operationKey, {
              status: "synced",
              attempts: record.attempts + 1,
              lastErrorCode: "",
              lastErrorMessage: "",
            });
            synchronized += 1;
            continue;
          }
          const failure = await responseError(response);
          if (disposition === "failed") {
            await updateLessonReview(record.operationKey, {
              status: "failed",
              attempts: record.attempts + 1,
              lastErrorCode: failure.code,
              lastErrorMessage: failure.message,
            });
            break;
          }
          await updateLessonReview(record.operationKey, {
            status: "pending",
            attempts: record.attempts + 1,
            lastErrorCode: failure.code,
            lastErrorMessage: failure.message,
          });
          break;
        }
      } catch (error) {
        console.error("[LexiGo] Review outbox synchronization failed", error);
      } finally {
        setSyncing(false);
        await refreshSummary();
      }
      if (synchronized > 0) {
        setRecoverySynced(true);
        setConnectionMessage("Локально сохранённый ответ принят сервером. Обновляем позицию урока.");
        scheduleStateReload();
      }
    })().finally(() => {
      syncInFlightRef.current = null;
    });
    syncInFlightRef.current = synchronization;
    return synchronization;
  }, [refreshSummary, scheduleStateReload]);

  const exposeQueuedReview = useCallback((record: ReviewOutboxRecord, message: string) => {
    setDetailsOpen(true);
    setConnectionMessage(message);
    window.dispatchEvent(new CustomEvent(REVIEW_QUEUED_EVENT, {
      detail: {
        lessonId: record.lessonId,
        wordId: record.wordId,
        lessonVersion: record.lessonVersion,
      },
    }));
  }, []);

  useEffect(() => {
    const originalFetch = globalThis.fetch.bind(globalThis);
    originalFetchRef.current = originalFetch;

    const interceptedFetch: typeof globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      const authAction = authSessionAction(request);
      if (authAction) {
        const response = await originalFetch(request);
        if (!response.ok) return response;
        if (authAction === "clear") {
          sessionRef.current = null;
          setActiveUserID("");
          setRecoverySynced(false);
          setConnectionRestored(false);
          setDetailsOpen(false);
          setSummary(EMPTY_SUMMARY);
          return response;
        }
        try {
          const payload: unknown = await response.clone().json();
          if (isSessionPayload(payload)) {
            sessionRef.current = payload;
            setActiveUserID(payload.user.id);
            window.dispatchEvent(new Event(SESSION_RESTORED_EVENT));
            void refreshSummary().then(() => syncPendingReviews());
          }
        } catch (error) {
          console.error("[LexiGo] Unable to adopt refreshed session for review outbox", error);
        }
        return response;
      }

      if (navigator.onLine === false && isNetworkLessonStart(request)) {
        return offlineLessonStartResponse();
      }
      if (request.method.toUpperCase() !== "POST") return originalFetch(request);
      const endpoint = parseLessonReviewEndpoint(request.url);
      if (!endpoint) return originalFetch(request);

      const activeSession = sessionRef.current;
      if (!activeSession) return originalFetch(request);
      const token = authorizationToken(request);
      if (token && token !== activeSession.tokens.accessToken) {
        sessionRef.current = {
          ...activeSession,
          tokens: { ...activeSession.tokens, accessToken: token },
        };
      }

      let requestBody: string;
      let payload: ReturnType<typeof parseLessonReviewPayload>;
      try {
        requestBody = await request.clone().text();
        payload = parseLessonReviewPayload(JSON.parse(requestBody) as unknown);
      } catch {
        return originalFetch(request);
      }
      if (!payload) return originalFetch(request);
      const durableRequestBody = JSON.stringify(payload);

      let record: ReviewOutboxRecord;
      try {
        setRecoverySynced(false);
        setConnectionRestored(false);
        record = await enqueueLessonReview({
          userId: activeSession.user.id,
          endpoint: request.url,
          reviewEndpoint: endpoint,
          payload,
          requestBody: durableRequestBody,
        });
        await refreshSummary();
      } catch (error) {
        console.error("[LexiGo] Unable to persist lesson review before sending", error);
        return queuedResponse("Не удалось безопасно сохранить ответ на устройстве. Освободите место в браузере и повторите попытку.", "lesson_review_storage_failed");
      }

      if (record.requestBody !== durableRequestBody) {
        return conflictResponse("Для этой карточки уже сохранена другая оценка. Дождитесь синхронизации исходного ответа.");
      }
      if (navigator.onLine === false) {
        const message = "Ответ сохранён на устройстве. Переход к следующей карточке станет доступен после восстановления сети.";
        exposeQueuedReview(record, message);
        return queuedResponse(message);
      }

      try {
        const response = await originalFetch(requestWithIdempotency(request, record.idempotencyKey));
        const disposition = reviewResponseDisposition(response.status);
        if (disposition === "synced") {
          await updateLessonReview(record.operationKey, {
            status: "synced",
            attempts: record.attempts + 1,
            lastErrorCode: "",
            lastErrorMessage: "",
          });
        } else if (disposition === "failed") {
          const failure = await responseError(response);
          await updateLessonReview(record.operationKey, {
            status: "failed",
            attempts: record.attempts + 1,
            lastErrorCode: failure.code,
            lastErrorMessage: failure.message,
          });
        } else if (disposition === "retry") {
          const failure = await responseError(response);
          await updateLessonReview(record.operationKey, {
            status: "pending",
            attempts: record.attempts + 1,
            lastErrorCode: failure.code,
            lastErrorMessage: failure.message,
          });
          await refreshSummary();
          const message = "Ответ сохранён на устройстве. LexiGo повторит отправку после восстановления сервиса.";
          exposeQueuedReview(record, message);
          return queuedResponse(message);
        }
        await refreshSummary();
        return response;
      } catch (error) {
        await updateLessonReview(record.operationKey, {
          status: "pending",
          attempts: record.attempts + 1,
          lastErrorCode: currentNetworkFailureCode(),
          lastErrorMessage: error instanceof Error ? error.message : "Network request failed",
        });
        await refreshSummary();
        const message = "Ответ сохранён на устройстве. LexiGo отправит его автоматически после восстановления соединения.";
        exposeQueuedReview(record, message);
        return queuedResponse(message);
      }
    };

    globalThis.fetch = interceptedFetch;
    void refreshSummary().then(() => syncPendingReviews());

    return () => {
      if (globalThis.fetch === interceptedFetch) globalThis.fetch = originalFetch;
      originalFetchRef.current = null;
    };
  }, [exposeQueuedReview, refreshSummary, syncPendingReviews]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setConnectionRestored(true);
      setConnectionMessage("Подключение восстановлено. Проверяем локальную очередь ответов.");
      void syncPendingReviews();
    };
    const handleOffline = () => {
      setOnline(false);
      setRecoverySynced(false);
      setConnectionRestored(false);
      setConnectionMessage("Соединение недоступно. Сетевые действия временно приостановлены.");
      void refreshSummary();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setOnline(navigator.onLine !== false);
        void syncPendingReviews();
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshSummary, syncPendingReviews]);

  const verifyConnection = useCallback(() => {
    const detectedOnline = navigator.onLine !== false;
    setOnline(detectedOnline);
    if (!detectedOnline) {
      setConnectionMessage("Соединение пока не восстановлено. Локально сохранённые ответы остаются на устройстве.");
      return;
    }
    setConnectionRestored(true);
    setConnectionMessage("Подключение обнаружено. Проверяем очередь ответов.");
    void syncPendingReviews();
  }, [syncPendingReviews]);

  const dismissRecoveredStatus = useCallback(() => {
    setRecoverySynced(false);
    setConnectionRestored(false);
    setConnectionMessage("");
    setDetailsOpen(false);
  }, []);

  const copy = bannerCopy(online, summary, syncing, recoverySynced, connectionRestored);
  if (!activeUserID || !copy) return null;

  const panelTitle = online ? "Синхронизация обучения" : "Работа без сети";
  const primaryActionLabel = online ? "Повторить синхронизацию" : "Проверить соединение";

  return (
    <div
      className="lx-system-connectivity"
      data-connectivity-state={copy.tone}
      data-online={online ? "true" : "false"}
      data-pending-reviews={summary.pending}
    >
      <aside className={`lx-review-sync lx-review-sync--${copy.tone}`} aria-label="Состояние подключения и синхронизации">
        <span className="lx-review-sync__indicator" aria-hidden="true" />
        <div
          className="lx-review-sync__copy"
          role={copy.tone === "failed" ? "alert" : "status"}
          aria-live={copy.tone === "failed" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          <strong>{copy.title}</strong>
          <span>{copy.message}</span>
        </div>
        <div className="lx-review-sync__actions">
          <button
            type="button"
            aria-expanded={detailsOpen}
            aria-controls="lexigo-connectivity-panel"
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {detailsOpen ? "Скрыть" : "Подробнее"}
          </button>
          {copy.tone === "failed" ? (
            <button type="button" onClick={() => window.location.reload()}>Обновить состояние</button>
          ) : copy.tone === "pending" && online && !syncing ? (
            <button type="button" onClick={() => void syncPendingReviews()}>Повторить сейчас</button>
          ) : copy.tone === "synced" ? (
            <button type="button" onClick={dismissRecoveredStatus}>Готово</button>
          ) : null}
        </div>
      </aside>

      {detailsOpen ? (
        <section
          id="lexigo-connectivity-panel"
          className="lx-connectivity-panel"
          aria-labelledby="lexigo-connectivity-title"
        >
          <div className="lx-connectivity-panel__heading">
            <span className="lx-connectivity-panel__icon" aria-hidden="true">{online ? "↻" : "⌁"}</span>
            <div>
              <h2 id="lexigo-connectivity-title">{panelTitle}</h2>
              <p>{online
                ? "Состояние основано на локальной очереди этого устройства и ответах сервера."
                : "LexiGo сохраняет только оценку открытой карточки. Полный переход по уроку остаётся серверным."}</p>
            </div>
          </div>

          <div className="lx-connectivity-panel__metrics" aria-label="Сводка локальной очереди">
            <div><strong>{summary.pending}</strong><span>Ожидают отправки</span></div>
            <div><strong>{summary.failed}</strong><span>Требуют проверки</span></div>
            <div><strong>{summary.synced}</strong><span>Синхронизировано за сутки</span></div>
          </div>

          <ul className="lx-connectivity-panel__contract">
            <li>Введённый ответ остаётся на текущей карточке.</li>
            <li>Оценка записывается в IndexedDB до первой сетевой отправки.</li>
            <li>Следующая карточка откроется только после подтверждения серверной позиции.</li>
            <li>Новый урок, каталог и обновление прогресса требуют сети.</li>
          </ul>

          <p>{formattedSyncTime(summary.latestSyncedAt)}</p>
          <p className="lx-connectivity-panel__status" role="status" aria-live="polite" aria-atomic="true">
            {connectionMessage}
          </p>

          <div className="lx-connectivity-panel__actions">
            <button type="button" onClick={() => setDetailsOpen(false)}>Продолжить в текущем экране</button>
            <button
              className="primary"
              type="button"
              disabled={syncing}
              onClick={online ? () => void syncPendingReviews() : verifyConnection}
            >
              {syncing ? "Синхронизируем…" : primaryActionLabel}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

async function sendQueuedReview(
  originalFetch: typeof globalThis.fetch,
  record: ReviewOutboxRecord,
  session: Session,
): Promise<Response> {
  const headers = new Headers({
    "Accept": "application/json",
    "Authorization": `Bearer ${session.tokens.accessToken}`,
    "Content-Type": "application/json",
    "Idempotency-Key": record.idempotencyKey,
  });
  const csrfToken = csrfTokenFromCookie();
  if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  return originalFetch(record.endpoint, {
    method: "POST",
    headers,
    body: record.requestBody,
    credentials: "include",
  });
}
