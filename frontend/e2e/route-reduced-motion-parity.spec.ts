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
  installQualityGateAPI,
  QUALITY_PHRASES,
  QUALITY_SESSION,
} from "./support/quality-gates";
import {
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

type ExplicitAppearance = "light" | "dark";
type NavigationOwner = "mobile" | "rail";
type RouteMotionKey =
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

type RouteMotionContract = Readonly<{
  key: RouteMotionKey;
  path: string;
  ownerSelector: string;
  focused: boolean;
}>;

type MotionViewport = Readonly<{
  key: "compact" | "desktop";
  width: number;
  height: number;
  navigation: NavigationOwner;
}>;

type MotionViolation = Readonly<{
  owner: string;
  pseudo: "element" | "::before" | "::after";
  animationName: string;
  animationDuration: string;
  transitionProperty: string;
  transitionDuration: string;
}>;

type MotionSnapshot = Readonly<{
  reducedMotion: boolean;
  htmlScrollBehavior: string;
  ownerScrollBehavior: string;
  navigationScrollBehavior: string[];
  activeAnimations: Array<{ owner: string; playState: string }>;
  violations: MotionViolation[];
  inspectedElements: number;
}>;

type FocusFeedback = Readonly<{
  tag: string;
  name: string;
  focusVisible: boolean;
  outlineStyle: string;
  outlineWidth: number;
  outlineColor: string;
  boxShadow: string;
  transform: string;
  transitionDurationMilliseconds: number[];
  activeAnimations: number;
}>;

const ROUTES: readonly RouteMotionContract[] = [
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

const VIEWPORTS: readonly MotionViewport[] = [
  { key: "compact", width: 390, height: 844, navigation: "mobile" },
  { key: "desktop", width: 1440, height: 1024, navigation: "rail" },
] as const;

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
    value: "route-reduced-motion-csrf",
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
  contract: RouteMotionContract,
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
}

async function expectRouteOwnership(
  page: Page,
  contract: RouteMotionContract,
  viewport: MotionViewport,
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
    `${contract.key}: RouteChrome ownership must match ${viewport.key} reduced-motion topology`,
  ).toEqual(contract.focused ? [] : [viewport.navigation]);
}

async function focusRepresentativeRouteControl(
  page: Page,
  contract: RouteMotionContract,
): Promise<FocusFeedback> {
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press("Tab");
    const feedback = await page.evaluate((selector) => {
      const owner = document.querySelector<HTMLElement>(selector);
      const active = document.activeElement as HTMLElement | null;
      if (!owner || !active || !owner.contains(active) || active.tabIndex < 0) return null;

      const style = window.getComputedStyle(active);
      const toMilliseconds = (value: string) => value.split(",").map((part) => {
        const normalized = part.trim();
        const numeric = Number.parseFloat(normalized);
        if (!Number.isFinite(numeric)) return Number.POSITIVE_INFINITY;
        return normalized.endsWith("ms") ? numeric : numeric * 1_000;
      });
      const visibleOutline = style.outlineStyle !== "none"
        && Number.parseFloat(style.outlineWidth || "0") >= 1
        && style.outlineColor !== "transparent"
        && style.outlineColor !== "rgba(0, 0, 0, 0)";
      const visibleShadow = style.boxShadow !== "none";

      return {
        tag: active.tagName.toLowerCase(),
        name: active.getAttribute("aria-label")
          ?? active.getAttribute("title")
          ?? active.textContent?.trim().replace(/\s+/g, " ").slice(0, 120)
          ?? "",
        focusVisible: active.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth || "0"),
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
        transform: style.transform,
        transitionDurationMilliseconds: toMilliseconds(style.transitionDuration),
        activeAnimations: active.getAnimations().filter((animation) => (
          animation.playState === "running" || animation.playState === "pending"
        )).length,
        hasPaintedIndicator: visibleOutline || visibleShadow,
      };
    }, contract.ownerSelector);

    if (feedback) {
      expect(feedback.focusVisible, `${contract.key}: keyboard target must match :focus-visible`).toBe(true);
      expect(feedback.hasPaintedIndicator, `${contract.key}: keyboard target must retain painted feedback`).toBe(true);
      expect(feedback.transform, `${contract.key}: reduced-motion keyboard feedback must not use spatial transform`).toBe("none");
      expect(
        feedback.transitionDurationMilliseconds.every((duration) => duration <= 0.01),
        `${contract.key}: keyboard feedback transition duration must be zero-equivalent`,
      ).toBe(true);
      expect(feedback.activeAnimations, `${contract.key}: focused control must have no active Web Animations`).toBe(0);
      const { hasPaintedIndicator: _painted, ...evidence } = feedback;
      return evidence;
    }
  }

  throw new Error(`${contract.key}: no representative route control reached within 80 keyboard Tab stops`);
}

