"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";

import {
  canonicalURLFromLegacySearch,
  isCanonicalRoutePath,
  navigationURL,
  parseNavigationLocation,
  viewTitle,
  type NavigationTarget,
} from "../lib/navigation";
import {
  createNavigationHistoryState,
  navigationScrollBehavior,
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

const ROUTE_ISLAND_BOUNDARIES = new Set(["/progress", "/scenarios"]);

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
  const previousPathRef = useRef<string | null>(null);
  const announcementCounterRef = useRef(0);
  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });

  useLayoutEffect(() => {
    initializeRouteEntry();
  }, [pathname]);

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

    const restoreBoundary = () => {
      if (cancelled) return;

      const main = document.querySelector<HTMLElement>("#lexigo-main-content");
      if (!main || main.getAttribute("aria-label") !== expectedLabel) {
        discoveryFrame = window.requestAnimationFrame(restoreBoundary);
        return;
      }

      main.focus({ preventScroll: true });
      cancelRestoration = scheduleNavigationScrollRestoration(
        destination.scroll,
        {
          readPosition: () => ({ x: window.scrollX, y: window.scrollY }),
          writePosition: (position) => {
            window.scrollTo({
              left: position.x,
              top: position.y,
              behavior: navigationScrollBehavior(window),
            });
          },
          requestFrame: (callback) => window.requestAnimationFrame(callback),
          cancelFrame: (frameID) => window.cancelAnimationFrame(frameID),
        },
        () => {
          announcementCounterRef.current += 1;
          setRouteAnnouncement({
            id: announcementCounterRef.current,
            message: `${expectedLabel}. Экран загружен.`,
          });
        },
      );
    };

    discoveryFrame = window.requestAnimationFrame(restoreBoundary);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(discoveryFrame);
      cancelRestoration?.();
    };
  }, [pathname]);

  if (!isCanonicalRoutePath(pathname)) return null;

  return (
    <div className="lx-routed-app" data-app-router-shell="true" data-route-path={pathname}>
      <RouteSkipLink />
      <RouteChrome />
      <LexigoBootstrappedApp pathname={pathname} />
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
