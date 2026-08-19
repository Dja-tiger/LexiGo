import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
  type Route,
  type TestInfo,
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
type NavigationOwner = "mobile" | "rail" | "none";
type RouteKeyboardKey =
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

type RouteKeyboardContract = Readonly<{
  key: RouteKeyboardKey;
  path: string;
  ownerSelector: string;
  focused: boolean;
}>;

type KeyboardViewport = Readonly<{
  key: "compact" | "desktop";
  width: number;
  height: number;
  navigation: Exclude<NavigationOwner, "none">;
}>;

type FocusStop = Readonly<{
  tag: string;
  role: string | null;
  name: string;
  tabIndex: number;
  disabled: boolean;
  inert: boolean;
  ariaHidden: boolean;
  rendered: boolean;
  focusVisible: boolean;
  outlineWidth: number;
  outlineOffset: number;
  outlineStyle: string;
  outlineColor: string;
  boxShadow: string;
  hasPaintedIndicator: boolean;
  ringExtent: number;
  rect: { left: number; right: number; top: number; bottom: number; width: number; height: number };
  viewport: { width: number; height: number };
  inlineRingContained: boolean;
  verticallyVisible: boolean;
  clippingAncestors: Array<{ tag: string; className: string; overflowX: string; left: number; right: number }>;
  navigationOverlaps: Array<{ variant: string; position: string; left: number; right: number; top: number; bottom: number }>;
  centerUnobscured: boolean;
}>;

const ROUTES: readonly RouteKeyboardContract[] = [
  { key: "home", path: "/", ownerSelector: '[data-route-client-island="home"]', focused: false },
  { key: "learn", path: "/learn", ownerSelector: '[data-route-client-island="learn"]', focused: false },
  { key: "active-lesson", path: "/lesson/active", ownerSelector: '[data-route-client-island="active-lesson"]', focused: true },
  { key: "progress", path: "/progress", ownerSelector: '[data-route-client-island="progress"]', focused: false },
  { key: "dictionary", path: "/dictionary", ownerSelector: '[data-route-client-island="dictionary"]', focused: false },
  { key: "word-detail", path: "/words/101", ownerSelector: '[data-route-client-island="dictionary"]', focused: false },
  { key: "phrases", path: "/phrases", ownerSelector: '[data-route-client-island="phrases"]', focused: false },
  { key: "phrase-detail", path: `/phrases/${QUALITY_PHRASES[0].slug}`, ownerSelector: '[data-route-client-island="phrases"]', focused: false },
  { key: "profile", path: "/profile", ownerSelector: '[data-route-client-island="profile"]', focused: false },
  { key: "onboarding", path: "/onboarding", ownerSelector: ".lx-first-use-panel", focused: true },
] as const;

const VIEWPORTS: readonly KeyboardViewport[] = [
  { key: "compact", width: 390, height: 844, navigation: "mobile" },
  { key: "desktop", width: 1440, height: 1024, navigation: "rail" },
] as const;

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"]):not([aria-disabled="true"]):visible',
  'button:not([disabled]):not([tabindex="-1"]):not([aria-disabled="true"]):visible',
  'input:not([disabled]):not([tabindex="-1"]):not([aria-disabled="true"]):visible',
  'select:not([disabled]):not([tabindex="-1"]):not([aria-disabled="true"]):visible',
  'textarea:not([disabled]):not([tabindex="-1"]):not([aria-disabled="true"]):visible',
  'summary:not([tabindex="-1"]):visible',
  '[tabindex="0"]:not([aria-disabled="true"]):visible',
].join(",");

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
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
}

async function installOnboardingResumeAPI(context: BrowserContext): Promise<void> {
  await context.unroute("**/api/v1/**");
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "route-keyboard-focus-csrf",
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
  contract: RouteKeyboardContract,
  page: Page,
  context: BrowserContext,
): Promise<void> {
  switch (contract.key) {
    case "home":
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", {
        name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/,
      })).toBeVisible();
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
      await expect(
        page.locator(".lx-progress-evidence").getByRole("heading", { name: "Прогресс", exact: true }),
      ).toBeVisible();
      return;
    case "dictionary":
      await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Открыть карточку: rollback" })).toBeVisible();
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
    case "onboarding":
      await installOnboardingResumeAPI(context);
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Продолжим диагностику" })).toBeVisible();
      return;
  }
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

