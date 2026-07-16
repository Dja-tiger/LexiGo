import { apiUrl } from "./api";

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

const CSRF_COOKIE_NAME = "lexigo_csrf";
const LEGACY_SESSION_KEY = "lexigo.session.v1";
const REFRESH_LOCK_NAME = "lexigo.auth.refresh";

let activeRefresh: Promise<Session> | null = null;

export class SessionRefreshError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
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

async function performRefresh(): Promise<Session> {
  const csrfToken = csrfTokenFromCookie();
  if (!csrfToken) throw new SessionRefreshError(401, "Session marker is missing");

  const response = await fetch(apiUrl("/api/v1/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });
  if (!response.ok) {
    throw new SessionRefreshError(response.status, `Session refresh failed with status ${response.status}`);
  }
  return (await response.json()) as Session;
}

async function refreshWithCrossTabLock(): Promise<Session> {
  if (typeof navigator === "undefined") return performRefresh();
  const lockManager = (navigator as Navigator & {
    locks?: { request<T>(name: string, callback: () => Promise<T>): Promise<T> };
  }).locks;
  return lockManager ? lockManager.request(REFRESH_LOCK_NAME, performRefresh) : performRefresh();
}

export function refreshSession(): Promise<Session> {
  if (activeRefresh) return activeRefresh;
  activeRefresh = refreshWithCrossTabLock().finally(() => {
    activeRefresh = null;
  });
  return activeRefresh;
}

export async function restoreSession(): Promise<Session | null> {
  clearLegacyAuthStorage();
  if (!csrfTokenFromCookie()) return null;
  return refreshSession();
}
