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

  it("preserves a safe request correlation id from response headers", async () => {
    const failure = await failureFromResponse(new Response(JSON.stringify({
      error: { code: "temporary_failure", message: "temporary" },
    }), {
      status: 503,
      headers: { "Content-Type": "application/json", "X-Request-ID": "req-44-test" },
    }));

    expect(failure.correlationId).toBe("req-44-test");
    expect(describeRequestFailure(failure, "каталог").correlationId).toBe("req-44-test");
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

  it("reuses route handoff resources and invalidates them after an API mutation", async () => {
    vi.stubGlobal("window", { location: { origin: "http://lexigo.test" } });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input.toString(), "http://lexigo.test");
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "GET") return new Response(null, { status: 204 });
      if (url.pathname === "/api/v1/lessons/active") {
        return new Response(JSON.stringify({ error: { code: "active_lesson_not_found" } }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ dueNow: 7 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const headers = { Authorization: "Bearer route-session" };

    // Clear any module-level cache left by an earlier browser-like test environment.
    await fetchWithTimeout("/api/v1/lessons", { method: "POST", headers });
    await fetchWithTimeout("/api/v1/progress?timezoneOffsetMinutes=0", { headers });
    await fetchWithTimeout("/api/v1/progress?timezoneOffsetMinutes=0", { headers });
    await fetchWithTimeout("/api/v1/lessons/active", { headers });
    await fetchWithTimeout("/api/v1/lessons/active", { headers });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    await fetchWithTimeout("/api/v1/lessons", { method: "POST", headers });
    await fetchWithTimeout("/api/v1/progress?timezoneOffsetMinutes=0", { headers });

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("revalidates a successful active lesson response", async () => {
    vi.stubGlobal("window", { location: { origin: "http://lexigo.test" } });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "00000000-0000-0000-0000-000000000001",
      status: "active",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const headers = { Authorization: "Bearer active-session" };

    await fetchWithTimeout("/api/v1/lessons", { method: "POST", headers });
    await fetchWithTimeout("/api/v1/lessons/active", { headers });
    await fetchWithTimeout("/api/v1/lessons/active", { headers });

    expect(fetchMock).toHaveBeenCalledTimes(3);
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
