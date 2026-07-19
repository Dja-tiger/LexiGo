import { readFile } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isDefinitiveSessionRefreshError,
  isRetryableSessionRefreshError,
  refreshSession,
  restoreSession,
  SessionRefreshError,
} from "./auth-session";
import { subscribeToSessionResume, type SessionResumeEnvironment } from "./session-resume";

const SESSION = {
  user: {
    id: "user-1",
    email: "test@example.com",
    displayName: "Test User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PWA session resume resilience", () => {
  it("treats only confirmed authorization failures as a definitive logout", () => {
    expect(isDefinitiveSessionRefreshError(new SessionRefreshError(401, "expired", "unauthorized"))).toBe(true);
    expect(isDefinitiveSessionRefreshError(new SessionRefreshError(403, "forbidden", "forbidden"))).toBe(true);
    expect(isDefinitiveSessionRefreshError(new SessionRefreshError(503, "temporary", "server"))).toBe(false);
    expect(isDefinitiveSessionRefreshError(new SessionRefreshError(200, "malformed", "malformed"))).toBe(false);
  });

  it("classifies transient failures and refresh conflicts as retryable", () => {
    expect(isRetryableSessionRefreshError(new SessionRefreshError(0, "offline", "offline"))).toBe(true);
    expect(isRetryableSessionRefreshError(new SessionRefreshError(503, "server", "server"))).toBe(true);
    expect(isRetryableSessionRefreshError(
      new SessionRefreshError(409, "conflict", "client", undefined, "refresh_conflict"),
    )).toBe(true);
    expect(isRetryableSessionRefreshError(new SessionRefreshError(401, "expired", "unauthorized"))).toBe(false);
  });

  it("retries a concurrent refresh conflict after the winning response updates cookies", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: "refresh_conflict", message: "session refresh is already in progress" },
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(SESSION), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession({
      redirectOnInvalid: false,
      retryDelaysMs: [0],
    })).resolves.toEqual(SESSION);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a transient bootstrap failure without requiring credentials", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify(SESSION), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(restoreSession({ retryDelaysMs: [0] })).resolves.toEqual(SESSION);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("subscribes to online, pageshow and visible-state resume signals with cleanup", () => {
    const windowListeners = new Map<string, EventListenerOrEventListenerObject>();
    const documentListeners = new Map<string, EventListenerOrEventListenerObject>();
    const environment = {
      windowTarget: {
        addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
          windowListeners.set(type, listener);
        }),
        removeEventListener: vi.fn((type: string) => {
          windowListeners.delete(type);
        }),
      },
      documentTarget: {
        visibilityState: "hidden" as DocumentVisibilityState,
        addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
          documentListeners.set(type, listener);
        }),
        removeEventListener: vi.fn((type: string) => {
          documentListeners.delete(type);
        }),
      },
    } as unknown as SessionResumeEnvironment;
    const onResume = vi.fn();

    const unsubscribe = subscribeToSessionResume(onResume, environment);
    const invoke = (listener: EventListenerOrEventListenerObject | undefined) => {
      if (typeof listener === "function") listener(new Event("resume"));
      else listener?.handleEvent(new Event("resume"));
    };

    invoke(windowListeners.get("online"));
    invoke(windowListeners.get("pageshow"));
    invoke(documentListeners.get("visibilitychange"));
    expect(onResume).toHaveBeenCalledTimes(2);

    environment.documentTarget.visibilityState = "visible";
    invoke(documentListeners.get("visibilitychange"));
    expect(onResume).toHaveBeenCalledTimes(3);

    unsubscribe();
    expect(windowListeners.size).toBe(0);
    expect(documentListeners.size).toBe(0);
  });

  it("keeps retryable bootstrap failures outside the guest login state", async () => {
    const source = await readFile(
      new URL("../components/lexigo-bootstrapped-app.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("isDefinitiveSessionRefreshError");
    expect(source).toContain("setRestoreRecoverable(true)");
    expect(source).toContain("Сессия не удалена. Пароль вводить заново не нужно.");
    expect(source).toContain("subscribeToSessionResume(requestRetry)");
    expect(source).not.toContain("document.addEventListener");
  });
});
