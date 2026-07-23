import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth-session", () => ({
  csrfTokenFromCookie: vi.fn(),
  restoreSession: vi.fn(),
}));

import { csrfTokenFromCookie, restoreSession, type Session } from "./auth-session";
import {
  adoptBootstrappedSession,
  invalidateBootstrappedSession,
  restoreBootstrappedSession,
} from "./session-bootstrap";

const mockedCSRFToken = vi.mocked(csrfTokenFromCookie);
const mockedRestoreSession = vi.mocked(restoreSession);

const SESSION: Session = {
  user: {
    id: "00000000-0000-0000-0000-000000000115",
    email: "island@example.com",
    displayName: "Route Island",
    createdAt: "2026-07-23T00:00:00Z",
  },
  tokens: {
    accessToken: "access-one",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const REFRESHED_SESSION: Session = {
  ...SESSION,
  tokens: {
    ...SESSION.tokens,
    accessToken: "access-two",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedCSRFToken.mockReturnValue("csrf-one");
  invalidateBootstrappedSession();
});

describe("document session bootstrap cache", () => {
  it("reuses one resolved restore across sequential route remounts", async () => {
    mockedRestoreSession.mockResolvedValue(SESSION);

    await expect(restoreBootstrappedSession()).resolves.toEqual(SESSION);
    await expect(restoreBootstrappedSession()).resolves.toEqual(SESSION);

    expect(mockedRestoreSession).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent bootstrap requests", async () => {
    let resolveRestore: ((session: Session) => void) | undefined;
    mockedRestoreSession.mockImplementation(() => new Promise<Session>((resolve) => {
      resolveRestore = resolve;
    }));

    const first = restoreBootstrappedSession();
    const second = restoreBootstrappedSession();
    expect(mockedRestoreSession).toHaveBeenCalledTimes(1);

    resolveRestore?.(SESSION);
    await expect(Promise.all([first, second])).resolves.toEqual([SESSION, SESSION]);
  });

  it("invalidates the cache when the CSRF session marker rotates", async () => {
    mockedRestoreSession
      .mockResolvedValueOnce(SESSION)
      .mockResolvedValueOnce(REFRESHED_SESSION);

    await expect(restoreBootstrappedSession()).resolves.toEqual(SESSION);
    mockedCSRFToken.mockReturnValue("csrf-two");
    await expect(restoreBootstrappedSession()).resolves.toEqual(REFRESHED_SESSION);

    expect(mockedRestoreSession).toHaveBeenCalledTimes(2);
  });

  it("adopts a child-refreshed session and clears it explicitly", async () => {
    adoptBootstrappedSession(REFRESHED_SESSION);
    await expect(restoreBootstrappedSession()).resolves.toEqual(REFRESHED_SESSION);
    expect(mockedRestoreSession).not.toHaveBeenCalled();

    invalidateBootstrappedSession();
    mockedRestoreSession.mockResolvedValue(SESSION);
    await expect(restoreBootstrappedSession()).resolves.toEqual(SESSION);
    expect(mockedRestoreSession).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failed restore", async () => {
    mockedRestoreSession
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(SESSION);

    await expect(restoreBootstrappedSession()).rejects.toThrow("network unavailable");
    await expect(restoreBootstrappedSession()).resolves.toEqual(SESSION);
    expect(mockedRestoreSession).toHaveBeenCalledTimes(2);
  });
});
