import { expect, test, type Page } from "@playwright/test";

import {
  installActiveLessonFixture,
  openActiveLesson,
  type ActiveLessonMode,
} from "./support/active-lesson-fixture";

type ExplicitAppearance = "light" | "dark";
type CanonicalActiveLessonState =
  | "recall-default"
  | "recall-correct"
  | "choice-incorrect"
  | "study";

type CanonicalActiveLessonCase = {
  name: string;
  width: number;
  height: number;
  appearance: ExplicitAppearance;
  mode: ActiveLessonMode;
  state: CanonicalActiveLessonState;
  canvas: string;
  figmaNode: string;
  designContract: string;
};

const CANONICAL_ACTIVE_LESSON_CASES: readonly CanonicalActiveLessonCase[] = [
  {
    name: "mobile Recall default Light",
    width: 390,
    height: 844,
    appearance: "light",
    mode: "recall",
    state: "recall-default",
    canvas: "#f4f7f5",
    figmaNode: "75:6",
    designContract: "Figma 75:6 — Mobile / Recall / Default",
  },
  {
    name: "mobile Recall default Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    mode: "recall",
    state: "recall-default",
    canvas: "#10211d",
    figmaNode: "75:6",
    designContract: "Figma 75:6 geometry + explicit Dark tokens",
  },
  {
    name: "mobile Recall correct Light",
    width: 390,
    height: 844,
    appearance: "light",
    mode: "recall",
    state: "recall-correct",
    canvas: "#f4f7f5",
    figmaNode: "75:30",
    designContract: "Figma 75:30 — Mobile / Recall / Correct",
  },
  {
    name: "mobile Recall correct Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    mode: "recall",
    state: "recall-correct",
    canvas: "#10211d",
    figmaNode: "75:30",
    designContract: "Figma 75:30 geometry + explicit Dark tokens",
  },
  {
    name: "mobile Choice incorrect Light",
    width: 390,
    height: 844,
    appearance: "light",
    mode: "choice",
    state: "choice-incorrect",
    canvas: "#f4f7f5",
    figmaNode: "75:89",
    designContract: "Figma 75:89 — Mobile / Choice / Incorrect",
  },
  {
    name: "mobile Choice incorrect Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    mode: "choice",
    state: "choice-incorrect",
    canvas: "#10211d",
    figmaNode: "75:89",
    designContract: "Figma 75:89 geometry + explicit Dark tokens",
  },
  {
    name: "desktop Study Light",
    width: 1440,
    height: 1024,
    appearance: "light",
    mode: "study",
    state: "study",
    canvas: "#f4f7f5",
    figmaNode: "75:120",
    designContract: "Figma 75:120 — Desktop / Study / Light",
  },
  {
    name: "desktop Study Dark",
    width: 1440,
    height: 1024,
    appearance: "dark",
    mode: "study",
    state: "study",
    canvas: "#10211d",
    figmaNode: "75:120",
    designContract: "Figma 75:120 geometry + explicit Dark tokens",
  },
  {
    name: "desktop Recall correct Light",
    width: 1440,
    height: 1024,
    appearance: "light",
    mode: "recall",
    state: "recall-correct",
    canvas: "#f4f7f5",
    figmaNode: "75:150",
    designContract: "Figma 75:150 — Desktop / Recall / Correct",
  },
  {
    name: "desktop Recall correct Dark",
    width: 1440,
    height: 1024,
    appearance: "dark",
    mode: "recall",
    state: "recall-correct",
    canvas: "#10211d",
    figmaNode: "75:150",
    designContract: "Figma 75:150 geometry + explicit Dark tokens",
  },
] as const;

function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1440) < 768;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.document,
    `horizontal overflow: viewport=${dimensions.viewport}px, document=${dimensions.document}px`,
  ).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function openMode(page: Page, mode: ActiveLessonMode) {
  const fixture = await installActiveLessonFixture(page, mode);
  await openActiveLesson(page);
  await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-mode", mode);
  return fixture;
}

