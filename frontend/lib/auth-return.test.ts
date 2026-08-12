import { describe, expect, it } from "vitest";

import { authenticationURL, catalogAuthenticationReturn } from "./auth-return";

describe("catalog authentication return", () => {
  it("preserves canonical dictionary filters and detail context", () => {
    const loginURL = authenticationURL({
      view: "library",
      source: "data-engineering",
      query: "window function",
      sort: "az",
      page: 3,
      detail: "42",
    });

    const profile = new URL(loginURL, "https://lexigo.test");
    expect(profile.pathname).toBe("/profile");
    expect(catalogAuthenticationReturn(profile.search)).toEqual({
      view: "library",
      source: "data-engineering",
      query: "window function",
      sort: "az",
      page: 3,
      detail: "42",
    });
  });

  it("preserves phrase detail context", () => {
    const loginURL = authenticationURL({ view: "phrases", query: "incident", detail: "status-update" });
    expect(catalogAuthenticationReturn(new URL(loginURL, "https://lexigo.test").search)).toEqual({
      view: "phrases",
      query: "incident",
      detail: "status-update",
    });
  });

  it.each([
    "https://evil.example/dictionary",
    "//evil.example/dictionary",
    "javascript:alert(1)",
    "/profile",
    "/progress",
    "/lesson/active",
    "/unknown",
  ])("rejects unsafe or non-catalog return target %s", (target) => {
    const search = new URLSearchParams({ return_to: target }).toString();
    expect(catalogAuthenticationReturn(`?${search}`)).toBeNull();
  });

  it("normalizes malformed catalog parameters instead of trusting them", () => {
    const search = new URLSearchParams({
      return_to: "/dictionary?status=invalid&page=-4&source=invalid&query=valid",
    }).toString();
    expect(catalogAuthenticationReturn(`?${search}`)).toEqual({ view: "library", query: "valid" });
  });
});
