import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const asyncStateSource = readFileSync(new URL("./async-state.tsx", import.meta.url), "utf8");
const outboxRuntimeSource = readFileSync(new URL("./review-outbox-runtime.tsx", import.meta.url), "utf8");
const activeLessonSource = readFileSync(new URL("./active-lesson-presentation.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const stateCSS = readFileSync(new URL("../app/system-states.css", import.meta.url), "utf8");
const lessonStateCSS = readFileSync(new URL("../app/system-states-lesson.css", import.meta.url), "utf8");
const offlineContract = readFileSync(new URL("../../docs/offline-review-outbox.md", import.meta.url), "utf8");

const productStateSource = [
  asyncStateSource,
  outboxRuntimeSource,
  activeLessonSource,
  layoutSource,
  stateCSS,
  lessonStateCSS,
  offlineContract,
].join("\n");

describe("system state ownership contract", () => {
  it("loads the bounded state layers after route presentation styles", () => {
    expect(layoutSource).toContain('import "./system-states.css";');
    expect(layoutSource).toContain('import "./system-states-lesson.css";');
    expect(layoutSource.indexOf('import "./profile.css";'))
      .toBeLessThan(layoutSource.indexOf('import "./system-states.css";'));
    expect(layoutSource.indexOf('import "./system-states.css";'))
      .toBeLessThan(layoutSource.indexOf('import "./system-states-lesson.css";'));
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
    expect(offlineContract).toContain("Полный offline-урок намеренно не реализован");
    expect(offlineContract).toContain("переход к следующей карточке");
  });
});
