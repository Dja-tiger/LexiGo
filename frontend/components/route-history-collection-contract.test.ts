import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type FrontendPackage = Readonly<{
  scripts?: Readonly<Record<string, string>>;
}>;

const frontendRoot = process.cwd();
const ownerSource = readFileSync(
  path.join(frontendRoot, "e2e", "route-history-parity.spec.ts"),
  "utf8",
);
const frontendPackage = JSON.parse(
  readFileSync(path.join(frontendRoot, "package.json"), "utf8"),
) as FrontendPackage;

const ROUTE_MARKERS = [
  'path: "/"',
  'path: "/learn"',
  'path: "/lesson/active"',
  'path: "/progress"',
  'path: "/dictionary"',
  'path: "/words/101"',
  'path: "/phrases"',
  'path: `/phrases/${QUALITY_PHRASES[0].slug}`',
  'path: "/profile"',
  'path: "/onboarding"',
] as const;

describe("Issue #617 route history parity collection", () => {
  it("keeps the owner in semantic navigation and the actually blocking UI CI collection", () => {
    expect(frontendPackage.scripts?.["test:e2e:navigation"]).toContain(
      "e2e/route-history-parity.spec.ts",
    );
    expect(frontendPackage.scripts?.["test:e2e:ui"]).toContain(
      "e2e/route-history-parity.spec.ts",
    );
  });

  it("keeps exactly ten canonical route contracts", () => {
    for (const marker of ROUTE_MARKERS) expect(ownerSource).toContain(marker);

    const routeBlock = ownerSource.slice(
      ownerSource.indexOf("const ROUTES:"),
      ownerSource.indexOf("const SURFACES:"),
    );
    expect(routeBlock.match(/\{ key: "/g)).toHaveLength(10);
  });

  it("keeps desktop Chromium and compact iOS WebKit surfaces explicit", () => {
    expect(ownerSource).toContain('{ project: "desktop-chromium", width: 1440, height: 1024 }');
    expect(ownerSource).toContain('{ project: "ios-webkit", width: 390, height: 844 }');
    expect(ownerSource).toContain('for (const appearance of ["light", "dark"] as const)');
  });

  it("uses real browser reload, Back and Forward instead of synthetic history events", () => {
    expect(ownerSource).toContain("page.reload(");
    expect(ownerSource).toContain("page.goBack()");
    expect(ownerSource).toContain("page.goForward()");
    expect(ownerSource).not.toContain("history.pushState");
    expect(ownerSource).not.toContain("history.replaceState");
    expect(ownerSource).not.toContain("popstate");
    expect(ownerSource).not.toContain("waitForTimeout");
  });

  it("keeps Active Lesson and Onboarding as deterministic valid states", () => {
    expect(ownerSource).toContain('contract.key === "active-lesson"');
    expect(ownerSource).toContain('page.route("**/api/v1/lessons/active"');
    expect(ownerSource).toContain('status: "active"');
    expect(ownerSource).toContain('contract.key === "onboarding"');
    expect(ownerSource).toContain('page.route("**/api/v1/onboarding"');
    expect(ownerSource).toContain('state: "in_progress"');
  });

  it("keeps lesson preview response ownership in the canonical context fixture", () => {
    expect(ownerSource).toContain("await installQualityGateAPI(context)");
    expect(ownerSource).toContain("async function installLessonPreviewInterception(page: Page)");
    expect(ownerSource).toContain('page.route("**/api/v1/lessons/preview"');
    expect(ownerSource).toContain("delete headers.origin");
    expect(ownerSource).toContain("route.fallback({ headers })");
    expect(ownerSource).not.toContain("browserCorsHeaders");
    expect(ownerSource).not.toContain('"access-control-allow-origin"');
  });

  it("fails closed on exact route identity and canonical owner restoration", () => {
    expect(ownerSource).toContain("expectExactLocation(page, contract.path)");
    expect(ownerSource).toContain("contract.ownerSelector");
    expect(ownerSource).toContain("expect(reloadURL).toBe(directURL)");
    expect(ownerSource).toContain("expect(backURL).toBe(directURL)");
    expect(ownerSource).toContain("expect(page.url()).toBe(forwardURL)");
  });

  it("keeps appearance and runtime-error evidence across the history cycle", () => {
    expect(ownerSource).toContain('data-lexigo-appearance');
    expect(ownerSource).toContain('data-lexigo-resolved-appearance');
    expect(ownerSource).toContain("captureRuntimeErrors(page)");
    expect(ownerSource).toContain("runtime errors during direct/reload/history audit");
    expect(ownerSource).toContain("issue-617-history-${contract.key}-${surface.project}-${appearance}.json");
    expect(ownerSource).toContain("parent: 205");
  });
});
