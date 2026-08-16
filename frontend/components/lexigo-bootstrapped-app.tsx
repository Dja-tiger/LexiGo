"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { subscribeAppearanceRuntime } from "../lib/appearance-preference";
import {
  isDefinitiveSessionRefreshError,
  isSessionPayload,
  SESSION_REFRESHED_EVENT,
  SessionRefreshError,
  type Session,
} from "../lib/auth-session";
import { parseNavigation, type NavigationTarget } from "../lib/navigation";
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
import { useFeedback } from "./feedback-center";
import { ReviewOutboxRuntime } from "./review-outbox-runtime";

const AUTO_RESTORE_DELAYS_MS = [2000, 5000, 15_000] as const;
const SESSION_RESTORED_EVENT = "lexigo:session-restored";
const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";
const ROUTE_GRAPH_HISTORY_KEY = "lexigoRouteGraph";

type SessionScreenReason = "required" | "expired" | "forbidden";
type RouteGraph = "dictionary" | "home" | "learn" | "product";

type RouteGraphRequest = {
  routeGraph: RouteGraph;
  pathname: string;
};

type LexigoBootstrappedAppProps = {
  pathname: string;
  onNavigateHome: () => void;
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
  { ssr: false, loading: ProductShellLoading },
);

const LexigoGuestHomeApp = dynamic(
  () => import("./lexigo-guest-home-app").then((module) => module.LexigoGuestHomeApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoHomeApp = dynamic(
  () => import("./lexigo-home-app").then((module) => module.LexigoHomeApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoOnboardingApp = dynamic(
  () => import("./lexigo-onboarding-app").then((module) => module.LexigoOnboardingApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoLearnApp = dynamic(
  () => import("./lexigo-learn-app").then((module) => module.LexigoLearnApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoActiveLessonApp = dynamic(
  () => import("./lexigo-active-lesson-app").then((module) => module.LexigoActiveLessonApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoDictionaryApp = dynamic(
  () => import("./lexigo-dictionary-app").then((module) => module.LexigoDictionaryApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoPhrasesApp = dynamic(
  () => import("./lexigo-phrases-app").then((module) => module.LexigoPhrasesApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoProgressApp = dynamic(
  () => import("./lexigo-progress-app").then((module) => module.LexigoProgressApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoProfileApp = dynamic(
  () => import("./lexigo-profile-app").then((module) => module.LexigoProfileApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoScenarioCatalogApp = dynamic(
  () => import("./lexigo-scenario-catalog-app").then((module) => module.LexigoScenarioCatalogApp),
  { ssr: false, loading: ProductShellLoading },
);

const LexigoScenarioApp = dynamic(
  () => import("./lexigo-scenario-app").then((module) => module.LexigoScenarioApp),
  { ssr: false, loading: ProductShellLoading },
);

function isScenarioCatalogRoute(pathname: string): boolean {
  return pathname === "/scenarios";
}

function isScenarioDetailRoute(pathname: string): boolean {
  return pathname.startsWith("/scenarios/");
}

function isOnboardingRoute(pathname: string): boolean {
  return normalizedPathname(pathname) === "/onboarding";
}

function isFocusedAuthenticatedRoute(pathname: string): boolean {
  return pathname.startsWith("/lesson/")
    || isOnboardingRoute(pathname)
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

function normalizedPathname(value: string): string {
  const pathname = value.trim() || "/";
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "") || "/";
}

function isHomeRoute(pathname: string): boolean {
  return normalizedPathname(pathname) === "/";
}

function isLearnRoute(pathname: string): boolean {
  return normalizedPathname(pathname) === "/learn";
}

function isDictionaryRoute(pathname: string): boolean {
  const normalized = normalizedPathname(pathname);
  return normalized === "/dictionary" || normalized.startsWith("/words/");
}

function isPhrasesRoute(pathname: string): boolean {
  const normalized = normalizedPathname(pathname);
  return normalized === "/phrases" || normalized.startsWith("/phrases/");
}

function isProgressRoute(pathname: string): boolean {
  return normalizedPathname(pathname) === "/progress";
}

function isProfileRoute(pathname: string): boolean {
  return normalizedPathname(pathname) === "/profile";
}

function isActiveLessonRoute(pathname: string): boolean {
  return normalizedPathname(pathname) === "/lesson/active";
}

function routeGraphForPath(pathname: string): RouteGraph {
  if (isHomeRoute(pathname)) return "home";
  if (isLearnRoute(pathname)) return "learn";
  if (isDictionaryRoute(pathname)) return "dictionary";
  return "product";
}

function isRouteGraph(value: unknown): value is RouteGraph {
  return value === "dictionary" || value === "home" || value === "learn" || value === "product";
}

function historyRouteGraph(pathname: string, state: unknown): RouteGraph {
  const fallback = routeGraphForPath(pathname);
  if (!state || typeof state !== "object") return fallback;
  const candidate = (state as Record<string, unknown>)[ROUTE_GRAPH_HISTORY_KEY];
  if (!isRouteGraph(candidate)) return fallback;
  if (isHomeRoute(pathname)) return "home";
  if (isLearnRoute(pathname)) {
    return candidate === "product" || candidate === "learn" ? candidate : "learn";
  }
  if (isDictionaryRoute(pathname)) {
    return candidate === "product" || candidate === "dictionary" ? candidate : "dictionary";
  }
  return "product";
}

function requestedRouteGraph(event: Event): RouteGraphRequest {
  if (event instanceof CustomEvent && event.detail && typeof event.detail === "object") {
    const detail = event.detail as { routeGraph?: unknown; pathname?: unknown };
    if (isRouteGraph(detail.routeGraph) && typeof detail.pathname === "string") {
      return {
        routeGraph: detail.routeGraph,
        pathname: normalizedPathname(detail.pathname),
      };
    }
  }
  return {
    routeGraph: historyRouteGraph(window.location.pathname, window.history.state),
    pathname: normalizedPathname(window.location.pathname),
  };
}

function mergedNavigationHistoryState(
  target: NavigationTarget,
  routeGraph: RouteGraph,
): Record<string, unknown> {
  const current = window.history.state;
  const next = createNavigationHistoryState(target, { x: 0, y: 0 });
  return {
    ...(current && typeof current === "object" ? current as Record<string, unknown> : {}),
    ...next,
    [ROUTE_GRAPH_HISTORY_KEY]: routeGraph,
  };
}

export function LexigoBootstrappedApp({ pathname, onNavigateHome }: LexigoBootstrappedAppProps) {
  const { publish: publishFeedback } = useFeedback();
  const [initialSession, setInitialSession] = useState<Session | null | undefined>(undefined);
  const [notice, setNotice] = useState<RequestProblem | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [restoreRecoverable, setRestoreRecoverable] = useState(false);
  const [sessionRestoreSuppressed, setSessionRestoreSuppressed] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [routeGraphRequest, setRouteGraphRequest] = useState<RouteGraphRequest | null>(null);
  const [activeLessonOwnerRetained, setActiveLessonOwnerRetained] = useState(
    () => isActiveLessonRoute(pathname),
  );

  const handleSessionUpdated = useCallback((nextSession: Session) => {
    adoptBootstrappedSession(nextSession);
    setSessionRestoreSuppressed(false);
    setInitialSession(nextSession);
  }, []);

  const retryRestore = useCallback(() => {
    invalidateBootstrappedSession();
    setSessionRestoreSuppressed(false);
    setInitialSession(undefined);
    setNotice(null);
    setRestoreRecoverable(false);
    setRestoreAttempt((current) => current + 1);
  }, []);

  const finalizeLoggedOut = useCallback(() => {
    invalidateBootstrappedSession();
    setInitialSession(null);
    setNotice(null);
    setRestoreRecoverable(false);
    setLogoutPending(false);
    publishFeedback({
      category: "success",
      title: "Вы вышли из аккаунта",
      message: "Текущая сессия завершена. Локальная настройка оформления сохранена.",
    });
  }, [publishFeedback]);

  const handleLoggedOut = useCallback(() => {
    setSessionRestoreSuppressed(true);
    setLogoutPending(true);
    onNavigateHome();
  }, [onNavigateHome]);

  const handleAccountDeleted = useCallback(() => {
    invalidateBootstrappedSession();
    setSessionRestoreSuppressed(true);
    setInitialSession(null);
    setNotice(null);
    setRestoreRecoverable(false);
    publishFeedback({
      category: "success",
      title: "Аккаунт удалён",
      message: "Аккаунт и связанные учебные данные удалены.",
    });
    window.history.replaceState(profileHistoryState(), "", "/profile?account=deleted");
  }, [publishFeedback]);

  const handleEmailChanged = useCallback(() => {
    invalidateBootstrappedSession();
    setSessionRestoreSuppressed(true);
    setInitialSession(null);
    setNotice(null);
    setRestoreRecoverable(false);
    publishFeedback({
      category: "success",
      title: "Email изменён",
      message: "Все активные сессии завершены. Войдите с новым адресом.",
    });
    window.history.replaceState(profileHistoryState(), "", "/profile?account=email-changed");
  }, [publishFeedback]);

  useEffect(() => subscribeAppearanceRuntime(), []);

  useEffect(() => {
    if (!logoutPending || pathname !== "/") return;
    const timer = window.setTimeout(finalizeLoggedOut, 0);
    return () => window.clearTimeout(timer);
  }, [finalizeLoggedOut, logoutPending, pathname]);

  useEffect(() => {
    const adoptRefreshedSession = (event: Event) => {
      if (!(event instanceof CustomEvent) || !isSessionPayload(event.detail)) return;
      handleSessionUpdated(event.detail);
    };
    window.addEventListener(SESSION_REFRESHED_EVENT, adoptRefreshedSession);
    return () => window.removeEventListener(SESSION_REFRESHED_EVENT, adoptRefreshedSession);
  }, [handleSessionUpdated]);

  useEffect(() => {
    if (sessionRestoreSuppressed) return;
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
  }, [pathname, restoreAttempt, sessionRestoreSuppressed]);

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
    const handleRouteGraphRequest = (event: Event) => {
      const request = requestedRouteGraph(event);
      setActiveLessonOwnerRetained(
        request.routeGraph === "product" && request.pathname.startsWith("/lesson/"),
      );
      if (isLearnRoute(window.location.pathname)
        && request.routeGraph === "product"
        && request.pathname.startsWith("/lesson/")) {
        const current = window.history.state;
        window.history.replaceState(
          {
            ...(current && typeof current === "object" ? current as Record<string, unknown> : {}),
            [ROUTE_GRAPH_HISTORY_KEY]: "product",
          },
          "",
          window.location.href,
        );
      }
      setRouteGraphRequest(request);
    };
    const syncRouteGraphFromHistory = (event: PopStateEvent) => {
      setRouteGraphRequest({
        routeGraph: historyRouteGraph(window.location.pathname, event.state),
        pathname: normalizedPathname(window.location.pathname),
      });
    };

    window.addEventListener(PRODUCT_ROUTE_GRAPH_EVENT, handleRouteGraphRequest);
    window.addEventListener("popstate", syncRouteGraphFromHistory);
    return () => {
      window.removeEventListener(PRODUCT_ROUTE_GRAPH_EVENT, handleRouteGraphRequest);
      window.removeEventListener("popstate", syncRouteGraphFromHistory);
    };
  }, []);

  const normalizedCurrentPath = normalizedPathname(pathname);
  const effectiveRouteGraph = routeGraphRequest?.pathname === normalizedCurrentPath
    ? routeGraphRequest.routeGraph
    : historyRouteGraph(normalizedCurrentPath, typeof window === "undefined" ? null : window.history.state);

  useEffect(() => {
    const expectedPath = normalizedPathname(pathname);
    const expectedGraph = routeGraphRequest?.pathname === expectedPath
      ? routeGraphRequest.routeGraph
      : historyRouteGraph(expectedPath, window.history.state);
    let frame = 0;

    const settleRouteGraph = () => {
      if (normalizedPathname(window.location.pathname) !== expectedPath) {
        frame = window.requestAnimationFrame(settleRouteGraph);
        return;
      }
      const canonicalTarget = parseNavigation(window.location.search, window.location.pathname);
      window.history.replaceState(
        mergedNavigationHistoryState(canonicalTarget, expectedGraph),
        "",
        window.location.href,
      );
    };

    frame = window.requestAnimationFrame(settleRouteGraph);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, routeGraphRequest]);

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

  const useGuestHomeIsland = effectiveRouteGraph === "home" && isHomeRoute(pathname) && initialSession === null;
  const useHomeIsland = effectiveRouteGraph === "home" && isHomeRoute(pathname) && initialSession !== null;
  const useOnboardingIsland = isOnboardingRoute(pathname) && initialSession !== null;
  const useLearnIsland = effectiveRouteGraph === "learn" && isLearnRoute(pathname);
  const useActiveLessonIsland = (isActiveLessonRoute(pathname) || activeLessonOwnerRetained)
    && initialSession !== null;
  const useDictionaryIsland = effectiveRouteGraph === "dictionary" && isDictionaryRoute(pathname);
  const usePhrasesIsland = effectiveRouteGraph === "product" && isPhrasesRoute(pathname);
  const useProgressIsland = isProgressRoute(pathname);
  const useProfileIsland = isProfileRoute(pathname) && initialSession !== null;
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
      ) : useGuestHomeIsland ? (
        <LexigoGuestHomeApp key="guest:first-use" />
      ) : useHomeIsland ? (
        <LexigoHomeApp
          key={routeKey}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : useOnboardingIsland ? (
        <LexigoOnboardingApp
          key={`${routeKey}:onboarding`}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : useLearnIsland ? (
        <LexigoLearnApp
          key={routeKey}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : useActiveLessonIsland ? (
        <LexigoActiveLessonApp
          key={routeKey}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : useDictionaryIsland ? (
        <LexigoDictionaryApp
          key={routeKey}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
        />
      ) : usePhrasesIsland ? (
        <LexigoPhrasesApp
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
      ) : useProfileIsland ? (
        <LexigoProfileApp
          key={routeKey}
          initialSession={initialSession}
          onSessionUpdated={handleSessionUpdated}
          onLoggedOut={handleLoggedOut}
        />
      ) : (
        <LexigoPremiumApp key={routeKey} initialSession={initialSession} />
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