async function expectRouteOwnership(
  page: Page,
  contract: RouteKeyboardContract,
  viewport: KeyboardViewport,
): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === contract.path);
  await expect(page.locator(contract.ownerSelector)).toBeVisible();
  await expect(page.locator("#lexigo-main-content")).toBeVisible();
  expect(await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);

  const ownership = await page.evaluate(() => Array.from(
    document.querySelectorAll<HTMLElement>("[data-route-navigation]"),
  ).flatMap((node) => {
    const style = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const rendered = style.display !== "none"
      && style.visibility !== "hidden"
      && style.visibility !== "collapse"
      && Number.parseFloat(style.opacity || "1") > 0
      && box.width > 0
      && box.height > 0;
    return rendered ? [node.dataset.routeNavigation ?? ""] : [];
  }));

  expect(
    ownership,
    `${contract.key}: RouteChrome ownership must match ${viewport.key} keyboard topology`,
  ).toEqual(contract.focused ? [] : [viewport.navigation]);
}

async function expectNoPositiveTabIndex(page: Page): Promise<void> {
  const positive = await page.locator("[tabindex]").evaluateAll((elements) => elements.flatMap((element) => {
    const value = Number(element.getAttribute("tabindex"));
    if (value <= 0) return [];
    return [{
      tag: element.tagName.toLowerCase(),
      value,
      text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 100) ?? "",
    }];
  }));
  expect(positive, "positive tabindex must remain forbidden").toEqual([]);
}

async function readFocusStop(page: Page, ownerSelector: string): Promise<FocusStop> {
  return page.evaluate((selector) => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) throw new Error("document.activeElement is missing");
    const owner = document.querySelector<HTMLElement>(selector);
    if (!owner) throw new Error(`Route keyboard owner is not mounted: ${selector}`);

    const style = window.getComputedStyle(active);
    const box = active.getBoundingClientRect();
    const rect = {
      left: box.left,
      right: box.right,
      top: box.top,
      bottom: box.bottom,
      width: box.width,
      height: box.height,
    };
    const outlineWidth = Number.parseFloat(style.outlineWidth || "0");
    const outlineOffset = Number.parseFloat(style.outlineOffset || "0");
    const visibleOutline = style.outlineStyle !== "none"
      && outlineWidth >= 1
      && style.outlineColor !== "transparent"
      && style.outlineColor !== "rgba(0, 0, 0, 0)";
    const visibleShadow = style.boxShadow !== "none";
    const ringExtent = visibleOutline ? Math.max(0, outlineWidth + Math.max(0, outlineOffset)) : 0;
    const rendered = style.display !== "none"
      && style.visibility !== "hidden"
      && style.visibility !== "collapse"
      && Number.parseFloat(style.opacity || "1") > 0
      && box.width > 0
      && box.height > 0;
    const disabled = (("disabled" in active) && Boolean((active as HTMLButtonElement).disabled))
      || active.getAttribute("aria-disabled") === "true";
    const inert = active.closest("[inert]") !== null;
    const ariaHidden = active.closest('[aria-hidden="true"]') !== null;

    const clippingAncestors: FocusStop["clippingAncestors"] = [];
    let ancestor = active.parentElement;
    while (ancestor) {
      const ancestorStyle = window.getComputedStyle(ancestor);
      if (["hidden", "clip", "scroll", "auto"].includes(ancestorStyle.overflowX)) {
        const ancestorBox = ancestor.getBoundingClientRect();
        if (box.left - ringExtent < ancestorBox.left - 1 || box.right + ringExtent > ancestorBox.right + 1) {
          clippingAncestors.push({
            tag: ancestor.tagName.toLowerCase(),
            className: ancestor.className,
            overflowX: ancestorStyle.overflowX,
            left: ancestorBox.left,
            right: ancestorBox.right,
          });
        }
      }
      if (ancestor === owner) break;
      ancestor = ancestor.parentElement;
    }

    const navigationOverlaps = Array.from(
      document.querySelectorAll<HTMLElement>("[data-route-navigation]"),
    ).flatMap((navigation) => {
      if (navigation.contains(active)) return [];
      const navigationStyle = window.getComputedStyle(navigation);
      const navigationBox = navigation.getBoundingClientRect();
      const renderedNavigation = navigationStyle.display !== "none"
        && navigationStyle.visibility !== "hidden"
        && navigationStyle.visibility !== "collapse"
        && navigationBox.width > 0
        && navigationBox.height > 0;
      if (!renderedNavigation || !["fixed", "sticky"].includes(navigationStyle.position)) return [];
      const intersects = box.left < navigationBox.right
        && box.right > navigationBox.left
        && box.top < navigationBox.bottom
        && box.bottom > navigationBox.top;
      if (!intersects) return [];
      return [{
        variant: navigation.dataset.routeNavigation ?? "",
        position: navigationStyle.position,
        left: navigationBox.left,
        right: navigationBox.right,
        top: navigationBox.top,
        bottom: navigationBox.bottom,
      }];
    });

    const centerX = Math.min(window.innerWidth - 1, Math.max(0, box.left + box.width / 2));
    const centerY = Math.min(window.innerHeight - 1, Math.max(0, box.top + box.height / 2));
    const hit = document.elementFromPoint(centerX, centerY);
    const centerUnobscured = hit === null || active === hit || active.contains(hit);

    return {
      tag: active.tagName.toLowerCase(),
      role: active.getAttribute("role"),
      name: active.getAttribute("aria-label")
        ?? active.getAttribute("title")
        ?? active.textContent?.trim().replace(/\s+/g, " ").slice(0, 120)
        ?? "",
      tabIndex: active.tabIndex,
      disabled,
      inert,
      ariaHidden,
      rendered,
      focusVisible: active.matches(":focus-visible"),
      outlineWidth,
      outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
      hasPaintedIndicator: visibleOutline || visibleShadow,
      ringExtent,
      rect,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      inlineRingContained: box.left - ringExtent >= -1 && box.right + ringExtent <= window.innerWidth + 1,
      verticallyVisible: box.bottom > 0 && box.top < window.innerHeight,
      clippingAncestors,
      navigationOverlaps,
      centerUnobscured,
    };
  }, ownerSelector);
}

