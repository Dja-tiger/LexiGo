"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";

import { canonicalURLFromLegacySearch, isCanonicalRoutePath, navigationURL, parseNavigationLocation } from "../lib/navigation";
import { createNavigationHistoryState, readNavigationHistoryState } from "../lib/navigation-history";
import { ApplicationErrorBoundary } from "./application-error-boundary";
import { LexigoBootstrappedApp } from "./lexigo-bootstrapped-app";
import { RouteChrome } from "./route-primary-navigation";

function initializeRouteEntry(): void {
  const target = parseNavigationLocation(window.location);
  const currentState = readNavigationHistoryState(window.history.state);
  const canonicalLegacyURL = canonicalURLFromLegacySearch(window.location.search);
  const currentURL = `${window.location.pathname}${window.location.search}`;
  const targetURL = canonicalLegacyURL ?? currentURL;

  if (!currentState || navigationURL(currentState.target) !== navigationURL(target)) {
    window.history.replaceState(
      createNavigationHistoryState(target, { x: window.scrollX, y: window.scrollY }),
      "",
      targetURL,
    );
    return;
  }

  if (canonicalLegacyURL && canonicalLegacyURL !== currentURL) {
    window.history.replaceState(currentState, "", canonicalLegacyURL);
  }
}

export function RoutedLexigoApp() {
  const pathname = usePathname();
  const initialized = useRef(false);

  if (!initialized.current && typeof window !== "undefined") {
    initializeRouteEntry();
    initialized.current = true;
  }

  if (!isCanonicalRoutePath(pathname)) return null;

  return (
    <div className="lx-routed-app" data-app-router-shell="true">
      <RouteChrome />
      <ApplicationErrorBoundary>
        <LexigoBootstrappedApp />
      </ApplicationErrorBoundary>
    </div>
  );
}
