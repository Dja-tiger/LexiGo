import { describe, expect, it, vi } from "vitest";

import {
  ACTIVE_LESSON_PATH,
  consumeLessonResumeIntent,
  lessonResumeURL,
} from "./lesson-resume-intent";

describe("one-time active lesson resume intent", () => {
  it("creates the explicit transient route URL", () => {
    expect(lessonResumeURL()).toBe("/lesson/active?resume=1");
  });

  it("consumes resume=1 once and preserves unrelated query/hash state", () => {
    const replaceState = vi.fn();
    const history = { state: { lexigo: true }, replaceState };

    expect(consumeLessonResumeIntent(
      { pathname: ACTIVE_LESSON_PATH, search: "?resume=1&source=mixed", hash: "#card" },
      history,
    )).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(
      history.state,
      "",
      "/lesson/active?source=mixed#card",
    );
  });

  it("ignores non-canonical routes and non-explicit values", () => {
    const replaceState = vi.fn();
    const history = { state: null, replaceState };

    expect(consumeLessonResumeIntent(
      { pathname: "/learn", search: "?resume=1", hash: "" },
      history,
    )).toBe(false);
    expect(consumeLessonResumeIntent(
      { pathname: ACTIVE_LESSON_PATH, search: "?resume=true", hash: "" },
      history,
    )).toBe(false);
    expect(replaceState).not.toHaveBeenCalled();
  });
});
