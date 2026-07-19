"use client";

import { useEffect, useState } from "react";

import { restoreSession, SessionRefreshError, type Session } from "../lib/auth-session";
import { describeRequestFailure, type RequestProblem } from "../lib/request-failure";
import { LexigoPremiumApp } from "./lexigo-premium-app";
import { ReviewOutboxRuntime } from "./review-outbox-runtime";

function moveToSessionScreen(reason: "expired" | "forbidden" | "invalid"): void {
  const target = new URL(window.location.href);
  target.search = `?view=profile&session=${reason}`;
  window.history.replaceState({ lexigo: true, view: "profile" }, "", target.pathname + target.search);
}

export function LexigoBootstrappedApp() {
  const [initialSession, setInitialSession] = useState<Session | null | undefined>(undefined);
  const [notice, setNotice] = useState<RequestProblem | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function preflightSession() {
      try {
        const restored = await restoreSession();
        if (cancelled) return;
        setInitialSession(restored);
        setNotice(null);
      } catch (requestError) {
        if (cancelled) return;
        const problem = describeRequestFailure(requestError, "сессию аккаунта");
        setInitialSession(null);
        setNotice(problem);
        if (requestError instanceof SessionRefreshError) {
          if (requestError.kind === "unauthorized") moveToSessionScreen("expired");
          else if (requestError.kind === "forbidden") moveToSessionScreen("forbidden");
          else if (requestError.kind === "malformed") moveToSessionScreen("invalid");
        }
      }
    }

    void preflightSession();
    return () => {
      cancelled = true;
    };
  }, [restoreAttempt]);

  function retryRestore() {
    setInitialSession(undefined);
    setNotice(null);
    setRestoreAttempt((current) => current + 1);
  }

  if (initialSession === undefined) {
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
