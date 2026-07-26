"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import {
  isDefinitiveSessionRefreshError,
  SessionRefreshError,
  type Session,
} from "../lib/auth-session";
import { createNavigationHistoryState } from "../lib/navigation-history";
import { describeRequestFailure, type RequestProblem } from "../lib/request-failure";
import {
  adoptBootstrappedSession,
  invalidateBootstrappedSession,
  restoreBootstrappedSession,
} from "../lib/session-bootstrap";
import { subscribeToSessionResume } from "../lib/session-resume";
import { AccountDataPanel } from "./account-data-panel";
import { AccountEmailPanel } from "./account-email-panel";
import { AccountSecurityPanel } from "./account-security-panel";
import { EmailChangeConfirmation } from "./email-change-confirmation";
import { ReviewOutboxRuntime } from "./review-outbox-runtime";

const AUTO_RESTORE_DELAYS_MS = [2000, 5000, 15_000] as const;
const SESSION_RESTORED_EVENT = "lexigo:session-restored";
const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";

type SessionScreenReason = "required" | "expired" | "forbidden";
type RouteGraph = "dictionary" | "product";

type AccountNotice = {
  title: string;
  message: string;
};

type LexigoBootstrappedAppProps = {
  pathname: string;
};

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

const LexigoDictionaryApp = dynamic(
  () => import("./lexigo-dictionary-app").then((module) => module.LexigoDictionaryApp),
  {
    ssr: false,
    loading: ProductShellLoading,
  },
);

const LexigoProgressApp = dynamic(
  () => import("./lexigo-progress-app").then((module) => module.LexigoProgressApp),
  {
    ssr: false,
    loading: ProductShellLoading,
  },
);

const LexigoScenarioCatalogApp = dynamic(
  () => import("./lexigo-scenario-catalog-app").then((module) => module.LexigoScenarioCatalogApp),
  {
    ssr: false,
    loading: ProductShellLoading,
  },
);

const LexigoScenarioApp = dynamic(
  () => import("./lexigo-scenario-app").then((module) => module.LexigoScenarioApp),
  {
    ssr: false,
    loading: ProductShellLoading,
  },
);

function isScenarioCatalogRoute(pathname: string): boolean {
  return pathname === "/scenarios";
}

function isScenarioDetailRoute(pathname: string): boolean {
  return pathname.startsWith("/scenarios/");
}

function isFocusedAuthenticatedRoute(pathname: string): boolean {
  return pathname.startsWith("/lesson/")
    || isScenarioCatalogRoute(pathname)
    || isScenarioDetailRoute(pathname);
}

function currentReturnTo(): string | null {
  if (!isFocusedAuthenticatedRoute(window.location.pathname)) return null;
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

function isDictionaryRoute(pathname: string): boolean {
  return pathname === "/dictionary" || pathname.startsWith("/words/");
}

function isProgressRoute(pathname: string): boolean {
  return pathname === "/progress";
}

export function LexigoBootstrappedApp({ pathname }: LexigoBootstrappedAppProps) {
  const [initialSession, setInitialSession] = useState<Session | null | undefined>(undefined);
  const [notice, setNotice] = useState<RequestProblem | null>(null);
  const [accountNotice, setAccountNotice] = useState<AccountNotice | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreRecoverable, setRestoreRecoverable] = useState(false);
  const [routeGraph, setRouteGraph] = useState<RouteGraph>(() => (
    isDictionaryRoute(pathname) ? "dictionary" : "product"
  ));

  const handleSessionUpdated = useCallback((nextSession: Session) => {
    adoptBootstrappedSession(nextSession);
    setInitialSession(nextSession);
  }, []);

  const retryRestore = useCallback(() => {
    invalidateBootstrappedSession();
    setInitialSession(undefined);
    setNotice(null);
    setAccountNotice(null);
    setRestoreRecoverable(false);
    setRestoreAttempt((current) => current + 1);
  }, []);

  const handleAccountDeleted = useCallback(() => {
    invalidateBootstrappedSession();
    setInitialSession(null);
    setNotice(null);
    setRestoreRecoverable(false);
    setAccountNotice({
      title: "Аккаунт удалён",
      message: "Аккаунт и связанные учебные данные удалены.",
    });
    window.history.replaceState(profileHistoryState(), "", "/profile?account=deleted");
  }, []);

  const handleEmailChanged = useCallback(() => {
    invalidateBootstrappedSession();
    setInitialSession(null);
    setNotice(null);
    setRestoreRecoverable(false);
    setAccountNotice({
      title: "Email изменён",
      message: "Все активные сессии завершены. Войдите с новым адресом.",
    });
    window.history.replaceState(profileHistoryState(), "", "/profile?account=email-changed");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function preflightSession() {
      try {
        const restored = await restoreBootstrappedSession();
        if (cancelled) return;
        if (restored === null && isFocusedAuthenticatedRoute(window.location.pathname)) {
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
          invalidateBootstrappedSession();
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
  }, [pathname, restoreAttempt]);

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

  useEffect(() => {
    // The dictionary graph is only a cold-entry optimization. The route chrome
    // signals the App Router handoff before navigation, and popstate covers
    // browser history entries that cross into the already loaded product graph.
    const loadProductGraph = () => setRouteGraph("product");
    const preserveLoadedProductGraph = () => {
      if (!isDictionaryRoute(window.location.pathname)) loadProductGraph();
    };

    window.addEventListener(PRODUCT_ROUTE_GRAPH_EVENT, loadProductGraph);
    window.addEventListener("popstate", preserveLoadedProductGraph);
    return () => {
      window.removeEventListener(PRODUCT_ROUTE_GRAPH_EVENT, loadProductGraph);
      window.removeEventListener("popstate", preserveLoadedProductGraph);
    };
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

  const useDictionaryIsland = routeGraph === "dictionary" && isDictionaryRoute(pathname);
  const useProgressIsland = isProgressRoute(pathname);
  const useScenarioCatalogIsland = isScenarioCatalogRoute(pathname) && initialSession !== null;
  const useScenarioIsland = isScenarioDetailRoute(pathname) && initialSession !== null;
  const routeKey = initialSession?.user.id ?? "guest";

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
            <strong>{accountNotice.title}</strong>
            <span>{accountNotice.message}</span>
          </div>
        </div>
      ) : null}
      <EmailChangeConfirmation onSessionInvalidated={handleEmailChanged} />
      {useScenarioCatalogIsland ? (
        <LexigoScenarioCatalogApp
          key={`${routeKey}:scenario-catalog`}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : useScenarioIsland ? (
        <LexigoScenarioApp
          key={`${routeKey}:${pathname}`}
          pathname={pathname}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : useDictionaryIsland ? (
        <LexigoDictionaryApp
          key={routeKey}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : useProgressIsland ? (
        <LexigoProgressApp
          key={routeKey}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : (
        <LexigoPremiumApp
          key={routeKey}
          initialSession={initialSession}
        />
      )}
      {initialSession ? (
        <>
          <AccountSecurityPanel
            session={initialSession}
            onSessionExpired={retryRestore}
            onSessionUpdated={handleSessionUpdated}
          />
          <AccountEmailPanel session={initialSession} onSessionExpired={retryRestore} />
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
