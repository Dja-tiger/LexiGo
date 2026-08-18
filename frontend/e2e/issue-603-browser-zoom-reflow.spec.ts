import { createHash } from "node:crypto";
import { resolve } from "node:path";

import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type CDPSession,
  type Page,
  type TestInfo,
  type Worker,
} from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PHRASES,
} from "./support/quality-gates";
import {
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

type ExplicitAppearance = "light" | "dark";
type RouteKey = "learn" | "progress" | "dictionary" | "word-detail" | "phrases" | "phrase-detail" | "profile";

type RouteContract = Readonly<{
  key: RouteKey;
  path: string;
  ownerSelector: string;
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
  cssLayoutViewport: { pageX: number; pageY: number; clientWidth: number; clientHeight: number };
  cssVisualViewport: { clientWidth: number; clientHeight: number; scale: number; zoom: number };
  cssContentSize: { x: number; y: number; width: number; height: number };
}>;

type BrowserZoomEvidenceCapture = Readonly<{
  screenshot: Buffer;
  metrics: BrowserLayoutMetrics;
  clip: { x: number; y: number; width: number; height: number; scale: number };
}>;

type ReviewedBaseline = Readonly<{
  width: number;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const ROUTES: readonly RouteContract[] = [
  { key: "learn", path: "/learn", ownerSelector: '[data-route-client-island="learn"]' },
  { key: "progress", path: "/progress", ownerSelector: '[data-route-client-island="progress"]' },
  { key: "dictionary", path: "/dictionary", ownerSelector: '[data-route-client-island="dictionary"]' },
  { key: "word-detail", path: "/words/101", ownerSelector: '[data-route-client-island="dictionary"]' },
  { key: "phrases", path: "/phrases", ownerSelector: '[data-route-client-island="phrases"]' },
  { key: "phrase-detail", path: `/phrases/${QUALITY_PHRASES[0].slug}`, ownerSelector: '[data-route-client-island="phrases"]' },
  { key: "profile", path: "/profile", ownerSelector: '[data-route-client-island="profile"]' },
] as const;

const REVIEW_REQUIRED: ReviewedBaseline = {
  width: 0,
  height: 0,
  sha256: "REVIEW_REQUIRED",
  sourceRun: 0,
  sourceHeadSha: "REVIEW_REQUIRED",
};

const BASELINES: Record<`${RouteKey}.${ExplicitAppearance}`, ReviewedBaseline> = {
  "learn.light": REVIEW_REQUIRED,
  "learn.dark": REVIEW_REQUIRED,
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
};

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

async function readLayoutMetrics(cdp: CDPSession): Promise<BrowserLayoutMetrics> {
  return await cdp.send("Page.getLayoutMetrics") as BrowserLayoutMetrics;
}

async function openRoute(contract: RouteContract, page: Page): Promise<void> {
  switch (contract.key) {
    case "learn":
      await page.goto("/learn", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
      return;
    case "progress":
      await page.goto("/progress", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".lx-progress-evidence").getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();
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
  }
}

async function settle(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function expectNoInternalInlineClipping(page: Page, contract: RouteContract): Promise<void> {
  const result = await page.evaluate((ownerSelector) => {
    const root = document.documentElement;
    const viewportWidth = root.clientWidth;
    const rendered = (element: HTMLElement) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && style.visibility !== "collapse"
        && Number.parseFloat(style.opacity || "1") > 0
        && rect.width > 2
        && rect.height > 2;
    };
    const label = (element: HTMLElement) => (
      element.getAttribute("aria-label")
      ?? element.getAttribute("placeholder")
      ?? element.textContent?.trim().replace(/\s+/g, " ").slice(0, 100)
      ?? element.tagName.toLowerCase()
    );

    const owner = document.querySelector<HTMLElement>(ownerSelector);
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    if (!owner || !main) throw new Error(`Missing route owner: ${ownerSelector}`);

    const box = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    };

    const boxOffenders: Array<{ kind: string; label: string; left: number; right: number; width: number }> = [];
    for (const element of Array.from(document.querySelectorAll<HTMLElement>([
      "#lexigo-main-content",
      ownerSelector,
      "a[href]",
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "[role='tab']",
      "[role='radio']",
      "[role='button']",
    ].join(",")))) {
      if (!rendered(element)) continue;
      const rect = element.getBoundingClientRect();
      if (!(rect.right > 0 && rect.left < viewportWidth)) continue;
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        boxOffenders.push({ kind: element.tagName.toLowerCase(), label: label(element), ...box(element) });
      }
    }

    const textOffenders: Array<{
      tag: string;
      text: string;
      left: number;
      right: number;
      ancestor: string;
      ancestorLeft: number;
      ancestorRight: number;
      overflowX: string;
    }> = [];

    const walker = document.createTreeWalker(owner, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement as HTMLElement | null;
        if (!parent || !rendered(parent)) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = Array.from(range.getClientRects());
      range.detach();

      let clippingAncestor: HTMLElement | null = parent;
      while (clippingAncestor && clippingAncestor !== owner) {
        const style = window.getComputedStyle(clippingAncestor);
        if (["hidden", "clip", "scroll", "auto"].includes(style.overflowX)) break;
        clippingAncestor = clippingAncestor.parentElement;
      }
      if (!clippingAncestor) clippingAncestor = owner;

      const ancestorRect = clippingAncestor.getBoundingClientRect();
      const overflowX = window.getComputedStyle(clippingAncestor).overflowX;
      for (const rect of rects) {
        if (rect.width <= 0 || rect.height <= 0) continue;
        const inlineLimitLeft = Math.max(0, ancestorRect.left);
        const inlineLimitRight = Math.min(viewportWidth, ancestorRect.right);
        const intersectsInline = rect.right > inlineLimitLeft && rect.left < inlineLimitRight;
        if (!intersectsInline) continue;
        if (rect.left < inlineLimitLeft - 1 || rect.right > inlineLimitRight + 1) {
          textOffenders.push({
            tag: parent.tagName.toLowerCase(),
            text: (node.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
            left: rect.left,
            right: rect.right,
            ancestor: clippingAncestor.className || clippingAncestor.tagName.toLowerCase(),
            ancestorLeft: ancestorRect.left,
            ancestorRight: ancestorRect.right,
            overflowX,
          });
        }
      }
      node = walker.nextNode();
    }

    return {
      viewportWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      main: box(main),
      owner: box(owner),
      boxOffenders: boxOffenders.slice(0, 30),
      textOffenders: textOffenders.slice(0, 30),
      navigation: Array.from(document.querySelectorAll<HTMLElement>>("[data-route-navigation]"))
        .filter(rendered)
        .map((element) => element.dataset.routeNavigation ?? ""),
    };
  }, contract.ownerSelector);

  expect(result.viewportWidth, `${contract.key}: true 2x zoom must land on exact 720px boundary`).toBe(720);
  expect(result.documentWidth, `${contract.key}: document must not horizontally overflow`).toBeLessThanOrEqual(721);
  expect(result.main.left, `${contract.key}: main starts inside viewport`).toBeGreaterThanOrEqual(-1);
  expect(result.main.right, `${contract.key}: main ends inside viewport`).toBeLessThanOrEqual(721);
  expect(result.owner.left, `${contract.key}: route owner starts inside viewport`).toBeGreaterThanOrEqual(-1);
  expect(result.owner.right, `${contract.key}: route owner ends inside viewport`).toBeLessThanOrEqual(721);
  expect(result.navigation, `${contract.key}: 720-767 gap must continue compact RouteChrome`).toEqual(["mobile"]);
  expect(result.boxOffenders, `${contract.key}: interactive/owner boxes must not clip internally`).toEqual([]);
  expect(result.textOffenders, `${contract.key}: visible text ranges must not be clipped by route/container owners`).toEqual([]);
}

async function captureBrowserZoomEvidence(cdp: CDPSession): Promise<BrowserZoomEvidenceCapture> {
  const metrics = await readLayoutMetrics(cdp);
  const zoom = metrics.cssVisualViewport.zoom;
  expect(zoom, "Issue #603 evidence must be captured while browser zoom is still 2x").toBeCloseTo(2, 4);

  // CDP Page.Viewport clip coordinates are device-independent pixels (DIP), while
  // cssLayoutViewport/cssContentSize are CSS pixels. Browser zoom reports the
  // CSS→DIP ratio through cssVisualViewport.zoom. Convert the full CSS surface to
  // DIP, then normalize the encoded raster back to one output pixel per CSS pixel.
  // Without this conversion Chromium captures only 720 DIP = 360 CSS px at 2x zoom.
  const clip = {
    x: metrics.cssContentSize.x * zoom,
    y: metrics.cssContentSize.y * zoom,
    width: metrics.cssLayoutViewport.clientWidth * zoom,
    height: metrics.cssContentSize.height * zoom,
    scale: 1 / zoom,
  };
  const captured = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip,
  }) as { data: string };

  return {
    screenshot: Buffer.from(captured.data, "base64"),
    metrics,
    clip,
  };
}

