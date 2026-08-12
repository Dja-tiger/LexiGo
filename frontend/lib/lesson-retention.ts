import { classifyBrowser, classifyDevice, isPrivacyOptOutValue } from "./performance-rum";

export type LessonRetentionAction = "review_due" | "continue_goal" | "next_lesson" | "home";
export type LessonRetentionDelayBucket =
  | "none"
  | "under_1m"
  | "under_5m"
  | "under_30m"
  | "under_4h"
  | "under_24h"
  | "under_72h"
  | "later";

type LessonRetentionEventName =
  | "lesson_completed"
  | "completion_to_next_action"
  | "return_to_next_session";

type LessonRetentionEvent = {
  appVersion: string;
  event: LessonRetentionEventName;
  action: LessonRetentionAction | "none";
  delayBucket: LessonRetentionDelayBucket;
  deviceClass: "mobile" | "tablet" | "desktop";
  browserFamily: "chromium" | "webkit" | "firefox" | "other";
  displayMode: "browser" | "standalone" | "fullscreen" | "minimal-ui" | "unknown";
};

type CompletionMarker = {
  completedAt: number;
  recommendedAction: LessonRetentionAction;
  actionReported: boolean;
};

type PrivacyAwareNavigator = Navigator & {
  globalPrivacyControl?: boolean;
  msDoNotTrack?: string | null;
};

type PrivacyAwareWindow = Window & {
  doNotTrack?: string | null;
};

const REPORT_ENDPOINT = "/api/v1/product/retention";
const COMPLETION_KEY = "lexigo:lesson-retention-completion:v1";
const COMPLETION_SESSION_KEY = "lexigo:lesson-retention-session:v1";
const LAST_REPORTED_COMPLETION_KEY = "lexigo:lesson-retention-last-completion:v1";
const MARKER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

export function retentionDelayBucket(elapsedMs: number): LessonRetentionDelayBucket {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "later";
  if (elapsedMs < 60_000) return "under_1m";
  if (elapsedMs < 5 * 60_000) return "under_5m";
  if (elapsedMs < 30 * 60_000) return "under_30m";
  if (elapsedMs < 4 * 60 * 60_000) return "under_4h";
  if (elapsedMs < 24 * 60 * 60_000) return "under_24h";
  if (elapsedMs < 72 * 60 * 60_000) return "under_72h";
  return "later";
}

export function reportLessonCompletion(action: LessonRetentionAction, completedAt = Date.now()): void {
  if (!isRetentionCollectionEnabled()) {
    clearRetentionState();
    return;
  }
  if (!Number.isFinite(completedAt) || completedAt <= 0) return;

  // The result screen is lesson-owned and may be restored in a later browser
  // session. Resolve any pending return before re-establishing the session
  // marker for this persisted completion; this keeps retention code out of the
  // global route bundle while preserving the cross-session signal.
  reportPendingLessonReturn();

  const lastReported = readLastReportedCompletion();
  if (lastReported === completedAt) {
    writeCompletionSession(completedAt);
    return;
  }

  const marker: CompletionMarker = {
    completedAt,
    recommendedAction: action,
    actionReported: false,
  };
  writeCompletionMarker(marker);
  writeCompletionSession(completedAt);
  writeLastReportedCompletion(completedAt);
  sendRetentionEvent("lesson_completed", action, "none");
}

export function reportLessonNextAction(action: LessonRetentionAction, now = Date.now()): void {
  if (!isRetentionCollectionEnabled()) {
    clearRetentionState();
    return;
  }

  const marker = readCompletionMarker(now);
  if (!marker || marker.actionReported) return;
  sendRetentionEvent("completion_to_next_action", action, retentionDelayBucket(now - marker.completedAt));
  writeCompletionMarker({ ...marker, actionReported: true });
}

export function reportPendingLessonReturn(now = Date.now()): void {
  if (!isRetentionCollectionEnabled()) {
    clearRetentionState();
    return;
  }

  const marker = readCompletionMarker(now);
  if (!marker) return;
  if (readCompletionSession() === marker.completedAt) return;

  sendRetentionEvent("return_to_next_session", "none", retentionDelayBucket(now - marker.completedAt));
  clearCompletionMarker();
}

