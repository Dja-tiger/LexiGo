import { readFile } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearLegacyAuthStorage,
  cookieValue,
  csrfTokenFromCookie,
  expiredSessionURL,
  isSessionPayload,
  refreshSession,
  SessionRefreshError,
} from "./auth-session";

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

describe("auth session", () => {
  it("reads an encoded CSRF cookie and safely ignores malformed values", () => {
    expect(cookieValue("other=1; lexigo_csrf=abc%2Fdef%3D; theme=dark", "lexigo_csrf")).toBe("abc/def=");
    expect(csrfTokenFromCookie("lexigo_csrf=csrf-token")).toBe("csrf-token");
    expect(cookieValue("lexigo_csrf=%E0%A4%A", "lexigo_csrf")).toBe("");
  });

  it("builds deterministic authorization routes for expired and forbidden sessions", () => {
    expect(expiredSessionURL("https://lexigo.example/lesson?view=lesson#card-2"))
      .toBe("/lesson?view=profile&session=expired");
    expect(expiredSessionURL("https://lexigo.example/lesson?view=lesson#card-2", "forbidden"))
      .toBe("/lesson?view=profile&session=forbidden");
  });

  it("removes the legacy persisted session without failing when storage is restricted", () => {
    const removeItem = vi.fn(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });
    vi.stubGlobal("window", {
      localStorage: { removeItem },
      sessionStorage: { removeItem },
    });

    expect(() => clearLegacyAuthStorage()).not.toThrow();
    expect(removeItem).toHaveBeenCalledTimes(2);
  });

  it("validates the complete runtime session schema", () => {
    expect(isSessionPayload(SESSION)).toBe(true);
    expect(isSessionPayload({ ...SESSION, tokens: { ...SESSION.tokens, accessToken: "" } })).toBe(false);
    expect(isSessionPayload({ ...SESSION, user: { ...SESSION.user, createdAt: "not-a-date" } })).toBe(false);
    expect(isSessionPayload({ user: SESSION.user })).toBe(false);
  });

  it("refreshes with credentials and the double-submit CSRF header", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(SESSION), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).resolves.toEqual(SESSION);
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/refresh", expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": "csrf-token",
      },
      signal: expect.any(AbortSignal),
    }));
  });

  it("coalesces concurrent refreshes in the same browser context", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    let resolveResponse: ((value: Response) => void) | undefined;
    const responsePromise = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = vi.fn(() => responsePromise);
    vi.stubGlobal("fetch", fetchMock);

    const first = refreshSession();
    const second = refreshSession();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveResponse?.(new Response(JSON.stringify(SESSION), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    await expect(Promise.all([first, second])).resolves.toEqual([SESSION, SESSION]);
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [503, "server"],
  ] as const)("classifies HTTP %i refresh failures as %s", async (status, kind) => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "refresh_failed", message: "refresh failed" },
    }), {
      status,
      headers: { "Content-Type": "application/json" },
    })));

    await expect(refreshSession({ redirectOnInvalid: false })).rejects.toMatchObject({
      name: "SessionRefreshError",
      kind,
      status,
    });
  });

  it("classifies an unavailable network separately from server errors", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(refreshSession({ redirectOnInvalid: false })).rejects.toMatchObject({
      name: "SessionRefreshError",
      kind: "offline",
      status: 0,
    });
  });

  it("rejects malformed JSON and a structurally invalid successful response", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("{broken", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: SESSION.user }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession({ redirectOnInvalid: false })).rejects.toMatchObject({
      name: "SessionRefreshError",
      kind: "malformed",
      code: "session_refresh_failed",
    });
    await expect(refreshSession({ redirectOnInvalid: false })).rejects.toMatchObject({
      name: "SessionRefreshError",
      kind: "malformed",
      code: "session_refresh_failed",
    });
  });

  it("retains the typed session error contract", () => {
    const error = new SessionRefreshError(403, "forbidden", "forbidden");
    expect(error).toMatchObject({
      name: "SessionRefreshError",
      kind: "forbidden",
      status: 403,
    });
  });

  it("does not write authentication tokens to persistent browser storage", async () => {
    const sources = await Promise.all([
      readFile(new URL("../components/lexigo-bootstrapped-app.tsx", import.meta.url), "utf8"),
      readFile(new URL("../components/lexigo-premium-app.tsx", import.meta.url), "utf8"),
      readFile(new URL("./auth-session.ts", import.meta.url), "utf8"),
    ]);
    const authenticationSource = sources.join("\n");

    expect(authenticationSource).not.toMatch(/(?:localStorage|sessionStorage)\.setItem\([^\n]*(?:accessToken|refreshToken|session)/i);
    expect(authenticationSource).not.toMatch(/indexedDB\.(?:add|put)\([^\n]*(?:accessToken|refreshToken|session)/i);
    expect(authenticationSource).not.toContain("refreshToken:");
  });
});
