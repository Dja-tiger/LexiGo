import { createHash } from "node:crypto";

import {
  expect,
  test,
  type BrowserContext,
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
type TabletRouteKey =
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

type TabletRouteContract = Readonly<{
  key: TabletRouteKey;
  path: string;
  ownerSelector: string;
  focused: boolean;
}>;

type TabletVisualBaseline = Readonly<{
  width: 768;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const TABLET_ROUTES: readonly TabletRouteContract[] = [
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

/**
 * These content-addressed fingerprints were approved only after direct manual
 * review of exact Linux artifact #9291962719 from CI run 32040684330 on head
 * 3578718bdcba1a24873ce23999ef7672a22193c5. The three retained Playwright
 * failure records for every state reproduced the same height and SHA-256.
 */
const TABLET_VISUAL_BASELINES: Record<
  `${TabletRouteKey}.${ExplicitAppearance}`,
  TabletVisualBaseline
> = {
  "home.light": { width: 768, height: 1105, sha256: "08d213c5fa280702abadc675476e8f4197c100ffd9011eb0d5a7f5772bab9d8e", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "home.dark": { width: 768, height: 1105, sha256: "d2ca7909b3a0f3480f28af24f9d734f0c641cc5f1ebc174108a408cbefb40bbc", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "learn.light": { width: 768, height: 1990, sha256: "189c3b116e23acb636e1f756e79a15a016aea78cea71a8af6ce38d7832311f08", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "learn.dark": { width: 768, height: 1990, sha256: "18e6e8da66d811cea71fefdcbd34ed30e6e8a27584aeb54f66eb5c484e6c07c4", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "active-lesson.light": { width: 768, height: 1024, sha256: "39dbd304a26668f6a11acb774d7e790cab4ba51af2710b0fc42a00631b104998", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "active-lesson.dark": { width: 768, height: 1024, sha256: "4f02aaef1849bee10c6a3bc71a72dba26ee2cb3615e12030c6eead00281cf935", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "progress.light": { width: 768, height: 1689, sha256: "41ef29fa337e8d9687d00ff1d69ff8d5689923ff706e5a39d873c9ade6de33c5", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "progress.dark": { width: 768, height: 1689, sha256: "121d09086cff4b44693bf0351b243f176564010037c5494d8f642f6286675da9", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "dictionary.light": { width: 768, height: 1760, sha256: "17910a66337422d1765ef1eec28d754e80083f6f3d7f59ea6d60b459ab54d38e", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "dictionary.dark": { width: 768, height: 1760, sha256: "91bdb446377da58c834ab0a915952b7ad6d038e3e9d980590d75288d6b0cedee", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "word-detail.light": { width: 768, height: 1663, sha256: "e065b923b788c332735b40370c61734eb5fc4e59bdb98f5ee0a5ee1c7556deb8", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "word-detail.dark": { width: 768, height: 1663, sha256: "d625844b0762103dc08a910dd994db0d0001ca7466691d779539d32945bf796a", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "phrases.light": { width: 768, height: 1593, sha256: "16c8efb17d7c599d425266d9c4e5457d9ac2b02756a677e0246c8aaf6fe8643a", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "phrases.dark": { width: 768, height: 1593, sha256: "c1a0ee9a5e970743b1d7ce149ffe44cfdef13f9cec481a34ddbcf2cc1b345663", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "phrase-detail.light": { width: 768, height: 1496, sha256: "d1c805baea90c677a320a6a32d9b93eda1e6fa61524bc6410520fc465faa6e78", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "phrase-detail.dark": { width: 768, height: 1496, sha256: "cfaaaabf676496c04ce033f0bdd99888bcda2c9ed2e7511ab8cf9c6f9ab7703c", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "profile.light": { width: 768, height: 4229, sha256: "b73fa564476dc1458c5096e02aac76667271df87e5fba8ce58e0f0fa7f111042", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "profile.dark": { width: 768, height: 4229, sha256: "d3975453cc920c779d363ffe7fd791f1e4fb10e306cf7cead870c8baefc8be6e", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "onboarding.light": { width: 768, height: 1024, sha256: "b63d5ec40e59cf210db08a2edb5134a529adb62653b8dd751da91472d01f010a", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
  "onboarding.dark": { width: 768, height: 1024, sha256: "483efada706044601cd599aea9e7c76c0e71da176578a610740c666bfd620aad", sourceRun: 32040684330, sourceHeadSha: "3578718bdcba1a24873ce23999ef7672a22193c5" },
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
  await page.emulateMedia({
    colorScheme: appearance,
    reducedMotion: "reduce",
  });
}

async function installOnboardingResumeAPI(context: BrowserContext): Promise<void> {
  // The shared quality-gate API intentionally does not own the onboarding state
  // machine. Replace only this test context's API route with the already-delivered
  // #18 resume contract used by the canonical First Use visual suite.
  await context.unroute("**/api/v1/**");
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "tablet-parity-csrf",
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

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });
}

async function openTabletRoute(
  contract: TabletRouteContract,
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
      await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
      await expect(page.getByText("Следующее повторение", { exact: true })).toBeVisible();
      return;
    case "phrases":
      await page.goto("/phrases", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
      await expect(
        page.getByRole("list", { name: "Результаты каталога фраз" }).getByRole("listitem"),
      ).toHaveCount(QUALITY_PHRASES.length);
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

async function settleTabletRoute(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function expectTabletOwnership(
  page: Page,
  contract: TabletRouteContract,
): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === contract.path);
  await expect(page.locator(contract.ownerSelector)).toBeVisible();
  await expect(page.locator("#lexigo-main-content")).toBeVisible();
  expect(
    await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
    `${contract.key} must run with reduced motion at 768px`,
  ).toBe(true);

  const geometry = await page.evaluate((input) => {
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    const owner = document.querySelector<HTMLElement>(input.ownerSelector);
    if (!main || !owner) throw new Error(`Tablet route owner is not mounted: ${input.ownerSelector}`);

    const rect = (node: HTMLElement) => {
      const box = node.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };

    const visibleNavigation = Array.from(
      document.querySelectorAll<HTMLElement>("[data-route-navigation]"),
    )
      .map((node) => {
        const style = window.getComputedStyle(node);
        return {
          variant: node.dataset.routeNavigation ?? "",
          display: style.display,
          visibility: style.visibility,
          box: rect(node),
        };
      })
      .filter((item) => (
        item.display !== "none"
        && item.visibility !== "hidden"
        && item.box.width > 0
        && item.box.height > 0
      ));

    const focusableSelector = [
      "a[href]",
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const focusableOffenders = Array.from(
      document.querySelectorAll<HTMLElement>(focusableSelector),
    ).flatMap((node) => {
      const style = window.getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const rendered = style.display !== "none"
        && style.visibility !== "hidden"
        && style.visibility !== "collapse"
        && Number.parseFloat(style.opacity || "1") > 0
        && box.width > 0
        && box.height > 0;
      if (!rendered) return [];

      // Controls fully outside the viewport may belong to an intentional
      // horizontal scroller. Partially visible focusable controls must keep the
      // complete focus box inside the viewport.
      const intersectsViewport = box.right > 0 && box.left < root.clientWidth;
      if (!intersectsViewport) return [];
      if (box.left >= -1 && box.right <= root.clientWidth + 1) return [];

      return [{
        tag: node.tagName.toLowerCase(),
        id: node.id,
        label: node.getAttribute("aria-label")
          ?? node.getAttribute("title")
          ?? node.textContent?.trim().replace(/\s+/g, " ").slice(0, 80)
          ?? "",
        left: box.left,
        right: box.right,
        width: box.width,
      }];
    });

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      main: rect(main),
      owner: rect(owner),
      visibleNavigation,
      focusableOffenders,
    };
  }, { ownerSelector: contract.ownerSelector });

  expect(geometry.innerWidth).toBe(768);
  expect(geometry.innerHeight).toBe(1024);
  expect(
    geometry.documentWidth,
    `${contract.key} must not overflow horizontally at 768px`,
  ).toBeLessThanOrEqual(geometry.clientWidth + 1);

  for (const [label, owner] of [["main", geometry.main], ["route owner", geometry.owner]] as const) {
    expect(owner.width, `${contract.key} ${label} must have positive width`).toBeGreaterThan(0);
    expect(owner.left, `${contract.key} ${label} must not clip on the inline start`).toBeGreaterThanOrEqual(-1);
    expect(owner.right, `${contract.key} ${label} must not clip on the inline end`).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }

  expect(
    geometry.focusableOffenders,
    `${contract.key} must not partially clip rendered focusable controls at 768px`,
  ).toEqual([]);

  if (contract.focused) {
    expect(
      geometry.visibleNavigation,
      `${contract.key} focused route must suppress ordinary RouteChrome`,
    ).toHaveLength(0);
  } else {
    expect(
      geometry.visibleNavigation,
      `${contract.key} must expose exactly one RouteChrome owner`,
    ).toHaveLength(1);
    const navigation = geometry.visibleNavigation[0];
    expect(["mobile", "rail", "header"]).toContain(navigation.variant);
    expect(navigation.box.left).toBeGreaterThanOrEqual(-1);
    expect(navigation.box.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }
}

async function captureTabletEvidence(
  page: Page,
  testInfo: TestInfo,
  contract: TabletRouteContract,
  appearance: ExplicitAppearance,
): Promise<void> {
  const baselineKey = `${contract.key}.${appearance}` as const;
  const baseline = TABLET_VISUAL_BASELINES[baselineKey];
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

  await testInfo.attach(`tablet-${contract.key}-${appearance}.png`, {
    body: screenshot,
    contentType: "image/png",
  });
  await testInfo.attach(`tablet-${contract.key}-${appearance}.json`, {
    body: Buffer.from(JSON.stringify({
      route: contract.path,
      routeKey: contract.key,
      appearance,
      responsiveViewport: { width: 768, height: 1024 },
      sourceSemantics: "responsive runtime interpolation between approved compact/desktop route sources; no separate tablet design node",
      actual,
      approved: baseline,
    }, null, 2)),
    contentType: "application/json",
  });

  expect(
    actual,
    `${baselineKey}: exact Linux 768×1024 fingerprint must match the manually reviewed evidence`,
  ).toEqual({
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  });
}

test.describe("Issue #568 medium/tablet route parity matrix", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  for (const contract of TABLET_ROUTES) {
    for (const appearance of ["light", "dark"] as const) {
      test(`${contract.key} 768×1024 ${appearance}`, async ({ context, page }, testInfo) => {
        test.skip(
          testInfo.project.name !== "visual-medium",
          "Issue #568 is the dedicated 768×1024 responsive runtime evidence matrix.",
        );

        expect(page.viewportSize()).toEqual({ width: 768, height: 1024 });
        testInfo.annotations.push({
          type: "responsive-source",
          description: `${contract.path} | 768×1024 | ${appearance} | no separate canonical tablet design node`,
        });

        await installAppearance(page, appearance);
        const runtimeErrors = captureRuntimeErrors(page);
        await openTabletRoute(contract, page, context);
        await settleTabletRoute(page, appearance);
        await expectTabletOwnership(page, contract);
        expect(runtimeErrors).toEqual([]);
        await captureTabletEvidence(page, testInfo, contract, appearance);
      });
    }
  }
});
