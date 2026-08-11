import { afterEach, describe, expect, it, vi } from "vitest";

import {
  reportLessonCompletion,
  reportLessonNextAction,
  reportPendingLessonReturn,
  retentionDelayBucket,
} from "./lesson-retention";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

const COMPLETION_KEY = "lexigo:lesson-retention-completion:v1";
const COMPLETION_SESSION_KEY = "lexigo:lesson-retention-session:v1";

function installBrowser(options: { doNotTrack?: string } = {}) {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 202 })));
  const navigatorValue = {
    userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    doNotTrack: options.doNotTrack ?? null,
    globalPrivacyControl: false,
    msDoNotTrack: null,
  };
  const windowValue = {
    innerWidth: 390,
    localStorage,
    sessionStorage,
    doNotTrack: null,
    matchMedia: (query: string) => ({ matches: query.includes("standalone") }),
  };
  const documentValue = {
    documentElement: {
      dataset: { lexigoBuild: "release-2026.08.11" },
    },
  };

  vi.stubGlobal("window", windowValue);
  vi.stubGlobal("navigator", navigatorValue);
  vi.stubGlobal("document", documentValue);
  vi.stubGlobal("fetch", fetchMock);

  return { localStorage, sessionStorage, fetchMock };
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, index: number) {
  const call = fetchMock.mock.calls[index];
  expect(call).toBeDefined();
  const init = call?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("lesson retention delay buckets", () => {
  it.each([
    [0, "under_1m"],
    [59_999, "under_1m"],
    [60_000, "under_5m"],
    [5 * 60_000, "under_30m"],
    [30 * 60_000, "under_4h"],
    [4 * 60 * 60_000, "under_24h"],
    [24 * 60 * 60_000, "under_72h"],
    [72 * 60 * 60_000, "later"],
  ] as const)("maps %d ms to %s", (elapsedMs, expected) => {
    expect(retentionDelayBucket(elapsedMs)).toBe(expected);
  });
});

describe("lesson retention reporting", () => {
  it("reports completion and exactly one chosen action without identifiers", () => {
    const { localStorage, fetchMock } = installBrowser();
    const completedAt = Date.UTC(2026, 7, 11, 18, 0, 0);

    reportLessonCompletion("review_due", completedAt);
    reportLessonNextAction("review_due", completedAt + 90_000);
    reportLessonNextAction("home", completedAt + 120_000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBody(fetchMock, 0)).toEqual({
      appVersion: "release-2026.08.11",
      event: "lesson_completed",
      action: "review_due",
      delayBucket: "none",
      deviceClass: "mobile",
      browserFamily: "webkit",
      displayMode: "standalone",
    });
    expect(requestBody(fetchMock, 1)).toMatchObject({
      event: "completion_to_next_action",
      action: "review_due",
      delayBucket: "under_5m",
    });

    const serialized = JSON.stringify(requestBody(fetchMock, 1));
    for (const forbidden of ["userId", "sessionId", "lessonId", "wordId", "contentId", "url", "referrer"]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(localStorage.getItem(COMPLETION_KEY)).toContain('"actionReported":true');
  });

  it("does not count a reload in the completion browser session as a return", () => {
    const { fetchMock } = installBrowser();
    const completedAt = Date.UTC(2026, 7, 11, 18, 0, 0);

    reportLessonCompletion("next_lesson", completedAt);
    reportPendingLessonReturn(completedAt + 15 * 60_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports one return when a later browser session has no matching session marker", () => {
    const { localStorage, sessionStorage, fetchMock } = installBrowser();
    const completedAt = Date.UTC(2026, 7, 11, 18, 0, 0);

    reportLessonCompletion("home", completedAt);
    sessionStorage.removeItem(COMPLETION_SESSION_KEY);
    reportPendingLessonReturn(completedAt + 26 * 60 * 60_000);
    reportPendingLessonReturn(completedAt + 27 * 60 * 60_000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBody(fetchMock, 1)).toMatchObject({
      event: "return_to_next_session",
      action: "none",
      delayBucket: "under_72h",
    });
    expect(localStorage.getItem(COMPLETION_KEY)).toBeNull();
  });

  it("honors browser privacy opt-out and keeps no cross-session marker", () => {
    const { localStorage, fetchMock } = installBrowser({ doNotTrack: "1" });

    reportLessonCompletion("next_lesson", Date.UTC(2026, 7, 11, 18, 0, 0));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(COMPLETION_KEY)).toBeNull();
  });
});
