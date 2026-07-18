import { describe, expect, it } from "vitest";

import { normalizeProgressValue, rovingTargetIndex } from "./accessibility-semantics";

describe("rovingTargetIndex", () => {
  it("wraps horizontal and vertical navigation", () => {
    expect(rovingTargetIndex(0, 3, "ArrowLeft", "horizontal")).toBe(2);
    expect(rovingTargetIndex(2, 3, "ArrowRight", "horizontal")).toBe(0);
    expect(rovingTargetIndex(0, 3, "ArrowUp", "vertical")).toBe(2);
    expect(rovingTargetIndex(2, 3, "ArrowDown", "vertical")).toBe(0);
  });

  it("supports Home and End and ignores keys outside the configured axis", () => {
    expect(rovingTargetIndex(1, 4, "Home", "horizontal")).toBe(0);
    expect(rovingTargetIndex(1, 4, "End", "horizontal")).toBe(3);
    expect(rovingTargetIndex(1, 4, "ArrowDown", "horizontal")).toBeNull();
    expect(rovingTargetIndex(1, 4, "Enter", "both")).toBeNull();
  });

  it("fails safely for empty groups and invalid current indexes", () => {
    expect(rovingTargetIndex(0, 0, "ArrowRight")).toBeNull();
    expect(rovingTargetIndex(-1, 3, "ArrowRight")).toBe(1);
  });
});

describe("normalizeProgressValue", () => {
  it("clamps finite values to the declared range", () => {
    expect(normalizeProgressValue(75)).toBe(75);
    expect(normalizeProgressValue(-4)).toBe(0);
    expect(normalizeProgressValue(140)).toBe(100);
    expect(normalizeProgressValue(7, 5, 10)).toBe(7);
  });

  it("normalizes malformed values and ranges", () => {
    expect(normalizeProgressValue(Number.NaN)).toBe(0);
    expect(normalizeProgressValue(Number.POSITIVE_INFINITY, 10, 20)).toBe(10);
    expect(normalizeProgressValue(12, 10, 10)).toBe(11);
  });
});
