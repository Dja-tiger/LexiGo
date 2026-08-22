import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000250",
    email: "home-island@example.com",
    displayName: "Home Island User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "home-island-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const WORD = {
  id: 25001,
  kind: "word" as const,
  lemma: "handoff",
  translation: "передача управления",
  aliases: ["transfer"],
  acceptedAnswers: ["передача управления"],
  phonetic: "/ˈhændɒf/",
  partOfSpeech: "noun",
  topic: "Frontend Architecture",
  examples: ["The route handoff preserves the active lesson."],
  note: "A route-island transition must retain the server-owned session.",
  status: "review",
};

const PROGRESS = {
  dueNow: 1,
  dueWords: 1,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 0,
  newWords: 0,
  learningWords: 0,
  reviewWords: 1,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  reviewsTotal: 1,
  dailyGoal: 30,
  currentStreak: 1,
  longestStreak: 1,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
};

const METADATA = {
  catalogVersion: "sha256:home-island-e2e",
  updatedAt: "2026-07-27T10:00:00Z",
  totals: { items: 1, words: 1, phrases: 0 },
  sources: {
    mixed: 1,
    noun: 1,
    verb: 0,
    adjective: 0,
    phrases: 0,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 0,
    academicTechnicalEnglish: 0,
  },
  topics: [{ topic: "Frontend Architecture", count: 1, words: 1, phrases: 0 }],
};

type ExplicitAppearance = "light" | "dark";
type CanonicalNavigation = "mobile" | "rail";

type CanonicalHomeCase = {
  name: string;
  width: number;
  height: number;
  appearance: ExplicitAppearance;
  navigation: CanonicalNavigation;
  canvas: string;
  designContract: string;
};

const CANONICAL_HOME_CASES: readonly CanonicalHomeCase[] = [
  {
    name: "mobile Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    navigation: "mobile",
    canvas: "#10211d",
    designContract: "Figma 196:223",
  },
  {
    name: "mobile Light",
    width: 390,
    height: 844,
    appearance: "light",
    navigation: "mobile",
    canvas: "#f4f7f5",
    designContract: "Figma 196:223 geometry + explicit Light tokens",
  },
  {
    name: "desktop Light",
    width: 1440,
    height: 1024,
    appearance: "light",
    navigation: "rail",
    canvas: "#f4f7f5",
    designContract: "Figma 194:249",
  },
  {
    name: "desktop Dark",
    width: 1440,
    height: 1024,
    appearance: "dark",
    navigation: "rail",
    canvas: "#10211d",
    designContract: "Figma 194:249 geometry + explicit Dark tokens",
  },
] as const;

function lesson(input: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-0000-0000-000000000251",
    source: "mixed",
    studyMode: typeof input.studyMode === "string" ? input.studyMode : "recall",
    ...(typeof input.sessionKind === "string" ? { sessionKind: input.sessionKind } : {}),
    lessonSize: typeof input.lessonSize === "string" ? input.lessonSize : "15",
    currentIndex: 0,
    version: 1,
    status: "active",
    items: [{ ...WORD, position: 0 }],
    createdAt: "2026-07-27T10:00:00Z",
    updatedAt: "2026-07-27T10:00:00Z",
  };
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

type FixtureState = {
  refreshes: number;
  lessonCreates: Array<Record<string, unknown>>;
};

