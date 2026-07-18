import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decodeJSON,
  describeRequestFailure,
  failureFromResponse,
  fetchWithTimeout,
  RequestFailure,
} from "./request-failure";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("request failure classification", () => {
  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [422, "client"],
    [503, "server"],
  ] as const)("classifies HTTP %i as %s", async (status, kind) => {
    const failure = await failureFromResponse(new Response(JSON.stringify({
      error: { code: "test_code", message: "test message" },
    }), {
      status,
      headers: { "Content-Type": "application/json" },
    }));

    expect(failure.kind).toBe(kind);
    expect(failure.status).toBe(status);
    expect(failure.code).toBe("test_code");
    expect(failure.message).toBe("test message");
  });

  it("distinguishes malformed JSON from an incompatible schema", async () => {
    await expect(decodeJSON(
      new Response("{broken", { status: 200 }),
      () => true,
      "Progress response",
    )).rejects.toMatchObject({ kind: "malformed", code: "malformed_json" });

    await expect(decodeJSON(
      new Response(JSON.stringify({ unexpected: true }), { status: 200 }),
      (value) => Boolean(value && typeof value === "object" && "expected" in value),
      "Progress response",
    )).rejects.toMatchObject({ kind: "malformed", code: "invalid_response_schema" });
  });

  it("classifies fetch TypeError as offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(fetchWithTimeout("/api/test")).rejects.toMatchObject({
      kind: "offline",
      code: "network_offline",
    });
  });

  it("aborts a request after the configured timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })));

    const rejection = expect(fetchWithTimeout("/api/test", { timeoutMs: 25 })).rejects.toMatchObject({
      kind: "timeout",
      code: "request_timeout",
    });
    await vi.advanceTimersByTimeAsync(25);
    await rejection;
  });

  it("returns distinct user-facing recovery states", () => {
    expect(describeRequestFailure(new RequestFailure("offline", "offline"), "прогресс")).toMatchObject({
      title: "Нет подключения к сети",
      retryable: true,
    });
    expect(describeRequestFailure(new RequestFailure("timeout", "timeout"), "прогресс")).toMatchObject({
      title: "Сервер отвечает слишком долго",
      retryable: true,
    });
    expect(describeRequestFailure(new RequestFailure("malformed", "malformed"), "прогресс")).toMatchObject({
      title: "Получены несовместимые данные",
      retryable: true,
    });
    expect(describeRequestFailure(new RequestFailure("forbidden", "forbidden", { status: 403 }), "прогресс")).toMatchObject({
      title: "Доступ ограничен",
      retryable: false,
    });
  });
});
