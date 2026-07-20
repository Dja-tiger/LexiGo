import { afterEach, describe, expect, it, vi } from "vitest";

import { createNavigationHistoryState } from "./navigation-history";
import {
  installHistoryWriteGuard,
  type HistoryWriteGuardEnvironment,
} from "./history-write-guard";

type ListenerMap = Map<string, Set<EventListener>>;

function createEnvironment(options: { replaceThrows?: boolean } = {}) {
  const listeners: ListenerMap = new Map();
  const replaceCalls: Array<{ data: unknown; url?: string | URL | null }> = [];
  const pushCalls: Array<{ data: unknown; url?: string | URL | null }> = [];
  const warnings: Array<{ message: string; error: unknown }> = [];
  const location = { href: "https://lexigo.example/learn" };
  const history = {
    state: createNavigationHistoryState({ view: "learn" }, { x: 0, y: 0 }),
    replaceState(data: unknown, _unused: string, url?: string | URL | null) {
      if (options.replaceThrows) throw new DOMException("Too many calls", "SecurityError");
      replaceCalls.push({ data, url });
      history.state = data as ReturnType<typeof createNavigationHistoryState>;
    },
    pushState(data: unknown, _unused: string, url?: string | URL | null) {
      pushCalls.push({ data, url });
      history.state = data as ReturnType<typeof createNavigationHistoryState>;
      if (url) location.href = new URL(url.toString(), location.href).href;
    },
  };

  const environment: HistoryWriteGuardEnvironment = {
    history,
    location,
    events: {
      addEventListener(type, listener) {
        const registered = listeners.get(type) ?? new Set<EventListener>();
        registered.add(listener);
        listeners.set(type, registered);
      },
      removeEventListener(type, listener) {
        listeners.get(type)?.delete(listener);
      },
    },
    timers: {
      setTimeout(handler, timeout) {
        return setTimeout(handler, timeout) as unknown as number;
      },
      clearTimeout(handle) {
        clearTimeout(handle);
      },
    },
    warn(message, error) {
      warnings.push({ message, error });
    },
  };

  return {
    environment,
    history,
    location,
    listeners,
    replaceCalls,
    pushCalls,
    warnings,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("installHistoryWriteGuard", () => {
  it("coalesces continuous same-route scroll snapshots into one trailing write", () => {
    vi.useFakeTimers();
    const fixture = createEnvironment();
    const uninstall = installHistoryWriteGuard(fixture.environment, 350);

    for (let index = 1; index <= 120; index += 1) {
      fixture.history.replaceState(
        createNavigationHistoryState({ view: "learn" }, { x: 0, y: index }),
        "",
        fixture.location.href,
      );
    }

    expect(fixture.replaceCalls).toHaveLength(0);
    vi.advanceTimersByTime(349);
    expect(fixture.replaceCalls).toHaveLength(0);
    vi.advanceTimersByTime(1);

    expect(fixture.replaceCalls).toHaveLength(1);
    expect(fixture.history.state).toEqual(
      createNavigationHistoryState({ view: "learn" }, { x: 0, y: 120 }),
    );
    uninstall();
  });

  it("flushes the current scroll snapshot before a real navigation push", () => {
    vi.useFakeTimers();
    const fixture = createEnvironment();
    const uninstall = installHistoryWriteGuard(fixture.environment, 350);

    fixture.history.replaceState(
      createNavigationHistoryState({ view: "learn" }, { x: 0, y: 640 }),
      "",
      fixture.location.href,
    );
    fixture.history.pushState(
      createNavigationHistoryState({ view: "phrases" }, { x: 0, y: 0 }),
      "",
      "/phrases",
    );

    expect(fixture.replaceCalls).toHaveLength(1);
    expect(fixture.pushCalls).toHaveLength(1);
    expect(fixture.location.href).toBe("https://lexigo.example/phrases");
    vi.advanceTimersByTime(500);
    expect(fixture.replaceCalls).toHaveLength(1);
    uninstall();
  });

  it("contains a WebKit SecurityError instead of terminating the application", () => {
    vi.useFakeTimers();
    const fixture = createEnvironment({ replaceThrows: true });
    const uninstall = installHistoryWriteGuard(fixture.environment, 350);

    fixture.history.replaceState(
      createNavigationHistoryState({ view: "learn" }, { x: 0, y: 900 }),
      "",
      fixture.location.href,
    );

    expect(() => vi.advanceTimersByTime(350)).not.toThrow();
    expect(fixture.warnings).toHaveLength(1);
    expect(fixture.warnings[0]?.message).toContain("History snapshot was skipped");
    uninstall();
  });

  it("keeps unrelated History API writes synchronous", () => {
    const fixture = createEnvironment();
    const uninstall = installHistoryWriteGuard(fixture.environment, 350);
    const state = { framework: "next" };

    fixture.history.replaceState(state, "", fixture.location.href);

    expect(fixture.replaceCalls).toEqual([{ data: state, url: fixture.location.href }]);
    uninstall();
  });
});
