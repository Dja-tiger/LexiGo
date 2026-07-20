"use client";

import dynamic from "next/dynamic";
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
import { AccountDataPanel } from "./account-data-panel";
import { AccountSecurityPanel } from "./account-security-panel";
import { ReviewOutboxRuntime } from "./review-outbox-runtime";

const AUTO_RESTORE_DELAYS_MS = [2000, 5000, 15_000] as const;
const SESSION_RESTORED_EVENT = "lexigo:session-restored";

type SessionScreenReason = "required" | "expired" | "forbidden";

function ProductShellLoading() {
  return (
    <main className="lx-bootstrap" aria-live="polite" aria-busy="true">
      <div className="lx-bootstrap-mark">L</div>
      <strong>LexiGo</strong>
      <span>Загружаем интерфейс…</span>
    </main>
  );
}

const LexigoPremiumApp = dynamic(
  () => import("./lexigo-premium-app").then((module) => module.LexigoPremiumApp),
  {
    ssr: false,
    loading: ProductShellLoading,
  },
);

function currentReturnTo(): string | null {
  if (!window.location.pathname.startsWith("/lesson/")) return null;
  return `${window.location.pathname}${window.location.search}`;
}

function profileHistoryState() {
  return createNavigationHistoryState({ view: "profile" }, { x: 0, y: 0 });
}

function moveToSessionScreen(reason: SessionScreenReason, returnTo: string | null = currentReturnTo()): void {
  const params = new URLSearchParams({ session: reason });
  if (returnTo) params.set("return_to", returnTo);
  window.history.replaceState(profileHistoryState(), "", `/profile?${params.toString()}`);
}

export function LexigoBootstrappedApp() {
  const [initialSession, setInitialSession] = useState<Session | null | undefined>(undefined);
  const [notice, setNotice] = useState<RequestProblem | null>(null);
  const [accountNotice, setAccountNotice] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreRecoverable, setRestoreRecoverable] = useState(false);

  const retryRestore = useCallback(() => {
    setInitialSession(undefined);
    setNotice(null);
    setAccountNotice("");
    setRestoreRecoverable(false);
    setRestoreAttempt((current) => current + 1);
  }, []);

  const handleAccountDeleted = useCallback(() => {
    setInitialSession(null);
    setNotice(null);
    setRestoreRecoverable(false);
    setAccountNotice("Аккаунт и связанные учебные данные удалены.");
    window.history.replaceState(profileHistoryState(), "", "/profile?account=deleted");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function preflightSession() {
      try {
        const restored = await restoreSession();
        if (cancelled) return;
        if (restored === null && window.location.pathname.startsWith("/lesson/")) {
          moveToSessionScreen("required");
        }
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
      <main className="lx-bootstrap" aria-live="polite" aria-busy="true">
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
      {accountNotice ? (
        <div className="lx-session-notice success" role="status">
          <div>
            <strong>Аккаунт удалён</strong>
            <span>{accountNotice}</span>
          </div>
        </div>
      ) : null}
      <LexigoPremiumApp
        key={initialSession?.tokens.accessToken ?? "guest"}
        initialSession={initialSession}
      />
      {initialSession ? (
        <>
          <AccountSecurityPanel session={initialSession} onSessionExpired={retryRestore} />
          <AccountDataPanel
            session={initialSession}
            onSessionExpired={retryRestore}
            onAccountDeleted={handleAccountDeleted}
          />
        </>
      ) : null}
    </>
  );
}
