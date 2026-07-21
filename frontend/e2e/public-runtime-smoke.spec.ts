import { expect, test, type Page } from "@playwright/test";

import {
  BUILD_CACHE_BUSTER_QUERY,
  BUILD_MARKER_STORAGE_KEY,
  BUILD_RECOVERY_STORAGE_KEY,
} from "../lib/build-version-guard";
import { isExpectedContentSecurityPolicyConsoleDiagnostic } from "../lib/content-security-policy";

const ROUTES = ["/", "/learn", "/phrases", "/dictionary", "/progress"] as const;
const FATAL_RUNTIME_PATTERN = /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed|hydration failed|UI_RENDER_FAILURE|UI_VERSION_MISMATCH|ROOT_RENDER_FAILURE|ROOT_VERSION_MISMATCH|Content Security Policy/i;
const EXPECTED_CSP_MODE = (() => {
  const configured = process.env.EXPECTED_CSP_MODE?.trim();
  if (configured !== "report-only" && configured !== "enforce") {
    throw new Error("EXPECTED_CSP_MODE must be report-only or enforce");
  }
  return configured;
})();

async function captureCSPViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.defineProperty(window, "__lexigoCSPViolations", {
      configurable: true,
      value: violations,
    });
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push(`${event.effectiveDirective}:${event.blockedURI}`);
    });
  });
}

async function expectCSPContract(page: Page, headers: Record<string, string>): Promise<void> {
  const expectedHeader = EXPECTED_CSP_MODE === "enforce"
    ? "content-security-policy"
    : "content-security-policy-report-only";
  const unexpectedHeader = EXPECTED_CSP_MODE === "enforce"
    ? "content-security-policy-report-only"
    : "content-security-policy";
  const policy = headers[expectedHeader] ?? "";

  expect(policy).toContain("script-src 'self' 'nonce-");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("report-uri /api/v1/security/csp-report");
  expect(policy).not.toContain("'unsafe-eval'");
  expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  expect(headers[unexpectedHeader]).toBeUndefined();
  expect(await page.evaluate(() => Reflect.get(window, "__lexigoCSPViolations") as string[] ?? [])).toEqual([]);
}

function captureFatalRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("crash", () => errors.push("pagecrash: browser renderer terminated"));
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.name}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (
      FATAL_RUNTIME_PATTERN.test(text)
      && !isExpectedContentSecurityPolicyConsoleDiagnostic(text, EXPECTED_CSP_MODE)
    ) {
      errors.push(`console: ${text}`);
    }
  });
  return errors;
}

async function exercisePublicScrollBursts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const pause = (milliseconds: number) => new Promise<void>((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    // Bounded bursts reproduce repeated top/bottom movement without depending
    // on requestAnimationFrame, which iOS WebKit may throttle under load.
    for (let burst = 0; burst < 6; burst += 1) {
      for (let step = 0; step < 6; step += 1) {
        const moveDown = (burst + step) % 2 === 0;
        window.scrollTo({ top: moveDown ? maximumScroll : 0, behavior: "auto" });
        window.dispatchEvent(new Event("scroll"));
      }
      await pause(35);
    }
  });
}

async function tolerateGuardNavigation(operation: Promise<unknown>): Promise<void> {
  try {
    await operation;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/aborted|interrupted by another navigation|frame was detached/i.test(message)) throw error;
  }
}

test.describe.configure({ mode: "serial" });

for (const route of ROUTES) {
  test(`${route} remains usable after hydration and scrolling`, async ({ page }) => {
    const fatalErrors = captureFatalRuntimeErrors(page);
    await captureCSPViolations(page);
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response).not.toBeNull();
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('[data-app-router-shell="true"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /LexiGo/ })).toBeVisible();

    await exercisePublicScrollBursts(page);
    await page.waitForTimeout(1_000);

    await expect(page.locator('[data-testid="application-error-boundary"]')).toHaveCount(0);
    await expect(page.getByText("LexiGo не смог открыть страницу", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Загружены файлы разных версий", { exact: false })).toHaveCount(0);
    await expectCSPContract(page, response?.headers() ?? {});
    expect(fatalErrors).toEqual([]);
  });
}

test("an existing public browser context recovers after its build marker becomes stale", async ({ page }) => {
  const fatalErrors = captureFatalRuntimeErrors(page);
  await captureCSPViolations(page);
  await page.goto("/dictionary?source=mixed#catalog", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-app-router-shell="true"]')).toBeVisible();

  const currentBuild = await page.locator("html").getAttribute("data-lexigo-build");
  expect(currentBuild).toBeTruthy();

  await page.evaluate(async ({ markerKey }) => {
    window.localStorage.setItem(markerKey, "stale-public-browser-build");
    const staleCache = await window.caches.open("lexigo-shell-stale-public-browser-build");
    await staleCache.put(
      "/stale-public-browser-document",
      new Response("stale", { status: 200, headers: { "Content-Type": "text/html" } }),
    );
  }, { markerKey: BUILD_MARKER_STORAGE_KEY });

  await tolerateGuardNavigation(page.reload({ waitUntil: "domcontentloaded" }));
  await expect(page.locator('[data-app-router-shell="true"]')).toBeVisible({ timeout: 20_000 });

  await expect.poll(() => page.evaluate(({ markerKey }) => (
    window.localStorage.getItem(markerKey)
  ), { markerKey: BUILD_MARKER_STORAGE_KEY })).toBe(currentBuild);

  expect(await page.evaluate(({ recoveryKey }) => (
    window.sessionStorage.getItem(recoveryKey)
  ), { recoveryKey: BUILD_RECOVERY_STORAGE_KEY })).toBeNull();
  expect(await page.evaluate(() => window.caches.keys())).not.toContain(
    "lexigo-shell-stale-public-browser-build",
  );

  const finalURL = new URL(page.url());
  expect(finalURL.pathname).toBe("/dictionary");
  expect(finalURL.searchParams.get("source")).toBe("mixed");
  expect(finalURL.searchParams.has(BUILD_CACHE_BUSTER_QUERY)).toBe(false);
  expect(finalURL.hash).toBe("#catalog");
  expect(await page.evaluate(() => Reflect.get(window, "__lexigoCSPViolations") as string[] ?? [])).toEqual([]);
  expect(fatalErrors).toEqual([]);
});
