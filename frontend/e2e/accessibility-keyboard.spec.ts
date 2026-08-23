import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

import { learningTermCopy } from "../lib/interface-copy";

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
  sources: { mixed: 2, noun: 1, verb: 0, adjective: 0, phrases: 1, dailyLife: 0, travel: 0, dataEngineering: 0, backend: 0, academicTechnicalEnglish: 0 },
  topics: [{ topic: "Accessibility", count: 2 }],
};
const KEYBOARD_AXE_RULES = ["button-name", "link-name", "label", "aria-allowed-attr", "aria-valid-attr", "aria-valid-attr-value", "aria-roles", "aria-required-attr", "aria-required-children", "aria-required-parent", "aria-hidden-focus", "nested-interactive"];

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installMocks(page: Page) {
  let lessonVersion = 1;
  let reviewCount = 0;
  let activeLesson: Record<string, unknown> | null = null;
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
      return activeLesson
        ? fulfillJSON(route, 200, activeLesson)
        : fulfillJSON(route, 404, { error: { code: "not_found", message: "not found" } });
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") {
      return fulfillJSON(route, 200, { items: PHRASES, count: PHRASES.length });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: WORDS, count: WORDS.length });
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        sessionKind?: "study" | "review" | "remediation";
        lessonSize?: string;
      };
      const available = input.sessionKind === "review"
        ? PROGRESS.dueNow
        : input.sessionKind === "remediation"
          ? 0
          : PROGRESS.newWords;
      const total = input.sessionKind ? Math.min(15, available) : 2;
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
        lessonSize: input.lessonSize ?? "15",
        composition: {
          total,
          words: total,
          phrases: 0,
          due: input.sessionKind === "review" ? total : 0,
          new: input.sessionKind === "review" || input.sessionKind === "remediation" ? 0 : total,
          scheduled: 0,
          availableWords: available,
          availablePhrases: 0,
        },
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as { source: string; studyMode: string; sessionKind?: "study" | "review" | "remediation"; lessonSize: string };
      activeLesson = {
        id: "00000000-0000-0000-0000-000000000450",
        source: input.source,
        studyMode: input.studyMode,
        ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
        lessonSize: input.lessonSize,
        currentIndex: 0,
        version: lessonVersion,
        status: "active",
        items: [WORDS[0], PHRASES[0]].map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-18T00:00:00Z",
        updatedAt: "2026-07-18T00:00:00Z",
      };
      return fulfillJSON(route, 201, activeLesson);
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      reviewCount += 1;
      lessonVersion += 1;
      if (activeLesson) {
        activeLesson = {
          ...activeLesson,
          currentIndex: reviewCount,
          version: lessonVersion,
          updatedAt: "2026-07-18T00:01:00Z",
        };
      }
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

function visiblePrimaryRoute(page: Page, view: "home" | "learn" | "library" | "progress") {
  return page.locator(`.lx-route-nav [data-navigation-view="${view}"]:visible`);
}

async function openReminderDialogWithKeyboard(page: Page) {
  const reminder = page.locator(".lx-route-reminder-entry");
  const trigger = reminder.locator(":scope > summary");
  await trigger.focus();
  await expectVisibleFocusRing(trigger);
  await page.keyboard.press("Enter");

  const preview = reminder.getByRole("region", { name: "Текущее напоминание о занятии" });
  await expect(preview).toBeVisible();
  const configure = preview.getByRole("button", { name: "Настроить календарь" });
  await configure.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const install = () => {
      const style = document.createElement("style");
      style.nonce = document.querySelector<HTMLElement>("[nonce]")?.nonce ?? "";
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }";
      (document.head ?? document.documentElement).append(style);
    };
    if (document.documentElement) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });
  await installMocks(page);
});