async function captureEvidence(
  cdp: CDPSession,
  testInfo: TestInfo,
  contract: RouteContract,
  appearance: ExplicitAppearance,
): Promise<string | null> {
  const key = `${contract.key}.${appearance}` as const;
  const baseline = BASELINES[key];
  const { screenshot, metrics, clip } = await captureBrowserZoomEvidence(cdp);
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };

  expect(actual.width, `${key}: normalized evidence width must equal the exact CSS layout viewport`).toBe(
    metrics.cssLayoutViewport.clientWidth,
  );
  expect(actual.height, `${key}: normalized evidence height must equal the CSS content height`).toBeCloseTo(
    metrics.cssContentSize.height,
    0,
  );

  await testInfo.attach(`issue-603-720-${contract.key}-${appearance}.png`, { body: screenshot, contentType: "image/png" });
  await testInfo.attach(`issue-603-720-${contract.key}-${appearance}.json`, {
    body: Buffer.from(JSON.stringify({
      issue: 603,
      parent: 205,
      discoveredBy: 601,
      route: contract.path,
      appearance,
      sourceViewport: { width: 1440, height: 900 },
      browserZoomFactor: metrics.cssVisualViewport.zoom,
      effectiveWidth: metrics.cssLayoutViewport.clientWidth,
      evidenceCapture: "cdp-normalized-dip",
      evidenceClip: clip,
      cssContentSize: metrics.cssContentSize,
      actual,
      approved: baseline,
    }, null, 2)),
    contentType: "application/json",
  });

  if (baseline.sha256 === "REVIEW_REQUIRED") {
    return `${key}: REVIEW_REQUIRED ${actual.width}x${actual.height} sha256=${actual.sha256}`;
  }
  expect(actual, `${key}: exact Linux evidence must match manually reviewed CI ${baseline.sourceRun}`).toEqual({
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  });
  return null;
}

