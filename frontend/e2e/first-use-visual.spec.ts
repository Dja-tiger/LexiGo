import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type BrowserContext, type Page, type Route, type TestInfo } from "@playwright/test";

type ExplicitAppearance = "light" | "dark";
type FirstUseVisualBaseline =
  | "guest-compact-light"
  | "guest-compact-dark"
  | "guest-desktop-light"
  | "guest-desktop-dark"
  | "role-compact-light"
  | "role-compact-dark"
  | "resume-desktop-light"
  | "resume-desktop-dark"
  | "loading-compact-light"
  | "loading-compact-dark"
  | "loading-desktop-light"
  | "loading-desktop-dark"
  | "error-compact-light"
  | "error-compact-dark"
  | "error-desktop-light"
  | "error-desktop-dark";

type FirstUseRoute = "/" | "/onboarding";
type CanonicalViewport = Readonly<{ width: 390 | 1440; height: 844 | 900 }>;
type FirstUseVisualContract = Readonly<{
  sha256: string;
  screenMapKey: string;
  openPencilNode: string;
  route: FirstUseRoute;
  viewport: CanonicalViewport;
}>;
type OpenPencilScreenMapEntry = Readonly<{
  key: string;
  route: string;
  openPencilNode: string;
  width: number;
  height: number;
}>;
type OnboardingVisualMode = "role" | "resume" | "loading" | "error";
type OnboardingAPIControls = Readonly<{
  releaseLoading?: () => Promise<void>;
}>;

/**
 * These hashes are approval records for exact Linux PNGs, not generic snapshot
 * fixtures. A hash may change only after the corresponding artifact is manually
 * reviewed against the active OpenPencil node recorded alongside it.
 *
 * `REVIEW_REQUIRED` is intentionally fail-closed: the first immutable Linux run
 * must publish exact PNG/JSON evidence before any new fingerprint is approved.
 *
 * Desktop First Use intentionally uses the canonical 1440×900 OpenPencil frame.
 * Broader 1440×1024 desktop behavior remains part of the umbrella #205 runtime
 * audit, but it is not claimed to be a pixel-parity design viewport here.
 */
const FIRST_USE_VISUAL_BASELINES: Record<FirstUseVisualBaseline, FirstUseVisualContract> = {
  "guest-compact-light": {
    sha256: "dcf5fcb11f5b10b195723de84134d4ce54e1e775027d5ecfb1ace6eddbe2dac2",
    screenMapKey: "firstuse.guest.mobile.light",
    openPencilNode: "n2",
    route: "/",
    viewport: { width: 390, height: 844 },
  },
  "guest-compact-dark": {
    sha256: "27c87ab46f9f71a9710d0c788b87266d3c2465eedf5fef74edfd2357d66c3cca",
    screenMapKey: "firstuse.guest.mobile.dark",
    openPencilNode: "n162",
    route: "/",
    viewport: { width: 390, height: 844 },
  },
  "guest-desktop-light": {
    sha256: "1675a56bf2a31716b6ce7c8dc52bffed9f42190e9743ae88a7c411b59046da79",
    screenMapKey: "firstuse.guest.desktop.light",
    openPencilNode: "n321",
    route: "/",
    viewport: { width: 1440, height: 900 },
  },
  "guest-desktop-dark": {
    sha256: "a60bd586f61bf9ecc71bc9f28e8e549593361d2ae3badb8b60faa73c37050063",
    screenMapKey: "firstuse.guest.desktop.dark",
    openPencilNode: "n493",
    route: "/",
    viewport: { width: 1440, height: 900 },
  },
  "role-compact-light": {
    sha256: "d6281d763d7a50a001b9e11d9bfc63bc000db5ea81490cc6e0a7e1a3ba4379da",
    screenMapKey: "firstuse.onboarding.mobile.light",
    openPencilNode: "fig_4282",
    route: "/onboarding",
    viewport: { width: 390, height: 844 },
  },
  "role-compact-dark": {
    sha256: "b8a542c17b923f2ee8dfcc833966b87cc34006936393d14e3989fff8e0a8ca9a",
    screenMapKey: "firstuse.onboarding.mobile.dark",
    openPencilNode: "n139",
    route: "/onboarding",
    viewport: { width: 390, height: 844 },
  },
  "resume-desktop-light": {
    sha256: "4da3f3589f396a164a05677dfe545167c1647521afde6b206048d7cd4142eae2",
    screenMapKey: "firstuse.diagnostic.resume.desktop.light",
    openPencilNode: "n378",
    route: "/onboarding",
    viewport: { width: 1440, height: 900 },
  },
  "resume-desktop-dark": {
    sha256: "abe2f9c7c180accf73bb6e7771845a85610a89cdee42e170d12787acc4c62e80",
    screenMapKey: "firstuse.diagnostic.resume.desktop.dark",
    openPencilNode: "n550",
    route: "/onboarding",
    viewport: { width: 1440, height: 900 },
  },
  "loading-compact-light": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.loading.mobile.light",
    openPencilNode: "n117",
    route: "/onboarding",
    viewport: { width: 390, height: 844 },
  },
  "loading-compact-dark": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.loading.mobile.dark",
    openPencilNode: "n277",
    route: "/onboarding",
    viewport: { width: 390, height: 844 },
  },
  "loading-desktop-light": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.loading.desktop.light",
    openPencilNode: "n442",
    route: "/onboarding",
    viewport: { width: 1440, height: 900 },
  },
  "loading-desktop-dark": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.loading.desktop.dark",
    openPencilNode: "n614",
    route: "/onboarding",
    viewport: { width: 1440, height: 900 },
  },
  "error-compact-light": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.error.mobile.light",
    openPencilNode: "n128",
    route: "/onboarding",
    viewport: { width: 390, height: 844 },
  },
  "error-compact-dark": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.error.mobile.dark",
    openPencilNode: "n288",
    route: "/onboarding",
    viewport: { width: 390, height: 844 },
  },
  "error-desktop-light": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.error.desktop.light",
    openPencilNode: "n456",
    route: "/onboarding",
    viewport: { width: 1440, height: 900 },
  },
  "error-desktop-dark": {
    sha256: "REVIEW_REQUIRED",
    screenMapKey: "firstuse.error.desktop.dark",
    openPencilNode: "n628",
    route: "/onboarding",
    viewport: { width: 1440, height: 900 },
  },
};