test("desktop Tab order is semantic and every shell stop has a visible WCAG-sized indicator", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Deterministic desktop Tab-order contract is covered once; cross-browser axe coverage runs separately.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();

  const expected = [
    page.getByRole("link", { name: "Перейти к основному содержимому" }),
    page.locator(".lx-route-brand"),
    visiblePrimaryRoute(page, "home"),
    visiblePrimaryRoute(page, "learn"),
    visiblePrimaryRoute(page, "library"),
    visiblePrimaryRoute(page, "progress"),
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
  await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();

  const learnNavigation = visiblePrimaryRoute(page, "learn");
  await expect(learnNavigation).toHaveAttribute("href", "/learn");
  await learnNavigation.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();

  const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения" });
  const study = modeGroup.getByRole("radio", { name: /Простое изучение слов/ });
  await study.focus();
  await page.keyboard.press("Space");
  await expect(study).toHaveAttribute("aria-checked", "true");

  const sourceGroup = page.getByRole("radiogroup", { name: "Раздел обучения" });
  const nouns = sourceGroup.getByRole("radio", { name: /Существительные/ });
  await nouns.focus();
  await page.keyboard.press("Space");
  await expect(nouns).toHaveAttribute("aria-checked", "true");

  const sizeGroup = page.getByRole("radiogroup", { name: "Размер урока" });
  const size15 = sizeGroup.getByRole("radio", { name: "15", exact: true });
  await expect(size15).toHaveAttribute("aria-checked", "true");
  await size15.focus();
  await page.keyboard.press("Space");
  await expect(size15).toHaveAttribute("aria-checked", "true");

  const startLesson = page.getByRole("button", { name: "Начать урок" });
  await expect(startLesson).toBeEnabled();
  await startLesson.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "keyboard" })).toBeVisible();

  const known = page.getByRole("button", { name: "Знал", exact: true });
  await known.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Дальше" })).toBeEnabled();
  await page.getByRole("button", { name: "Дальше" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("progressbar", { name: "Прогресс урока" }))
    .toHaveAttribute("aria-valuetext", "2 из 2 элементов");
  await expect(page.getByRole("heading", { name: "keyboard access" })).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();
  const { trigger: calendarTrigger, dialog } = await openReminderDialogWithKeyboard(page);
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
  { name: "home", url: "/", heading: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ },
  { name: "learn", url: "/learn", heading: "Соберите один сфокусированный урок" },
  { name: "phrases", url: "/phrases", heading: "Находите готовые формулировки" },
  { name: "library", url: "/dictionary", heading: "Словарь" },
  { name: "progress", url: "/progress", heading: "Прогресс" },
  { name: "profile", url: "/profile", heading: "Профиль" },
] as const) {
  test(`axe keyboard baseline: ${target.name}`, async ({ page }) => {
    await page.goto(target.url);
    await expect(page.getByRole("heading", {
      level: 1,
      name: target.heading,
      exact: target.url === "/progress" || target.url === "/dictionary" || target.url === "/profile",
    })).toBeVisible();
    await expectKeyboardAxeBaseline(page);
    await expectNoPositiveTabIndex(page);
  });
}

test("axe keyboard baseline: calendar dialog", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();
  await openReminderDialogWithKeyboard(page);
  await expectKeyboardAxeBaseline(page);
  await expectNoPositiveTabIndex(page);
});

test("focused Study controls remain reachable and expose an unclipped focus ring", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Focused lesson geometry is deterministic in the desktop Chromium release profile.");
  await page.goto("/learn");
  const studyMode = page.getByRole("radio", { name: /Простое изучение слов/ });
  await studyMode.press("Space");
  await expect(studyMode).toHaveAttribute("aria-checked", "true");

  const startLesson = page.getByRole("button", { name: "Начать урок", exact: true });
  await expect(startLesson).toBeEnabled();
  await startLesson.press("Enter");
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);

  const speech = page.getByRole("button", { name: /Произнести: keyboard/ });
  await speech.focus();
  await expectVisibleFocusRing(speech);
  await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeVisible();
  await expectKeyboardAxeBaseline(page);
});

test("single-choice controls expose radio semantics and roving keyboard navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Roving focus is deterministic in the desktop Chromium profile.");
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();

  const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения" });
  const study = modeGroup.getByRole("radio", { name: /Простое изучение слов/ });
  const recall = modeGroup.getByRole("radio", { name: new RegExp(learningTermCopy("recall").label) });
  await expect(recall).toHaveAttribute("aria-checked", "true");
  await recall.focus();
  await recall.press("ArrowUp");
  await expect(study).toBeFocused();
  await expect(study).toHaveAttribute("aria-checked", "true");

  const sizeGroup = page.getByRole("radiogroup", { name: "Размер урока" });
  const size15 = sizeGroup.getByRole("radio", { name: "15", exact: true });
  const size30 = sizeGroup.getByRole("radio", { name: "30", exact: true });
  const size50 = sizeGroup.getByRole("radio", { name: "50", exact: true });
  const sizeAll = sizeGroup.getByRole("radio", { name: "Все", exact: true });
  await expect(sizeGroup.getByRole("radio")).toHaveCount(4);
  await expect(size15).toHaveAttribute("aria-checked", "true");
  await size15.focus();
  await size15.press("ArrowRight");
  await expect(size30).toBeFocused();
  await expect(size30).toHaveAttribute("aria-checked", "true");
  await size30.press("ArrowRight");
  await expect(size50).toBeFocused();
  await expect(size50).toHaveAttribute("aria-checked", "true");
  await size50.press("ArrowRight");
  await expect(sizeAll).toBeFocused();
  await expect(sizeAll).toHaveAttribute("aria-checked", "true");
  await sizeAll.press("ArrowRight");
  await expect(size15).toBeFocused();
  await expect(size15).toHaveAttribute("aria-checked", "true");
});
