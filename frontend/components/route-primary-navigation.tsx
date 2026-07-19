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
import {
  rememberRouteTab,
  routeTabDestination,
  type PrimaryRouteView,
} from "../lib/route-tab-snapshots";

type RouteNavigationVariant = "header" | "rail" | "mobile";
type RouteIconName = "home" | "learn" | "phrases" | "library" | "progress";

const PRIMARY_ROUTE_VIEWS = new Set<PrimaryRouteView>([
  "home",
  "learn",
  "phrases",
  "library",
  "progress",
]);

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
  if (name === "phrases") return <svg {...common}><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>;
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

function pushRoute(requestedTarget: NavigationTarget): void {
  const current = parseNavigationLocation(window.location);
  const currentScroll = { x: window.scrollX, y: window.scrollY };
  rememberRouteTab(current, currentScroll);

  const destination = destinationFor(requestedTarget);
  const currentURL = navigationURL(current);
  const nextURL = navigationURL(destination.target);
  if (currentURL === nextURL) {
    document.querySelector<HTMLElement>("#lexigo-main-content")?.focus({ preventScroll: false });
    return;
  }

  window.history.replaceState(
    createNavigationHistoryState(current, currentScroll),
    "",
    window.location.href,
  );

  const nextState = createNavigationHistoryState(destination.target, destination.scroll);
  window.history.pushState(nextState, "", nextURL);
  window.dispatchEvent(new PopStateEvent("popstate", { state: nextState }));
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
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      data-navigation-view={navigationView}
      onClick={(event) => {
        if (shouldUseNativeNavigation(event)) return;
        event.preventDefault();
        pushRoute(target);
      }}
    >
      {children}
    </Link>
  );
}

function currentView(pathname: string): AppView {
  return parseNavigation("", pathname).view;
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
        const active = activeView === entry.view;
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
  if (pathname.startsWith("/lesson/")) return null;

  return (
    <>
      <RouteBrand />
      <RoutePrimaryNavigation variant="header" />
      <RoutePrimaryNavigation variant="rail" />
      <RoutePrimaryNavigation variant="mobile" />
    </>
  );
}
