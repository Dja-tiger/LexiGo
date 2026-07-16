"use client";

import { useEffect, useState } from "react";

import { restoreSession, SessionRefreshError, type Session } from "../lib/auth-session";
import { CalendarReminderIntegration } from "./calendar-reminder-integration";
import { EnhancedUIInteractions } from "./enhanced-ui-interactions";
import { LexigoPremiumApp } from "./lexigo-premium-app";

function moveToExpiredSessionScreen(): void {
  const target = new URL(window.location.href);
  target.search = "?view=profile&session=expired";
  window.history.replaceState({ lexigo: true, view: "profile" }, "", target.pathname + target.search);
}

export function LexigoBootstrappedApp() {
  const [initialSession, setInitialSession] = useState<Session | null | undefined>(undefined);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function preflightSession() {
      try {
        const restored = await restoreSession();
        if (!cancelled) setInitialSession(restored);
      } catch (requestError) {
        if (cancelled) return;
        setInitialSession(null);
        if (requestError instanceof SessionRefreshError && (requestError.status === 401 || requestError.status === 403)) {
          moveToExpiredSessionScreen();
          setNotice("Сессия истекла. Войдите снова, чтобы продолжить обучение.");
        } else {
          setNotice("Не удалось восстановить сессию. Проверьте подключение к сети.");
        }
      }
    }

    void preflightSession();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <EnhancedUIInteractions />
      <CalendarReminderIntegration />
      {notice ? <div className="lx-session-notice" role="status">{notice}</div> : null}
      <LexigoPremiumApp initialSession={initialSession} />
    </>
  );
}
