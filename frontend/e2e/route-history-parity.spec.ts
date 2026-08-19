import {
  expect,
  test,
  type Page,
  type Route,
  type TestInfo,
} from "@playwright/test";

import { ACTIVE_LESSON_ITEMS } from "./support/active-lesson-fixture";
import {
  captureRuntimeErrors,
  installQualityGateAPI,
  QUALITY_PHRASES,
  QUALITY_WORDS,
} from "./support/quality-gates";
import {
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

type Appearance = "light" | "dark";
type RouteHistoryKey =
  | "home"
  | "learn"
  | "active-lesson"
  | "progress"
  | "dictionary"
  | "word-detail"
  | "phrases"
  | "phrase-detail"
  | "profile"
  | "onboarding";

type RouteHistoryContract = Readonly<{
  key: RouteHistoryKey;
  path: string;
  ownerSelector: string;
}>;

type BrowserSurface = Readonly<{
  project: "desktop-chromium" | "ios-webkit";
  width: number;
  height: number;
}>;

const ROUTES: readonly RouteHistoryContract[] = [
  { key: "home", path: "/", ownerSelector: '[data-route-client-island="home"]' },
  { key: "learn", path: "/learn", ownerSelector: '[data-route-client-island="learn"]' },
  { key: "active-lesson", path: "/lesson/active", ownerSelector: '[data-route-client-island="active-lesson"]' },
  { key: "progress", path: "/progress", ownerSelector: '[data-route-client-island="progress"]' },
  { key: "dictionary", path: "/dictionary", ownerSelector: '[data-route-client-island="dictionary"]' },
  { key: "word-detail", path: "/words/101", ownerSelector: '[data-route-client-island="dictionary"]' },
  { key: "phrases", path: "/phrases", ownerSelector: '[data-route-client-island="phrases"]' },
  { key: "phrase-detail", path: `/phrases/${QUALITY_PHRASES[0].slug}`, ownerSelector: '[data-route-client-island="phrases"]' },
  { key: "profile", path: "/profile", ownerSelector: '[data-route-client-island="profile"]' },
  { key: "onboarding", path: "/onboarding", ownerSelector: ".lx-first-use-panel" },
] as const;

const SURFACES: readonly BrowserSurface[] = [
  { project: "desktop-chromium", width: 1440, height: 1024 },
  { project: "ios-webkit", width: 390, height: 844 },
] as const;

const PROFILE_TRANSIT: RouteHistoryContract = {
  key: "profile",
  path: "/profile",
  ownerSelector: '[data-route-client-island="profile"]',
};

const LEARN_TRANSIT: RouteHistoryContract = {
  key: "learn",
  path: "/learn",
  ownerSelector: '[data-route-client-island="learn"]',
};

const ONBOARDING_PROMPT = {
  position: 4,
  id: 20101,
  kind: "word",
  lemma: "schema evolution",
  phonetic: "/ˈskiːmə/",
  partOfSpeech: "noun",
  topic: "Data Engineering",
};

function surfaceFor(testInfo: TestInfo): BrowserSurface | null {
  return SURFACES.find((surface) => surface.project === testInfo.project.name) ?? null;
}

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAppearance(page: Page, appearance: Appearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({ colorScheme: appearance });
}

async function installRouteOverrides(page: Page, contract: RouteHistoryContract): Promise<void> {
  if (contract.key === "active-lesson") {
    await page.route("**/api/v1/lessons/active", async (route) => {
      await fulfillJSON(route, 200, {
        id: "00000000-0000-0000-0000-000000000617",
        source: "phrases",
        studyMode: "recall",
        lessonSize: "15",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: ACTIVE_LESSON_ITEMS,
        createdAt: "2026-08-19T00:00:00Z",
        updatedAt: "2026-08-19T00:00:00Z",
      });
    });
  }

  if (contract.key === "word-detail") {
    // Word Detail validates scheduler/review fields strictly. Reuse the route's
    // canonical fixture instead of the intentionally compact dictionary row.
    await installCanonicalWordDetailFixture(page);
  }

  if (contract.key === "onboarding") {
    await page.route("**/api/v1/onboarding", async (route) => {
      await fulfillJSON(route, 200, {
        state: "in_progress",
        total: 12,
        marked: 4,
        current: ONBOARDING_PROMPT,
      });
    });
  }
}

function expectedLocation(path: string): Readonly<{ pathname: string; search: string }> {
  const parsed = new URL(path, "http://127.0.0.1:3000");
  return { pathname: parsed.pathname, search: parsed.search };
}

async function expectExactLocation(page: Page, path: string): Promise<void> {
  const expected = expectedLocation(path);
  await expect(page).toHaveURL((url) => (
    url.pathname === expected.pathname && url.search === expected.search
  ));
}

async function stabilizeActiveLesson(page: Page): Promise<void> {
  const active = page.locator(".lx-active-lesson");
  if (await active.isVisible()) return;

  const continueLesson = page.getByRole("button", { name: "Продолжить урок", exact: true });
  await expect(continueLesson).toBeVisible();
  await continueLesson.click();
  await expect(active).toBeVisible();
}

async function expectSemanticReady(page: Page, contract: RouteHistoryContract): Promise<void> {
  switch (contract.key) {
    case "home":
      await expect(page.locator(".lx-home-next-action h1")).toBeVisible();
      return;
    case "learn":
      await expect(page.getByRole("heading", { level: 1, name: "Соберите один сфокусированный урок" })).toBeVisible();
      return;
    case "active-lesson":
      await stabilizeActiveLesson(page);
      await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-state", "prompt");
      return;
    case "progress":
      await expect(
        page.locator(".lx-progress-evidence").getByRole("heading", { level: 1, name: "Прогресс", exact: true }),
      ).toBeVisible();
      return;
    case "dictionary":
      await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();
      return;
    case "word-detail":
      await expect(
        page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma, exact: true }),
      ).toBeVisible();
      return;
    case "phrases":
      await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки", exact: true })).toBeVisible();
      return;
    case "phrase-detail":
      await expect(page.getByRole("heading", { level: 1, name: QUALITY_PHRASES[0].lemma, exact: true })).toBeVisible();
      return;
    case "profile":
      await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
      return;
    case "onboarding":
      await expect(page.getByRole("heading", { name: "Продолжим диагностику", exact: true })).toBeVisible();
      return;
  }
}

