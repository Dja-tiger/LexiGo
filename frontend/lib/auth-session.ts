import { apiUrl } from "./api";
import {
  decodeJSON,
  failureFromResponse,
  fetchWithTimeout,
  RequestFailure,
  type RequestFailureKind,
  toRequestFailure,
} from "./request-failure";

export type User = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type AccessTokens = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type Session = {
  user: User;
  tokens: AccessTokens;
};

type RefreshOptions = {
  redirectOnInvalid?: boolean;
  retryDelaysMs?: readonly number[];
  retryTransient?: boolean;
};

type RestoreOptions = {
  retryDelaysMs?: readonly number[];
};

const CSRF_COOKIE_NAME = "lexigo_csrf";
const LEGACY_SESSION_KEY = "lexigo.session.v1";
const REFRESH_LOCK_NAME = "lexigo.auth.refresh";
const CONFLICT_RETRY_DELAYS_MS = [100, 300] as const;
const RESTORE_RETRY_DELAYS_MS = [150, 500, 1500] as const;

let activeRefresh: Promise<Session> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isSessionPayload(value: unknown): value is Session {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.tokens)) return false;
  const { user, tokens } = value;
  return isNonEmptyString(user.id)
    && isNonEmptyString(user.email)
    && typeof user.displayName === "string"
    && isNonEmptyString(user.createdAt)
    && Number.isFinite(Date.parse(user.createdAt))
    && isNonEmptyString(tokens.accessToken)
    && isNonEmptyString(tokens.tokenType)
    && typeof tokens.expiresIn === "number"
    && Number.isFinite(tokens.expiresIn)
    && tokens.expiresIn > 0;
}

function kindForStatus(status: number): RequestFailureKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status >= 500) return "server";
  if (status >= 400) return "client";
  return "unknown";
}

export class SessionRefreshError extends RequestFailure {
  constructor(
    status: number,
    message: string,
    kind: RequestFailureKind = kindForStatus(status),
    cause?: unknown,
    code = "session_refresh_failed",
  ) {
    super(kind, message, {
      status,
      code,
      cause,
    });
    this.name = "SessionRefreshError";
  }
}

export function isRetryableSessionRefreshError(error: unknown): error is SessionRefreshError {
  if (!(error instanceof SessionRefreshError)) return false;
  return error.code === "refresh_conflict"
    || error.kind === "offline"
    || error.kind === "timeout"
    || error.kind === "server"
    || error.kind === "unknown";
}

export function isDefinitiveSessionRefreshError(error: unknown): error is SessionRefreshError {
  return error instanceof SessionRefreshError
    && (error.kind === "unauthorized" || error.kind === "forbidden" || error.kind === "malformed");
}

export function cookieValue(cookieHeader: string, name: string): string {
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName !== name) continue;
    const value = rawValue.join("=");
    try {
      return decodeURIComponent(value);
    } catch {
      return "";
    }
  }
  return "";
}

export function csrfTokenFromCookie(
  cookieHeader = typeof document === "undefined" ? "" : document.cookie,
): string {
  return cookieValue(cookieHeader, CSRF_COOKIE_NAME);
}

export function clearLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // Safari private mode and managed browsers may deny storage access.
  }
  try {
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // Session restoration must continue even when storage is unavailable.
  }
}

export function expiredSessionURL(currentURL: string, reason = "expired"): string {
  const target = new URL(currentURL);
  target.search = `?view=profile&session=${encodeURIComponent(reason)}`;
  target.hash = "";
  return target.pathname + target.search;
}

export function redirectToExpiredSession(reason = "expired"): void {
  if (typeof window === "undefined") return;
  window.location.replace(expiredSessionURL(window.location.href, reason));
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, Math.max(0, milliseconds)));
}

async function performRefreshAttempt(): Promise<Session> {
  const csrfToken = csrfTokenFromCookie();
  if (!csrfToken) throw new SessionRefreshError(401, "Session marker is missing", "unauthorized");

  let response: Response;
  try {
    response = await fetchWithTimeout(apiUrl("/api/v1/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    });
  } catch (error) {
    const failure = toRequestFailure(error);
    throw new SessionRefreshError(failure.status, failure.message, failure.kind, failure, failure.code);
  }

  if (!response.ok) {
    const failure = await failureFromResponse(response);
    throw new SessionRefreshError(
      response.status,
      failure.message,
      failure.kind,
      failure,
      failure.code,
    );
  }

  try {
    return await decodeJSON<Session>(response, isSessionPayload, "Session response");
  } catch (error) {
    const failure = toRequestFailure(error);
    throw new SessionRefreshError(response.status, failure.message, failure.kind, failure);
  }
}

async function performRefresh(options: RefreshOptions): Promise<Session> {
  const configuredDelays = options.retryDelaysMs ?? CONFLICT_RETRY_DELAYS_MS;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await performRefreshAttempt();
    } catch (error) {
      const retryable = isRetryableSessionRefreshError(error)
        && (error.code === "refresh_conflict" || options.retryTransient === true);
      const retryDelay = configuredDelays[attempt];
      if (!retryable || retryDelay === undefined) throw error;
      await delay(retryDelay);
    }
  }
}

async function refreshWithCrossTabLock(options: RefreshOptions): Promise<Session> {
  if (typeof navigator === "undefined") return performRefresh(options);
  const lockManager = (navigator as Navigator & {
    locks?: { request<T>(name: string, callback: () => Promise<T>): Promise<T> };
  }).locks;
  return lockManager
    ? lockManager.request(REFRESH_LOCK_NAME, () => performRefresh(options))
    : performRefresh(options);
}

export function refreshSession(options: RefreshOptions = {}): Promise<Session> {
  if (!activeRefresh) {
    activeRefresh = refreshWithCrossTabLock(options).finally(() => {
      activeRefresh = null;
    });
  }

  const refresh = activeRefresh;
  if (options.redirectOnInvalid === false) return refresh;
  return refresh.catch((error: unknown) => {
    if (error instanceof SessionRefreshError && (error.kind === "unauthorized" || error.kind === "forbidden")) {
      redirectToExpiredSession(error.kind === "forbidden" ? "forbidden" : "expired");
    }
    throw error;
  });
}

export async function restoreSession(options: RestoreOptions = {}): Promise<Session | null> {
  clearLegacyAuthStorage();
  if (!csrfTokenFromCookie()) return null;
  return refreshSession({
    redirectOnInvalid: false,
    retryDelaysMs: options.retryDelaysMs ?? RESTORE_RETRY_DELAYS_MS,
    retryTransient: true,
  });
}
