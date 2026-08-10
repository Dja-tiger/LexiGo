import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const reminderOwner = readFileSync(
  new URL("../app/calendar-reminder-entry.css", import.meta.url),
  "utf8",
);

describe("Issue #468 closed calendar reminder overflow source contract", () => {
  it("removes only the closed preview from layout geometry", () => {
    const selector =
      ".lx-route-reminder-entry:not([open]) > .lx-route-reminder-preview";
    const start = reminderOwner.indexOf(`${selector} {`);

    expect(start).toBeGreaterThanOrEqual(0);

    const rule = reminderOwner.slice(
      start,
      reminderOwner.indexOf("}", start) + 1,
    );

    expect(rule).toContain("display: none;");
    expect(rule).not.toContain("overflow:");
    expect(rule).not.toContain("visibility:");
    expect(rule).not.toContain("pointer-events:");
  });

  it("keeps the canonical open preview as a visible grid owner", () => {
    const selector = ".lx-route-reminder-preview";
    const start = reminderOwner.indexOf(`${selector} {`);

    expect(start).toBeGreaterThanOrEqual(0);

    const rule = reminderOwner.slice(
      start,
      reminderOwner.indexOf("}", start) + 1,
    );

    expect(rule).toContain("display: grid;");
    expect(rule).toContain("width: min(340px, calc(100vw - 28px));");
    expect(rule).not.toContain("display: none;");
  });
});