async function reachCanonicalActiveLessonState(
  page: Page,
  canonicalCase: CanonicalActiveLessonCase,
): Promise<void> {
  await openMode(page, canonicalCase.mode);

  if (canonicalCase.state === "recall-correct") {
    const answer = page.getByRole("textbox", { name: "Введите ответ" });
    await answer.fill("backlog");
    await answer.press("Enter");
    await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ответ принят" })).toBeVisible();
  } else if (canonicalCase.state === "choice-incorrect") {
    await page.getByRole("button", { name: "checkpoint", exact: true }).click();
    await expect(page.getByRole("button", { name: "Не знал" })).toBeEnabled();
    await page.getByRole("button", { name: "Не знал" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ответ не принят" })).toBeVisible();
  }
}

async function expectCanonicalActiveLessonState(
  page: Page,
  canonicalCase: CanonicalActiveLessonCase,
): Promise<void> {
  if (canonicalCase.state === "recall-default") {
    await expect(page.getByRole("textbox", { name: "Введите ответ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Сверить ответ" })).toBeDisabled();
  } else if (canonicalCase.state === "recall-correct") {
    await expect(page.getByRole("status").filter({ hasText: "Ответ принят" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Дальше" })).toBeVisible();
  } else if (canonicalCase.state === "choice-incorrect") {
    await expect(page.getByRole("status").filter({ hasText: "Ответ не принят" })).toBeVisible();
    await expect(page.getByRole("button", { name: "checkpoint: выбран неверно" })).toBeVisible();
    await expect(page.getByRole("button", { name: "backlog: верный вариант" })).toBeVisible();
  } else {
    await expect(page.getByText("Изучение", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "The pipeline is delayed by a backlog in the ingestion stage.",
      }),
    ).toBeVisible();
  }
}

async function expectCanonicalActiveLessonGeometry(
  page: Page,
  canonicalCase: CanonicalActiveLessonCase,
): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    const island = document.querySelector<HTMLElement>('[data-route-client-island="active-lesson"]');
    const focusMode = document.querySelector<HTMLElement>(".lx-app.lx-lesson-focus-mode");
    const lesson = document.querySelector<HTMLElement>(".lx-active-lesson");

    if (!main || !island || !focusMode || !lesson) {
      throw new Error("Active Lesson canonical geometry owner is not mounted");
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
          display: style.display,
          visibility: style.visibility,
          box: rect(node),
        };
      })
      .filter(
        (item) =>
          item.display !== "none" &&
          item.visibility !== "hidden" &&
          item.box.width > 0 &&
          item.box.height > 0,
      );

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth ?? 0,
      canvas: window.getComputedStyle(root).getPropertyValue("--ak-color-canvas").trim(),
      main: rect(main),
      island: rect(island),
      focusMode: rect(focusMode),
      lesson: rect(lesson),
      visibleNavigation,
    };
  });

  expect(geometry.innerWidth).toBe(canonicalCase.width);
  expect(geometry.innerHeight).toBe(canonicalCase.height);
  expect(geometry.canvas).toBe(canonicalCase.canvas);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.visibleNavigation).toHaveLength(0);

  for (const owner of [geometry.main, geometry.island, geometry.focusMode, geometry.lesson]) {
    expect(owner.width).toBeGreaterThan(0);
    expect(owner.left).toBeGreaterThanOrEqual(-1);
    expect(owner.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }
}

