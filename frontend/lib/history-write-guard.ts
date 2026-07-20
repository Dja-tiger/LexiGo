import {
  navigationIdentity,
  readNavigationHistoryState,
} from "./navigation-history";

const DEFAULT_SCROLL_COMMIT_DELAY_MS = 350;

type HistoryURL = string | URL | null | undefined;

type MutableHistory = {
  state: unknown;
  replaceState(data: unknown, unused: string, url?: HistoryURL): void;
  pushState(data: unknown, unused: string, url?: HistoryURL): void;
};

type GuardEventSource = {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
};

type GuardTimerSource = {
  setTimeout(handler: () => void, timeout: number): number;
  clearTimeout(handle: number): void;
};

export type HistoryWriteGuardEnvironment = {
  history: MutableHistory;
  location: Pick<Location, "href">;
  events: GuardEventSource;
  timers: GuardTimerSource;
  warn: (message: string, error: unknown) => void;
};

type PendingReplaceState = {
  data: unknown;
  unused: string;
  url?: HistoryURL;
  expectedHref: string;
  identity: string;
};

function browserEnvironment(): HistoryWriteGuardEnvironment {
  return {
    history: window.history,
    location: window.location,
    events: window,
    timers: window,
    warn: (message, error) => console.warn(message, error),
  };
}

function resolvedHref(url: HistoryURL, currentHref: string): string | null {
  try {
    return url === null || url === undefined
      ? currentHref
      : new URL(url.toString(), currentHref).href;
  } catch {
    return null;
  }
}

function lexigoIdentity(value: unknown): string | null {
  const state = readNavigationHistoryState(value);
  return state ? navigationIdentity(state.target) : null;
}

function isSameEntryScrollSnapshot(
  currentState: unknown,
  nextState: unknown,
  url: HistoryURL,
  currentHref: string,
): boolean {
  const currentIdentity = lexigoIdentity(currentState);
  const nextIdentity = lexigoIdentity(nextState);
  return Boolean(
    currentIdentity
      && nextIdentity
      && currentIdentity === nextIdentity
      && resolvedHref(url, currentHref) === currentHref,
  );
}

/**
 * Coalesces repeated same-entry LexiGo `history.replaceState` writes.
 *
 * A real touch scroll can emit dozens of events per second. The application
 * stores the latest scroll position in memory immediately, but persisting every
 * animation frame through the History API can exceed WebKit's write budget and
 * terminate the page. Navigation writes remain synchronous; only repeated
 * writes for the current LexiGo route are committed after scrolling settles.
 */
export function installHistoryWriteGuard(
  environment: HistoryWriteGuardEnvironment = browserEnvironment(),
  commitDelayMs = DEFAULT_SCROLL_COMMIT_DELAY_MS,
): () => void {
  const { history, location, events, timers, warn } = environment;
  const originalReplaceState = history.replaceState;
  const originalPushState = history.pushState;
  let pending: PendingReplaceState | null = null;
  let commitTimer = 0;
  let disposed = false;

  const cancelPending = () => {
    if (commitTimer) timers.clearTimeout(commitTimer);
    commitTimer = 0;
    pending = null;
  };

  const safeReplaceState = (entry: PendingReplaceState) => {
    try {
      originalReplaceState.call(history, entry.data, entry.unused, entry.url);
    } catch (error) {
      // Losing one scroll snapshot is preferable to taking down the WebKit page.
      warn("[LexiGo] History snapshot was skipped", error);
    }
  };

  const flushPending = () => {
    if (commitTimer) timers.clearTimeout(commitTimer);
    commitTimer = 0;
    const entry = pending;
    pending = null;
    if (!entry || disposed) return;

    const currentIdentity = lexigoIdentity(history.state);
    if (
      currentIdentity !== entry.identity
      || location.href !== entry.expectedHref
      || resolvedHref(entry.url, location.href) !== location.href
    ) {
      return;
    }
    safeReplaceState(entry);
  };

  const guardedReplaceState: MutableHistory["replaceState"] = (data, unused, url) => {
    if (isSameEntryScrollSnapshot(history.state, data, url, location.href)) {
      const identity = lexigoIdentity(data);
      if (!identity) {
        originalReplaceState.call(history, data, unused, url);
        return;
      }
      pending = {
        data,
        unused,
        url,
        expectedHref: location.href,
        identity,
      };
      if (commitTimer) timers.clearTimeout(commitTimer);
      commitTimer = timers.setTimeout(flushPending, commitDelayMs);
      return;
    }

    flushPending();
    try {
      originalReplaceState.call(history, data, unused, url);
    } catch (error) {
      if (!lexigoIdentity(data)) throw error;
      warn("[LexiGo] History navigation state was skipped", error);
    }
  };

  const guardedPushState: MutableHistory["pushState"] = (data, unused, url) => {
    flushPending();
    originalPushState.call(history, data, unused, url);
  };

  const flushOnPageHide: EventListener = () => flushPending();
  const cancelOnPopState: EventListener = () => cancelPending();

  history.replaceState = guardedReplaceState;
  history.pushState = guardedPushState;
  events.addEventListener("pagehide", flushOnPageHide);
  events.addEventListener("beforeunload", flushOnPageHide);
  events.addEventListener("popstate", cancelOnPopState);

  return () => {
    disposed = true;
    cancelPending();
    events.removeEventListener("pagehide", flushOnPageHide);
    events.removeEventListener("beforeunload", flushOnPageHide);
    events.removeEventListener("popstate", cancelOnPopState);
    if (history.replaceState === guardedReplaceState) history.replaceState = originalReplaceState;
    if (history.pushState === guardedPushState) history.pushState = originalPushState;
  };
}