function expectValidKeyboardStop(stop: FocusStop, label: string): void {
  expect(stop.tag, `${label}: browser focus must not fall back to body/html`).not.toMatch(/^(body|html)$/);
  expect(stop.tabIndex, `${label}: sequential stop must be tabbable`).toBeGreaterThanOrEqual(0);
  expect(stop.disabled, `${label}: disabled control must not be a Tab stop`).toBe(false);
  expect(stop.inert, `${label}: inert content must not be a Tab stop`).toBe(false);
  expect(stop.ariaHidden, `${label}: aria-hidden content must not be a Tab stop`).toBe(false);
  expect(stop.rendered, `${label}: keyboard stop must be rendered`).toBe(true);
  expect(stop.focusVisible, `${label}: keyboard-originated focus must match :focus-visible`).toBe(true);
  expect(stop.hasPaintedIndicator, `${label}: focus-visible must paint an outline or focus halo`).toBe(true);
  expect(stop.inlineRingContained, `${label}: painted inline focus indicator must not clip at viewport edges`).toBe(true);
  expect(stop.verticallyVisible, `${label}: browser auto-scroll must keep focused target in the viewport`).toBe(true);
  expect(stop.clippingAncestors, `${label}: focus indicator must not be clipped by overflow ownership`).toEqual([]);
  expect(stop.navigationOverlaps, `${label}: RouteChrome must not obscure focused route content`).toEqual([]);
  expect(stop.centerUnobscured, `${label}: focused target center must remain pointer-visible/unobscured`).toBe(true);
}

function representativeRouteTarget(page: Page, contract: RouteKeyboardContract): Locator {
  return page.locator(contract.ownerSelector).locator(FOCUSABLE_SELECTOR).first();
}

