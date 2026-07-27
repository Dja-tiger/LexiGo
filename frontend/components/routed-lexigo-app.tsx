"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from "react";

import {
  canonicalURLFromLegacySearch,
  isCanonicalRoutePath,
  navigationURL,
  parseNavigationLocation,
  readPersistedNavigation,
  viewTitle,
  writePersistedNavigation,
  type NavigationTarget,
} from "../lib/navigation";
import {
  createNavigationHistoryState,
  navigationScrollFromHistory,
  readNavigationHistoryState,
  type NavigationScrollPosition,
} from "../lib/navigation-history";
import { scheduleNavigationScrollRestoration } from "../lib/navigation-scroll-restoration";
import {
  routeTabDestination,
  type PrimaryRouteView,
} from "../lib/route-tab-snapshots";
import { LexigoBootstrappedApp } from "./lexigo-bootstrapped-app";
import { RouteChrome } from "./route-primary-navigation";

const ROUTE_ISLAND_BOUNDARIES = new Set(["/", "/learn", "/progress", "/scenarios"]);
const ROUTE_GRAPH_HISTORY_KEY = "lexigoRouteGraph";
const ACTIVE_LESSON_SELECTOR = ".lx-active-lesson";
const SCROLL_INTENT_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
]);

function isStandaloneDisplayMode(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return navigatorWithStandalone.standalone === true
    || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

function initializeRouteEntry(): void {
  const target = parseNavigationLocation(window.location);
  const currentState = readNavigationHistoryState(window.history.state);
  const canonicalLegacyURL = canonicalURLFromLegacySearch(window.location.search);
  const hash = window.location.hash;
  const currentURL = `${window.location.pathname}${window.location.search}${hash}`;
  const targetURL = canonicalLegacyURL ? `${canonicalLegacyURL}${hash}` : currentURL;

  if (!currentState || navigationURL(currentState.target) !== navigationURL(target)) {
    window.history.replaceState(
      createNavigationHistoryState(target, { x: window.scrollX, y: window.scrollY }),
      "",
      targetURL,
    );
    return;
  }

  if (canonicalLegacyURL && targetURL !== currentURL) {
    window.history.replaceState(currentState, "", targetURL);
  }
}

function restoreStandaloneStartRoute(pathname: string): string | null {
  if (pathname !== "/" || window.location.search.length > 0 || !isStandaloneDisplayMode()) return null;
  const restored = readPersistedNavigation(window.localStorage);
  if (!restored || restored.view === "home") return null;

  const restoredURL = navigationURL(restored);
  window.history.replaceState(
    createNavigationHistoryState(restored, { x: 0, y: 0 }),
    "",
    restoredURL,
  );
  return restoredURL;
}

function primaryRouteView(target: NavigationTarget): PrimaryRouteView | null {
  if (target.view === "phrases") return "library";
  if (["home", "learn", "library", "progress"].includes(target.view)) {
    return target.view as PrimaryRouteView;
  }
  return null;
}

function routeBoundaryDestination(target: NavigationTarget): {
  target: NavigationTarget;
  scroll: NavigationScrollPosition;
} {
  const primaryView = primaryRouteView(target);
  if (!primaryView) {
    return {
      target,
      scroll: navigationScrollFromHistory(window.history.state),
    };
  }

  const saved = routeTabDestination(primaryView);
  return navigationURL(saved.target) === navigationURL(target)
    ? saved
    : {
        target,
        scroll: navigationScrollFromHistory(window.history.state),
      };
}

function routeBoundaryLabel(pathname: string, target: NavigationTarget): string {
  return pathname === "/scenarios" ? "Рабочие сценарии" : viewTitle(target.view);
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (
    target.isContentEditable
    || target.tagName === "INPUT"
    || target.tagName === "SELECT"
    || target.tagName === "TEXTAREA"
  );
}

function isKeyboardScrollIntent(event: KeyboardEvent): boolean {
  return !event.defaultPrevented
    && !event.altKey
    && !event.ctrlKey
    && !event.metaKey
    && !isEditableTarget(event.target)
    && SCROLL_INTENT_KEYS.has(event.key);
}

function RouteSkipLink() {
  function skipToMainContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    if (!main) return;
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start", behavior: "auto" });
  }

  return (
    <a className="lx-skip-link lx-route-skip-link" href="#lexigo-main-content" onClick={skipToMainContent}>
      Перейти к основному содержимому
    </a>
  );
}

