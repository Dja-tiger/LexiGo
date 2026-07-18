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
  "aria-hidden-focus",
  "button-name",
  "focus-order-semantics",
  "label",
  "nested-interactive",
  "scrollable-region-focusable",
  "select-name",
  "tabindex",
];

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installMocks(page: Page) {
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

    if (path === "/api/v1/auth/refresh") {
      await fulfillJSON(route, 200, SESSION);
      return;
    }
    if (path === "/api/v1/catalog/metadata") {
      await fulfillJSON(route, 200, METADATA);
      return;
    }
    if (path === "/api/v1/progress") {
      await fulfillJSON(route, 200, PROGRESS);
      return;
    }
    if (path === "/api/v1/lessons/active") {
      await fulfillJSON(route, 404, { error: { code: "not_found", message: "not found" } });
      return;
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") {
      await fulfillJSON(route, 200, { items: PHRASES, count: PHRASES.length });
      return;
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      await fulfillJSON(route, 200, { items: WORDS, count: WORDS.length });
      return;
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      await fulfillJSON(route, 200, {
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
      return;
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as { source: string; studyMode: string; lessonSize: string };
      await fulfillJSON(route, 201, {
        id: "00000000-0000-0000-0000-000000000450",
        source: input.source,
        studyMode: input.studyMode,
        lessonSize: input.lessonSize,
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [WORDS[0], PHRASES[0]].map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-18T00:00:00Z",
        updatedAt: "2026-07-18T00:00:00Z",
      });
      return;
    }

    await fulfillJSON(route, 404, { error: { code: "not_mocked", message: path } });
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
    page.locator(".lx-brand"),
    page.locator(".lx-nav").getByRole("button", { name: "Главная", exact: true }),
    page.locator(".lx-nav").getByRole("button", { name: "Обучение", exact: true }),
    page.locator(".lx-nav").getByRole("button", { name: "Фразы", exact: true }),
    page.locator(".lx-nav").getByRole("button", { name: "Словарь", exact: true }),
    page.locator(".lx-nav").getByRole("button", { name: "Прогресс", exact: true }),
  ];

  for (const target of expected) {
    await page.keyboard.press("Tab");
    await expectVisibleFocusRing(target);
  }

  await expectNoPositiveTabIndex(page);
});

test("primary flows work with Enter and Space and the calendar dialog contains and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Keyboard activation and focus containment use one deterministic desktop profile.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const learnNavigation = page.locator(".lx-nav").getByRole("button", { name: "Обучение", exact: true });
  await learnNavigation.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/view=learn/);
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  const recallMode = page.getByRole("button", { name: /Вспомнить самому/ });
  await recallMode.focus();
  await page.keyboard.press("Space");
  await expect(recallMode).toHaveClass(/selected/);

  const phrasesSource = page.locator('[data-lexigo-source="phrases"]');
  await phrasesSource.focus();
  await page.keyboard.press("Space");
  await expect(phrasesSource).toHaveAttribute("aria-pressed", "true");

  const size15 = page.locator(".lx-size-control").getByRole("button", { name: "15", exact: true });
  await size15.focus();
  await page.keyboard.press("Space");
  await expect(size15).toHaveClass(/selected/);

  const calendarTrigger = page.getByRole("button", { name: "Уведомления" });
  await calendarTrigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole("button", { name: "Закрыть" });
  const apple = dialog.getByRole("button", { name: /Apple Calendar/ });
  await expect(close).toBeFocused();
  await expectVisibleFocusRing(close);

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
  { name: "learn", url: "/?view=learn", heading: "Настройте урок под текущую задачу" },
  { name: "phrases", url: "/?view=phrases", heading: "Готовые формулировки для работы" },
  { name: "library", url: "/?view=library", heading: "Материалы, организованные по учебной задаче" },
  { name: "progress", url: "/?view=progress", heading: "Смотрите, что действительно сохранилось" },
  { name: "profile", url: "/?view=profile", heading: "Keyboard User" },
] as const) {
  test(`axe keyboard baseline: ${target.name}`, async ({ page }) => {
    await page.goto(target.url);
    await expect(page.getByRole("heading", { name: target.heading })).toBeVisible();
    await expectKeyboardAxeBaseline(page);
    await expectNoPositiveTabIndex(page);
  });
}

test("axe keyboard baseline: calendar dialog", async ({ page }) => {
  await page.goto("/?view=progress");
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
  await page.goto("/?view=learn");
  await page.getByRole("button", { name: /Простое изучение слов/ }).press("Space");
  await page.getByRole("button", { name: "Начать урок" }).press("Enter");
  await expect(page).toHaveURL(/view=lesson/);

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
