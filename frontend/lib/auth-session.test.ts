import { readFile } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearLegacyAuthStorage,
  cookieValue,
  csrfTokenFromCookie,
  expiredSessionURL,
  refreshSession,
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

  it("builds one deterministic authorization route for an expired session", () => {
    expect(expiredSessionURL("https://lexigo.example/lesson?view=lesson#card-2"))
      .toBe("/lesson?view=profile&session=expired");
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

  it("refreshes with credentials and the double-submit CSRF header", async () => {
    vi.stubGlobal("document", { cookie: "lexigo_csrf=csrf-token" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(SESSION), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).resolves.toEqual(SESSION);
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-CSRF-Token": "csrf-token",
      },
    });
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