export function RoutedLexigoApp() {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathRef = useRef<string | null>(null);
  const announcementCounterRef = useRef(0);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });
  const navigateHome = useCallback(() => {
    router.replace("/", { scroll: false });
  }, [router]);

  useLayoutEffect(() => {
    let redispatchingProtectedHistory = false;
    const preserveFocusedLessonGraph = (event: PopStateEvent) => {
      if (redispatchingProtectedHistory
        || window.location.pathname !== "/learn"
        || !document.querySelector(ACTIVE_LESSON_SELECTOR)) {
        return;
      }

      const currentState = event.state && typeof event.state === "object"
        ? event.state as Record<string, unknown>
        : {};
      if (currentState[ROUTE_GRAPH_HISTORY_KEY] === "product") return;

      // Back from an unfinished lesson first belongs to the product graph so
      // its safe-exit owner can block navigation and open the confirmation.
      // Re-dispatch the same history entry with only LexiGo's graph marker
      // changed; preserve every Next.js internal field byte-for-byte.
      event.stopImmediatePropagation();
      const protectedState = {
        ...currentState,
        [ROUTE_GRAPH_HISTORY_KEY]: "product",
      };
      window.history.replaceState(protectedState, "", window.location.href);
      redispatchingProtectedHistory = true;
      window.dispatchEvent(new PopStateEvent("popstate", { state: protectedState }));
      redispatchingProtectedHistory = false;
    };

    window.addEventListener("popstate", preserveFocusedLessonGraph, { capture: true });
    return () => window.removeEventListener("popstate", preserveFocusedLessonGraph, { capture: true });
  }, []);

  useLayoutEffect(() => {
    initializeRouteEntry();
    const restoredURL = restoreStandaloneStartRoute(pathname);
    if (restoredURL) {
      router.replace(restoredURL, { scroll: false });
      return;
    }
    writePersistedNavigation(window.localStorage, parseNavigationLocation(window.location));
  }, [pathname, router]);

  useLayoutEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = pathname;

    // Focused Scenario detail owns its own focus and saved-draft lifecycle.
    if (pathname.startsWith("/scenarios/")) return;
    if (!previousPath || (!ROUTE_ISLAND_BOUNDARIES.has(previousPath) && !ROUTE_ISLAND_BOUNDARIES.has(pathname))) return;

    const parsedTarget = parseNavigationLocation(window.location);
    const destination = routeBoundaryDestination(parsedTarget);
    const expectedLabel = routeBoundaryLabel(pathname, parsedTarget);
    let discoveryFrame = 0;
    let cancelRestoration: (() => void) | null = null;
    let cancelled = false;
    let interrupted = false;
    let settled = false;

    const announceBoundary = () => {
      if (settled || cancelled) return;
      settled = true;
      announcementCounterRef.current += 1;
      setRouteAnnouncement({
        id: announcementCounterRef.current,
        message: `${expectedLabel}. Экран загружен.`,
      });
    };

    const interruptRestoration = () => {
      interrupted = true;
      if (!cancelRestoration) return;
      cancelRestoration();
      cancelRestoration = null;
      announceBoundary();
    };
    const interruptFromPointer = (event: PointerEvent) => {
      if (event.isPrimary) interruptRestoration();
    };
    const interruptFromKeyboard = (event: KeyboardEvent) => {
      if (isKeyboardScrollIntent(event)) interruptRestoration();
    };

    window.addEventListener("wheel", interruptRestoration, { passive: true });
    window.addEventListener("touchstart", interruptRestoration, { passive: true });
    window.addEventListener("touchmove", interruptRestoration, { passive: true });
    window.addEventListener("pointerdown", interruptFromPointer, { passive: true });
    window.addEventListener("keydown", interruptFromKeyboard);

    const restoreBoundary = () => {
      if (cancelled) return;

      const main = document.querySelector<HTMLElement>("#lexigo-main-content");
      if (!main || main.getAttribute("aria-label") !== expectedLabel) {
        discoveryFrame = window.requestAnimationFrame(restoreBoundary);
        return;
      }

      main.focus({ preventScroll: true });
      if (interrupted) {
        announceBoundary();
        return;
      }

      cancelRestoration = scheduleNavigationScrollRestoration(
        destination.scroll,
        {
          readPosition: () => ({ x: window.scrollX, y: window.scrollY }),
          writePosition: (position) => {
            window.scrollTo({
              left: position.x,
              top: position.y,
              behavior: "auto",
            });
          },
          requestFrame: (callback) => window.requestAnimationFrame(callback),
          cancelFrame: (frameID) => window.cancelAnimationFrame(frameID),
        },
        () => {
          cancelRestoration = null;
          announceBoundary();
        },
      );
    };

    discoveryFrame = window.requestAnimationFrame(restoreBoundary);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(discoveryFrame);
      cancelRestoration?.();
      window.removeEventListener("wheel", interruptRestoration);
      window.removeEventListener("touchstart", interruptRestoration);
      window.removeEventListener("touchmove", interruptRestoration);
      window.removeEventListener("pointerdown", interruptFromPointer);
      window.removeEventListener("keydown", interruptFromKeyboard);
    };
  }, [pathname]);

  if (!isCanonicalRoutePath(pathname)) return null;

  return (
    <div className="lx-routed-app" data-app-router-shell="true" data-route-path={pathname}>
      <RouteSkipLink />
      <RouteChrome />
      <LexigoBootstrappedApp pathname={pathname} onNavigateHome={navigateHome} />
      {routeAnnouncement.message ? (
        <p
          key={routeAnnouncement.id}
          className="lx-route-announcement"
          data-announcement-id={routeAnnouncement.id}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {routeAnnouncement.message}
        </p>
      ) : null}
    </div>
  );
}
