import { describe, expect, it } from "vitest";

import {
  isExpectedWebKitGuardServiceWorkerCancellation,
  normalizeRuntimePageError,
} from "./public-runtime-errors";

describe("public runtime error classification", () => {
  const scriptURL = "https://lexigo.example/sw.js?build=build-1";
  const splitWebKitDiagnostic = {
    browserName: "webkit",
    errorName: "Cannot load https",
    errorMessage: "//lexigo.example/sw.js?build=build-1 due to access control checks.",
    guardServiceWorkerURL: scriptURL,
  };

  it("normalizes WebKit's split protocol diagnostic", () => {
    expect(normalizeRuntimePageError(
      splitWebKitDiagnostic.errorName,
      splitWebKitDiagnostic.errorMessage,
    )).toBe(`Cannot load ${scriptURL} due to access control checks.`);
    expect(normalizeRuntimePageError(
      "Error",
      `Cannot load ${scriptURL} due to access control checks.`,
    )).toBe(`Cannot load ${scriptURL} due to access control checks.`);
  });

  it("accepts only the exact WebKit current-build cancellation during guard recovery", () => {
    expect(isExpectedWebKitGuardServiceWorkerCancellation(splitWebKitDiagnostic)).toBe(true);
    expect(isExpectedWebKitGuardServiceWorkerCancellation({
      ...splitWebKitDiagnostic,
      browserName: "chromium",
    })).toBe(false);
    expect(isExpectedWebKitGuardServiceWorkerCancellation({
      ...splitWebKitDiagnostic,
      guardServiceWorkerURL: null,
    })).toBe(false);
    expect(isExpectedWebKitGuardServiceWorkerCancellation({
      ...splitWebKitDiagnostic,
      errorMessage: "//lexigo.example/sw.js?build=another-build due to access control checks.",
    })).toBe(false);
    expect(isExpectedWebKitGuardServiceWorkerCancellation({
      ...splitWebKitDiagnostic,
      errorMessage: "//lexigo.example/api/v1/auth/refresh due to access control checks.",
    })).toBe(false);
    expect(isExpectedWebKitGuardServiceWorkerCancellation({
      ...splitWebKitDiagnostic,
      errorMessage: "//other.example/sw.js?build=build-1 due to access control checks.",
    })).toBe(false);
  });
});
