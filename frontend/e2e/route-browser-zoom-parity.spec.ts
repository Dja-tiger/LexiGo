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
type NavigationOwner = "rail" | "mobile" | "none";
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
  expectedNavigation: NavigationOwner;
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

type DOMZoomMetrics = Readonly<{
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  documentWidth: number;
  bodyWidth: number;
  rootFontSize: number;
  visualViewportScale: number;
}>;

type BrowserZoomEvidenceCapture = Readonly<{
  screenshot: Buffer;
  metrics: BrowserLayoutMetrics;
  clip: { x: number; y: number; width: number; height: number; scale: number };
}>;

type ReviewedZoomBaseline = Readonly<{
  width: number;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const ROUTES: readonly RouteZoomContract[] = [
  { key: "home", path: "/", ownerSelector: '[data-route-client-island="home"]', expectedNavigation: "rail" },
  { key: "learn", path: "/learn", ownerSelector: '[data-route-client-island="learn"]', expectedNavigation: "mobile" },
  { key: "active-lesson", path: "/lesson/active", ownerSelector: '[data-route-client-island="active-lesson"]', expectedNavigation: "none" },
  { key: "progress", path: "/progress", ownerSelector: '[data-route-client-island="progress"]', expectedNavigation: "mobile" },
  { key: "dictionary", path: "/dictionary", ownerSelector: '[data-route-client-island="dictionary"]', expectedNavigation: "mobile" },
  { key: "word-detail", path: "/words/101", ownerSelector: '[data-route-client-island="dictionary"]', expectedNavigation: "mobile" },
  { key: "phrases", path: "/phrases", ownerSelector: '[data-route-client-island="phrases"]', expectedNavigation: "mobile" },
  { key: "phrase-detail", path: `/phrases/${QUALITY_PHRASES[0].slug}`, ownerSelector: '[data-route-client-island="phrases"]', expectedNavigation: "mobile" },
  { key: "profile", path: "/profile", ownerSelector: '[data-route-client-island="profile"]', expectedNavigation: "mobile" },
  { key: "onboarding", path: "/onboarding", ownerSelector: ".lx-first-use-panel", expectedNavigation: "none" },
] as const;

const REVIEW_REQUIRED: ReviewedZoomBaseline = {
  width: 0,
  height: 0,
  sha256: "REVIEW_REQUIRED",
  sourceRun: 0,
  sourceHeadSha: "REVIEW_REQUIRED",
};

const REVIEWED_SOURCE_RUN = 32224361667;
const REVIEWED_SOURCE_HEAD_SHA = "d04e2bacbb0d5f3ad2b7bc83dd1a251f481e8b20";
const PROCESS_AWARE_HOME_SOURCE_RUN = 32730909720;
const PROCESS_AWARE_HOME_SOURCE_HEAD_SHA = "aec5a7dc72cef09c59148c7ae0ba3868e021675e";

const ZOOM_BASELINES: Record<`${RouteZoomKey}.${ExplicitAppearance}`, ReviewedZoomBaseline> = {
  "home.light": {
    width: 720,
    height: 710,
    sha256: "22460dd5698065cc7169cd7f2b4135e2300c6a901dedafbdec375f66b6e16afb",
    sourceRun: PROCESS_AWARE_HOME_SOURCE_RUN,
    sourceHeadSha: PROCESS_AWARE_HOME_SOURCE_HEAD_SHA,
  },
  "home.dark": {
    width: 720,
    height: 710,
    sha256: "019991cc898c4df44d50a5b6e7073e5c624874c7c8cde14701ea0782bbac993d",
    sourceRun: PROCESS_AWARE_HOME_SOURCE_RUN,
    sourceHeadSha: PROCESS_AWARE_HOME_SOURCE_HEAD_SHA,
  },
  "learn.light": {
    width: 720,
    height: 995,
    sha256: "4e764f2ea69bb58ffacd129850900f1d6c91a82e153d450e8d940f3daf1702a6",
    sourceRun: 32770042784,
    sourceHeadSha: "b7e028a4c689335c94151e645071731c87c83b97",
  },
  "learn.dark": {
    width: 720,
    height: 995,
    sha256: "b96851c4a4ac6ac5466a2a78475d55f6b61a5850531205434e586e679df78b0d",
    sourceRun: 32770042784,
    sourceHeadSha: "b7e028a4c689335c94151e645071731c87c83b97",
  },
  "active-lesson.light": {
    width: 720,
    height: 766,
    sha256: "14cf5dce9466ab03bb40eb106e2e99c985b6b046dfa959f36587d35a93558985",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "active-lesson.dark": {
    width: 720,
    height: 766,
    sha256: "aa65b64f58055f76485e21db9a2058cbca9f2612086d00b65fc8480e86ec6416",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "progress.light": {
    width: 720,
    height: 1664,
    sha256: "8e133b7078f10c16a4bd14036c212fe686aad097b51361d96611590c9cfd412a",
    sourceRun: 32784991362,
    sourceHeadSha: "6610ca81fbeb30c7df50f0cc589038c00d7b432c",
  },
  "progress.dark": {
    width: 720,
    height: 1664,
    sha256: "4a2a526256d567e51cf37f24d20d4da2fc81566d7ffccff51b55d08e166f0aef",
    sourceRun: 32784991362,
    sourceHeadSha: "6610ca81fbeb30c7df50f0cc589038c00d7b432c",
  },
  "dictionary.light": {
    width: 720,
    height: 1058,
    sha256: "efe959368d7546958ff82742e52795d8c6e145546a20badfe3ea900a20b44a6f",
    sourceRun: 32786150396,
    sourceHeadSha: "249070f1349009438f04d98ef5d7b5888eebe011",
  },
  "dictionary.dark": {
    width: 720,
    height: 1058,
    sha256: "343f67c962949fde460b133ed2ce08bd5c81977aff8fa2c27b22910acd99646a",
    sourceRun: 32786150396,
    sourceHeadSha: "249070f1349009438f04d98ef5d7b5888eebe011",
  },
  "word-detail.light": {
    width: 720,
    height: 1676,
    sha256: "5b46df7b5eca305052230d64e583b4cdd189320dc0913bac2270784903ed1ad3",
    sourceRun: 32797940396,
    sourceHeadSha: "e7f6503fe0115cc18e4c703bb16a2b390a32c322",
  },
  "word-detail.dark": {
    width: 720,
    height: 1676,
    sha256: "3c35de91c6038334ac3720ee74db6d8818c42b77de3e5a023be6dd45543a3723",
    sourceRun: 32797940396,
    sourceHeadSha: "e7f6503fe0115cc18e4c703bb16a2b390a32c322",
  },
  "phrases.light": {
    width: 720,
    height: 1363,
    sha256: "a600b1098395ad6cf9e170de0d59863dc0505bd63b80390de2a40f54aabdae65",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "phrases.dark": {
    width: 720,
    height: 1363,
    sha256: "b36077210d12ac1eae8de4e4898965b1d3bd9b55dec5551b5e07c77bc5c70084",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "phrase-detail.light": {
    width: 720,
    height: 1589,
    sha256: "64b6dfcc35d1aa327945e4fac47c95cc31bd7daa14c199d1f6d4d52f23981f75",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "phrase-detail.dark": {
    width: 720,
    height: 1589,
    sha256: "788bee88dc42223eeff5d9e923ed89d71c9205e8369afa9beb6ff54353576167",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "profile.light": {
    width: 720,
    height: 4086,
    sha256: "8dacc1f7f390229c9f4b3fed4a2b037731e00e0fd4b34d702c51027060b0237b",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "profile.dark": {
    width: 720,
    height: 4086,
    sha256: "f6b7826b0a9b61e4092aa1696ead3ec7dd73a5c3af1aeafcdf1547c5af1105d5",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "onboarding.light": {
    width: 720,
    height: 914,
    sha256: "a166f294d2d6b8a5714c5ad066fbb98f51d059fa6d931cbed3561fcda6913f89",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
  "onboarding.dark": {
    width: 720,
    height: 914,
    sha256: "b3cef0bddbb26e6f7b5e96c142a130642b4c47f8da57a1efe049330bc7018ebe",
    sourceRun: REVIEWED_SOURCE_RUN,
    sourceHeadSha: REVIEWED_SOURCE_HEAD_SHA,
  },
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

async function openRoute(contract: RouteZoomContract, page: Page, context: BrowserContext): Promise<void> {
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
  const target = contract.expectedNavigation === "none"
    ? page.locator(contract.ownerSelector).locator(
      "button:visible, input:visible, select:visible, textarea:visible, summary:visible, a[href]:visible, [tabindex]:not([tabindex='-1']):visible",
    ).first()
    : page.locator("[data-route-navigation]:visible a:visible").first();

  await expect(target, `${contract.key}: representative keyboard focus target must be visible`).toBeVisible();
  await target.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(target, `${contract.key}: keyboard navigation must return to representative target`).toBeFocused();

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
  expect(focus.left - focus.extent, `${contract.key}: focus ring must not clip inline start`).toBeGreaterThanOrEqual(-1);
  expect(focus.right + focus.extent, `${contract.key}: focus ring must not clip inline end`).toBeLessThanOrEqual(focus.viewportWidth + 1);
}

async function expectZoomedOwnership(page: Page, contract: RouteZoomContract): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === contract.path);
  await expect(page.locator(contract.ownerSelector)).toBeVisible();
  await expect(page.locator("#lexigo-main-content")).toBeVisible();
  expect(await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

  const geometry = await page.evaluate((input) => {
    const root = document.documentElement;
    const viewportWidth = root.clientWidth;
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    const owner = document.querySelector<HTMLElement>(input.ownerSelector);
    if (!main || !owner) throw new Error(`Route zoom owner is not mounted: ${input.ownerSelector}`);

    const rendered = (node: HTMLElement) => {
      const style = window.getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && style.visibility !== "collapse"
        && Number.parseFloat(style.opacity || "1") > 0
        && box.width > 2
        && box.height > 2;
    };
    const rect = (node: HTMLElement) => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const label = (node: HTMLElement) => (
      node.getAttribute("aria-label")
      ?? node.getAttribute("placeholder")
      ?? node.textContent?.trim().replace(/\s+/g, " ").slice(0, 100)
      ?? node.tagName.toLowerCase()
    );

    const visibleNavigation = Array.from(document.querySelectorAll<HTMLElement>("[data-route-navigation]"))
      .filter(rendered)
      .map((node) => node.dataset.routeNavigation ?? "");

    const boxOffenders: Array<{ kind: string; label: string; left: number; right: number; width: number }> = [];
    for (const node of Array.from(document.querySelectorAll<HTMLElement>([
      "#lexigo-main-content",
      input.ownerSelector,
      ".lx-route-brand",
      ".lx-route-reminder-entry > summary",
      'button[aria-label="Открыть профиль"]',
      "[data-route-navigation]",
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
      if (!rendered(node)) continue;
      const box = node.getBoundingClientRect();
      if (!(box.right > 0 && box.left < viewportWidth)) continue;
      if (box.left < -1 || box.right > viewportWidth + 1) {
        boxOffenders.push({ kind: node.tagName.toLowerCase(), label: label(node), left: box.left, right: box.right, width: box.width });
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

    let textNode = walker.nextNode();
    while (textNode) {
      const parent = textNode.parentElement as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(textNode);
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
      for (const box of rects) {
        if (box.width <= 0 || box.height <= 0) continue;
        const inlineLimitLeft = Math.max(0, ancestorRect.left);
        const inlineLimitRight = Math.min(viewportWidth, ancestorRect.right);
        if (!(box.right > inlineLimitLeft && box.left < inlineLimitRight)) continue;
        if (box.left < inlineLimitLeft - 1 || box.right > inlineLimitRight + 1) {
          textOffenders.push({
            tag: parent.tagName.toLowerCase(),
            text: (textNode.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
            left: box.left,
            right: box.right,
            ancestor: clippingAncestor.className || clippingAncestor.tagName.toLowerCase(),
            ancestorLeft: ancestorRect.left,
            ancestorRight: ancestorRect.right,
            overflowX,
          });
        }
      }
      textNode = walker.nextNode();
    }

    return {
      innerWidth: window.innerWidth,
      clientWidth: viewportWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      main: rect(main),
      owner: rect(owner),
      visibleNavigation,
      boxOffenders: boxOffenders.slice(0, 30),
      textOffenders: textOffenders.slice(0, 30),
    };
  }, { ownerSelector: contract.ownerSelector });

  expect(geometry.innerWidth, `${contract.key}: true 200% browser zoom must land on exact 720px boundary`).toBe(720);
  expect(geometry.clientWidth, `${contract.key}: root viewport must stay at exact 720px boundary`).toBe(720);
  expect(geometry.documentWidth, `${contract.key}: document must not horizontally overflow`).toBeLessThanOrEqual(721);
  expect(geometry.main.left, `${contract.key}: main starts inside viewport`).toBeGreaterThanOrEqual(-1);
  expect(geometry.main.right, `${contract.key}: main ends inside viewport`).toBeLessThanOrEqual(721);
  expect(geometry.owner.left, `${contract.key}: route owner starts inside viewport`).toBeGreaterThanOrEqual(-1);
  expect(geometry.owner.right, `${contract.key}: route owner ends inside viewport`).toBeLessThanOrEqual(721);
  expect(geometry.boxOffenders, `${contract.key}: visible interactive/global/owner boxes must not clip`).toEqual([]);
  expect(geometry.textOffenders, `${contract.key}: visible text ranges must not clip inside route/container owners`).toEqual([]);

  const expectedNavigation = contract.expectedNavigation === "none" ? [] : [contract.expectedNavigation];
  expect(geometry.visibleNavigation, `${contract.key}: exact 720px RouteChrome owner must match reviewed responsive ownership`).toEqual(expectedNavigation);

  await expectKeyboardFocusVisible(page, contract);
}

async function captureBrowserZoomEvidence(cdp: CDPSession): Promise<BrowserZoomEvidenceCapture> {
  const metrics = await readBrowserLayoutMetrics(cdp);
  const zoom = metrics.cssVisualViewport.zoom;
  expect(zoom, "Issue #601 evidence must be captured while browser zoom remains 2x").toBeCloseTo(2, 4);

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

async function captureZoomEvidence(
  cdp: CDPSession,
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
  const { screenshot, metrics, clip } = await captureBrowserZoomEvidence(cdp);
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };

  expect(actual.width, `${key}: normalized evidence width must equal exact CSS layout viewport`).toBe(metrics.cssLayoutViewport.clientWidth);
  expect(actual.width, `${key}: exact 200% audit evidence must be 720 CSS pixels wide`).toBe(720);

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
      captureMetrics: metrics,
      captureClip: clip,
      actual,
      approved: baseline,
    }, null, 2)),
    contentType: "application/json",
  });

  if (baseline.sha256 === REVIEW_REQUIRED.sha256) {
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
      if (contract.key !== "active-lesson") {
        await page.unroute("**/api/v1/**");
      }

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
      await expect.poll(async () => (await readDOMZoomMetrics(page)).innerWidth).toBe(720);

      const afterDOM = await readDOMZoomMetrics(page);
      const afterCDP = await readBrowserLayoutMetrics(cdp);
      expect(afterCDP.cssVisualViewport.zoom).toBeCloseTo(2, 4);
      expect(afterDOM.innerWidth).toBe(720);
      expect(afterDOM.clientWidth).toBe(720);
      expect(afterDOM.rootFontSize).toBeCloseTo(beforeDOM.rootFontSize, 4);

      await expectZoomedOwnership(page, contract);
      expect(runtimeErrors, `${contract.key}.${appearance}: runtime errors at 200% browser zoom`).toEqual([]);
      const reviewMessage = await captureZoomEvidence(cdp, testInfo, contract, appearance, beforeDOM, afterDOM, beforeCDP, afterCDP);
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
      await runAppearanceMatrix(appearance, testInfo);
    });
  }
});
