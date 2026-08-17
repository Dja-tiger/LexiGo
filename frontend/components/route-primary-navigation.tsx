"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AriaAttributes, MouseEvent, ReactNode } from "react";

import {
  PRIMARY_NAVIGATION,
  navigationURL,
  parseNavigation,
  parseNavigationLocation,
  type AppView,
  type NavigationTarget,
} from "../lib/navigation";
import { createNavigationHistoryState } from "../lib/navigation-history";
import { queueProductJourneyIntent, type ProductJourneyIntent } from "../lib/product-journey";
import {
  rememberRouteTab,
  routeTabDestination,
  type PrimaryRouteView,
} from "../lib/route-tab-snapshots";
import { CalendarReminderRouteEntry } from "./calendar-reminder-route-entry";

type RouteNavigationVariant = "header" | "rail" | "mobile";
type RouteIconName = "home" | "learn" | "library" | "progress";
type RouteGraphHint = "dictionary" | "home" | "learn" | "product";

const PRIMARY_ROUTE_VIEWS = new Set<PrimaryRouteView>([
  "home",
  "learn",
  "library",
  "progress",
]);
const ROUTE_CLIENT_ISLAND_SELECTOR = "[data-route-client-island]";
const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";
const ROUTE_GRAPH_HISTORY_KEY = "lexigoRouteGraph";

function RouteIcon({ name }: { name: RouteIconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") return <svg {...common}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === "learn") return <svg {...common}><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M7 9.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3V9.5"/><path d="M21 7v6"/></svg>;
  if (name === "library") return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></svg>;
  return <svg {...common}><path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/></svg>;
}

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || event.currentTarget.target === "_blank";
}

function isPrimaryRouteView(value: AppView): value is PrimaryRouteView {
  return PRIMARY_ROUTE_VIEWS.has(value as PrimaryRouteView);
}

function destinationFor(target: NavigationTarget) {
  return isPrimaryRouteView(target.view)
    ? routeTabDestination(target.view)
    : { target, scroll: { x: 0, y: 0 } };
}

function routeGraphHint(target: NavigationTarget): RouteGraphHint {
  if (target.view === "home") return "home";
  if (target.view === "learn") return "learn";
  if (target.view === "library") return "dictionary";
  return "product";
}

function activeRouteGraph(): RouteGraphHint {
  const island = document.querySelector<HTMLElement>(ROUTE_CLIENT_ISLAND_SELECTOR)
    ?.dataset.routeClientIsland;
  if (island === "home") return "home";
  if (island === "learn") return "learn";
  if (island === "dictionary") return "dictionary";
  return "product";
}

function graphHistoryState(
  target: NavigationTarget,
  scroll: { x: number; y: number },
  routeGraph: RouteGraphHint,
): Record<string, unknown> {
  return {
    ...createNavigationHistoryState(target, scroll),
    [ROUTE_GRAPH_HISTORY_KEY]: routeGraph,
  };
}

function routeTransition(requestedTarget: NavigationTarget, intent: ProductJourneyIntent) {
  const current = parseNavigationLocation(window.location);
  const currentScroll = { x: window.scrollX, y: window.scrollY };
  rememberRouteTab(current, currentScroll);

  const destination = destinationFor(requestedTarget);
  const currentURL = navigationURL(current);
  const nextURL = navigationURL(destination.target);
  if (currentURL === nextURL) {
    document.querySelector<HTMLElement>("#lexigo-main-content")?.focus({ preventScroll: false });
    return null;
  }

  queueProductJourneyIntent(intent);
  return {
    current,
    currentScroll,
    currentGraph: activeRouteGraph(),
    destination,
    nextURL,
    nextPathname: new URL(nextURL, window.location.origin).pathname,
    nextGraph: routeGraphHint(destination.target),
  };
}

function mergeCurrentHistoryState(nextState: Record<string, unknown>): Record<string, unknown> {
  const current = window.history.state;
  return {
    ...(current && typeof current === "object" ? current as Record<string, unknown> : {}),
    ...nextState,
  };
}

function stabilizeGraphHistoryEntry(
  transition: NonNullable<ReturnType<typeof routeTransition>>,
  nextState: Record<string, unknown>,
): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        if (navigationURL(parseNavigationLocation(window.location)) !== transition.nextURL) return;
        window.history.replaceState(
          mergeCurrentHistoryState(nextState),
          "",
          window.location.href,
        );
      }, 0);
    });
  });
}

