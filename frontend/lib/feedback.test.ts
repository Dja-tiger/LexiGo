import { describe, expect, it } from "vitest";

import {
  INITIAL_FEEDBACK_STATE,
  createFeedbackItem,
  feedbackDurationMs,
  feedbackPolicy,
  feedbackReducer,
} from "./feedback";

describe("feedback taxonomy", () => {
  it("keeps blocking errors persistent and assertive", () => {
    expect(feedbackPolicy("blocking-error")).toEqual({
      presentation: "banner",
      role: "alert",
      live: "assertive",
      dismissible: false,
      autoDismiss: false,
    });
    expect(feedbackDurationMs({
      category: "blocking-error",
      title: "Сессия недоступна",
      message: "Повторите восстановление.",
    })).toBeNull();
  });

  it("uses polite dismissible toasts for non-blocking action feedback", () => {
    for (const category of ["error", "success", "info"] as const) {
      expect(feedbackPolicy(category)).toMatchObject({
        presentation: "toast",
        role: "status",
        live: "polite",
        dismissible: true,
        autoDismiss: true,
      });
    }
  });

  it("gives longer copy more reading time inside bounded limits", () => {
    const short = feedbackDurationMs({ category: "success", message: "Готово." });
    const long = feedbackDurationMs({
      category: "success",
      message: "Событие подготовлено. Подтвердите сохранение и уведомление в календаре, затем вернитесь в LexiGo.",
    });
    const veryLong = feedbackDurationMs({ category: "error", message: "Ошибка ".repeat(100) });

    expect(short).toBeGreaterThanOrEqual(5_000);
    expect(long).toBeGreaterThan(short ?? 0);
    expect(veryLong).toBe(12_000);
  });
});

describe("feedback reducer", () => {
  it("queues transient feedback FIFO instead of overwriting the active toast", () => {
    const first = createFeedbackItem("feedback-1", { category: "success", message: "Первое" });
    const second = createFeedbackItem("feedback-2", { category: "info", message: "Второе" });
    const third = createFeedbackItem("feedback-3", { category: "error", message: "Третье" });

    let state = feedbackReducer(INITIAL_FEEDBACK_STATE, { type: "publish", item: first });
    state = feedbackReducer(state, { type: "publish", item: second });
    state = feedbackReducer(state, { type: "publish", item: third });

    expect(state.activeToast?.id).toBe("feedback-1");
    expect(state.toastQueue.map((item) => item.id)).toEqual(["feedback-2", "feedback-3"]);

    state = feedbackReducer(state, { type: "dismiss", id: "feedback-1" });
    expect(state.activeToast?.id).toBe("feedback-2");
    expect(state.toastQueue.map((item) => item.id)).toEqual(["feedback-3"]);

    state = feedbackReducer(state, { type: "dismiss", id: "feedback-2" });
    expect(state.activeToast?.id).toBe("feedback-3");
    expect(state.toastQueue).toEqual([]);
  });

  it("replaces a keyed persistent banner without creating duplicate announcements", () => {
    const first = createFeedbackItem("feedback-1", {
      category: "blocking-error",
      key: "session-restore",
      title: "Сессия недоступна",
      message: "Первая ошибка",
    });
    const updated = createFeedbackItem("feedback-2", {
      category: "blocking-error",
      key: "session-restore",
      title: "Сессия недоступна",
      message: "Уточнённая ошибка",
    });

    let state = feedbackReducer(INITIAL_FEEDBACK_STATE, { type: "publish", item: first });
    state = feedbackReducer(state, { type: "publish", item: updated });

    expect(state.banners).toHaveLength(1);
    expect(state.banners[0]?.id).toBe("feedback-2");
    expect(state.banners[0]?.message).toBe("Уточнённая ошибка");

    state = feedbackReducer(state, { type: "clear-key", key: "session-restore" });
    expect(state.banners).toEqual([]);
  });

  it("clears a keyed active toast and advances to the next unrelated queued item", () => {
    const first = createFeedbackItem("feedback-1", {
      category: "success",
      key: "account-status",
      message: "Первое",
    });
    const second = createFeedbackItem("feedback-2", {
      category: "info",
      key: "calendar-status",
      message: "Второе",
    });

    let state = feedbackReducer(INITIAL_FEEDBACK_STATE, { type: "publish", item: first });
    state = feedbackReducer(state, { type: "publish", item: second });
    state = feedbackReducer(state, { type: "clear-key", key: "account-status" });

    expect(state.activeToast?.id).toBe("feedback-2");
    expect(state.toastQueue).toEqual([]);
  });
});
