import { createHash } from "node:crypto";
import { resolve } from "node:path";

import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type CDPSession,
  type Page,
  type Route,
  type TestInfo,
  type Worker,
} from "@playwright/test";

import {
  installActiveLessonFixture,
  openActiveLesson,
} from "./support/active-lesson-fixture";
import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PHRASES,
  QUALITY_SESSION,
} from "./support/quality-gates";
import {
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

type ExplicitAppearance = "light" | "dark";
type RouteZoomKey =
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

type RouteZoomContract = Readonly<{
  key: RouteZoomKey;
  path: string;
  ownerSelector: string;
  focused: boolean;
}>;

type BrowserZoomResult = Readonly<{
  tabId: number;
  url: string;
  previousZoom: number;
  zoom: number;
  mode: string | null;
  scope: string | null;
}>;

type BrowserLayoutMetrics = Readonly<{
  cssLayoutViewport: { clientWidth: number; clientHeight: number };
  cssVisualViewport: { clientWidth: number; clientHeight: number; scale: number; zoom: number };
}>;

type DOMZoomMetrics = Readonly<{
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  documentWidth: number;
  bodyWidth: number;
  rootFontSize: number;
  visualViewportScale: number;
}>;

type ReviewedZoomBaseline = Readonly<{
  width: number;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const ROUTES: readonly RouteZoomContract[] = [
  { key: "home", path: "/", ownerSelector: '[data-route-client-island="home"]', focused: false },
  { key: "learn", path: "/learn", ownerSelector: '[data-route-client-island="learn"]', focused: false },
  { key: "active-lesson", path: "/lesson/active", ownerSelector: '[data-route-client-island="active-lesson"]', focused: true },
  { key: "progress", path: "/progress", ownerSelector: '[data-route-client-island="progress"]', focused: false },
  { key: "dictionary", path: "/dictionary", ownerSelector: '[data-route-client-island="dictionary"]', focused: false },
  { key: "word-detail", path: "/words/101", ownerSelector: '[data-route-client-island="dictionary"]', focused: false },
  { key: "phrases", path: "/phrases", ownerSelector: '[data-route-client-island="phrases"]', focused: false },
  { key: "phrase-detail", path: `/phrases/${QUALITY_PHRASES[0].slug}`, ownerSelector: '[data-route-client-island="phrases"]', focused: false },
  { key: "profile", path: "/profile", ownerSelector: '[data-route-client-island="profile"]', focused: false },
  // Keep onboarding last: its deterministic API replaces the shared quality API.
  { key: "onboarding", path: "/onboarding", ownerSelector: ".lx-first-use-panel", focused: true },
] as const;

const REVIEW_REQUIRED: ReviewedZoomBaseline = {
  width: 0,
  height: 0,
  sha256: "REVIEW_REQUIRED",
  sourceRun: 0,
  sourceHeadSha: "REVIEW_REQUIRED",
};

const ZOOM_BASELINES: Record<`${RouteZoomKey}.${ExplicitAppearance}`, ReviewedZoomBaseline> = {
  "home.light": REVIEW_REQUIRED,
  "home.dark": REVIEW_REQUIRED,
  "learn.light": REVIEW_REQUIRED,
  "learn.dark": REVIEW_REQUIRED,
  "active-lesson.light": REVIEW_REQUIRED,
  "active-lesson.dark": REVIEW_REQUIRED,
  "progress.light": REVIEW_REQUIRED,
  "progress.dark": REVIEW_REQUIRED,
  "dictionary.light": REVIEW_REQUIRED,
  "dictionary.dark": REVIEW_REQUIRED,
  "word-detail.light": REVIEW_REQUIRED,
  "word-detail.dark": REVIEW_REQUIRED,
  "phrases.light": REVIEW_REQUIRED,
  "phrases.dark": REVIEW_REQUIRED,
  "phrase-detail.light": REVIEW_REQUIRED,
  "phrase-detail.dark": REVIEW_REQUIRED,
  "profile.light": REVIEW_REQUIRED,
  "profile.dark": REVIEW_REQUIRED,
  "onboarding.light": REVIEW_REQUIRED,
  "onboarding.dark": REVIEW_REQUIRED,
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

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installOnboardingResumeAPI(context: BrowserContext): Promise<void> {
  await context.unroute("**/api/v1/**");
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "route-zoom-parity-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, QUALITY_SESSION);
    if (path === "/api/v1/auth/sessions") return fulfillJSON(route, 200, { sessions: [] });
    if (path === "/api/v1/onboarding" && request.method() === "GET") {
      return fulfillJSON(route, 200, {
        state: "in_progress",
        total: 12,
        marked: 4,
        current: ONBOARDING_PROMPT,
      });
    }
    return fulfillJSON(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function openRoute(
  contract: RouteZoomContract,
  page: Page,
  context: BrowserContext,
): Promise<void> {
  switch (contract.key) {
    case "home":
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу|Первый полезный урок — без длинной настройки/,
      );
      return;
    case "learn":
      await page.goto("/learn", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
      return;
    case "active-lesson":
      await installActiveLessonFixture(page, "recall");
      await openActiveLesson(page);
      await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-state", "prompt");
      return;
    case "progress":
      await page.goto("/progress", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".lx-progress-evidence").getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
      return;
    case "dictionary":
      await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();
      return;
    case "word-detail":
      await installCanonicalWordDetailFixture(page);
      await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
      return;
    case "phrases":
      await page.goto("/phrases", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
      return;
    case "phrase-detail":
      await page.goto(`/phrases/${QUALITY_PHRASES[0].slug}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: QUALITY_PHRASES[0].lemma })).toBeVisible();
      return;
    case "profile":
      await page.goto("/profile", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
      await expect(page.getByText("12 из 30 ответов сегодня", { exact: true })).toBeVisible();
      return;
    case "onboarding": {
      await installOnboardingResumeAPI(context);
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Продолжим диагностику" })).toBeVisible();
      const unsureMark = page.getByRole("radio", { name: "Не уверен" });
      await unsureMark.click();
      await expect(unsureMark).toHaveAttribute("aria-checked", "true");
      return;
    }
  }
}

async function setBrowserZoom(worker: Worker, targetURL: string, zoomFactor: number): Promise<BrowserZoomResult> {
  return worker.evaluate(async ({ targetURL: exactTargetURL, zoomFactor: exactZoomFactor }) => {
    type ZoomController = { setZoomForURL: (url: string, factor: number) => Promise<BrowserZoomResult> };
    const controller = (globalThis as typeof globalThis & {
      lexigoBrowserZoomController?: ZoomController;
    }).lexigoBrowserZoomController;
    if (!controller) throw new Error("LexiGo browser zoom extension controller is unavailable.");
    return controller.setZoomForURL(exactTargetURL, exactZoomFactor);
  }, { targetURL, zoomFactor });
}

async function browserZoomWorker(context: BrowserContext): Promise<Worker> {
  const existing = context.serviceWorkers().find((worker) => /^chrome-extension:\/\/[a-z]+\/background\.js$/.test(worker.url()));
  if (existing) return existing;
  const worker = await context.waitForEvent("serviceworker", { timeout: 10_000 });
  expect(worker.url()).toMatch(/^chrome-extension:\/\/[a-z]+\/background\.js$/);
  return worker;
}

async function readBrowserLayoutMetrics(cdp: CDPSession): Promise<BrowserLayoutMetrics> {
  return await cdp.send("Page.getLayoutMetrics") as BrowserLayoutMetrics;
}

async function readDOMZoomMetrics(page: Page): Promise<DOMZoomMetrics> {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    rootFontSize: Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize),
    visualViewportScale: window.visualViewport?.scale ?? 1,
  }));
}

async function settleRoute(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function expectKeyboardFocusVisible(page: Page, contract: RouteZoomContract): Promise<void> {
  const target = contract.focused
    ? page.locator(contract.ownerSelector).locator(
      "button:visible, input:visible, select:visible, textarea:visible, summary:visible, a[href]:visible, [tabindex]:not([tabindex='-1']):visible",
    ).first()
    : page.locator("[data-route-navigation]:visible a:visible").first();

  await expect(target, `${contract.key}: representative keyboard focus target must be visible`).toBeVisible();
  await target.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(target, `${contract.key}: keyboard navigation must return to the representative target`).toBeFocused();

  const focus = await target.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const box = element.getBoundingClientRect();
    const outlineWidth = Number.parseFloat(style.outlineWidth || "0");
    const outlineOffset = Number.parseFloat(style.outlineOffset || "0");
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineWidth,
      outlineStyle: style.outlineStyle,
      boxShadow: style.boxShadow,
      left: box.left,
      right: box.right,
      extent: Math.max(0, outlineWidth + outlineOffset),
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(focus.focusVisible, `${contract.key}: focus must be keyboard-visible`).toBe(true);
  expect(focus.outlineStyle !== "none" || focus.boxShadow !== "none", `${contract.key}: focus-visible must have a painted indicator`).toBe(true);
  expect(focus.left - focus.extent, `${contract.key}: focus ring must not clip on the inline start`).toBeGreaterThanOrEqual(-1);
  expect(focus.right + focus.extent, `${contract.key}: focus ring must not clip on the inline end`).toBeLessThanOrEqual(focus.viewportWidth + 1);
}

async function expectZoomedOwnership(page: Page, contract: RouteZoomContract): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === contract.path);
  await expect(page.locator(contract.ownerSelector)).toBeVisible();
  await expect(page.locator("#lexigo-main-content")).toBeVisible();
  expect(await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

  const geometry = await page.evaluate((input) => {
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    const owner = document.querySelector<HTMLElement>(input.ownerSelector);
    if (!main || !owner) throw new Error(`Route zoom owner is not mounted: ${input.ownerSelector}`);

    const rect = (node: HTMLElement) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const rendered = (node: HTMLElement) => {
      const style = window.getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && style.visibility !== "collapse"
        && Number.parseFloat(style.opacity || "1") > 0
        && box.width > 0
        && box.height > 0;
    };

    const visibleNavigation = Array.from(document.querySelectorAll<HTMLElement>("[data-route-navigation]"))
      .filter(rendered)
      .map((node) => ({ variant: node.dataset.routeNavigation ?? "", box: rect(node) }));

    const fixedGlobalChrome = Array.from(document.querySelectorAll<HTMLElement>([
      ".lx-route-brand",
      ".lx-route-reminder-entry > summary",
      'button[aria-label="Открыть профиль"]',
      "[data-route-navigation]",
    ].join(",")))
      .filter(rendered)
      .flatMap((node) => {
        const box = node.getBoundingClientRect();
        if (!(box.right > 0 && box.left < root.clientWidth)) return [];
        return [{
          label: node.getAttribute("aria-label") ?? node.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) ?? "",
          box: rect(node),
        }];
      });

    const focusableSelector = [
      "a[href]", "button", "input", "select", "textarea", "summary", "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const focusableOffenders = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).flatMap((node) => {
      if (!rendered(node)) return [];
      const box = node.getBoundingClientRect();
      const intersectsViewport = box.right > 0 && box.left < root.clientWidth;
      if (!intersectsViewport || (box.left >= -1 && box.right <= root.clientWidth + 1)) return [];
      return [{
        label: node.getAttribute("aria-label") ?? node.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
        left: box.left,
        right: box.right,
        width: box.width,
      }];
    });

    return {
      innerWidth: window.innerWidth,
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      main: rect(main),
      owner: rect(owner),
      visibleNavigation,
      fixedGlobalChrome,
      focusableOffenders,
    };
  }, { ownerSelector: contract.ownerSelector });

  expect(geometry.innerWidth, `${contract.key}: 200% browser zoom must reflow below the 1440px source viewport`).toBeLessThanOrEqual(760);
  expect(geometry.documentWidth, `${contract.key}: document must not overflow horizontally at 200% browser zoom`).toBeLessThanOrEqual(geometry.clientWidth + 1);

  for (const [label, box] of [["main", geometry.main], ["route owner", geometry.owner]] as const) {
    expect(box.width, `${contract.key}: ${label} must have positive width`).toBeGreaterThan(0);
    expect(box.left, `${contract.key}: ${label} must not clip on inline start`).toBeGreaterThanOrEqual(-1);
    expect(box.right, `${contract.key}: ${label} must not clip on inline end`).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }

  expect(geometry.focusableOffenders, `${contract.key}: no partially visible focusable control may clip at 200% browser zoom`).toEqual([]);
  for (const chrome of geometry.fixedGlobalChrome) {
    expect(chrome.box.left, `${contract.key}: fixed/global chrome ${chrome.label} must not clip left`).toBeGreaterThanOrEqual(-1);
    expect(chrome.box.right, `${contract.key}: fixed/global chrome ${chrome.label} must not clip right`).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }

  if (contract.focused) {
    expect(geometry.visibleNavigation, `${contract.key}: focused route must suppress ordinary RouteChrome at 200% zoom`).toHaveLength(0);
  } else {
    expect(geometry.visibleNavigation, `${contract.key}: ordinary route must expose exactly one RouteChrome owner at 200% zoom`).toHaveLength(1);
    expect(["mobile", "rail", "header"]).toContain(geometry.visibleNavigation[0].variant);
  }

  await expectKeyboardFocusVisible(page, contract);
}

async function captureZoomEvidence(
  page: Page,
  testInfo: TestInfo,
  contract: RouteZoomContract,
  appearance: ExplicitAppearance,
  beforeDOM: DOMZoomMetrics,
  afterDOM: DOMZoomMetrics,
  beforeCDP: BrowserLayoutMetrics,
  afterCDP: BrowserLayoutMetrics,
): Promise<string | null> {
  const key = `${contract.key}.${appearance}` as const;
  const baseline = ZOOM_BASELINES[key];
  const profileButton = page.getByRole("button", { name: "Открыть профиль" });
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    mask: await profileButton.count() > 0 ? [profileButton] : [],
    scale: "css",
  });
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };

  await testInfo.attach(`browser-zoom-200-${contract.key}-${appearance}.png`, { body: screenshot, contentType: "image/png" });
  await testInfo.attach(`browser-zoom-200-${contract.key}-${appearance}.json`, {
    body: Buffer.from(JSON.stringify({
      issue: 601,
      parent: 205,
      route: contract.path,
      routeKey: contract.key,
      appearance,
      sourceViewport: { width: 1440, height: 900 },
      browserZoomFactor: 2,
      beforeDOM,
      afterDOM,
      beforeCDP,
      afterCDP,
      actual,
      approved: baseline,
    }, null, 2)),
    contentType: "application/json",
  });

  if (baseline.sha256 === "REVIEW_REQUIRED") {
    return `${key}: REVIEW_REQUIRED ${actual.width}x${actual.height} sha256=${actual.sha256}`;
  }
  expect(actual, `${key}: exact Linux 200% browser-zoom fingerprint must match manually reviewed evidence from CI ${baseline.sourceRun} at ${baseline.sourceHeadSha}`).toEqual({
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  });
  return null;
}

async function runAppearanceMatrix(appearance: ExplicitAppearance, testInfo: TestInfo): Promise<void> {
  const extensionPath = resolve(process.cwd(), "e2e/support/browser-zoom-extension");
  const context = await chromium.launchPersistentContext("", {
    baseURL: "http://127.0.0.1:3000",
    channel: "chromium",
    headless: true,
    locale: "ru-RU",
    colorScheme: appearance,
    reducedMotion: "reduce",
    serviceWorkers: "allow",
    viewport: { width: 1440, height: 900 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const reviewRequired: string[] = [];
  try {
    const page = context.pages()[0] ?? await context.newPage();
    await installDeterministicRuntime(page);
    await page.addInitScript((value) => {
      window.localStorage.setItem("lexigo.appearance.v1", value);
    }, appearance);
    await installQualityGateAPI(context);
    const worker = await browserZoomWorker(context);
    const runtimeErrors = captureRuntimeErrors(page);

    for (const contract of ROUTES) {
      runtimeErrors.length = 0;
      if (page.url().startsWith("http://") || page.url().startsWith("https://")) {
        await setBrowserZoom(worker, page.url(), 1);
      }

      await openRoute(contract, page, context);
      await settleRoute(page, appearance);

      const cdp = await context.newCDPSession(page);
      const targetURL = page.url();
      const normalized = await setBrowserZoom(worker, targetURL, 1);
      expect(normalized.url).toBe(targetURL);
      expect(normalized.zoom).toBeCloseTo(1, 5);
      expect(normalized.mode).toBe("automatic");
      expect(normalized.scope).toBe("per-tab");
      await expect.poll(async () => (await readBrowserLayoutMetrics(cdp)).cssVisualViewport.zoom).toBeCloseTo(1, 4);

      const beforeDOM = await readDOMZoomMetrics(page);
      const beforeCDP = await readBrowserLayoutMetrics(cdp);
      expect(beforeCDP.cssVisualViewport.zoom).toBeCloseTo(1, 4);
      expect(beforeDOM.rootFontSize).toBeGreaterThanOrEqual(16);

      const applied = await setBrowserZoom(worker, targetURL, 2);
      expect(applied.url).toBe(targetURL);
      expect(applied.previousZoom).toBeCloseTo(1, 5);
      expect(applied.zoom).toBeCloseTo(2, 5);
      expect(applied.mode).toBe("automatic");
      expect(applied.scope).toBe("per-tab");
      await expect.poll(async () => (await readBrowserLayoutMetrics(cdp)).cssVisualViewport.zoom).toBeCloseTo(2, 4);
      await expect.poll(async () => (await readDOMZoomMetrics(page)).innerWidth).toBeLessThanOrEqual(Math.ceil(beforeDOM.innerWidth / 1.9));

      const afterDOM = await readDOMZoomMetrics(page);
      const afterCDP = await readBrowserLayoutMetrics(cdp);
      expect(afterCDP.cssVisualViewport.zoom).toBeCloseTo(2, 4);
      expect(afterDOM.innerWidth).toBeGreaterThanOrEqual(Math.floor(beforeDOM.innerWidth / 2.1));
      expect(afterDOM.rootFontSize).toBeCloseTo(beforeDOM.rootFontSize, 4);

      await expectZoomedOwnership(page, contract);
      expect(runtimeErrors, `${contract.key}.${appearance}: runtime errors at 200% browser zoom`).toEqual([]);
      const reviewMessage = await captureZoomEvidence(page, testInfo, contract, appearance, beforeDOM, afterDOM, beforeCDP, afterCDP);
      if (reviewMessage) reviewRequired.push(reviewMessage);

      await setBrowserZoom(worker, targetURL, 1);
    }
  } finally {
    await context.close();
  }

  if (reviewRequired.length > 0) {
    throw new Error(`REVIEW_REQUIRED exact Linux 200% browser-zoom evidence:\n${reviewRequired.join("\n")}`);
  }
}

test.describe("Issue #601 consolidated route browser-owned zoom parity", () => {
  test.describe.configure({ timeout: 300_000 });

  for (const appearance of ["light", "dark"] as const) {
    test(`all ten canonical routes at true 200% browser zoom — ${appearance}`, async ({}, testInfo) => {
      test.skip(testInfo.project.name !== "visual-desktop", "Issue #601 true browser zoom runs once in authoritative desktop Chromium");
      await runAppearanceMatrix(appearance, testInfo);
    });
  }
});
