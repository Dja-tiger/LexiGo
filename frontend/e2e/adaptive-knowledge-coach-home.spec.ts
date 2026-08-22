import { expect, test, type Browser, type Locator, type Page, type Route } from "@playwright/test";

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

type ProcessKind = "study" | "review" | "remediation";
type ProcessBacklogs = Record<ProcessKind, number>;

type FixtureState = {
  lessonCreates: Array<Record<string, unknown>>;
};

type TargetRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  height: number;
  width: number;
};

type EffectiveTarget = TargetRect & {
  visualHeight: number;
  visualWidth: number;
  perimeterHits: boolean[];
  pseudoBackground: string;
  pseudoBorderWidths: string[];
  pseudoBoxShadow: string;
};

const DEFAULT_PROCESS_BACKLOGS: ProcessBacklogs = {
  review: 38,
  remediation: 6,
  study: 24,
};

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function processPreview(input: Record<string, unknown>, backlogs: ProcessBacklogs) {
  const sessionKind = input.sessionKind as ProcessKind;
  const backlog = backlogs[sessionKind] ?? 0;
  const selected = Math.min(15, backlog);
  return {
    source: input.source ?? "mixed",
    studyMode: input.studyMode ?? "study",
    sessionKind,
    lessonSize: input.lessonSize ?? "15",
    composition: {
      total: selected,
      words: selected,
      phrases: 0,
      due: sessionKind === "review" ? selected : 0,
      new: sessionKind === "study" ? selected : 0,
      scheduled: 0,
      availableWords: backlog,
      availablePhrases: 0,
    },
  };
}

function activeLesson(input: Record<string, unknown>) {
  return {
    id: "00000000-0000-0000-0000-000000000184",
    source: input.source ?? "mixed",
    studyMode: input.studyMode ?? "recall",
    sessionKind: input.sessionKind,
    lessonSize: input.lessonSize ?? "15",
    currentIndex: 0,
    version: 1,
    status: "active",
    items: [{ ...WORD, position: 0, reason: input.sessionKind === "study" ? "new" : "due" }],
    createdAt: "2026-08-23T00:00:00Z",
    updatedAt: "2026-08-23T00:00:00Z",
  };
}

async function installAPI(
  page: Page,
  processBacklogs: ProcessBacklogs = DEFAULT_PROCESS_BACKLOGS,
): Promise<FixtureState> {
  const state: FixtureState = { lessonCreates: [] };
  let currentLesson: ReturnType<typeof activeLesson> | null = null;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "adaptive-home-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (path === "/api/v1/progress") return fulfillJSON(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return currentLesson
        ? fulfillJSON(route, 200, currentLesson)
        : fulfillJSON(route, 404, {
            error: { code: "active_lesson_not_found", message: "active lesson was not found" },
          });
    }
    if (path === "/api/v1/lessons/preview" && request.method() === "POST") {
      const input = request.postDataJSON() as Record<string, unknown>;
      return fulfillJSON(route, 200, processPreview(input, processBacklogs));
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as Record<string, unknown>;
      state.lessonCreates.push(input);
      currentLesson = activeLesson(input);
      return fulfillJSON(route, 201, currentLesson);
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: [WORD], count: 1 });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });

  return state;
}

async function boxOrFail(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function centerForHitTesting(control: Locator): Promise<void> {
  await control.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  });
  await expect(control).toBeInViewport();
}

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
  return control.evaluate((element) => {
    const button = element as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    const hitSlop = window.getComputedStyle(button, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const topInset = Number.parseFloat(hitSlop.top) || 0;
    const rightInset = Number.parseFloat(hitSlop.right) || 0;
    const bottomInset = Number.parseFloat(hitSlop.bottom) || 0;
    const leftInset = Number.parseFloat(hitSlop.left) || 0;
    const pseudoTop = rect.top + borderTop + topInset;
    const pseudoRight = rect.right - borderRight - rightInset;
    const pseudoBottom = rect.bottom - borderBottom - bottomInset;
    const pseudoLeft = rect.left + borderLeft + leftInset;
    const top = Math.min(rect.top, pseudoTop);
    const right = Math.max(rect.right, pseudoRight);
    const bottom = Math.max(rect.bottom, pseudoBottom);
    const left = Math.min(rect.left, pseudoLeft);
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    const inset = 1;
    const perimeterHits = [
      [centerX, top + inset],
      [right - inset, centerY],
      [centerX, bottom - inset],
      [left + inset, centerY],
    ].map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === button || (hit instanceof Node && button.contains(hit));
    });

    return {
      top,
      right,
      bottom,
      left,
      height: bottom - top,
      width: right - left,
      visualHeight: rect.height,
      visualWidth: rect.width,
      perimeterHits,
      pseudoBackground: hitSlop.backgroundColor,
      pseudoBorderWidths: [
        hitSlop.borderTopWidth,
        hitSlop.borderRightWidth,
        hitSlop.borderBottomWidth,
        hitSlop.borderLeftWidth,
      ],
      pseudoBoxShadow: hitSlop.boxShadow,
    };
  });
}

