import { describe, expect, it } from "vitest";

import {
  diagnosticMarkLabel,
  isDiagnosticMarkResultPayload,
  isOnboardingSnapshotPayload,
} from "./onboarding";

describe("onboarding client contract", () => {
  it("accepts an authoritative in-progress snapshot with the current prompt", () => {
    expect(isOnboardingSnapshotPayload({
      state: "in_progress",
      total: 12,
      marked: 4,
      current: {
        position: 4,
        id: 42,
        kind: "word",
        lemma: "schema evolution",
        phonetic: "/ˈskiːmə/",
        partOfSpeech: "noun",
        topic: "Data Engineering",
      },
    })).toBe(true);
  });

  it("rejects impossible progress or a prompt attached to a terminal state", () => {
    expect(isOnboardingSnapshotPayload({ state: "in_progress", total: 3, marked: 4 })).toBe(false);
    expect(isOnboardingSnapshotPayload({
      state: "completed",
      total: 1,
      marked: 1,
      current: {
        position: 0,
        id: 42,
        kind: "word",
        lemma: "schema evolution",
        phonetic: "",
        partOfSpeech: "noun",
        topic: "Data Engineering",
      },
    })).toBe(false);
  });

  it("accepts reveal only in the mark response shape", () => {
    expect(isDiagnosticMarkResultPayload({
      marked: 5,
      total: 12,
      completeReady: false,
      reveal: { id: 42, translation: "эволюция схемы" },
    })).toBe(true);
    expect(isDiagnosticMarkResultPayload({
      marked: 5,
      total: 12,
      completeReady: false,
      reveal: { id: 0, translation: "эволюция схемы" },
    })).toBe(false);
  });

  it("keeps the three server-owned self-mark labels explicit", () => {
    expect(diagnosticMarkLabel("known")).toBe("Знаю");
    expect(diagnosticMarkLabel("unsure")).toBe("Не уверен");
    expect(diagnosticMarkLabel("new")).toBe("Новое");
  });
});
