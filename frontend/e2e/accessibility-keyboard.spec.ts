import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000045",
    email: "keyboard@example.com",
    displayName: "Keyboard User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "keyboard-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROGRESS = {
  dueNow: 2,
  dueWords: 1,
  duePhrases: 1,
  totalWords: 2,
  totalPhrases: 2,
  newWords: 2,
  learningWords: 0,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 30,
  currentStreak: 3,
  longestStreak: 5,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
};

const METADATA = {
  catalogVersion: "sha256:keyboard-e2e",
  updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: 4, words: 2, phrases: 2 },
  sources: {
    mixed: 4,
    noun: 1,
    verb: 1,
    adjective: 0,
    phrases: 2,
    dailyLife: 1,
    travel: 1,
    dataEngineering: 1,
    backend: 1,
  },
  topics: [{ topic: "Reliability", count: 2 }],
};

const WORDS = [
  {
    id: 4501,
    kind: "word",
    lemma: "focus",
    translation: "фокус",
    phonetic: "/ˈfəʊkəs/",
    partOfSpeech: "noun",
    topic: "Accessibility",
    examples: ["Keep the focus indicator visible."],
    note: "Keyboard users must always know their position.",
    status: "new",
  },
  {
    id: 4502,
    kind: "word",
    lemma: "navigate",
    translation: "перемещаться",
    phonetic: "/ˈnævɪɡeɪt/",
    partOfSpeech: "verb",
    topic: "Accessibility",
    examples: ["Navigate without a mouse."],
    note: "Use native controls and predictable order.",
    status: "new",
  },
];

const PHRASES = [
  {
    id: 4511,
    kind: "phrase",
    slug: "visible-focus",
    lemma: "Keep focus visible",
    translation: "сохранять фокус видимым",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Reliability",
    examples: ["Keep focus visible in every viewport."],
    note: "Do not rely on hover alone.",
    status: "new",
  },
  {
    id: 4512,
    kind: "phrase",
    slug: "keyboard-only",
    lemma: "Use the keyboard only",
    translation: "использовать только клавиатуру",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Reliability",
    examples: ["Complete the flow using the keyboard only."],
    note: "Enter and Space activate native buttons.",
    status: "new",
  },
];

const KEYBOARD_AXE_RULES = [
  "aria-allowed-attr",
  "aria-conditional-attr",
  "aria-hidden-focus",
  "aria-prohibited-attr",
  "aria-required-attr",
  "aria-required-children",
  "aria-required-parent",
  "aria-roles",
  "aria-valid-attr-value",
  "aria-valid-attr",
  "button-name",
  "focus-order-semantics",
  "html-has-lang",
  "html-lang-valid",
  "label",
  "nested-interactive",
  "scrollable-region-focusable",
  "select-name",
  "tabindex",
  "valid-lang",
];

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installMocks(page: Page) {
  let lessonVersion = 1;
  let reviewCount = 0;
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "keyboard-csrf",
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
      return fulfillJSON(route, 404, { error: { code: "not_found", message: "not found" } });
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") {
      return fulfillJSON(route, 200, { items: PHRASES, count: PHRASES.length });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: WORDS, count: WORDS.length });
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "30",
        composition: {
          total: 2,
          words: 1,
          phrases: 1,
          due: 2,
          new: 0,
          scheduled: 0,
          availableWords: 2,
          availablePhrases: 2,
        },
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as { source: string; studyMode: string; lessonSize: string };
      return fulfillJSON(route, 201, {
        id: "00000000-0000-0000-0000-000000000450",
        source: input.source,
        studyMode: input.studyMode,
        lessonSize: input.lessonSize,
        currentIndex: 0,
        version: lessonVersion,
        status: "active",
        items: [WORDS[0], PHRASES[0]].map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-18T00:00:00Z",
        updatedAt: "2026-07-18T00:00:00Z",
      });
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      reviewCount += 1;
      lessonVersion += 1;
      return fulfillJSON(route, 200, {
        wordId: reviewCount === 1 ? WORDS[0].id : PHRASES[0].id,
        status: "learning",
        easiness: 2.5,
        intervalDays: 1,
        repetitions: reviewCount,
        dueAt: "2026-07-19T00:00:00Z",
        lastReviewedAt: "2026-07-18T00:00:00Z",
        lessonId: "00000000-0000-0000-0000-000000000450",
        lessonCurrentIndex: reviewCount,
        lessonVersion,
        lessonCompleted: reviewCount >= 2,
        lessonReviewedItems: reviewCount,
        lessonSkippedItems: 0,
        lessonTotalItems: 2,
      });
    }

    return fulfillJSON(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

function formatViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string {
  return violations.map((violation) => {
    const targets = violation.nodes.flatMap((node) => node.target).join(", ");
    return `${violation.id}: ${violation.help}\n${targets}`;
  }).join("\n\n");
}

async function expectKeyboardAxeBaseline(page: Page) {
  const result = await new AxeBuilder({ page })
    .withRules(KEYBOARD_AXE_RULES)
    .analyze();
  expect(result.violations, formatViolations(result.violations)).toEqual([]);
}

async function expectVisibleFocusRing(locator: Locator) {
  await expect(locator).toBeFocused();
  const focus = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineStyle: style.outlineStyle,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
    };
  });

  expect(focus.focusVisible).toBe(true);
  expect(focus.outlineWidth).toBeGreaterThanOrEqual(3);
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(focus.boxShadow).not.toBe("none");
}