async function runAppearance(appearance: ExplicitAppearance, testInfo: TestInfo): Promise<void> {
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
    await page.addInitScript((value) => window.localStorage.setItem("lexigo.appearance.v1", value), appearance);
    await installQualityGateAPI(context);
    const worker = await browserZoomWorker(context);
    const runtimeErrors = captureRuntimeErrors(page);

    for (const contract of ROUTES) {
      runtimeErrors.length = 0;
      if (page.url().startsWith("http://") || page.url().startsWith("https://")) {
        await setBrowserZoom(worker, page.url(), 1);
      }

      await openRoute(contract, page);
      await settle(page, appearance);

      const cdp = await context.newCDPSession(page);
      const targetURL = page.url();
      const normalized = await setBrowserZoom(worker, targetURL, 1);
      expect(normalized.zoom).toBeCloseTo(1, 5);
      await expect.poll(async () => (await readLayoutMetrics(cdp)).cssVisualViewport.zoom).toBeCloseTo(1, 4);

      const applied = await setBrowserZoom(worker, targetURL, 2);
      expect(applied.previousZoom).toBeCloseTo(1, 5);
      expect(applied.zoom).toBeCloseTo(2, 5);
      expect(applied.mode).toBe("automatic");
      expect(applied.scope).toBe("per-tab");
      await expect.poll(async () => (await readLayoutMetrics(cdp)).cssVisualViewport.zoom).toBeCloseTo(2, 4);
      await expect.poll(async () => page.evaluate(() => window.innerWidth)).toBe(720);

      await expectNoInternalInlineClipping(page, contract);
      expect(runtimeErrors, `${contract.key}.${appearance}: runtime errors`).toEqual([]);
      const review = await captureEvidence(cdp, testInfo, contract, appearance);
      if (review) reviewRequired.push(review);

      await setBrowserZoom(worker, targetURL, 1);
    }
  } finally {
    await context.close();
  }

  if (reviewRequired.length > 0) {
    throw new Error(`REVIEW_REQUIRED exact Linux Issue #603 evidence:\n${reviewRequired.join("\n")}`);
  }
}

test.describe("Issue #603 ordinary routes at exact 720px true browser zoom", () => {
  test.describe.configure({ timeout: 300_000 });

  for (const appearance of ["light", "dark"] as const) {
    test(`seven ordinary routes reflow without internal clipping — ${appearance}`, async ({}, testInfo) => {
      test.skip(testInfo.project.name !== "visual-desktop", "Issue #603 true browser zoom runs once in authoritative desktop Chromium");
      await runAppearance(appearance, testInfo);
    });
  }
});