function loadActiveOpenPencilScreens(): readonly OpenPencilScreenMapEntry[] {
  const relativePath = "docs/figma/openpencil-screen-map.json";
  const candidates = [
    process.env.GITHUB_WORKSPACE
      ? resolve(process.env.GITHUB_WORKSPACE, relativePath)
      : undefined,
    resolve("/repository", relativePath),
    resolve(process.cwd(), "..", relativePath),
    resolve(process.cwd(), relativePath),
  ].filter((candidate): candidate is string => typeof candidate === "string");
  const screenMapPath = candidates.find((candidate) => existsSync(candidate));

  if (!screenMapPath) {
    throw new Error(
      `First Use visual parity requires ${relativePath}; checked: ${candidates.join(", ")}`,
    );
  }

  const parsed = JSON.parse(readFileSync(screenMapPath, "utf8")) as {
    activeScreens?: OpenPencilScreenMapEntry[];
  };
  if (!Array.isArray(parsed.activeScreens)) {
    throw new Error(`${screenMapPath} does not expose an activeScreens array`);
  }
  return parsed.activeScreens;
}

const ACTIVE_OPENPENCIL_SCREENS = loadActiveOpenPencilScreens();

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000201",
    email: "first-use-visual@example.com",
    displayName: "First Use Visual",
    createdAt: "2026-08-16T00:00:00Z",
  },
  tokens: {
    accessToken: "first-use-visual-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROMPT = {
  position: 4,
  id: 20101,
  kind: "word",
  lemma: "schema evolution",
  phonetic: "/ˈskiːmə/",
  partOfSpeech: "noun",
  topic: "Data Engineering",
};

