import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth-session", () => ({
  csrfTokenFromCookie: vi.fn(),
  refreshSession: vi.fn(),
}));

import { authorizedJSON, requestJSON } from "./authorized-json";
import { csrfTokenFromCookie, refreshSession, type Session } from "./auth-session";

const mockedCSRFToken = vi.mocked(csrfTokenFromCookie);
const mockedRefreshSession = vi.mocked(refreshSession);

const SESSION: Session = {
  user: {
    id: "00000000-0000-0000-0000-000000000115",
    email: "route-island@example.com",
    displayName: "Route Island",
    createdAt: "2026-07-23T00:00:00Z",
  },
  tokens: {
    accessToken: "initial-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const REFRESHED_SESSION: Session = {
  ...SESSION,
  tokens: {
    ...SESSION.tokens,
    accessToken: "refreshed-access-token",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("authorized JSON client", () => {
  it("adds JSON, bearer and CSRF headers to a mutating request", async () => {
    mockedCSRFToken.mockReturnValue("csrf-token");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ saved: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJSON<{ saved: boolean }>(
      "/api/v1/example",
      { method: "POST", body: JSON.stringify({ value: 1 }) },
      SESSION.tokens.accessToken,
      (value) => Boolean(value) && typeof value === "object" && (value as { saved?: unknown }).saved === true,
    )).resolves.toEqual({ saved: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(url).toBe("/api/v1/example");
    expect(init.credentials).toBe("include");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer initial-access-token");
    expect(headers.get("X-CSRF-Token")).toBe("csrf-token");
  });

  it("refreshes once after a 401 and retries with the new access token", async () => {
    mockedCSRFToken.mockReturnValue("csrf-token");
    mockedRefreshSession.mockResolvedValue(REFRESHED_SESSION);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: "unauthorized", message: "expired" },
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await authorizedJSON<{ items: unknown[] }>(
      SESSION,
      "/api/v1/words",
      {},
      (value) => Boolean(value) && typeof value === "object" && Array.isArray((value as { items?: unknown }).items),
    );

    expect(mockedRefreshSession).toHaveBeenCalledTimes(1);
    expect(result.activeSession).toEqual(REFRESHED_SESSION);
    expect(result.data).toEqual({ items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstHeaders = new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit).headers);
    const secondHeaders = new Headers((fetchMock.mock.calls[1]?.[1] as RequestInit).headers);
    expect(firstHeaders.get("Authorization")).toBe("Bearer initial-access-token");
    expect(secondHeaders.get("Authorization")).toBe("Bearer refreshed-access-token");
  });
});