async function expectNoPositiveTabIndex(page: Page) {
  const positive = await page.locator("[tabindex]").evaluateAll((elements) => elements
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      value: Number(element.getAttribute("tabindex")),
      text: element.textContent?.trim().slice(0, 80) ?? "",
    }))
    .filter((entry) => entry.value > 0));
  expect(positive).toEqual([]);
}

function headerRoute(page: Page, view: "home" | "learn" | "phrases" | "library" | "progress") {
  return page.locator(`[data-route-navigation="header"] [data-navigation-view="${view}"]`);
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const install = () => {
      const style = document.createElement("style");
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }";
      (document.head ?? document.documentElement).append(style);
    };
    if (document.documentElement) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });
  await installMocks(page);
});

test("desktop Tab order is semantic and every header stop has a visible WCAG-sized indicator", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Deterministic desktop Tab-order contract is covered once; cross-browser axe coverage runs separately.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const expected = [
    page.getByRole("link", { name: "Перейти к основному содержимому" }),
    page.locator(".lx-route-brand"),
    headerRoute(page, "home"),
    headerRoute(page, "learn"),
    headerRoute(page, "phrases"),
    headerRoute(page, "library"),
    headerRoute(page, "progress"),
  ];

  for (const target of expected) {
    await page.keyboard.press("Tab");
    await expectVisibleFocusRing(target);
  }

  await expectNoPositiveTabIndex(page);
});

test("primary flows work with native links, Space controls, and a focus-trapped calendar dialog", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Keyboard activation and focus containment use one deterministic desktop profile.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const learnNavigation = headerRoute(page, "learn");
  await expect(learnNavigation).toHaveAttribute("href", "/learn");
  await learnNavigation.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  const recallMode = page.getByRole("radio", { name: /Вспомнить самому/ });
  await recallMode.focus();
  await page.keyboard.press("Space");
  await expect(recallMode).toHaveAttribute("aria-checked", "true");

  const phrasesSource = page.locator('[data-lexigo-source="phrases"]');
  await phrasesSource.focus();
  await page.keyboard.press("Space");
  await expect(phrasesSource).toHaveAttribute("aria-checked", "true");

  const size15 = page.locator(".lx-size-control").getByRole("radio", { name: "15", exact: true });
  await size15.focus();
  await page.keyboard.press("Space");
  await expect(size15).toHaveAttribute("aria-checked", "true");

  const calendarTrigger = page.getByRole("button", { name: "Уведомления" });
  await calendarTrigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(dialog).toBeVisible();
  const title = dialog.getByRole("heading", { name: "Напоминание об английском" });
  const close = dialog.getByRole("button", { name: "Закрыть" });
  const apple = dialog.getByRole("button", { name: /Apple Calendar/ });
  await expect(title).toBeFocused();
  await expectVisibleFocusRing(title);

  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await title.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(apple).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(calendarTrigger).toBeFocused();
});

for (const target of [
  { name: "home", url: "/", heading: /Продолжайте учиться/ },
  { name: "learn", url: "/learn", heading: "Настройте урок под текущую задачу" },
  { name: "phrases", url: "/phrases", heading: "Готовые формулировки для работы" },
  { name: "library", url: "/dictionary", heading: "Каталог слов и терминов" },
  { name: "progress", url: "/progress", heading: "Смотрите, что действительно сохранилось" },
  { name: "profile", url: "/profile", heading: "Keyboard User" },
] as const) {
  test(`axe keyboard baseline: ${target.name}`, async ({ page }) => {
    await page.goto(target.url);
    await expect(page.getByRole("heading", { name: target.heading })).toBeVisible();
    await expectKeyboardAxeBaseline(page);
    await expectNoPositiveTabIndex(page);
  });
}

