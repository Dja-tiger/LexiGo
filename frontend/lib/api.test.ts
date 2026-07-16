import { afterEach, describe, expect, it } from "vitest";
import { apiBaseUrl, apiUrl } from "./api";

describe("api URL", () => {
  afterEach(() => delete process.env.NEXT_PUBLIC_API_BASE_URL);

  it("uses same-origin requests by default", () => {
    expect(apiBaseUrl()).toBe("");
    expect(apiUrl("/api/v1/me")).toBe("/api/v1/me");
  });

  it("supports an explicit public API origin", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/";
    expect(apiUrl("/health/live")).toBe("https://api.example.com/health/live");
  });
});
