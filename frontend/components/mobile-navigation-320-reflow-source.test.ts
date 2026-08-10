import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const labelsOwner = readFileSync(
  new URL("../app/mobile-navigation-labels.css", import.meta.url),
  "utf8",
);

describe("Issue #466 narrow mobile navigation reflow source contract", () => {
  it("bounds both label grid layers to the owning navigation track", () => {
    const wrapperSelector =
      ".lx-routed-app:has(.lx-route-nav--mobile) .lx-route-nav--mobile a > span";
    const labelSelector = `${wrapperSelector} > span`;

    expect(labelsOwner).toContain(`${wrapperSelector} {`);
    expect(labelsOwner).toContain(`${labelSelector} {`);

    const wrapperRule = labelsOwner.slice(
      labelsOwner.indexOf(`${wrapperSelector} {`),
      labelsOwner.indexOf("}", labelsOwner.indexOf(`${wrapperSelector} {`)) + 1,
    );
    const labelRule = labelsOwner.slice(
      labelsOwner.indexOf(`${labelSelector} {`),
      labelsOwner.indexOf("}", labelsOwner.indexOf(`${labelSelector} {`)) + 1,
    );

    for (const rule of [wrapperRule, labelRule]) {
      expect(rule).toContain("inline-size: 100%;");
      expect(rule).toContain("min-inline-size: 0;");
      expect(rule).toContain("max-inline-size: 100%;");
    }
  });

  it("keeps the label paint and wrapping contract unchanged", () => {
    expect(labelsOwner).toContain("overflow: visible;");
    expect(labelsOwner).toContain("text-overflow: clip;");
    expect(labelsOwner).toContain("white-space: normal;");
    expect(labelsOwner).toContain("overflow-wrap: anywhere;");

    for (const prohibited of [
      "background:",
      "border:",
      "box-shadow:",
      "color:",
      "position:",
      "transform:",
    ]) {
      expect(labelsOwner, `${prohibited} must remain route-presentation owned`).not.toContain(prohibited);
    }
  });
});