async function expectTransparentHitSlop(target: EffectiveTarget): Promise<void> {
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  expect(target.perimeterHits, "all target perimeter points must resolve to the Home progress CTA")
    .toEqual([true, true, true, true]);
}

async function expectFocusVisible(control: Locator, page: Page): Promise<void> {
  await centerForHitTesting(control);
  await control.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(control).toBeFocused();
  const focus = await control.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });
  expect(focus.focusVisible).toBe(true);
  expect(focus.outlineStyle).not.toBe("none");
  expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);
  expect(focus.boxShadow).not.toBe("none");
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

async function expectShellUsesCanvasToken(page: Page) {
  const appearance = await page.locator(".lx-routed-app").evaluate((node) => {
    const styles = getComputedStyle(node);
    const colorProbe = document.createElement("span");
    colorProbe.style.color = styles.getPropertyValue("--ak-color-canvas");
    node.append(colorProbe);
    const canvasColor = getComputedStyle(colorProbe).color;
    colorProbe.remove();

    return {
      backgroundColor: styles.backgroundColor,
      canvasColor,
      routePath: node.getAttribute("data-route-path"),
    };
  });

  expect(appearance.routePath).toBe("/");
  expect(appearance.backgroundColor).toBe(appearance.canvasColor);
}

async function expectExactProcessCreate(
  browser: Browser,
  buttonName: string,
  expectedBody: Record<string, unknown>,
): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const state = await installAPI(page);
    await page.goto("/");
    const button = page.getByRole("button", { name: buttonName, exact: true });
    await expect(button).toBeEnabled();
    await button.click();
    await expect.poll(() => state.lessonCreates.length).toBe(1);
    expect(state.lessonCreates[0]).toEqual(expectedBody);
  } finally {
    await context.close();
  }
}

