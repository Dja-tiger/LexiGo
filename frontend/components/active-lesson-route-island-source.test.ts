import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const activeLesson = readFileSync(new URL("./lexigo-active-lesson-app.tsx", import.meta.url), "utf8");

describe("Active Lesson route island source contract", () => {
  it("loads a dedicated authenticated entry for only the canonical active route", () => {
    expect(bootstrap).toContain('import("./lexigo-active-lesson-app")');
    expect(bootstrap).toContain('normalizedPathname(pathname) === "/lesson/active"');
    expect(bootstrap).toContain("useActiveLessonIsland");
    expect(bootstrap).toContain("activeLessonOwnerRetained");
    expect(bootstrap).toContain('request.routeGraph === "product" && request.pathname.startsWith("/lesson/")');
    expect(bootstrap).toContain("<LexigoActiveLessonApp");
  });

  it("does not import the compatibility graph or persistent runtime owners", () => {
    expect(activeLesson).not.toContain('from "./lexigo-premium-app"');
    expect(activeLesson).not.toContain("LexigoPremiumApp");
    expect(activeLesson).not.toContain("ReviewOutboxRuntime");
    expect(activeLesson).not.toContain("ServiceWorkerRegistration");
    expect(activeLesson).not.toContain("restoreBootstrappedSession");
    expect(activeLesson).not.toContain("/api/v1/auth/refresh");
  });

  it("preserves review, optimistic-version, result and safe-exit contracts", () => {
    expect(activeLesson).toContain("lessonVersion: activeLesson.version");
    expect(activeLesson).toContain("responseMs: Math.max(0, Math.round(submittedAt - cardStartedAt))");
    expect(activeLesson).toContain("answerRevealed: revealed || studyMode === \"study\"");
    expect(activeLesson).toContain("timezoneOffsetMinutes: timezoneOffsetMinutes()");
    expect(activeLesson).toContain("buildLessonResultSnapshot");
    expect(activeLesson).toContain("isDistinctLessonResultCandidate");
    expect(activeLesson).toContain('onExit={() => leaveLesson({ view: "home" }, "lesson_exit")}');
  });

  it("keeps the approved presentation and offline event owner intact", () => {
    expect(activeLesson).toContain("<ActiveLessonPresentation");
    expect(activeLesson).toContain("<LessonResultPresentation");
    expect(activeLesson).toContain('data-route-client-island="active-lesson"');
    expect(activeLesson).toContain("mainContentRef.current?.focus({ preventScroll: true })");
    expect(activeLesson).toContain("Урок. Экран загружен.");
    expect(activeLesson).not.toContain("lexigo:lesson-review-queued");
    expect(activeLesson).not.toContain("indexedDB");
  });
});
