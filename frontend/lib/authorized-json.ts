import { apiUrl } from "./api";
import { csrfTokenFromCookie, refreshSession, type Session } from "./auth-session";
import {
  decodeJSON,
  failureFromResponse,
  fetchWithTimeout,
  RequestFailure,
} from "./request-failure";

export type AuthorizedJSONResult<T> = {
  activeSession: Session;
  data: T;
};

export async function requestJSON<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
  validator: (value: unknown) => boolean = () => true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = csrfTokenFromCookie();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetchWithTimeout(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    const failure = await failureFromResponse(response);
    throw new RequestFailure(failure.kind, failure.message, {
      status: failure.status,
      code: failure.code,
      field: failure.field,
      correlationId: failure.correlationId,
      cause: failure,
    });
  }
  if (response.status === 204) return undefined as T;
  return decodeJSON<T>(response, validator, `${path} response`);
}

export async function authorizedJSON<T>(
  current: Session,
  path: string,
  init: RequestInit = {},
  validator: (value: unknown) => boolean = () => true,
): Promise<AuthorizedJSONResult<T>> {
  try {
    return {
      activeSession: current,
      data: await requestJSON<T>(path, init, current.tokens.accessToken, validator),
    };
  } catch (error) {
    if (!(error instanceof RequestFailure) || error.status !== 401) throw error;
    const refreshed = await refreshSession();
    return {
      activeSession: refreshed,
      data: await requestJSON<T>(path, init, refreshed.tokens.accessToken, validator),
    };
  }
}