async function expectRouteReady(
  page: Page,
  contract: RouteHistoryContract,
  appearance: Appearance,
): Promise<void> {
  await expectExactLocation(page, contract.path);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await expect(page.locator(contract.ownerSelector)).toBeVisible();
  await expect(page.locator("#lexigo-main-content")).toBeVisible();
  await expectSemanticReady(page, contract);
}

async function directEntry(
  page: Page,
  contract: RouteHistoryContract,
  appearance: Appearance,
): Promise<string> {
  await page.goto(contract.path, { waitUntil: "domcontentloaded" });
  await expectRouteReady(page, contract, appearance);
  return page.url();
}

function transitFor(contract: RouteHistoryContract): RouteHistoryContract {
  return contract.key === "profile" ? LEARN_TRANSIT : PROFILE_TRANSIT;
}

test.describe("Issue #617 canonical route direct-entry/reload/Back-Forward parity", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const contract of ROUTES) {
    for (const appearance of ["light", "dark"] as const) {
      test(`${contract.key} ${appearance} preserves browser history`, async ({ context, page }, testInfo) => {
        const surface = surfaceFor(testInfo);
        test.skip(
          surface === null,
          "Issue #617 owns desktop Chromium and compact iOS WebKit history parity; existing suites retain Android and specialized URL-state coverage.",
        );
        if (!surface) return;

        await page.setViewportSize({ width: surface.width, height: surface.height });
        expect(page.viewportSize()).toEqual({ width: surface.width, height: surface.height });
        await installQualityGateAPI(context);
        await installRouteOverrides(page, contract);
        await installAppearance(page, appearance);
        const runtimeErrors = captureRuntimeErrors(page);

        const directURL = await directEntry(page, contract, appearance);

        await page.reload({ waitUntil: "domcontentloaded" });
        await expectRouteReady(page, contract, appearance);
        const reloadURL = page.url();
        expect(reloadURL).toBe(directURL);

        const transit = transitFor(contract);
        await page.goto(transit.path, { waitUntil: "domcontentloaded" });
        await expectRouteReady(page, transit, appearance);
        const forwardURL = page.url();

        await page.goBack();
        await expectRouteReady(page, contract, appearance);
        const backURL = page.url();
        expect(backURL).toBe(directURL);

        await page.goForward();
        await expectRouteReady(page, transit, appearance);
        expect(page.url()).toBe(forwardURL);

        expect(
          runtimeErrors,
          `${contract.key}.${surface.project}.${appearance}: runtime errors during direct/reload/history audit`,
        ).toEqual([]);

        await testInfo.attach(`issue-617-history-${contract.key}-${surface.project}-${appearance}.json`, {
          body: Buffer.from(JSON.stringify({
            issue: 617,
            parent: 205,
            route: contract.path,
            routeKey: contract.key,
            project: surface.project,
            viewport: { width: surface.width, height: surface.height },
            appearance,
            directURL,
            reloadURL,
            backURL,
            forwardURL,
            transit: transit.path,
          }, null, 2)),
          contentType: "application/json",
        });
      });
    }
  }
});
