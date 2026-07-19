import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("production proxy routing", () => {
  it("routes the Apple Calendar endpoint to Next.js before the backend API catch-all", () => {
    const caddyfile = readFileSync(resolve(process.cwd(), "../deploy/Caddyfile"), "utf8");
    const calendarRoute = "handle /api/calendar/reminder";
    const backendCatchAll = "handle /api/*";
    const calendarRouteIndex = caddyfile.indexOf(calendarRoute);
    const backendCatchAllIndex = caddyfile.indexOf(backendCatchAll);

    expect(calendarRouteIndex).toBeGreaterThanOrEqual(0);
    expect(backendCatchAllIndex).toBeGreaterThanOrEqual(0);
    expect(calendarRouteIndex).toBeLessThan(backendCatchAllIndex);

    const calendarBlock = caddyfile.slice(calendarRouteIndex, backendCatchAllIndex);
    expect(calendarBlock).toContain("reverse_proxy web:3000");
    expect(calendarBlock).not.toContain("reverse_proxy api:8080");
  });
});