export function isRetentionCollectionEnabled(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const privacyNavigator = navigator as PrivacyAwareNavigator;
  const privacyWindow = window as PrivacyAwareWindow;
  return !(
    privacyNavigator.globalPrivacyControl === true
    || isPrivacyOptOutValue(navigator.doNotTrack)
    || isPrivacyOptOutValue(privacyNavigator.msDoNotTrack)
    || isPrivacyOptOutValue(privacyWindow.doNotTrack)
  );
}

function sendRetentionEvent(
  event: LessonRetentionEventName,
  action: LessonRetentionAction | "none",
  delayBucket: LessonRetentionDelayBucket,
): void {
  if (typeof fetch !== "function" || typeof window === "undefined" || typeof navigator === "undefined") return;
  const payload: LessonRetentionEvent = {
    appVersion: sanitizeBuildID(document.documentElement.dataset.lexigoBuild),
    event,
    action,
    delayBucket,
    deviceClass: classifyDevice(window.innerWidth),
    browserFamily: classifyBrowser(navigator.userAgent),
    displayMode: currentDisplayMode(),
  };
  void fetch(REPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "omit",
    cache: "no-store",
    keepalive: true,
    referrerPolicy: "no-referrer",
  }).catch(() => undefined);
}

function readCompletionMarker(now: number): CompletionMarker | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(COMPLETION_KEY) ?? "null") as unknown;
    if (!isCompletionMarker(value)) {
      clearCompletionMarker();
      return null;
    }
    if (now < value.completedAt || now - value.completedAt > MARKER_MAX_AGE_MS) {
      clearCompletionMarker();
      return null;
    }
    return value;
  } catch {
    clearCompletionMarker();
    return null;
  }
}

function writeCompletionMarker(marker: CompletionMarker): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMPLETION_KEY, JSON.stringify(marker));
  } catch {
    // Retention analytics remain best-effort when storage is unavailable.
  }
}

function clearCompletionMarker(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(COMPLETION_KEY);
  } catch {
    // Retention analytics remain best-effort when storage is unavailable.
  }
}

function writeCompletionSession(completedAt: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(COMPLETION_SESSION_KEY, String(completedAt));
  } catch {
    // A missing session marker may cause at most one conservative return event.
  }
}

function readCompletionSession(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const value = Number(window.sessionStorage.getItem(COMPLETION_SESSION_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeLastReportedCompletion(completedAt: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_REPORTED_COMPLETION_KEY, String(completedAt));
  } catch {
    // Deduplication is best-effort when storage is unavailable.
  }
}

function readLastReportedCompletion(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const value = Number(window.localStorage.getItem(LAST_REPORTED_COMPLETION_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function clearRetentionState(): void {
  if (typeof window === "undefined") return;
  clearCompletionMarker();
  try {
    window.localStorage.removeItem(LAST_REPORTED_COMPLETION_KEY);
    window.sessionStorage.removeItem(COMPLETION_SESSION_KEY);
  } catch {
    // Privacy opt-out cleanup is best-effort when storage is unavailable.
  }
}

function isCompletionMarker(value: unknown): value is CompletionMarker {
  if (!value || typeof value !== "object") return false;
  const marker = value as Partial<CompletionMarker>;
  return typeof marker.completedAt === "number"
    && Number.isFinite(marker.completedAt)
    && isLessonRetentionAction(marker.recommendedAction)
    && typeof marker.actionReported === "boolean";
}

function isLessonRetentionAction(value: unknown): value is LessonRetentionAction {
  return value === "review_due"
    || value === "continue_goal"
    || value === "next_lesson"
    || value === "home";
}

function currentDisplayMode(): LessonRetentionEvent["displayMode"] {
  if (typeof window.matchMedia !== "function") return "unknown";
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  return "browser";
}

function sanitizeBuildID(value: string | undefined): string {
  const normalized = value?.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return normalized || "local";
}
