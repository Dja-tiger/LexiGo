type APIErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    field?: string;
  };
};

export class AccountRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly field?: string,
    message = "Не удалось выполнить операцию",
  ) {
    super(message);
  }
}

function csrfToken(): string {
  const entry = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("lexigo_csrf="));
  return entry ? decodeURIComponent(entry.slice("lexigo_csrf=".length)) : "";
}

export async function accountResponse(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  if (init.method && init.method !== "GET" && init.method !== "HEAD") {
    const csrf = csrfToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.ok) return response;

  let payload: APIErrorPayload = {};
  try {
    payload = await response.json() as APIErrorPayload;
  } catch {
    // Preserve a structured fallback for non-JSON proxy and gateway errors.
  }
  throw new AccountRequestError(
    response.status,
    payload.error?.code ?? "request_failed",
    payload.error?.field,
    payload.error?.message ?? `Запрос завершился с кодом ${response.status}`,
  );
}

export async function accountRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await accountResponse(path, accessToken, init);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
