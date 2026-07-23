import {
  csrfTokenFromCookie,
  restoreSession,
  type Session,
} from "./auth-session";

type SessionBootstrapState = {
  cachedSession: Session | null;
  cachedCSRFToken: string;
  activeRestore: Promise<Session | null> | null;
  generation: number;
};

type SessionBootstrapRuntime = typeof globalThis & {
  __lexigoSessionBootstrapStateV1?: SessionBootstrapState;
};

/**
 * Next.js may evaluate a shared client module more than once when navigation
 * hands control from one route-level chunk to another. Module-local variables
 * therefore cannot be used as a document-wide session bootstrap cache.
 *
 * globalThis is scoped to the current browser document, survives route chunk
 * replacement and is naturally discarded after a full reload.
 */
function bootstrapState(): SessionBootstrapState {
  const runtime = globalThis as SessionBootstrapRuntime;
  runtime.__lexigoSessionBootstrapStateV1 ??= {
    cachedSession: null,
    cachedCSRFToken: "",
    activeRestore: null,
    generation: 0,
  };
  return runtime.__lexigoSessionBootstrapStateV1;
}

function clearCachedSession(state: SessionBootstrapState): void {
  state.cachedSession = null;
  state.cachedCSRFToken = "";
}

function cacheSession(state: SessionBootstrapState, session: Session): void {
  state.cachedSession = session;
  state.cachedCSRFToken = csrfTokenFromCookie();
}

/**
 * Reuses a session restored in the current browser document. Route-level
 * client entries may remount or be evaluated from separate Next.js chunks;
 * that must not rotate the refresh token or repeat the bootstrap request.
 */
export function restoreBootstrappedSession(): Promise<Session | null> {
  const state = bootstrapState();
  const currentCSRFToken = csrfTokenFromCookie();
  if (!currentCSRFToken) {
    if (state.cachedSession) clearCachedSession(state);
    return Promise.resolve(null);
  }

  if (state.cachedSession && state.cachedCSRFToken === currentCSRFToken) {
    return Promise.resolve(state.cachedSession);
  }
  if (state.cachedSession) clearCachedSession(state);
  if (state.activeRestore) return state.activeRestore;

  const restoreGeneration = state.generation;
  const restore = restoreSession()
    .then((session) => {
      const currentState = bootstrapState();
      if (currentState.generation === restoreGeneration && session) {
        cacheSession(currentState, session);
      }
      return session;
    })
    .finally(() => {
      const currentState = bootstrapState();
      if (currentState.activeRestore === restore) currentState.activeRestore = null;
    });
  state.activeRestore = restore;
  return restore;
}

/** Keep the bootstrap cache aligned when a child refreshes its access token. */
export function adoptBootstrappedSession(session: Session): void {
  const state = bootstrapState();
  state.generation += 1;
  state.activeRestore = null;
  cacheSession(state, session);
}

/** Force the next bootstrap to verify the cookie-backed session again. */
export function invalidateBootstrappedSession(): void {
  const state = bootstrapState();
  state.generation += 1;
  state.activeRestore = null;
  clearCachedSession(state);
}
