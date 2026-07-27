import { afterEach, describe, expect, it, vi } from "vitest";

import {
  consumeFocusedLessonExitRequest,
  FOCUSED_LESSON_EXIT_REQUEST_EVENT,
  requestFocusedLessonExit,
} from "./focused-lesson-exit-request";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("focused lesson exit request", () => {
  it("keeps a request pending until the active presentation claims it", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });

    requestFocusedLessonExit();

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    expect((dispatchEvent.mock.calls[0]?.[0] as Event).type).toBe(FOCUSED_LESSON_EXIT_REQUEST_EVENT);
    expect(consumeFocusedLessonExitRequest()).toBe(true);
    expect(consumeFocusedLessonExitRequest()).toBe(false);
  });

  it("does not report a request before one is published", () => {
    vi.stubGlobal("window", {});

    expect(consumeFocusedLessonExitRequest()).toBe(false);
  });
});
