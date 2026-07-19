"use client";

import { useCallback, useEffect, useState } from "react";

import {
  isDefinitiveSessionRefreshError,
  restoreSession,
  SessionRefreshError,
  type Session,
} from "../lib/auth-session";
import { createNavigationHistoryState } from "../lib/navigation-history";
import { describeRequestFailure, type RequestProblem } from "../lib/request-failure";
import { subscribeToSessionResume } from "../lib/session-resume";
import { LexigoPremiumApp } from "./lexigo-premium-app";
import { ReviewOutboxRuntime } from "./review-outbox-runtime";

const AUTO_RESTORE_DELAYS_MS = [2000, 5000, 15_000] as const;
const SESSION_RESTORED_EVENT = "lexigo:session-restored";

function moveToSessionScreen(reason: "expired" | "forbidden"): void {
  const target = { view: "profile" as const };
  const state = createNavigationHistoryState(target, { x: 0, y: 0 });
  window.history.replaceState(state, "", `/profile?session=${reason}`);
}

export function LexigoBootstrappedApp() {
  const [initialSession, setInitialSession] = useState<Session | null | undefined>(undefined);
  const [notice, setNotice] = useState<RequestProblem | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreRecoverable, setRestoreRecoverable] = useState(false);

  const retryRestore = useCallback(() => {
    setInitialSession(undefined);
    setNotice(null);
    setRestoreRecoverable(false);
    setRestoreAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function preflightSession() {
      try {
        const restored = await restoreSession();
        if (cancelled) return;
        setInitialSession(restored);
        setNotice(null);
        setRestoreRecoverable(false);
      } catch (requestError) {
        if (cancelled) return;
        const problem = describeRequestFailure(requestError, "сессию аккаунта");
        setNotice(problem);

        if (isDefinitiveSessionRefreshError(requestError)) {
          setInitialSession(null);
          setRestoreRecoverable(false);
          if (requestError instanceof SessionRefreshError) {
            moveToSessionScreen(requestError.kind === "forbidden" ? "forbidden" : "expired");
          }
          return;
        }

        // iOS can resume the PWA before the WebKit network process is ready.
        // Preserve the bootstrap state and retry instead of presenting a false logout.
        setInitialSession(undefined);
        setRestoreRecoverable(true);
      }
    }

    void preflightSession();
    return () => {
      cancelled = true;
    };
  }, [restoreAttempt]);

  useEffect(() => {
    if (!restoreRecoverable) return;

    let retryScheduled = false;
    const requestRetry = () => {
      if (retryScheduled || navigator.onLine === false || document.visibilityState === "hidden") return;
      retryScheduled = true;
      retryRestore();
    };
    const timer = window.setTimeout(
      requestRetry,
      AUTO_RESTORE_DELAYS_MS[Math.min(restoreAttempt, AUTO_RESTORE_DELAYS_MS.length - 1)],
    );
    const unsubscribe = subscribeToSessionResume(requestRetry);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [restoreAttempt, restoreRecoverable, retryRestore]);

  useEffect(() => {
    const clearResolvedNotice = () => setNotice(null);
    window.addEventListener(SESSION_RESTORED_EVENT, clearResolvedNotice);
    return () => window.removeEventListener(SESSION_RESTORED_EVENT, clearResolvedNotice);
  }, []);

  if (initialSession === undefined) {
    if (restoreRecoverable && notice) {
      return (
        <main className="lx-bootstrap lx-bootstrap--recoverable" role="alert" aria-live="polite">
          <div className="lx-bootstrap-mark">L</div>
          <strong>{notice.title}</strong>
          <span>{notice.message}</span>
          <small>Сессия не удалена. Пароль вводить заново не нужно.</small>
          <button type="button" className="lx-button primary" onClick={retryRestore}>
            Повторить восстановление
          </button>
        </main>
      );
    }

    return (
      <main className="lx-bootstrap" aria-live="polite">
        <div className="lx-bootstrap-mark">L</div>
        <strong>LexiGo</strong>
        <span>Восстанавливаем сессию…</span>
      </main>
    );
  }

  return (
    <>
      <ReviewOutboxRuntime session={initialSession} />
      {notice ? (
        <div className={`lx-session-notice ${notice.kind}`} role="alert">
          <div>
            <strong>{notice.title}</strong>
            <span>{notice.message}</span>
          </div>
          {notice.retryable ? <button type="button" onClick={retryRestore}>Повторить</button> : null}
        </div>
      ) : null}
      <LexigoPremiumApp
        key={initialSession?.tokens.accessToken ?? "guest"}
        initialSession={initialSession}
      />
    </>
  );
}
