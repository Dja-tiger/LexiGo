"use client";

import { useEffect, useState } from "react";

import { apiUrl } from "../lib/api";
import { EnhancedUIInteractions } from "./enhanced-ui-interactions";
import { LexigoPremiumApp } from "./lexigo-premium-app";

type StoredSession = {
  user: unknown;
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
};

type TokenPair = StoredSession["tokens"];

const SESSION_KEY = "lexigo.session.v1";

function readStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed.user || !parsed.tokens?.refreshToken) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed as StoredSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function LexigoBootstrappedApp() {
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function preflightSession() {
      const stored = readStoredSession();
      if (!stored) {
        if (new URLSearchParams(window.location.search).get("session") === "expired") {
          setNotice("Сессия истекла. Войдите снова, чтобы продолжить обучение.");
        }
        setReady(true);
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/v1/auth/refresh"), {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: stored.tokens.refreshToken }),
        });

        if (response.ok) {
          const tokens = (await response.json()) as TokenPair;
          window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...stored, tokens }));
        } else if (response.status === 401 || response.status === 403) {
          window.localStorage.removeItem(SESSION_KEY);
          const target = new URL(window.location.href);
          target.search = "?view=profile&session=expired";
          window.history.replaceState({ lexigo: true, view: "profile" }, "", target.pathname + target.search);
          setNotice("Сессия истекла. Войдите снова, чтобы продолжить обучение.");
        }
      } catch {
        // Offline or temporary network failures must not destroy a potentially valid session.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void preflightSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
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
      {notice ? <div className="lx-session-notice" role="status">{notice}</div> : null}
      <LexigoPremiumApp />
    </>
  );
}
