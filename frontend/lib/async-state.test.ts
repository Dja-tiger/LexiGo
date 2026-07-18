import { describe, expect, it } from "vitest";

import { failedResourceStatus, loadingResourceStatus, readyResourceStatus } from "./account-resources";
import { RequestFailure } from "./request-failure";

describe("account resource states", () => {
  it("keeps loading and ready states free from stale problems", () => {
    expect(loadingResourceStatus()).toEqual({ phase: "loading", problem: null });
    expect(readyResourceStatus()).toEqual({ phase: "ready", problem: null });
  });

  it("preserves a safe localized problem and correlation id", () => {
    const state = failedResourceStatus(new RequestFailure("server", "internal detail", {
      status: 503,
      code: "temporary_failure",
      correlationId: "req-async-state-42",
    }), "каталог фраз");

    expect(state).toMatchObject({
      phase: "error",
      problem: {
        title: "Сервис временно недоступен",
        retryable: true,
        correlationId: "req-async-state-42",
      },
    });
    expect(state.problem?.message).not.toContain("internal detail");
  });
});
