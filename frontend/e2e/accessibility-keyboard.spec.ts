import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: { id: "00000000-0000-0000-0000-000000000045", email: "keyboard@example.com", displayName: "Keyboard User", createdAt: "2026-01-01T00:00:00Z" },
  tokens: { accessToken: "keyboard-access-token", tokenType: "Bearer", expiresIn: 900 },
};
const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const PROGRESS = {
  dueNow: 2, dueWords: 1, duePhrases: 1, totalWords: 1, totalPhrases: 1, newWords: 2, learningWords: 0,
  reviewWords: 0, masteredWords: 0, masteredPhrases: 0, reviewsToday: 0, successfulToday: 0,
  objectiveReviewsToday: 0, objectiveSuccessfulToday: 0, reviewsTotal: 0, dailyGoal: 30, currentStreak: 0,
  longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0, retainedPhrasesWeek: 0, eventSchemaVersion: 2,
  modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
};
const WORDS = [{ id: 451, kind: "word", lemma: "keyboard", translation: "клавиатура", phonetic: "/ˈkiːbɔːrd/", partOfSpeech: "noun", topic: "Accessibility", examples: ["Use the keyboard."], note: "", status: "new" }];
const PHRASES = [{ id: 452, kind: "phrase", slug: "keyboard-access", lemma: "keyboard access", translation: "доступ с клавиатуры", phonetic: "", partOfSpeech: "phrase", topic: "Accessibility", examples: ["Preserve keyboard access."], note: "", cloze: "keyboard ____", clozeAnswer: "access", status: "new" }];
const METADATA = {
  catalogVersion: "sha256:keyboard-e2e", updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: 2, words: 1, phrases: 1 },
  sources: { mixed: 2, noun: 1, verb: 0, adjective: 0, phrases: 1, dailyLife: 0, travel: 0, dataEngineering: 0, backend: 0 },
  topics: [{ topic: "Accessibility", count: 2 }],
};
const KEYBOARD_AXE_RULES = ["button-name", "link-name", "label", "aria-allowed-attr", "aria-valid-attr", "aria-valid-attr-value", "aria-roles", "aria-required-attr", "aria-required-children", "aria-required-parent", "aria-hidden-focus", "nested-interactive"];

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
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
  await expect(page.getByRole("heading", { name: /готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();

  const expected = [
    page.getByRole("link", { name: "Перейти к основному содержимому" }),
    page.locator(".lx-route-brand"),
    headerRoute(page, "home"),
    headerRoute(page, "learn"),
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
  await expect(page.getByRole("heading", { name: /готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();

  const learnNavigation = headerRoute(page, "learn");
  await expect(learnNavigation).toHaveAttribute("href", "/learn");
  await learnNavigation.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();

  const sourceGroup = page.getByRole("radiogroup", { name: "Раздел обучения" });
  const nouns = sourceGroup.getByRole("radio", { name: /Существительные/ });
  await nouns.focus();
  await page.keyboard.press("Space");
  await expect(nouns).toHaveAttribute("aria-checked", "true");

  const sizeGroup = page.getByRole("radiogroup", { name: "Размер урока" });
  const size15 = sizeGroup.getByRole("radio", { name: "15", exact: true });
  await size15.focus();
  await page.keyboard.press("Space");
  await expect(size15).toHaveAttribute("aria-checked", "true");

  const startLesson = page.getByRole("button", { name: "Начать урок" });
  await expect(startLesson).toBeEnabled();
  await startLesson.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
  await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeVisible();

  const known = page.getByRole("button", { name: "Знал", exact: true });
  await known.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Дальше" })).toBeEnabled();
  await page.getByRole("button", { name: "Дальше" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Не знал" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Карточка" })).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Смотрите, что действительно сохранилось" })).toBeVisible();
  const calendarTrigger = page.getByRole("button", { name: "Настроить календарь" });
  await calendarTrigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("heading", { name: "Напоминание об английском" })).toBeVisible();

  const title = dialog.getByRole("heading", { name: "Напоминание об английском" });
  const close = dialog.getByRole("button", { name: "Закрыть" });
  const apple = dialog.getByRole("button", { name: /Apple Calendar/ });
  await expect(title).toBeFocused();
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
  { name: "home", url: "/", heading: /готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ },
  { name: "learn", url: "/learn", heading: "Соберите один сфокусированный урок" },
  { name: "phrases", url: "/phrases", heading: "Находите готовые формулировки" },
  { name: "library", url: "/dictionary", heading: "Находите и изучайте материал в контексте" },
  { name: "progress", url: "/progress", heading: "Смотрите, что действительно сохранилось" },
  { name: "profile", url: "/profile", heading: "Keyboard User" },
] as const) {
  test(`axe keyboard baseline: ${target.name}`, async ({ page }) => {
    await page.goto(target.url);
    await expect(page.getByRole("heading", { level: 1, name: target.heading })).toBeVisible();
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
  await expect(exampleTab).toHaveAttribute("aria-selected", "true");
  await expectVisibleFocusRing(exampleTab);

  const innerRing = await exampleTab.evaluate((element) => window.getComputedStyle(element).boxShadow);
  expect(innerRing).toContain("inset");
  await expectKeyboardAxeBaseline(page);
});

test("single-choice controls expose radio semantics and roving keyboard navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Roving focus is deterministic in the desktop Chromium profile.");
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();

  const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения" });
  const study = modeGroup.getByRole("radio", { name: /Простое изучение слов/ });
  const recall = modeGroup.getByRole("radio", { name: /Вспомнить самому/ });
  await expect(study).toHaveAttribute("aria-checked", "true");
  await study.focus();
  await study.press("ArrowDown");
  await expect(recall).toBeFocused();
  await expect(recall).toHaveAttribute("aria-checked", "true");

  const sizeGroup = page.getByRole("radiogroup", { name: "Размер урока" });
  const size30 = sizeGroup.getByRole("radio", { name: "30", exact: true });
  const size60 = sizeGroup.getByRole("radio", { name: "60", exact: true });
  await expect(size30).toHaveAttribute("aria-checked", "true");
  await size30.focus();
  await size30.press("ArrowRight");
  await expect(size60).toBeFocused();
  await expect(size60).toHaveAttribute("aria-checked", "true");
});