function commitRouteTransition(
  transition: NonNullable<ReturnType<typeof routeTransition>>,
  graphHandoff: boolean,
): void {
  window.history.replaceState(
    graphHistoryState(transition.current, transition.currentScroll, transition.currentGraph),
    "",
    window.location.href,
  );

  const nextState = graphHistoryState(
    transition.destination.target,
    transition.destination.scroll,
    transition.nextGraph,
  );
  if (graphHandoff) {
    window.dispatchEvent(new CustomEvent(PRODUCT_ROUTE_GRAPH_EVENT, {
      detail: {
        routeGraph: transition.nextGraph,
        pathname: transition.nextPathname,
      },
    }));
  }

  // Next.js App Router patches the native History API. It updates usePathname
  // for cross-graph transitions itself. Dispatching a synthetic popstate there
  // starts a second navigation cycle and can replace the custom graph marker.
  window.history.pushState(nextState, "", transition.nextURL);
  if (graphHandoff) {
    stabilizeGraphHistoryEntry(transition, nextState);
  } else {
    window.dispatchEvent(new PopStateEvent("popstate", { state: nextState }));
  }
}

function pushRoute(requestedTarget: NavigationTarget, intent: ProductJourneyIntent): void {
  const transition = routeTransition(requestedTarget, intent);
  if (!transition) return;
  commitRouteTransition(transition, false);
}

function RouteLink({
  target,
  children,
  className,
  ariaLabel,
  ariaCurrent,
  navigationView,
}: {
  target: NavigationTarget;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: AriaAttributes["aria-current"];
  navigationView?: AppView;
}) {
  return (
    <Link
      href={navigationURL(target)}
      prefetch={false}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      data-navigation-view={navigationView}
      onClick={(event) => {
        if (shouldUseNativeNavigation(event)) return;
        event.preventDefault();

        const intent = navigationView ? "primary_navigation" : "in_app_navigation";
        const requiresGraphHandoff = target.view === "scenario"
          || target.view === "home"
          || Boolean(document.querySelector(ROUTE_CLIENT_ISLAND_SELECTOR));
        if (requiresGraphHandoff) {
          const transition = routeTransition(target, intent);
          if (transition) commitRouteTransition(transition, true);
          return;
        }

        pushRoute(target, intent);
      }}
    >
      {children}
    </Link>
  );
}

function currentView(pathname: string): AppView {
  return parseNavigation("", pathname).view;
}

function isFocusedRoute(pathname: string): boolean {
  return pathname.startsWith("/lesson/") || pathname.startsWith("/scenarios/");
}

function LearningSectionSwitch() {
  return (
    <nav className="lx-learning-section-switch lx-learning-section-switch--learn" aria-label="Разделы обучения">
      <RouteLink target={{ view: "learn" }} className="active" ariaCurrent="page">Уроки</RouteLink>
      <RouteLink target={{ view: "scenario" }}>Сценарии</RouteLink>
    </nav>
  );
}

export function RouteBrand() {
  return (
    <RouteLink target={{ view: "home" }} className="lx-route-brand" ariaLabel="LexiGo — открыть главную">
      <span className="lx-logo-mark"><span>L</span></span>
      <strong>LexiGo</strong>
    </RouteLink>
  );
}

export function RoutePrimaryNavigation({ variant }: { variant: RouteNavigationVariant }) {
  const pathname = usePathname();
  const activeView = currentView(pathname);
  const labelMode = variant === "mobile" ? "short" : "full";
  const ariaLabel = variant === "header"
    ? "Основная навигация"
    : variant === "rail"
      ? "Навигация по разделам"
      : "Мобильная навигация";

  return (
    <nav className={`lx-route-nav lx-route-nav--${variant}`} aria-label={ariaLabel} data-route-navigation={variant}>
      {PRIMARY_NAVIGATION.map((entry) => {
        const active = activeView === entry.view
          || (entry.view === "library" && activeView === "phrases")
          || (entry.view === "learn" && activeView === "scenario");
        return (
          <RouteLink
            key={entry.view}
            target={{ view: entry.view }}
            className={active ? "active" : undefined}
            ariaCurrent={active ? "page" : undefined}
            navigationView={entry.view}
          >
            <span>
              <RouteIcon name={entry.view as RouteIconName} />
              <span>{labelMode === "short" ? entry.shortLabel : entry.label}</span>
            </span>
          </RouteLink>
        );
      })}
    </nav>
  );
}

export function RouteChrome() {
  const pathname = usePathname();
  if (isFocusedRoute(pathname)) return null;

  return (
    <>
      <RouteBrand />
      <RoutePrimaryNavigation variant="header" />
      <RoutePrimaryNavigation variant="rail" />
      <RoutePrimaryNavigation variant="mobile" />
      {pathname === "/learn" ? <LearningSectionSwitch /> : null}
      <CalendarReminderRouteEntry />
    </>
  );
}
