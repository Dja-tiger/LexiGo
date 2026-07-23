import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000183",
    email: "adaptive-home@example.com",
    displayName: "Adaptive Home User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "adaptive-home-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const EMPTY_MODE = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

const PROGRESS = {
  dueNow: 12,
  dueWords: 8,
  duePhrases: 4,
  totalWords: 80,
  totalPhrases: 20,
  newWords: 14,
  learningWords: 22,
  reviewWords: 44,
  masteredWords: 18,
  masteredPhrases: 6,
  reviewsToday: 7,
  successfulToday: 6,
  objectiveReviewsToday: 7,
  objectiveSuccessfulToday: 6,
  reviewsTotal: 340,
  dailyGoal: 30,
  currentStreak: 5,
  longestStreak: 9,
  retainedItemsWeek: 21,
  retainedWordsWeek: 15,
  retainedPhrasesWeek: 6,
  eventSchemaVersion: 2,
  modes: {
    study: EMPTY_MODE,
    recall: EMPTY_MODE,
    choice: EMPTY_MODE,
    legacy: EMPTY_MODE,
  },
};

const WORD = {
  id: 18301,
  kind: "word",
  lemma: "priority",
  translation: "приоритет",
  phonetic: "/praɪˈɒrəti/",
  partOfSpeech: "noun",
  topic: "Product UX",
  examples: ["Keep the next learning action visible."],
  note: "The unfinished lesson has priority over a new queue.",
  status: "review",
};

const METADATA = {
  catalogVersion: "sha256:adaptive-home-e2e",
  updatedAt: "2026-07-23T00:00:00Z",
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
  topics: [{ topic: "Product UX", count: 1, words: 1, phrases: 0 }],
};

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAPI(page: Page) {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "adaptive-home-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (path === "/api/v1/progress") return fulfillJSON(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return fulfillJSON(route, 404, {
        error: { code: "active_lesson_not_found", message: "active lesson was not found" },
      });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: [WORD], count: 1 });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });
}

async function boxOrFail(locator: ReturnType<Page["locator"]>) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe("Adaptive Knowledge Coach application shell and Home", () => {
  test("uses a persistent desktop rail and one dominant Home action", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.emulateMedia({ colorScheme: "light" });
    await installAPI(page);
    await page.goto("/");

    const rail = page.locator('[data-route-navigation="rail"]');
    const headerNavigation = page.locator('[data-route-navigation="header"]');
    const mobileNavigation = page.locator('[data-route-navigation="mobile"]');
    const main = page.locator('.lx-main-content[aria-label="Главная"]');
    const hero = main.locator(".lx-hero-card");
    const evidence = main.locator(".lx-progress-panel");

    await expect(rail).toBeVisible();
    await expect(headerNavigation).toBeHidden();
    await expect(mobileNavigation).toBeHidden();
    await expect(main.locator(".lx-home-paths")).toBeHidden();
    await expect(page.getByRole("button", { name: "Повторить сейчас" })).toBeVisible();

    const railBox = await boxOrFail(rail);
    const mainBox = await boxOrFail(main);
    const heroBox = await boxOrFail(hero);
    const evidenceBox = await boxOrFail(evidence);

    expect(railBox.x).toBeLessThanOrEqual(1);
    expect(railBox.width).toBeGreaterThanOrEqual(219);
    expect(railBox.height).toBeGreaterThanOrEqual(1023);
    expect(mainBox.x).toBeGreaterThanOrEqual(220);
    expect(Math.abs(heroBox.y - evidenceBox.y)).toBeLessThanOrEqual(2);
    expect(evidenceBox.x).toBeGreaterThan(heroBox.x + heroBox.width);

    const shellBackground = await page.locator(".lx-routed-app").evaluate((node) => (
      getComputedStyle(node).backgroundColor
    ));
    expect(shellBackground).toBe("rgb(244, 247, 245)");
    await expectNoHorizontalOverflow(page);
  });

  test("uses edge-to-edge mobile navigation and reflows at 200% text size", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark" });
    await installAPI(page);
    await page.goto("/");

    const rail = page.locator('[data-route-navigation="rail"]');
    const mobileNavigation = page.locator('[data-route-navigation="mobile"]');
    const brand = page.locator(".lx-route-brand");
    const primaryCTA = page.getByRole("button", { name: "Повторить сейчас" });

    await expect(rail).toBeHidden();
    await expect(brand).toBeHidden();
    await expect(mobileNavigation).toBeVisible();
    await expect(page.locator('.lx-main-content[aria-label="Главная"] .lx-home-paths')).toBeHidden();
    await expect(primaryCTA).toBeVisible();

    const navigationBox = await boxOrFail(mobileNavigation);
    const ctaBox = await boxOrFail(primaryCTA);
    expect(navigationBox.x).toBeLessThanOrEqual(1);
    expect(navigationBox.width).toBeGreaterThanOrEqual(389);
    expect(navigationBox.y + navigationBox.height).toBeGreaterThanOrEqual(843);
    expect(ctaBox.y + ctaBox.height).toBeLessThan(navigationBox.y);

    const shellBackground = await page.locator(".lx-routed-app").evaluate((node) => (
      getComputedStyle(node).backgroundColor
    ));
    expect(shellBackground).toBe("rgb(11, 33, 27)");

    await page.addStyleTag({ content: ":root { font-size: 200%; }" });
    await expectNoHorizontalOverflow(page);
  });

  test("removes optional motion when reduced motion is requested", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await installAPI(page);
    await page.goto("/");

    const primaryCTA = page.getByRole("button", { name: "Повторить сейчас" });
    await expect(primaryCTA).toBeVisible();
    const motion = await primaryCTA.evaluate((node) => ({
      transitionDuration: getComputedStyle(node).transitionDuration,
      animationName: getComputedStyle(node).animationName,
    }));

    expect(motion.transitionDuration).toBe("0s");
    expect(motion.animationName).toBe("none");
  });
});
