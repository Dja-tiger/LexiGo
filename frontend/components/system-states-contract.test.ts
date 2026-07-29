import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const asyncStateSource = readFileSync(new URL("./async-state.tsx", import.meta.url), "utf8");
const outboxRuntimeSource = readFileSync(new URL("./review-outbox-runtime.tsx", import.meta.url), "utf8");
const activeLessonSource = readFileSync(new URL("./active-lesson-presentation.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const mobilePWAStyles = readFileSync(new URL("../app/mobile-pwa-fixes.css", import.meta.url), "utf8");
const retiredOutboxStyles = new URL("../app/review-outbox.css", import.meta.url);
const retiredGenericLessonStyles = new URL("../app/system-states-lesson.css", import.meta.url);
const stateCSS = readFileSync(new URL("../app/system-states.css", import.meta.url), "utf8");
const lessonStateCSS = readFileSync(new URL("../app/active-lesson-queued-state.css", import.meta.url), "utf8");

const productStateSource = [
  asyncStateSource,
  outboxRuntimeSource,
  activeLessonSource,
  layoutSource,
  stateCSS,
  lessonStateCSS,
].join("\n");

describe("system state ownership contract", () => {
  it("loads the bounded state layers after route presentation styles", () => {
    expect(layoutSource).toContain('import "./system-states.css";');
    expect(layoutSource).toContain('import "./active-lesson-queued-state.css";');
    expect(layoutSource).not.toContain('import "./system-states-lesson.css";');
    expect(existsSync(retiredGenericLessonStyles)).toBe(false);
    expect(layoutSource.indexOf('import "./profile.css";'))
      .toBeLessThan(layoutSource.indexOf('import "./system-states.css";'));
    expect(layoutSource.indexOf('import "./system-states.css";'))
      .toBeLessThan(layoutSource.indexOf('import "./active-lesson-queued-state.css";'));
  });

  it("keeps async, skeleton and connectivity presentation in one canonical owner", () => {
    expect(layoutSource).not.toContain('import "./review-outbox.css";');
    expect(existsSync(retiredOutboxStyles)).toBe(false);
    expect(mobilePWAStyles).not.toContain(".lx-async-state");
    expect(mobilePWAStyles).not.toContain(".lx-async-skeleton");

    for (const selector of [
      ".lx-async-state",
      ".lx-async-skeleton",
      ".lx-review-sync",
      ".lx-review-sync--offline .lx-review-sync__indicator",
      ".lx-review-sync--pending .lx-review-sync__indicator",
    ]) {
      expect(stateCSS).toContain(selector);
    }
    expect(stateCSS).toMatch(
      /\.lx-review-sync__copy span\s*\{[\s\S]*?color:\s*#cbd5e1;[\s\S]*?font-size:\s*13px;[\s\S]*?line-height:\s*1\.45;/,
    );
  });

  it("uses shared semantic tokens and preserves accessible motion and contrast fallbacks", () => {
    for (const token of [
      "--ak-color-canvas",
      "--ak-color-surface",
      "--ak-color-text-main",
      "--ak-color-text-muted",
      "--ak-color-primary",
      "--ak-color-retained",
      "--ak-color-weak",
    ]) {
      expect(stateCSS).toContain(token);
    }
    expect(stateCSS).toContain("@media (prefers-reduced-motion: reduce)");
    expect(stateCSS).toContain("animation: none");
    expect(stateCSS).toContain("@media (forced-colors: active)");
    expect(lessonStateCSS).toContain("@media (forced-colors: active)");
  });

  it("keeps the durable review queue ahead of the first network request", () => {
    const durableWrite = outboxRuntimeSource.indexOf("record = await enqueueLessonReview");
    const firstSend = outboxRuntimeSource.indexOf("originalFetch(requestWithIdempotency");
    expect(durableWrite).toBeGreaterThan(-1);
    expect(firstSend).toBeGreaterThan(durableWrite);
    expect(outboxRuntimeSource).toContain('headers.set("Idempotency-Key", idempotencyKey)');
    expect(outboxRuntimeSource).toContain('"X-Lexigo-Review-Queued": "true"');
    expect(outboxRuntimeSource).not.toContain("localStorage");
    expect(outboxRuntimeSource).not.toContain("sessionStorage");
  });

  it("turns offline and retryable review failures into one truthful queued state", () => {
    expect(outboxRuntimeSource).toContain('const REVIEW_QUEUED_EVENT = "lexigo:lesson-review-queued"');
    expect(outboxRuntimeSource).toContain('else if (disposition === "retry")');
    expect(outboxRuntimeSource).toContain("return queuedResponse(message)");
    expect(outboxRuntimeSource).toContain("Полный переход по уроку остаётся серверным");
    expect(activeLessonSource).toContain('const LESSON_REVIEW_QUEUED_EVENT = "lexigo:lesson-review-queued"');
    expect(activeLessonSource).toContain('data-review-queued="true"');
    expect(activeLessonSource).toContain("Ожидаем синхронизацию");
    expect(activeLessonSource).toContain("Следующая карточка откроется после восстановления сети и подтверждения серверной позиции");
    expect(activeLessonSource).toContain("reviewing || queuedReview");
  });

  it("keeps shared async states live, focusable and geometry-preserving", () => {
    expect(asyncStateSource).toContain('aria-busy={kind === "loading" ? true : undefined}');
    expect(asyncStateSource).toContain('role={kind === "error" ? "alert" : "status"}');
    expect(asyncStateSource).toContain('aria-live={kind === "error" ? "assertive" : "polite"}');
    expect(asyncStateSource).toContain("regionRef.current?.focus");
    expect(asyncStateSource).toContain('data-skeleton-variant={variant}');
    expect(stateCSS).toContain("min-height: 152px");
    expect(stateCSS).toContain("min-height: 320px");
  });

  it("does not advertise unsupported custom-term or full-offline capabilities", () => {
    expect(productStateSource).not.toContain("Добавить термин");
    expect(productStateSource).not.toContain("128 элементов доступны");
    expect(outboxRuntimeSource).toContain("Полный переход по уроку остаётся серверным");
    expect(activeLessonSource).toContain("Следующая карточка откроется после восстановления сети и подтверждения серверной позиции");
  });
});