async function readMotionSnapshot(page: Page, ownerSelector: string): Promise<MotionSnapshot> {
  return page.evaluate((selector) => {
    const owner = document.querySelector<HTMLElement>(selector);
    if (!owner) throw new Error(`Reduced-motion owner is not mounted: ${selector}`);

    const toMilliseconds = (value: string) => value.split(",").map((part) => {
      const normalized = part.trim();
      const numeric = Number.parseFloat(normalized);
      if (!Number.isFinite(numeric)) return Number.POSITIVE_INFINITY;
      return normalized.endsWith("ms") ? numeric : numeric * 1_000;
    });
    const hasPositiveDuration = (value: string) => toMilliseconds(value).some((duration) => duration > 0.01);
    const isRendered = (element: HTMLElement) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && style.visibility !== "collapse"
        && Number.parseFloat(style.opacity || "1") > 0
        && rect.width > 0
        && rect.height > 0;
    };

    const candidates = new Set<HTMLElement>([owner]);
    owner.querySelectorAll<HTMLElement>("*").forEach((element) => candidates.add(element));
    document.querySelectorAll<HTMLElement>(".lx-route-brand, [data-route-navigation]").forEach((root) => {
      if (!isRendered(root)) return;
      candidates.add(root);
      root.querySelectorAll<HTMLElement>("*").forEach((element) => candidates.add(element));
    });

    const violations: MotionViolation[] = [];
    const activeAnimations: Array<{ owner: string; playState: string }> = [];
    let inspectedElements = 0;

    const inspectStyle = (
      element: HTMLElement,
      pseudo: "element" | "::before" | "::after",
      style: CSSStyleDeclaration,
    ) => {
      const animationViolation = style.animationName !== "none" && hasPositiveDuration(style.animationDuration);
      const transitionViolation = style.transitionProperty !== "none" && hasPositiveDuration(style.transitionDuration);
      if (!animationViolation && !transitionViolation) return;
      violations.push({
        owner: element.getAttribute("data-route-navigation")
          ?? element.getAttribute("data-route-client-island")
          ?? element.className
          ?? element.tagName.toLowerCase(),
        pseudo,
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
      });
    };

    for (const element of candidates) {
      if (!isRendered(element)) continue;
      inspectedElements += 1;
      inspectStyle(element, "element", window.getComputedStyle(element));
      inspectStyle(element, "::before", window.getComputedStyle(element, "::before"));
      inspectStyle(element, "::after", window.getComputedStyle(element, "::after"));

      for (const animation of element.getAnimations()) {
        if (animation.playState !== "running" && animation.playState !== "pending") continue;
        activeAnimations.push({
          owner: element.getAttribute("data-route-navigation")
            ?? element.getAttribute("data-route-client-island")
            ?? element.className
            ?? element.tagName.toLowerCase(),
          playState: animation.playState,
        });
      }
    }

    const navigationScrollBehavior = Array.from(
      document.querySelectorAll<HTMLElement>("[data-route-navigation]"),
    ).filter(isRendered).map((element) => window.getComputedStyle(element).scrollBehavior);

    return {
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      htmlScrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
      ownerScrollBehavior: window.getComputedStyle(owner).scrollBehavior,
      navigationScrollBehavior,
      activeAnimations,
      violations,
      inspectedElements,
    };
  }, ownerSelector);
}

async function auditReducedMotion(
  page: Page,
  contract: RouteMotionContract,
  viewport: MotionViewport,
  appearance: ExplicitAppearance,
  testInfo: TestInfo,
): Promise<void> {
  const focusFeedback = await focusRepresentativeRouteControl(page, contract);
  const snapshot = await readMotionSnapshot(page, contract.ownerSelector);

  expect(snapshot.reducedMotion, `${contract.key}: reduced-motion media query must resolve true`).toBe(true);
  expect(snapshot.inspectedElements, `${contract.key}: audit must inspect rendered route/shell elements`).toBeGreaterThan(0);
  expect(snapshot.htmlScrollBehavior, `${contract.key}: document scrolling must be instant under reduce`).toBe("auto");
  expect(snapshot.ownerScrollBehavior, `${contract.key}: route owner scrolling must be instant under reduce`).toBe("auto");
  expect(
    snapshot.navigationScrollBehavior.every((behavior) => behavior === "auto"),
    `${contract.key}: rendered RouteChrome scrolling must be instant under reduce`,
  ).toBe(true);
  expect(snapshot.activeAnimations, `${contract.key}: active Web Animations under reduce`).toEqual([]);
  expect(snapshot.violations, `${contract.key}: positive-duration CSS motion under reduce`).toEqual([]);

  await testInfo.attach(`issue-614-reduced-motion-${contract.key}-${viewport.key}-${appearance}.json`, {
    body: Buffer.from(JSON.stringify({
      issue: 614,
      parent: 205,
      related: [65, 461],
      route: contract.path,
      routeKey: contract.key,
      appearance,
      viewport: { width: viewport.width, height: viewport.height },
      expectedNavigation: contract.focused ? "none" : viewport.navigation,
      focusFeedback,
      motion: snapshot,
    }, null, 2)),
    contentType: "application/json",
  });
}

test.describe("Issue #614 consolidated reduced-motion route parity", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const viewport of VIEWPORTS) {
    for (const contract of ROUTES) {
      for (const appearance of ["light", "dark"] as const) {
        test(`${contract.key} ${viewport.width}×${viewport.height} ${appearance}`, async ({ context, page }, testInfo) => {
          test.skip(
            testInfo.project.name !== "desktop-chromium",
            "Issue #614 owns the deterministic 10-route reduced-motion parity matrix once in desktop Chromium; existing #65 suites retain specialized Chromium/WebKit/mobile interaction coverage.",
          );

          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          expect(page.viewportSize()).toEqual({ width: viewport.width, height: viewport.height });
          await installQualityGateAPI(context);
          await installAppearance(page, appearance);
          const runtimeErrors = captureRuntimeErrors(page);

          await openRoute(contract, page, context);
          await settleRoute(page, appearance);
          await expectRouteOwnership(page, contract, viewport);
          await auditReducedMotion(page, contract, viewport, appearance, testInfo);
          expect(runtimeErrors, `${contract.key}.${viewport.key}.${appearance}: runtime errors during reduced-motion audit`).toEqual([]);
        });
      }
    }
  }
});
