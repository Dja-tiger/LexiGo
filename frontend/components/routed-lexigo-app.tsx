"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, type MouseEvent } from "react";

import { installHistoryWriteGuard } from "../lib/history-write-guard";
import { canonicalURLFromLegacySearch, isCanonicalRoutePath, navigationURL, parseNavigationLocation } from "../lib/navigation";
import { createNavigationHistoryState, readNavigationHistoryState } from "../lib/navigation-history";
import { LexigoBootstrappedApp } from "./lexigo-bootstrapped-app";
import { RouteChrome } from "./route-primary-navigation";

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

  useLayoutEffect(() => installHistoryWriteGuard(), []);

  useLayoutEffect(() => {
    initializeRouteEntry();
  }, [pathname]);

  if (!isCanonicalRoutePath(pathname)) return null;

  return (
    <div className="lx-routed-app" data-app-router-shell="true">
      <RouteSkipLink />
      <RouteChrome />
      <LexigoBootstrappedApp />
    </div>
  );
}