async function installAPI(context: BrowserContext): Promise<FixtureState> {
  const state: FixtureState = { refreshes: 0, lessonCreates: [] };
  let activeLesson: ReturnType<typeof lesson> | null = null;

  await context.addCookies([{
    name: "lexigo_csrf",
    value: "home-island-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      state.refreshes += 1;
      return json(route, 200, SESSION);
    }
    if (path === "/api/v1/progress") return json(route, 200, PROGRESS);
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    if (path === "/api/v1/lessons/active") {
      return activeLesson
        ? json(route, 200, activeLesson)
        : json(route, 404, { error: { code: "active_lesson_not_found", message: "not found" } });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as Record<string, unknown>;
      state.lessonCreates.push(input);
      activeLesson = lesson(input);
      return json(route, 201, activeLesson);
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as Record<string, unknown>;
      const sessionKind = typeof input.sessionKind === "string" ? input.sessionKind : "";
      const review = sessionKind === "review";
      const explicitEmpty = sessionKind === "remediation" || sessionKind === "study";
      return json(route, 200, {
        source: typeof input.source === "string" ? input.source : "mixed",
        studyMode: typeof input.studyMode === "string" ? input.studyMode : "study",
        ...(sessionKind ? { sessionKind } : {}),
        lessonSize: typeof input.lessonSize === "string" ? input.lessonSize : "30",
        composition: {
          total: explicitEmpty ? 0 : 1,
          words: explicitEmpty ? 0 : 1,
          phrases: 0,
          due: review || !sessionKind ? 1 : 0,
          new: 0,
          scheduled: 0,
          availableWords: explicitEmpty ? 0 : 1,
          availablePhrases: 0,
        },
      });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return json(route, 200, {
        items: [WORD],
        count: 1,
        total: 1,
        page: 1,
        pageSize: 48,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }

    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  return state;
}

function visibleRouteLink(page: Page, view: "home" | "learn" | "library" | "progress") {
  return page.locator(`.lx-route-nav:visible [data-navigation-view="${view}"]`);
}

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function expectHomeRouteOwner(page: Page, appearance?: ExplicitAppearance): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  const island = page.locator('[data-route-client-island="home"]');
  await expect(island).toBeVisible();
  await expect(island).toHaveAttribute("data-figma-home-mobile", "196:223");
  await expect(island).toHaveAttribute("data-figma-home-desktop", "194:249");
  await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", "Главная");
  await expect(page.getByRole("button", { name: "Повторить 1", exact: true })).toBeVisible();

  if (appearance) {
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  }
}

async function expectCanonicalHomeGeometry(
  page: Page,
  expected: CanonicalHomeCase,
): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    const island = document.querySelector<HTMLElement>('[data-route-client-island="home"]');

    if (!main || !island) {
      throw new Error("Home route geometry owner is not mounted");
    }

    const rect = (node: HTMLElement) => {
      const value = node.getBoundingClientRect();
      return {
        left: value.left,
        right: value.right,
        top: value.top,
        bottom: value.bottom,
        width: value.width,
        height: value.height,
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

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth ?? 0,
      canvas: window.getComputedStyle(root).getPropertyValue("--ak-color-canvas").trim(),
      main: rect(main),
      island: rect(island),
      visibleNavigation,
    };
  });

  expect(geometry.innerWidth).toBe(expected.width);
  expect(geometry.innerHeight).toBe(expected.height);
  expect(geometry.canvas).toBe(expected.canvas);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);

  for (const owner of [geometry.main, geometry.island]) {
    expect(owner.width).toBeGreaterThan(0);
    expect(owner.left).toBeGreaterThanOrEqual(-1);
    expect(owner.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }

  expect(geometry.visibleNavigation).toHaveLength(1);
  const navigation = geometry.visibleNavigation[0];
  expect(navigation.variant).toBe(expected.navigation);
  expect(navigation.box.left).toBeGreaterThanOrEqual(-1);
  expect(navigation.box.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(navigation.box.top).toBeGreaterThanOrEqual(-1);
  expect(navigation.box.bottom).toBeLessThanOrEqual(geometry.innerHeight + 1);
}

test.describe.configure({ timeout: 90_000 });

test("Home starts the due lesson and consumes resume=1 without an intermediate gate", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The one-time route intent is verified once in Chromium; the shared lesson flow remains covered cross-browser.");
  const state = await installAPI(context);

  await page.goto("/");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Повторить 1", exact: true })).toBeVisible();
  expect(state.refreshes).toBe(1);

  await page.getByRole("button", { name: "Повторить 1", exact: true }).click();

  await expect(page).toHaveURL((url) => url.pathname === "/lesson/active" && url.search === "");
  await expect(page.locator(".lx-active-lesson")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить урок" })).toHaveCount(0);
  expect(state.lessonCreates).toEqual([{
    source: "mixed",
    studyMode: "recall",
    sessionKind: "review",
    lessonSize: "15",
  }]);
  expect(state.refreshes).toBe(1);
});

test("Home remains a dedicated entry across Home to product graph navigation and browser history", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Route-graph ownership is verified once in Chromium; canonical navigation is covered by the full browser matrix.");
  const state = await installAPI(context);

  await page.goto("/");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();

  await visibleRouteLink(page, "learn").click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await expect(page.locator('[data-route-client-island="home"]')).toHaveCount(0);

  await visibleRouteLink(page, "home").click();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();

  await visibleRouteLink(page, "library").click();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Словарь" })).toBeVisible();

  await visibleRouteLink(page, "home").click();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
  expect(state.refreshes).toBe(1);
});

test.describe("canonical Home Figma parity contract", () => {
  for (const canonicalCase of CANONICAL_HOME_CASES) {
    test(`${canonicalCase.name} uses canonical geometry and route chrome (${canonicalCase.designContract})`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop-chromium",
        "Canonical Figma geometry is measured once in Chromium; the existing Home route/history and browser-owned zoom contracts remain independently covered.",
      );

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installAppearance(page, canonicalCase.appearance);
      await installAPI(context);

      await page.goto("/");
      await expectHomeRouteOwner(page, canonicalCase.appearance);
      await expectCanonicalHomeGeometry(page, canonicalCase);

      await page.reload({ waitUntil: "domcontentloaded" });
      await expectHomeRouteOwner(page, canonicalCase.appearance);
      await expectCanonicalHomeGeometry(page, canonicalCase);
    });
  }
});