test("axe keyboard baseline: calendar dialog", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Смотрите, что действительно сохранилось" })).toBeVisible();

  const headerTrigger = page.getByRole("button", { name: "Уведомления" });
  const cardTrigger = page.getByRole("button", { name: "Настроить календарь" });
  if (await headerTrigger.isVisible()) await headerTrigger.click();
  else await cardTrigger.click();

  await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
  await expectKeyboardAxeBaseline(page);
  await expectNoPositiveTabIndex(page);
});

test("lesson tabs remain reachable and expose an unclipped inner focus ring", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Focused lesson geometry is deterministic in the desktop Chromium release profile.");
  await page.goto("/learn");
  await page.getByRole("radio", { name: /Простое изучение слов/ }).press("Space");
  await page.getByRole("button", { name: "Начать урок" }).press("Enter");
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);

  const cardTab = page.getByRole("tab", { name: "Карточка", exact: true });
  await cardTab.focus();
  await page.keyboard.press("ArrowRight");
  const exampleTab = page.getByRole("tab", { name: "Пример", exact: true });
  await expectVisibleFocusRing(exampleTab);
  await expect(exampleTab).toHaveAttribute("aria-selected", "true");

  const innerRing = await exampleTab.evaluate((element) => window.getComputedStyle(element).boxShadow);
  expect(innerRing).toContain("inset");
  await expectKeyboardAxeBaseline(page);
});

test("single-choice controls expose radio semantics and roving keyboard navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Roving focus is deterministic in the desktop Chromium profile.");
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения" });
  const study = modeGroup.getByRole("radio", { name: /Простое изучение слов/ });
  const recall = modeGroup.getByRole("radio", { name: /Вспомнить самому/ });
  await expect(study).toHaveAttribute("aria-checked", "true");
  await study.focus();
  await study.press("ArrowDown");
  await expect(recall).toBeFocused();
  await expect(recall).toHaveAttribute("aria-checked", "true");

  const sourceGroup = page.getByRole("radiogroup", { name: "Раздел обучения" });
  const mixed = sourceGroup.getByRole("radio", { name: /Смешанная практика/ });
  const backend = sourceGroup.getByRole("radio", { name: /Backend Development/ });
  await mixed.focus();
  await mixed.press("End");
  await expect(backend).toBeFocused();
  await expect(backend).toHaveAttribute("aria-checked", "true");
  await backend.press("Home");
  await expect(mixed).toBeFocused();
  await expect(mixed).toHaveAttribute("aria-checked", "true");

  const sizeGroup = page.getByRole("radiogroup", { name: "Размер урока" });
  const size30 = sizeGroup.getByRole("radio", { name: "30", exact: true });
  const size60 = sizeGroup.getByRole("radio", { name: "60", exact: true });
  await size30.focus();
  await size30.press("ArrowRight");
  await expect(size60).toBeFocused();
  await expect(size60).toHaveAttribute("aria-checked", "true");

  await page.goto("/phrases");
  const topicGroup = page.getByRole("radiogroup", { name: "Тема фраз" });
  const allTopics = topicGroup.getByRole("radio", { name: "Все темы" });
  await expect(allTopics).toHaveAttribute("aria-checked", "true");
  await allTopics.focus();
  await allTopics.press("ArrowRight");
  await expect(topicGroup.getByRole("radio").nth(1)).toBeFocused();
  await expect(topicGroup.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");

  await page.goto("/progress");
  const goalGroup = page.getByRole("radiogroup", { name: "Дневная цель" });
  await expect(goalGroup.getByRole("radio", { name: "30", exact: true })).toHaveAttribute("aria-checked", "true");
  await expectNoPositiveTabIndex(page);
});

test("dictionary filters and item cards remain keyboard operable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Native select and deep-link focus flow are asserted once in Chromium.");
  await page.goto("/dictionary");
  await expect(page.getByRole("heading", { name: "Каталог слов и терминов" })).toBeVisible();

  const source = page.getByRole("combobox", { name: "Раздел словаря" });
  await source.focus();
  await source.selectOption("backend");
  await expect(page).toHaveURL(/source=backend/);

  const firstCard = page.getByRole("button", { name: /Открыть карточку:/ }).first();
  await firstCard.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/words\/\d+(?:\?|$)/);
  await expect(page.locator(".lx-dictionary-detail-card h1")).toHaveAttribute("lang", "en");

  const back = page.getByRole("button", { name: "← К результатам" });
  await back.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dictionary\?/);
  await expect(page).toHaveURL(/source=backend/);
  await expect(page.getByRole("list", { name: "Результаты словаря" })).toBeVisible();
  await expectNoPositiveTabIndex(page);
});