async function auditSequentialFocus(
  page: Page,
  contract: RouteKeyboardContract,
  viewport: KeyboardViewport,
  appearance: ExplicitAppearance,
  testInfo: TestInfo,
): Promise<void> {
  const target = representativeRouteTarget(page, contract);
  await expect(target, `${contract.key}: route must expose a representative keyboard control`).toBeVisible();
  await expect(target, `${contract.key}: representative keyboard control must be enabled`).toBeEnabled();

  const trace: FocusStop[] = [];
  const skipLink = page.getByRole("link", { name: "Перейти к основному содержимому" });

  await page.keyboard.press("Tab");
  await expect(skipLink, `${contract.key}: skip link must remain the first keyboard stop`).toBeFocused();
  const firstStop = await readFocusStop(page, contract.ownerSelector);
  expectValidKeyboardStop(firstStop, `${contract.key}.${viewport.key}.${appearance}.stop-1`);
  trace.push(firstStop);

  let previousMarkerInstalled = false;
  let reachedTarget = false;
  for (let index = 2; index <= 80; index += 1) {
    await page.evaluate(() => {
      document.querySelectorAll<HTMLElement>("[data-issue-608-previous-focus]").forEach((node) => {
        node.removeAttribute("data-issue-608-previous-focus");
      });
      const active = document.activeElement as HTMLElement | null;
      if (active && !["BODY", "HTML"].includes(active.tagName)) {
        active.setAttribute("data-issue-608-previous-focus", "true");
      }
    });
    previousMarkerInstalled = true;

    await page.keyboard.press("Tab");
    const stop = await readFocusStop(page, contract.ownerSelector);
    expectValidKeyboardStop(stop, `${contract.key}.${viewport.key}.${appearance}.stop-${index}`);
    trace.push(stop);

    if (await target.evaluate((element) => document.activeElement === element)) {
      reachedTarget = true;
      break;
    }
  }

  expect(reachedTarget, `${contract.key}: representative route control must be reachable within 80 sequential Tab stops`).toBe(true);
  expect(previousMarkerInstalled).toBe(true);
  expect(await target.evaluate((element) => document.activeElement === element)).toBe(true);
  expect(await target.evaluate((element, selector) => element.closest(selector) !== null, contract.ownerSelector)).toBe(true);

  const previous = page.locator('[data-issue-608-previous-focus="true"]');
  await expect(previous, `${contract.key}: previous sequential stop must be recorded`).toHaveCount(1);
  await page.keyboard.press("Shift+Tab");
  await expect(previous, `${contract.key}: Shift+Tab must reverse to the previous sequential stop`).toBeFocused();
  const reverseStop = await readFocusStop(page, contract.ownerSelector);
  expectValidKeyboardStop(reverseStop, `${contract.key}.${viewport.key}.${appearance}.reverse`);

  await page.keyboard.press("Tab");
  await expect(target, `${contract.key}: Tab after reversal must return to the representative route control`).toBeFocused();
  const restoredTarget = await readFocusStop(page, contract.ownerSelector);
  expectValidKeyboardStop(restoredTarget, `${contract.key}.${viewport.key}.${appearance}.restored-target`);

  await testInfo.attach(`issue-608-keyboard-focus-${contract.key}-${viewport.key}-${appearance}.json`, {
    body: Buffer.from(JSON.stringify({
      issue: 608,
      parent: 205,
      route: contract.path,
      routeKey: contract.key,
      appearance,
      viewport: { width: viewport.width, height: viewport.height },
      expectedNavigation: contract.focused ? "none" : viewport.navigation,
      sequentialStops: trace,
      reverseStop,
      restoredTarget,
    }, null, 2)),
    contentType: "application/json",
  });
}

test.describe("Issue #608 consolidated keyboard/focus route parity", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const viewport of VIEWPORTS) {
    for (const contract of ROUTES) {
      for (const appearance of ["light", "dark"] as const) {
        test(`${contract.key} ${viewport.width}×${viewport.height} ${appearance}`, async ({ context, page }, testInfo) => {
          test.skip(
            testInfo.project.name !== "desktop-chromium",
            "Issue #608 owns deterministic sequential Tab traversal once in desktop Chromium; existing specialized suites retain cross-browser keyboard/axe coverage.",
          );

          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          expect(page.viewportSize()).toEqual({ width: viewport.width, height: viewport.height });
          await installDeterministicRuntime(page);
          await installQualityGateAPI(context);
          await installAppearance(page, appearance);
          const runtimeErrors = captureRuntimeErrors(page);

          await openRoute(contract, page, context);
          await settleRoute(page, appearance);
          await expectRouteOwnership(page, contract, viewport);
          await expectNoPositiveTabIndex(page);
          await auditSequentialFocus(page, contract, viewport, appearance, testInfo);
          expect(runtimeErrors, `${contract.key}.${viewport.key}.${appearance}: runtime errors during keyboard audit`).toEqual([]);
        });
      }
    }
  }
});
