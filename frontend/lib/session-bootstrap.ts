import {
  csrfTokenFromCookie,
  restoreSession,
  type Session,
} from "./auth-session";

let cachedSession: Session | null = null;
let cachedCSRFToken = "";
let activeRestore: Promise<Session | null> | null = null;
let generation = 0;

function clearCachedSession(): void {
  cachedSession = null;
  cachedCSRFToken = "";
}

function cacheSession(session: Session): void {
  cachedSession = session;
  cachedCSRFToken = csrfTokenFromCookie();
}

/**
 * Reuses a session restored in the current browser document. Route-level
 * client entries may remount while Next synchronizes a manually-pushed URL;
 * that must not rotate the refresh token or repeat the bootstrap request.
 */
export function restoreBootstrappedSession(): Promise<Session | null> {
  const currentCSRFToken = csrfTokenFromCookie();
  if (!currentCSRFToken) {
    if (cachedSession) clearCachedSession();
    return Promise.resolve(null);
  }

  if (cachedSession && cachedCSRFToken === currentCSRFToken) {
    return Promise.resolve(cachedSession);
  }
  if (cachedSession) clearCachedSession();
  if (activeRestore) return activeRestore;

  const restoreGeneration = generation;
  const restore = restoreSession()
    .then((session) => {
      if (generation === restoreGeneration && session) cacheSession(session);
      return session;
    })
    .finally(() => {
      if (activeRestore === restore) activeRestore = null;
    });
  activeRestore = restore;
  return restore;
}

/** Keep the bootstrap cache aligned when a child refreshes its access token. */
export function adoptBootstrappedSession(session: Session): void {
  generation += 1;
  activeRestore = null;
  cacheSession(session);
}

/** Force the next bootstrap to verify the cookie-backed session again. */
export function invalidateBootstrappedSession(): void {
  generation += 1;
  activeRestore = null;
  clearCachedSession();
}
