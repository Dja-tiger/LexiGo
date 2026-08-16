import { describe, expect, it } from "vitest";

import { authenticationURL, catalogAuthenticationReturn } from "./auth-return";
import {
  isCanonicalRoutePath,
  isRestorableNavigation,
  navigationURL,
  parseNavigation,
  viewTitle,
} from "./navigation";

describe("First Use navigation", () => {
  it("owns a canonical non-restorable onboarding route", () => {
    expect(parseNavigation("", "/onboarding")).toEqual({ view: "onboarding" });
    expect(navigationURL({ view: "onboarding" })).toBe("/onboarding");
    expect(isCanonicalRoutePath("/onboarding")).toBe(true);
    expect(isRestorableNavigation({ view: "onboarding" })).toBe(false);
    expect(viewTitle("onboarding")).toBe("Первичная настройка");
  });

  it("round-trips onboarding through the existing same-origin authentication return", () => {
    const loginURL = authenticationURL({ view: "onboarding" });
    const profile = new URL(loginURL, "https://lexigo.test");
    expect(profile.pathname).toBe("/profile");
    expect(catalogAuthenticationReturn(profile.search)).toEqual({ view: "onboarding" });
  });

  it.each([
    "https://evil.example/onboarding",
    "//evil.example/onboarding",
    "/onboarding/other-user",
    "/lesson/active",
    "/progress",
  ])("rejects unsafe First Use return target %s", (target) => {
    const search = new URLSearchParams({ return_to: target }).toString();
    expect(catalogAuthenticationReturn(`?${search}`)).toBeNull();
  });
});
