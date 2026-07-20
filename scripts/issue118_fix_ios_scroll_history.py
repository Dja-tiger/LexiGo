#!/usr/bin/env python3
"""Apply the Issue #118 iOS WebKit scroll/history stability hotfix."""

from __future__ import annotations

from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    occurrences = text.count(old)
    if occurrences != 1:
        raise RuntimeError(f"expected exactly one match in {path}, found {occurrences}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


app_path = Path("frontend/components/lexigo-premium-app.tsx")
replace_once(
    app_path,
    '''    let scrollFrame = 0;

    const applyNavigation = (
''',
    '''    let scrollFrame = 0;
    let scrollCommitTimer = 0;
    let pendingScrollSnapshot: {
      identity: string;
      target: NavigationTarget;
      scroll: NavigationScrollPosition;
    } | null = null;

    const applyNavigation = (
''',
)
replace_once(
    app_path,
    '''    const persistCurrentEntry = () => {
      const current = navigationRef.current;
      const scroll = { x: window.scrollX, y: window.scrollY };
      navigationTabs.remember(current, scroll);
      window.history.replaceState(
        createNavigationHistoryState(current, scroll),
        "",
        window.location.href,
      );
    };

    const scheduleScrollSnapshot = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        persistCurrentEntry();
      });
    };
''',
    '''    const persistScrollSnapshot = (snapshot: NonNullable<typeof pendingScrollSnapshot>) => {
      navigationTabs.remember(snapshot.target, snapshot.scroll);
      if (navigationIdentity(navigationRef.current) !== snapshot.identity) return;

      try {
        window.history.replaceState(
          createNavigationHistoryState(snapshot.target, snapshot.scroll),
          "",
          window.location.href,
        );
      } catch (historyError) {
        // WebKit rate-limits History API writes. A failed scroll snapshot must never
        // terminate the application; navigation itself persists the current entry.
        console.warn("[LexiGo] Scroll history snapshot was skipped", historyError);
      }
    };

    const flushPendingScrollSnapshot = () => {
      if (scrollCommitTimer) {
        window.clearTimeout(scrollCommitTimer);
        scrollCommitTimer = 0;
      }
      const snapshot = pendingScrollSnapshot;
      pendingScrollSnapshot = null;
      if (snapshot) persistScrollSnapshot(snapshot);
    };

    const scheduleScrollSnapshot = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const target = navigationRef.current;
        const scroll = { x: window.scrollX, y: window.scrollY };
        pendingScrollSnapshot = {
          identity: navigationIdentity(target),
          target,
          scroll,
        };
        navigationTabs.remember(target, scroll);
        if (scrollCommitTimer) window.clearTimeout(scrollCommitTimer);
        scrollCommitTimer = window.setTimeout(flushPendingScrollSnapshot, 350);
      });
    };

    const flushScrollOnPageHide = () => flushPendingScrollSnapshot();
''',
)
replace_once(
    app_path,
    '''    window.addEventListener("popstate", syncNavigationFromHistory);
    window.addEventListener("scroll", scheduleScrollSnapshot, { passive: true });
    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", syncNavigationFromHistory);
      window.removeEventListener("scroll", scheduleScrollSnapshot);
    };
''',
    '''    window.addEventListener("popstate", syncNavigationFromHistory);
    window.addEventListener("scroll", scheduleScrollSnapshot, { passive: true });
    window.addEventListener("pagehide", flushScrollOnPageHide);
    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (scrollCommitTimer) window.clearTimeout(scrollCommitTimer);
      pendingScrollSnapshot = null;
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", syncNavigationFromHistory);
      window.removeEventListener("scroll", scheduleScrollSnapshot);
      window.removeEventListener("pagehide", flushScrollOnPageHide);
    };
''',
)

routes_test_path = Path("frontend/e2e/app-router-routes.spec.ts")
replace_once(
    routes_test_path,
    '''function runtimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
''',
    '''function runtimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("crash", () => errors.push("page crashed"));
  page.on("pageerror", (error) => {
''',
)
replace_once(
    routes_test_path,
    '''test("legacy query URLs redirect once to canonical paths without losing filters", async ({ page }) => {
''',
    '''test("continuous scrolling coalesces History API snapshots", async ({ page }, testInfo) => {
  test.skip(!["desktop-chromium", "ios-webkit"].includes(testInfo.project.name), "History pressure is covered in desktop Chromium and iOS WebKit.");
  const errors = runtimeErrors(page);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  await page.evaluate(() => {
    const instrumentedWindow = window as typeof window & {
      __lexigoOriginalReplaceState?: History["replaceState"];
      __lexigoReplaceStateCount?: number;
    };
    if (!instrumentedWindow.__lexigoOriginalReplaceState) {
      const original = window.history.replaceState.bind(window.history);
      instrumentedWindow.__lexigoOriginalReplaceState = original;
      window.history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
        instrumentedWindow.__lexigoReplaceStateCount = (instrumentedWindow.__lexigoReplaceStateCount ?? 0) + 1;
        return original(...args);
      }) as History["replaceState"];
    }
    instrumentedWindow.__lexigoReplaceStateCount = 0;
  });

  await page.evaluate(async () => {
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    for (let frame = 0; frame < 90; frame += 1) {
      const progress = (frame + 1) / 90;
      window.scrollTo(0, maximum * progress);
      window.dispatchEvent(new Event("scroll"));
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }
  });
  await page.waitForTimeout(700);

  const replaceStateCalls = await page.evaluate(() => (
    window as typeof window & { __lexigoReplaceStateCount?: number }
  ).__lexigoReplaceStateCount ?? 0);
  expect(replaceStateCalls).toBeLessThanOrEqual(3);
  await expect(page.getByTestId("application-error-boundary")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("legacy query URLs redirect once to canonical paths without losing filters", async ({ page }) => {
''',
)

public_smoke_path = Path("frontend/e2e/public-runtime-smoke.spec.ts")
replace_once(
    public_smoke_path,
    '''const FATAL_RUNTIME_PATTERN = /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed|hydration failed|UI_RENDER_FAILURE|UI_VERSION_MISMATCH|ROOT_RENDER_FAILURE|ROOT_VERSION_MISMATCH/i;
''',
    '''const FATAL_RUNTIME_PATTERN = /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed|hydration failed|SecurityError|history\\.replaceState|UI_RENDER_FAILURE|UI_VERSION_MISMATCH|ROOT_RENDER_FAILURE|ROOT_VERSION_MISMATCH/i;
''',
)
replace_once(
    public_smoke_path,
    '''function captureFatalRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.name}: ${error.message}`));
''',
    '''function captureFatalRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("crash", () => errors.push("page crashed"));
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.name}: ${error.message}`));
''',
)
replace_once(
    public_smoke_path,
    '''    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
      window.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(1_750);
''',
    '''    await page.evaluate(async () => {
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      for (let frame = 0; frame < 72; frame += 1) {
        window.scrollTo({ top: maximum * ((frame + 1) / 72), behavior: "auto" });
        window.dispatchEvent(new Event("scroll"));
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }
    });
    await page.waitForTimeout(700);
''',
)

print("Issue #118 iOS scroll/history hotfix applied")
