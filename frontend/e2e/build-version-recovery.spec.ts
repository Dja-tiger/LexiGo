import { expect, test, type Page } from "@playwright/test";

import {
  BUILD_CACHE_BUSTER_QUERY,
  BUILD_MARKER_STORAGE_KEY,
  BUILD_RECOVERY_STORAGE_KEY,
} from "../lib/build-version-guard";
import { installQualityGateAPI } from "./support/quality-gates";

const EXPECTED_WEBKIT_GUARD_ABORT =
  /^\/127\.0\.0\.1:\d+\/api\/v1\/\S+ due to access control checks\.$/;

function shouldIgnoreRuntimePageError(message: string, guardRecoveryActive: boolean): boolean {
  return guardRecoveryActive && EXPECTED_WEBKIT_GUARD_ABORT.test(message);
}

function captureRuntimeFailures(page: Page): {
  failures: string[];
  setGuardRecoveryActive: (active: boolean) => void;
} {
  const failures: string[] = [];
  let guardRecoveryActive = false;

  page.on("crash", () => failures.push("pagecrash: browser renderer terminated"));
  page.on("pageerror", (error) => {
    if (shouldIgnoreRuntimePageError(error.message, guardRecoveryActive)) return;
    failures.push(`pageerror: ${error.message}`);
  });

  return {
    failures,
    setGuardRecoveryActive(active) {
      guardRecoveryActive = active;
    },
  };
}

async function tolerateGuardNavigation(operation: Promise<unknown>): Promise<void> {
  try {
    await operation;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/aborted|interrupted by another navigation|frame was detached/i.test(message)) throw error;
  }
}

test.describe.configure({ timeout: 45_000 });

test("runtime error filtering is limited to guarded WebKit API cancellations", () => {
  const expectedAbort = "/127.0.0.1:3000/api/v1/auth/refresh due to access control checks.";

  expect(shouldIgnoreRuntimePageError(expectedAbort, true)).toBe(true);
  expect(shouldIgnoreRuntimePageError(expectedAbort, false)).toBe(false);
  expect(shouldIgnoreRuntimePageError(
    "/127.0.0.1:3000/not-api/v1/auth/refresh due to access control checks.",
    true,
  )).toBe(false);
  expect(shouldIgnoreRuntimePageError("Unexpected application error", true)).toBe(false);
});

test("an existing browser context recovers an old build marker without losing its route", async ({ context, page }) => {
  await installQualityGateAPI(context);
  const runtimeFailures = captureRuntimeFailures(page);
  const route = "/dictionary?source=mixed#catalog";
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-app-router-shell="true"]')).toBeVisible();

  const currentBuild = await page.locator("html").getAttribute("data-lexigo-build");
  expect(currentBuild).toBeTruthy();

  await page.evaluate(async ({ markerKey }) => {
    window.localStorage.setItem(markerKey, "stale-existing-client-build");
    const staleCache = await window.caches.open("lexigo-shell-stale-existing-client-build");
    await staleCache.put(
      "/stale-existing-client-document",
      new Response("stale", { status: 200, headers: { "Content-Type": "text/html" } }),
    );
  }, { markerKey: BUILD_MARKER_STORAGE_KEY });

  runtimeFailures.setGuardRecoveryActive(true);
  await tolerateGuardNavigation(page.reload({ waitUntil: "domcontentloaded" }));
  await expect(page.locator('[data-app-router-shell="true"]')).toBeVisible({ timeout: 20_000 });

  await expect.poll(() => page.evaluate(({ markerKey }) => (
    window.localStorage.getItem(markerKey)
  ), { markerKey: BUILD_MARKER_STORAGE_KEY })).toBe(currentBuild);

  const recoveryState = await page.evaluate(({ recoveryKey }) => (
    window.sessionStorage.getItem(recoveryKey)
  ), { recoveryKey: BUILD_RECOVERY_STORAGE_KEY });
  expect(recoveryState).toBeNull();

  const cacheNames = await page.evaluate(() => window.caches.keys());
  expect(cacheNames).not.toContain("lexigo-shell-stale-existing-client-build");

  const finalURL = new URL(page.url());
  expect(finalURL.pathname).toBe("/dictionary");
  expect(finalURL.searchParams.get("source")).toBe("mixed");
  expect(finalURL.searchParams.has(BUILD_CACHE_BUSTER_QUERY)).toBe(false);
  expect(finalURL.hash).toBe("#catalog");
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-build", currentBuild ?? "");

  runtimeFailures.setGuardRecoveryActive(false);
  expect(runtimeFailures.failures).toEqual([]);
});
