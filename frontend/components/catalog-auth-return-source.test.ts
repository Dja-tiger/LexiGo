import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const premiumApp = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");

describe("Issue #72 catalog authentication return ownership", () => {
  it("consumes validated catalog return_to only after successful authentication", () => {
    expect(premiumApp).toContain('import { catalogAuthenticationReturn } from "../lib/auth-return";');
    expect(premiumApp).toContain("const returnTarget = catalogAuthenticationReturn(window.location.search);");
    expect(premiumApp).toContain("window.location.replace(navigationURL(returnTarget));");
  });

  it("keeps the legacy in-memory return view as the non-catalog fallback", () => {
    expect(premiumApp).toContain('navigate({ view: returnView === "profile" ? "home" : returnView });');
  });
});
