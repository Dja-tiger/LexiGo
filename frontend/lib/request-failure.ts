export type RequestFailureKind =
  | "unauthorized"
  | "forbidden"
  | "offline"
  | "timeout"
  | "malformed"
  | "server"
  | "client"
  | "unknown";

export type RequestProblem = {
  kind: RequestFailureKind;
  title: string;
  message: string;
  retryable: boolean;
  status: number;
  code: string;
};

type RequestFailureOptions = {
  status?: number;
  code?: string;
  field?: string;
  cause?: unknown;
};

export type TimedRequestInit = RequestInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 12_000;

export class RequestFailure extends Error {
  readonly status: number;
  readonly code: string;
  readonly field: string;

  constructor(
    readonly kind: RequestFailureKind,
    message: string,
    options: RequestFailureOptions = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "RequestFailure";
    this.status = options.status ?? 0;
    this.code = options.code ?? "request_failed";
    this.field = options.field ?? "";
  }
}

function failureKindForStatus(status: number): RequestFailureKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status >= 500) return "server";
  if (status >= 400) return "client";
  return "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function errorDetails(value: unknown): { code: string; message: string; field: string } {
  if (!isRecord(value)) return { code: "request_failed", message: "", field: "" };
  const nested = isRecord(value.error) ? value.error : value;
  return {
    code: typeof nested.code === "string" && nested.code.trim() ? nested.code : "request_failed",
    message: typeof nested.message === "string" ? nested.message.trim() : "",
    field: typeof nested.field === "string" ? nested.field.trim() : "",
  };
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: TimedRequestInit = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...requestInit } = options;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, Math.max(1, timeoutMs));
  const abortFromCaller = () => controller.abort(externalSignal?.reason);

  if (externalSignal?.aborted) abortFromCaller();
  else externalSignal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    return await fetch(input, { ...requestInit, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new RequestFailure("timeout", "Request timed out", {
        code: "request_timeout",
        cause: error,
      });
    }
    if (externalSignal?.aborted) throw error;
    const offline = (typeof navigator !== "undefined" && navigator.onLine === false)
      || error instanceof TypeError;
    if (offline) {
      throw new RequestFailure("offline", "Network connection is unavailable", {
        code: "network_offline",
        cause: error,
      });
    }
    throw new RequestFailure("unknown", "Request failed", {
      cause: error,
    });
  } finally {
    globalThis.clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export async function failureFromResponse(response: Response): Promise<RequestFailure> {
  let details = { code: "request_failed", message: "", field: "" };
  try {
    details = errorDetails(await response.clone().json());
  } catch {
    // Status classification remains reliable even when the error body is empty or malformed.
  }
  return new RequestFailure(
    failureKindForStatus(response.status),
    details.message || `Request failed with status ${response.status}`,
    { status: response.status, code: details.code, field: details.field },
  );
}

export async function decodeJSON<T>(
  response: Response,
  validator: (value: unknown) => boolean,
  payloadName: string,
): Promise<T> {
  let value: unknown;
  try {
    const body = await response.text();
    if (!body.trim()) throw new SyntaxError("empty response body");
    value = JSON.parse(body) as unknown;
  } catch (error) {
    throw new RequestFailure("malformed", `${payloadName} contains malformed JSON`, {
      status: response.status,
      code: "malformed_json",
      cause: error,
    });
  }
  if (!validator(value)) {
    throw new RequestFailure("malformed", `${payloadName} has an incompatible schema`, {
      status: response.status,
      code: "invalid_response_schema",
    });
  }
  return value as T;
}

export function toRequestFailure(error: unknown): RequestFailure {
  if (error instanceof RequestFailure) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new RequestFailure("unknown", "Request was cancelled", {
      code: "request_cancelled",
      cause: error,
    });
  }
  return new RequestFailure("unknown", error instanceof Error ? error.message : "Request failed", {
    cause: error,
  });
}

export function describeRequestFailure(error: unknown, resource: string): RequestProblem {
  const failure = toRequestFailure(error);
  switch (failure.kind) {
    case "unauthorized":
      return {
        kind: failure.kind,
        title: "Сессия истекла",
        message: `Войдите снова, чтобы загрузить ${resource}.`,
        retryable: false,
        status: failure.status,
        code: failure.code,
      };
    case "forbidden":
      return {
        kind: failure.kind,
        title: "Доступ ограничен",
        message: `У текущей сессии нет доступа к ресурсу «${resource}».`,
        retryable: false,
        status: failure.status,
        code: failure.code,
      };
    case "offline":
      return {
        kind: failure.kind,
        title: "Нет подключения к сети",
        message: `Не удалось загрузить ${resource}. Проверьте соединение и повторите запрос.`,
        retryable: true,
        status: failure.status,
        code: failure.code,
      };
    case "timeout":
      return {
        kind: failure.kind,
        title: "Сервер отвечает слишком долго",
        message: `Загрузка ресурса «${resource}» превысила допустимое время.`,
        retryable: true,
        status: failure.status,
        code: failure.code,
      };
    case "malformed":
      return {
        kind: failure.kind,
        title: "Получены несовместимые данные",
        message: `Сервер вернул повреждённый или устаревший формат ресурса «${resource}».`,
        retryable: true,
        status: failure.status,
        code: failure.code,
      };
    case "server":
      return {
        kind: failure.kind,
        title: "Сервис временно недоступен",
        message: `Не удалось загрузить ${resource} из-за ошибки сервера.`,
        retryable: true,
        status: failure.status,
        code: failure.code,
      };
    case "client":
      return {
        kind: failure.kind,
        title: "Запрос отклонён",
        message: `Сервис не смог обработать запрос ресурса «${resource}».`,
        retryable: false,
        status: failure.status,
        code: failure.code,
      };
    default:
      return {
        kind: failure.kind,
        title: "Не удалось загрузить данные",
        message: `При загрузке ресурса «${resource}» произошла неизвестная ошибка.`,
        retryable: true,
        status: failure.status,
        code: failure.code,
      };
  }
}