test.describe("Adaptive Knowledge Coach application shell and Home", () => {
  test("uses a persistent desktop rail and one dominant process-aware Home action", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop geometry is deterministic in Chromium; cross-browser shell coverage lives in adaptive-navigation.spec.ts.");
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
    const nextAction = main.getByRole("region", { name: "Следующее рекомендуемое действие" });

    await expect(rail).toBeVisible();
    await expect(headerNavigation).toBeHidden();
    await expect(mobileNavigation).toBeHidden();
    await expect(main.locator(".lx-home-paths")).toBeHidden();
    await expect(nextAction.locator(".lx-button.primary")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Повторить 15 из 38", exact: true })).toBeVisible();
    const secondary = page.getByRole("group", { name: "Другие доступные учебные процессы" });
    await expect(secondary.getByRole("button", { name: "Разобрать 6 слабых мест", exact: true })).toBeVisible();
    await expect(secondary.getByRole("button", { name: "Изучить 15 новых из 24", exact: true })).toBeVisible();

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

    await expectShellUsesCanvasToken(page);
    await expectNoHorizontalOverflow(page);
  });

  test("uses edge-to-edge mobile navigation and reflows all process actions at 200% text size", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "android-chromium", "Mobile Home geometry is asserted once; iOS and cross-browser navigation remain covered by adaptive-navigation.spec.ts.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark" });
    await installAPI(page);
    await page.goto("/");

    const rail = page.locator('[data-route-navigation="rail"]');
    const mobileNavigation = page.locator('[data-route-navigation="mobile"]');
    const brand = page.locator(".lx-route-brand");
    const primaryCTA = page.getByRole("button", { name: "Повторить 15 из 38", exact: true });
    const processActions = page.getByRole("group", { name: "Другие доступные учебные процессы" });

    await expect(rail).toBeHidden();
    await expect(brand).toBeHidden();
    await expect(mobileNavigation).toBeVisible();
    await expect(page.locator('.lx-main-content[aria-label="Главная"] .lx-home-paths')).toBeHidden();
    await expect(primaryCTA).toBeVisible();
    await expect(processActions).toBeVisible();

    const navigationBox = await boxOrFail(mobileNavigation);
    const ctaBox = await boxOrFail(primaryCTA);
    expect(navigationBox.x).toBeLessThanOrEqual(1);
    expect(navigationBox.width).toBeGreaterThanOrEqual(389);
    expect(navigationBox.y + navigationBox.height).toBeGreaterThanOrEqual(843);
    expect(ctaBox.y + ctaBox.height).toBeLessThan(navigationBox.y);

    await expectShellUsesCanvasToken(page);

    await page.evaluate(() => {
      const style = document.createElement("style");
      style.textContent = ":root { font-size: 200%; }";
      style.nonce = document.querySelector<HTMLElement>("[nonce]")?.nonce ?? "";
      document.head.appendChild(style);
    });
    await expectNoHorizontalOverflow(page);
    for (const button of await processActions.getByRole("button").all()) {
      await expect(button).toBeVisible();
    }
  });

  test("removes optional motion when reduced motion is requested", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Reduced-motion style ownership is asserted once; accessibility audits cover the full project matrix.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await installAPI(page);
    await page.goto("/");

    const primaryCTA = page.getByRole("button", { name: "Повторить 15 из 38", exact: true });
    await expect(primaryCTA).toBeVisible();
    const motion = await primaryCTA.evaluate((node) => ({
      transitionDuration: getComputedStyle(node).transitionDuration,
      animationName: getComputedStyle(node).animationName,
    }));

    expect(motion.transitionDuration).toBe("0s");
    expect(motion.animationName).toBe("none");
  });

  test("sends the exact sessionKind, matching mode and bounded size for every automatic process", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Mutation payload contract is asserted once; presentation remains cross-browser.");

    await expectExactProcessCreate(browser, "Повторить 15 из 38", {
      source: "mixed",
      studyMode: "recall",
      sessionKind: "review",
      lessonSize: "15",
    });
    await expectExactProcessCreate(browser, "Разобрать 6 слабых мест", {
      source: "mixed",
      studyMode: "recall",
      sessionKind: "remediation",
      lessonSize: "15",
    });
    await expectExactProcessCreate(browser, "Изучить 15 новых из 24", {
      source: "mixed",
      studyMode: "study",
      sessionKind: "study",
      lessonSize: "15",
    });
  });

  test("recommendation priority falls from Review to Remediation to Study without cross-process fill", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Deterministic recommendation priority is asserted once in Chromium.");

    const cases: Array<{ backlogs: ProcessBacklogs; button: string }> = [
      { backlogs: { review: 2, remediation: 9, study: 18 }, button: "Повторить 2" },
      { backlogs: { review: 0, remediation: 9, study: 18 }, button: "Разобрать 9 слабых мест" },
      { backlogs: { review: 0, remediation: 0, study: 18 }, button: "Изучить 15 новых из 18" },
    ];

    for (const scenario of cases) {
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await installAPI(page, scenario.backlogs);
        await page.goto("/");
        await expect(page.locator(".lx-button.primary")).toHaveCount(1);
        await expect(page.getByRole("button", { name: scenario.button, exact: true })).toBeVisible();
      } finally {
        await context.close();
      }
    }
  });

  test("Issue #74 Home progress CTA touch target preserves presentation and content separation", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Home progress target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    await page.emulateMedia({ colorScheme: "dark" });
    await installAPI(page);

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const main = page.getByRole("main", { name: "Главная", exact: true });
      const panel = main.locator(".lx-progress-panel");
      const action = panel.getByRole("button", { name: "Открыть прогресс", exact: true });

      await expect(main).toBeVisible();
      await expect(panel).toBeVisible();
      await expect(action).toBeVisible();
      await expect(main.locator(".lx-home-paths")).toBeHidden();
      await centerForHitTesting(action);

      const target = await effectiveTarget(action);
      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));
      const panelBox = await boxOrFail(panel);
      const precedingBottom = await action.evaluate((element) => (
        element.previousElementSibling?.getBoundingClientRect().bottom ?? Number.NEGATIVE_INFINITY
      ));

      expect(target.visualHeight).toBeCloseTo(44, 1);
      expect(target.height).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
      expect(target.width).toBeCloseTo(target.visualWidth, 3);
      expect(target.top).toBeGreaterThanOrEqual(precedingBottom - 0.1);
      expect(target.top).toBeGreaterThanOrEqual(panelBox.y - 0.1);
      expect(target.bottom).toBeLessThanOrEqual(panelBox.y + panelBox.height + 0.1);
      await expectTransparentHitSlop(target);
      await expectFocusVisible(action, page);
      await expectNoHorizontalOverflow(page);
    }
  });
});