test.describe("Issue #193 canonical Active Lesson", () => {
  test.describe.configure({ timeout: 60_000 });

  test("mobile Recall default follows the canonical prompt hierarchy", async ({ page }) => {
    test.skip(!isMobile(page), "mobile canonical state");
    await openMode(page, "recall");

    await expect(page.getByText("Воспроизведение", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Прогресс урока" })).toHaveAttribute("aria-valuetext", "1 из 3 элементов");
    await expect(page.getByRole("textbox", { name: "Введите ответ" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Варианты ответа" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Сверить ответ" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Не знал" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Почти" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeDisabled();
    await expect(page.locator(".lx-active-lesson__primary")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });

  test("keyboard Recall preserves objective answer and server review contracts", async ({ page }) => {
    const fixture = await openMode(page, "recall");
    const answer = page.getByRole("textbox", { name: "Введите ответ" });

    await answer.focus();
    await answer.fill("backlog");
    await answer.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ подготовлен" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeEnabled();

    await page.getByRole("button", { name: "Знал", exact: true }).focus();
    await page.getByRole("button", { name: "Знал", exact: true }).press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ принят" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Дальше" })).toBeFocused();

    await expect.poll(() => fixture.reviewRequests().length).toBe(1);
    expect(fixture.reviewRequests()[0]).toMatchObject({
      lessonVersion: 1,
      rating: "known",
      answerMode: "recall",
      answerRevealed: true,
      submittedAnswer: "backlog",
    });
  });

  test("Choice shows options immediately and announces incorrect/correct states beyond color", async ({ page }) => {
    const fixture = await openMode(page, "choice");

    await expect(page.getByRole("textbox", { name: "Введите ответ" })).toHaveCount(0);
    const choices = page.getByRole("group", { name: "Варианты ответа" }).getByRole("button");
    await expect(choices).toHaveCount(3);

    const wrong = page.getByRole("button", { name: "checkpoint", exact: true });
    await wrong.focus();
    await wrong.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ подготовлен" })).toBeFocused();

    await page.getByRole("button", { name: "Не знал" }).focus();
    await page.getByRole("button", { name: "Не знал" }).press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Ответ не принят" })).toBeVisible();
    await expect(page.getByRole("button", { name: "checkpoint: выбран неверно" })).toBeVisible();
    await expect(page.getByRole("button", { name: "backlog: верный вариант" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Дальше" })).toBeFocused();

    expect(fixture.reviewRequests()[0]).toMatchObject({
      answerMode: "choice",
      answerRevealed: true,
      submittedAnswer: "checkpoint",
    });
  });

  test("desktop Study is explicit exposure and never submits an objective answer", async ({ page }) => {
    test.skip(isMobile(page), "desktop canonical Study frame");
    const fixture = await openMode(page, "study");

    await expect(page.getByText("Изучение", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The pipeline is delayed by a backlog in the ingestion stage." })).toBeVisible();
    await expect(page.getByText("Пайплайн задерживается из-за очереди на этапе загрузки.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeEnabled();

    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Изучение готово к сохранению" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Дальше" })).toBeVisible();

    const request = fixture.reviewRequests()[0];
    expect(request).toMatchObject({
      answerMode: "study",
      answerRevealed: true,
      rating: "known",
    });
    expect(request).not.toHaveProperty("submittedAnswer");
  });

  test("safe exit explains persistence and restores focus after cancellation", async ({ page }) => {
    await openMode(page, "recall");
    const exitTrigger = isMobile(page)
      ? page.getByRole("button", { name: "Закрыть", exact: true })
      : page.getByRole("button", { name: "Закрыть урок" });

    await exitTrigger.focus();
    await exitTrigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Закрыть урок?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Несохранённый ответ текущей карточки будет сброшен");
    await expect(page.getByRole("button", { name: "Продолжить урок", exact: true })).toBeFocused();

    await page.getByRole("button", { name: "Продолжить урок", exact: true }).press("Escape");
    await expect(dialog).toBeHidden();
    await expect(exitTrigger).toBeFocused();

    await exitTrigger.click();
    await page.getByRole("dialog", { name: "Закрыть урок?" })
      .getByRole("button", { name: "Сохранить и выйти", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".lx-active-lesson")).toHaveCount(0);
  });

  test("direct entry and reload restore the active server session without Home or Learn", async ({ page }) => {
    const fixture = await installActiveLessonFixture(page, "recall");
    await page.goto("/lesson/active", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Продолжить урок", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Продолжить урок", exact: true }).click();
    await expect(page.locator(".lx-active-lesson")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Продолжить урок", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Продолжить урок", exact: true }).click();
    await expect(page.locator(".lx-active-lesson")).toBeVisible();
    await expect.poll(fixture.activeRequests).toBeGreaterThanOrEqual(4);
    expect(fixture.reviewRequests()).toEqual([]);
  });

  test("browser Back opens safe exit instead of navigating or duplicating a submit", async ({ page }) => {
    const fixture = await openMode(page, "recall");
    await page.evaluate(() => {
      const activeState = window.history.state;
      const learnState = {
        lexigo: true,
        version: 1,
        target: { view: "learn" },
        scroll: { x: 0, y: 0 },
      };

      // Next.js patches the instance methods to synchronize App Router state.
      // Use the native prototype methods only to seed the adjacent entries;
      // the actual Browser Back below remains a real browser traversal.
      History.prototype.replaceState.call(window.history, learnState, "", "/learn");
      History.prototype.pushState.call(window.history, activeState, "", "/lesson/active");
    });
    await expect(page).toHaveURL(/\/lesson\/active$/);
    await expect(page.locator(".lx-active-lesson")).toBeVisible();

    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/lesson/active");
    await expect(page.getByRole("dialog", { name: "Закрыть урок?" })).toBeVisible();
    expect(fixture.reviewRequests()).toEqual([]);
  });

  test("minimum width and 200% page zoom do not introduce horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openMode(page, "recall");
    await page.evaluate(() => {
      document.body.style.setProperty("zoom", "2");
    });
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("textbox", { name: "Введите ответ" })).toBeVisible();
  });

  test("Dark appearance and reduced motion resolve through semantic tokens", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openMode(page, "recall");

    const styles = await page.locator(".lx-active-lesson").evaluate((element) => {
      const root = getComputedStyle(document.documentElement);
      const progress = getComputedStyle(element.querySelector(".lx-active-lesson__progress-track > span") as Element);
      return {
        canvas: getComputedStyle(element).backgroundColor,
        tokenCanvas: root.getPropertyValue("--ak-color-canvas").trim(),
        transitionDuration: progress.transitionDuration,
      };
    });
    expect(styles.tokenCanvas).toBe("#10211d");
    expect(styles.canvas).toBe("rgb(16, 33, 29)");
    expect(Number.parseFloat(styles.transitionDuration)).toBeLessThanOrEqual(0.00001);
  });
});

test.describe("Issue #528 canonical Active Lesson Figma parity contract", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const canonicalCase of CANONICAL_ACTIVE_LESSON_CASES) {
    test(`${canonicalCase.name} uses canonical focus-mode ownership (${canonicalCase.designContract})`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop-chromium",
        "Canonical Active Lesson Figma parity is measured once in Chromium; existing behavior, browser-owned zoom, reduced-motion, touch and accessibility gates remain independent.",
      );

      testInfo.annotations.push({
        type: "figma",
        description: `${canonicalCase.figmaNode}: ${canonicalCase.designContract}`,
      });

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installAppearance(page, canonicalCase.appearance);
      await reachCanonicalActiveLessonState(page, canonicalCase);

      await expect(page).toHaveURL((url) => url.pathname === "/lesson/active" && url.search === "");
      await expect(page.locator('[data-route-client-island="active-lesson"]')).toBeVisible();
      await expect(page.locator(".lx-app.lx-lesson-focus-mode")).toBeVisible();
      await expect(page.locator("#lexigo-main-content")).toBeVisible();
      await expect(page.locator(".lx-active-lesson")).toHaveAttribute(
        "data-active-lesson-mode",
        canonicalCase.mode,
      );
      await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", canonicalCase.appearance);
      await expect(page.locator("html")).toHaveAttribute(
        "data-lexigo-resolved-appearance",
        canonicalCase.appearance,
      );

      await expectCanonicalActiveLessonState(page, canonicalCase);
      await expectCanonicalActiveLessonGeometry(page, canonicalCase);
    });
  }
});