const RECOVERABLE_ERROR_COPY = "Текущий выбор сохранён. Повторите запрос — диагностическая позиция не потеряется.";

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAppearance(page: Page, appearance: ExplicitAppearance) {
  await page.addInitScript((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function installGuestAPI(context: BrowserContext) {
  await context.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/refresh") {
      return json(route, 401, { error: { code: "unauthorized", message: "guest" } });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function installOnboardingAPI(
  context: BrowserContext,
  mode: OnboardingVisualMode,
): Promise<OnboardingAPIControls> {
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "first-use-visual-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  let resolveLoadingRoute: ((route: Route) => void) | undefined;
  const loadingRouteReady = mode === "loading"
    ? new Promise<Route>((resolveRoute) => {
      resolveLoadingRoute = resolveRoute;
    })
    : undefined;

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/auth/sessions") return json(route, 200, { sessions: [] });
    if (path === "/api/v1/onboarding" && request.method() === "GET") {
      if (mode === "loading") {
        resolveLoadingRoute?.(route);
        return;
      }
      if (mode === "error") {
        return json(route, 503, {
          error: {
            code: "temporary_unavailable",
            message: RECOVERABLE_ERROR_COPY,
          },
        });
      }
      if (mode === "resume") {
        return json(route, 200, {
          state: "in_progress",
          total: 12,
          marked: 4,
          current: PROMPT,
        });
      }
      return json(route, 200, { state: "not_started", total: 0, marked: 0 });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  if (!loadingRouteReady) return {};
  return {
    releaseLoading: async () => {
      const route = await loadingRouteReady;
      await json(route, 200, { state: "not_started", total: 0, marked: 0 });
    },
  };
}

function annotateOpenPencil(testInfo: TestInfo, baselineName: FirstUseVisualBaseline) {
  const baseline = FIRST_USE_VISUAL_BASELINES[baselineName];
  const { width, height } = baseline.viewport;
  testInfo.annotations.push({
    type: "openpencil",
    description: `${baseline.screenMapKey} | node=${baseline.openPencilNode} | route=${baseline.route} | viewport=${width}×${height}`,
  });
}

function expectActiveOpenPencilContract(baselineName: FirstUseVisualBaseline) {
  const baseline = FIRST_USE_VISUAL_BASELINES[baselineName];
  const screen = ACTIVE_OPENPENCIL_SCREENS.find((entry) => entry.key === baseline.screenMapKey);

  expect(
    screen,
    `${baselineName} must resolve to an active OpenPencil screen-map entry: ${baseline.screenMapKey}`,
  ).toBeDefined();
  expect(screen?.openPencilNode).toBe(baseline.openPencilNode);
  expect(screen?.route).toBe(baseline.route);
  expect({ width: screen?.width, height: screen?.height }).toEqual(baseline.viewport);
}

async function prepareCanonicalViewport(page: Page, baselineName: FirstUseVisualBaseline) {
  const baseline = FIRST_USE_VISUAL_BASELINES[baselineName];
  expectActiveOpenPencilContract(baselineName);
  await page.setViewportSize(baseline.viewport);
  expect(
    page.viewportSize(),
    `${baselineName} must capture the canonical OpenPencil ${baseline.viewport.width}×${baseline.viewport.height} frame`,
  ).toEqual(baseline.viewport);
}

async function settle(page: Page, appearance: ExplicitAppearance) {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function expectControlInsideViewport(page: Page, name: string) {
  const geometry = await page.getByRole("button", { name }).evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
}

async function captureForReview(
  page: Page,
  testInfo: TestInfo,
  baselineName: FirstUseVisualBaseline,
  beforeAssert?: () => Promise<void>,
) {
  const baseline = FIRST_USE_VISUAL_BASELINES[baselineName];
  expect(page.viewportSize()).toEqual(baseline.viewport);

  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
  });
  await testInfo.attach(`${baselineName}.png`, {
    body: screenshot,
    contentType: "image/png",
  });
  const actualSha256 = createHash("sha256").update(screenshot).digest("hex");
  await testInfo.attach(`${baselineName}.json`, {
    body: Buffer.from(JSON.stringify({
      baselineName,
      actualSha256,
      approvedSha256: baseline.sha256,
      screenMapKey: baseline.screenMapKey,
      openPencilNode: baseline.openPencilNode,
      route: baseline.route,
      canonicalViewport: baseline.viewport,
    }, null, 2)),
    contentType: "application/json",
  });
  await beforeAssert?.();
  expect(
    actualSha256,
    `${baselineName} changed from active OpenPencil ${baseline.screenMapKey} (${baseline.openPencilNode}) at ${baseline.viewport.width}×${baseline.viewport.height}; manually review the exact Linux PNG before approving a new hash`,
  ).toBe(baseline.sha256);
}

test.describe("First Use reviewed OpenPencil visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const appearance of ["light", "dark"] as const) {
    test(`Guest Home compact ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `guest-compact-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-compact", "390×844 canonical Guest Home evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      await installGuestAPI(context);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-route-client-island="guest-home"]')).toBeVisible();
      await settle(page, appearance);
      await captureForReview(page, testInfo, baselineName);
    });

    test(`Guest Home desktop ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `guest-desktop-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-desktop", "1440×900 canonical Guest Home evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      await installGuestAPI(context);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-route-client-island="guest-home"]')).toBeVisible();
      await settle(page, appearance);
      await captureForReview(page, testInfo, baselineName);
    });

    test(`Onboarding role compact ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `role-compact-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-compact", "390×844 canonical role-step evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      await installOnboardingAPI(context, "role");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Настроим полезный первый урок" })).toBeVisible();
      await settle(page, appearance);
      await captureForReview(page, testInfo, baselineName);
    });

    test(`Diagnostic resume desktop ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `resume-desktop-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-desktop", "1440×900 canonical resume evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      await installOnboardingAPI(context, "resume");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Продолжим диагностику" })).toBeVisible();
      const unsureMark = page.getByRole("radio", { name: "Не уверен" });
      await unsureMark.click();
      await expect(unsureMark).toHaveAttribute("aria-checked", "true");
      await settle(page, appearance);
      await captureForReview(page, testInfo, baselineName);
    });

    test(`Onboarding loading compact ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `loading-compact-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-compact", "390×844 canonical loading evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      const controls = await installOnboardingAPI(context, "loading");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      const main = page.locator('#lexigo-main-content[data-route-client-island], #lexigo-main-content');
      await expect(page.locator('[data-route-client-island="onboarding"]')).toBeVisible();
      await expect(main).toHaveAttribute("aria-busy", "true");
      await expect(page.locator(".lx-first-use-loading")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Подготавливаем диагностику" })).toBeVisible();
      await expect(page.getByText(PROMPT.lemma)).toHaveCount(0);
      await expect(page.getByRole("radio")).toHaveCount(0);
      await settle(page, appearance);
      await captureForReview(page, testInfo, baselineName, controls.releaseLoading);
    });

    test(`Onboarding loading desktop ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `loading-desktop-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-desktop", "1440×900 canonical loading evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      const controls = await installOnboardingAPI(context, "loading");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      const main = page.locator("#lexigo-main-content");
      await expect(page.locator('[data-route-client-island="onboarding"]')).toBeVisible();
      await expect(main).toHaveAttribute("aria-busy", "true");
      await expect(page.locator(".lx-first-use-loading")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Подготавливаем диагностику" })).toBeVisible();
      await expect(page.getByText(PROMPT.lemma)).toHaveCount(0);
      await expect(page.getByRole("radio")).toHaveCount(0);
      await settle(page, appearance);
      await captureForReview(page, testInfo, baselineName, controls.releaseLoading);
    });

    test(`Onboarding error compact ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `error-compact-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-compact", "390×844 canonical error evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      await installOnboardingAPI(context, "error");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      const alertPanel = page.locator('.lx-first-use-message[role="alert"]');
      await expect(page.locator('[data-route-client-island="onboarding"]')).toBeVisible();
      await expect(alertPanel).toBeVisible();
      await expect(alertPanel.getByRole("heading", { name: "Не удалось продолжить" })).toBeVisible();
      await expect(alertPanel.getByText(RECOVERABLE_ERROR_COPY)).toBeVisible();
      await expect(page.getByRole("button", { name: "Повторить" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Вернуться назад" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Перейти к обучению" })).toHaveCount(0);
      await settle(page, appearance);
      await expectControlInsideViewport(page, "Повторить");
      await expectControlInsideViewport(page, "Вернуться назад");
      await captureForReview(page, testInfo, baselineName);
    });

    test(`Onboarding error desktop ${appearance}`, async ({ context, page }, testInfo) => {
      const baselineName = `error-desktop-${appearance}` as const;
      test.skip(testInfo.project.name !== "visual-desktop", "1440×900 canonical error evidence only");
      annotateOpenPencil(testInfo, baselineName);
      await prepareCanonicalViewport(page, baselineName);
      await installAppearance(page, appearance);
      await installOnboardingAPI(context, "error");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      const stateIntro = page.locator(".lx-first-use-state-intro");
      const alertPanel = page.locator('.lx-first-use-message[role="alert"]');
      await expect(page.locator('[data-route-client-island="onboarding"]')).toBeVisible();
      await expect(stateIntro).toBeVisible();
      await expect(stateIntro.getByRole("heading", { name: "Не удалось продолжить" })).toBeVisible();
      await expect(alertPanel).toBeVisible();
      await expect(alertPanel.getByRole("heading", { name: "Не удалось продолжить" })).toBeVisible();
      await expect(alertPanel.getByText(RECOVERABLE_ERROR_COPY)).toBeVisible();
      await expect(page.getByRole("button", { name: "Повторить" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Вернуться назад" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Перейти к обучению" })).toHaveCount(0);
      await settle(page, appearance);
      await expectControlInsideViewport(page, "Повторить");
      await expectControlInsideViewport(page, "Вернуться назад");
      await captureForReview(page, testInfo, baselineName);
    });
  }
});
