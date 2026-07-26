import { createHash } from "node:crypto";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PROGRESS,
} from "./support/quality-gates";
import {
  installActiveLessonFixture,
  openActiveLesson,
} from "./support/active-lesson-fixture";
import {
  completeRecallLesson,
  installLessonResultFixture,
} from "./support/lesson-result-fixture";
import {
  installScenarioFixture,
  startScenario,
} from "./support/scenario-fixture";

type ContentAddressedVisualBaseline = {
  name: string;
  width: number;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
};

const SCENARIO_VISUAL_BASELINES = {
  compactLight: {
    name: "scenario-lessons-compact-light.png",
    width: 390,
    height: 1792,
    sha256: "85a674882de19c87bc92d4b06888d7dc91471726a9916a943d4592bbd7919aab",
    sourceRun: 30169218809,
    sourceHeadSha: "79957603bdd358220d6e045bab00207633999aaf",
  },
  desktopDark: {
    name: "scenario-lessons-desktop-dark.png",
    width: 1440,
    height: 1054,
    sha256: "eaad352ced6e94a639014af3ea9a01c5bd20ec335857fe21a5d2cec93af4da40",
    sourceRun: 30171478706,
    sourceHeadSha: "c0c0f74e001b5ae248b5d88d1fdb8dac041ea2f0",
  },
} satisfies Record<string, ContentAddressedVisualBaseline>;

const SCENARIO_CATALOG_VISUAL_BASELINES = {
  compactLight: {
    name: "scenario-catalog-compact-light.png",
    width: 390,
    height: 1876,
    sha256: "6d6412fabb2e1b9d5b146da4609da35b7544252d9ab04bd4a8ae3c6e45d26508",
    sourceRun: 30181864359,
    sourceHeadSha: "e608d6f58135d689e06cd49735c6a05bec82c1a3",
  },
  compactDark: {
    name: "scenario-catalog-compact-dark.png",
    width: 390,
    height: 1876,
    sha256: "fa874501b7c1a9f66b868c350f607bec444ab12255a18a108f990295a525a47a",
    sourceRun: 30181864359,
    sourceHeadSha: "e608d6f58135d689e06cd49735c6a05bec82c1a3",
  },
  desktopLight: {
    name: "scenario-catalog-desktop-light.png",
    width: 1440,
    height: 981,
    sha256: "350597de5f363c687c821223b88d86849a62bf51f17b2483c300455fb717ae8a",
    sourceRun: 30181864359,
    sourceHeadSha: "e608d6f58135d689e06cd49735c6a05bec82c1a3",
  },
} satisfies Record<string, ContentAddressedVisualBaseline>;

const LESSON_COMPOSER_VISUAL_BASELINES = {
  compact: {
    name: "lesson-composer-compact.png",
    width: 390,
    height: 1212,
    sha256: "8cbc1f01bb7079ca0a83b785db2e42be205489edd2dec48a7e40e5b915f20fb9",
    sourceRun: 30181864359,
    sourceHeadSha: "e608d6f58135d689e06cd49735c6a05bec82c1a3",
  },
  medium: {
    name: "lesson-composer-medium.png",
    width: 768,
    height: 6154,
    sha256: "4acb9301f3837fb235670c6841c281eb732488701566a84db3b406eaac422812",
    sourceRun: 30181864359,
    sourceHeadSha: "e608d6f58135d689e06cd49735c6a05bec82c1a3",
  },
  desktop: {
    name: "lesson-composer-desktop.png",
    width: 1440,
    height: 1656,
    sha256: "3be9635dd17bf578adb48cfcbae812c46fe3714969574e5b9a6627b82b7d4088",
    sourceRun: 30183186758,
    sourceHeadSha: "623a143a5e4f988606a723efdac66fbd3e43953d",
  },
} satisfies Record<string, ContentAddressedVisualBaseline>;

const BASELINE_PROGRESS: Record<string, unknown> = { ...QUALITY_PROGRESS };
delete BASELINE_PROGRESS.scenarios;

async function expectLearningSwitchClearOfRouteChrome(page: Page): Promise<void> {
  const intersections = await page.evaluate(() => {
    const subsection = document.querySelector<HTMLElement>(".lx-learning-section-switch--learn");
    if (!subsection) return ["missing Learning subsection switch"];

    const subsectionRect = subsection.getBoundingClientRect();
    const selectors = [
      ".lx-route-brand",
      ".lx-route-nav--header",
      ".lx-route-nav--rail",
      ".lx-route-reminder-entry",
    ];

    return selectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const overlapWidth = Math.min(subsectionRect.right, rect.right)
          - Math.max(subsectionRect.left, rect.left);
        const overlapHeight = Math.min(subsectionRect.bottom, rect.bottom)
          - Math.max(subsectionRect.top, rect.top);
        return overlapWidth > 1 && overlapHeight > 1;
      })
      .map((element) => element.className);
  });

  expect(intersections, "Learning subsection switch must not overlap visible route chrome").toEqual([]);
}

async function prepareStableScreenshot(page: Page): Promise<void> {
  const dimensions = await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });

    const root = document.documentElement;
    return {
      viewportWidth: root.clientWidth,
      contentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
    };
  });

  expect(
    dimensions.contentWidth,
    `Страница не должна иметь горизонтальный overflow: viewport=${dimensions.viewportWidth}px, content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);

  await page.waitForTimeout(100);
}

async function expectStableScreenshot(page: Page, name: string): Promise<void> {
  await prepareStableScreenshot(page);
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
  });
}

async function expectContentAddressedScreenshot(
  page: Page,
  baseline: ContentAddressedVisualBaseline,
): Promise<void> {
  await prepareStableScreenshot(page);
  const screenshot = await page.screenshot({ fullPage: true });
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };
  const expected = {
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  };

  if (
    actual.width !== expected.width
    || actual.height !== expected.height
    || actual.sha256 !== expected.sha256
  ) {
    await test.info().attach(baseline.name, {
      body: screenshot,
      contentType: "image/png",
    });
  }

  expect(
    actual,
    `${baseline.name}: Linux baseline from CI ${baseline.sourceRun} at ${baseline.sourceHeadSha}`,
  ).toEqual(expected);
}

async function openCalendarDialog(page: Page): Promise<void> {
  const reminder = page.locator(".lx-route-reminder-entry");
  const disclosure = reminder.locator(":scope > summary");
  await expect(disclosure).toBeVisible();
  await disclosure.click();

  const preview = reminder.getByRole("region", { name: "Текущее напоминание о занятии" });
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "Настроить календарь" }).click();
  await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
}

async function fillScenarioIncidentDraft(page: Page): Promise<void> {
  await page.getByRole("textbox", { name: "Рабочая формулировка на английском" }).fill(
    "The impact is confirmed for delayed ingestion jobs, and the team will publish another update at 17:00 UTC.",
  );
  await page.getByRole("textbox", { name: "Подтверждённые факты — по одному на строку" }).fill(
    "Ingestion jobs are delayed\nThe customer-facing impact is confirmed",
  );
  await page.getByRole("textbox", { name: "Текущие гипотезы — по одной на строку" }).fill(
    "A saturated consumer may be increasing queue depth",
  );
}

async function openScenarioCatalog(page: Page, context: BrowserContext): Promise<void> {
  await context.unroute("**/api/v1/**");
  await installQualityGateAPI(context);
  await page.goto("/scenarios", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Рабочие сценарии" })).toBeVisible();
  await expect(page.locator("[data-scenario-catalog-order]")).toBeVisible();
}

test.describe("critical visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context, { progress: BASELINE_PROGRESS });
  });

  test("home", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();
    await expectStableScreenshot(page, "home.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson composer", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
    await expectLearningSwitchClearOfRouteChrome(page);

    const viewportWidth = page.viewportSize()?.width;
    const baseline = viewportWidth === 390
      ? LESSON_COMPOSER_VISUAL_BASELINES.compact
      : viewportWidth === 768
        ? LESSON_COMPOSER_VISUAL_BASELINES.medium
        : LESSON_COMPOSER_VISUAL_BASELINES.desktop;
    await expectContentAddressedScreenshot(page, baseline);
    expect(runtimeErrors).toEqual([]);
  });

  test("dictionary", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Открыть карточку: rollback" })).toBeVisible();
    await expectStableScreenshot(page, "dictionary.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("progress", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".lx-progress-evidence").getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await expectStableScreenshot(page, "progress.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("Scenario catalog compact Light", async ({ context, page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact Scenario catalog baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await openScenarioCatalog(page, context);
    await expectContentAddressedScreenshot(page, SCENARIO_CATALOG_VISUAL_BASELINES.compactLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("Scenario catalog compact Dark", async ({ context, page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact dark Scenario catalog baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openScenarioCatalog(page, context);
    await expectContentAddressedScreenshot(page, SCENARIO_CATALOG_VISUAL_BASELINES.compactDark);
    expect(runtimeErrors).toEqual([]);
  });

  test("Scenario catalog desktop Light", async ({ context, page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop Scenario catalog baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await openScenarioCatalog(page, context);
    await expectContentAddressedScreenshot(page, SCENARIO_CATALOG_VISUAL_BASELINES.desktopLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("calendar dialog", async ({ page }) => {
    const runtimeErrors = captureRuntimeErrors(page);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".lx-progress-evidence").getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await openCalendarDialog(page);
    await expectStableScreenshot(page, "calendar-dialog.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson compact Recall default", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installActiveLessonFixture(page, "recall");
    await openActiveLesson(page);
    await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-state", "prompt");
    await expectStableScreenshot(page, "active-lesson-recall-default.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson medium Choice incorrect", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 768, "medium baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installActiveLessonFixture(page, "choice");
    await openActiveLesson(page);
    await page.getByRole("button", { name: "checkpoint", exact: true }).click();
    await page.getByRole("button", { name: "Не знал" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ответ не принят" })).toBeVisible();
    await expectStableScreenshot(page, "active-lesson-choice-incorrect.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson desktop Study", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installActiveLessonFixture(page, "study");
    await openActiveLesson(page);
    await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-mode", "study");
    await expectStableScreenshot(page, "active-lesson-study.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("active lesson desktop Recall correct Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop dark baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installActiveLessonFixture(page, "recall");
    await openActiveLesson(page);
    await page.getByRole("textbox", { name: "Введите ответ" }).fill("backlog");
    await page.getByRole("button", { name: "Сверить ответ" }).click();
    await page.getByRole("button", { name: "Знал", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ответ принят" })).toBeVisible();
    await expectStableScreenshot(page, "active-lesson-recall-correct-dark.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("Scenario compact Light active draft", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact Scenario baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installScenarioFixture(page);
    await startScenario(page);
    await fillScenarioIncidentDraft(page);
    await expect(page.locator(".lx-scenario")).toHaveAttribute("data-scenario-state", "active");
    await expectContentAddressedScreenshot(page, SCENARIO_VISUAL_BASELINES.compactLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("Scenario desktop Dark objective feedback", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop dark Scenario baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installScenarioFixture(page);
    await startScenario(page);
    await fillScenarioIncidentDraft(page);
    await page.getByRole("button", { name: "Отправить ответ", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Шаг принят сервером" })).toContainText("Языковая цель использована");
    await expect(page.locator(".lx-scenario")).toHaveAttribute("data-scenario-state", "feedback");
    await expectContentAddressedScreenshot(page, SCENARIO_VISUAL_BASELINES.desktopDark);
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson result compact Next Block", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact result baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installLessonResultFixture(page, { previewTotal: 1 });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "next");
    await expectStableScreenshot(page, "lesson-result-next-compact.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson result desktop Due Review", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop result baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await installLessonResultFixture(page, { previewTotal: 0, dueNow: 6 });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "due");
    await expectStableScreenshot(page, "lesson-result-due-desktop.png");
    expect(runtimeErrors).toEqual([]);
  });

  test("lesson result desktop Daily Goal Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop dark result baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installLessonResultFixture(page, {
      previewTotal: 1,
      reviewsBefore: 14,
      reviewsAfter: 15,
      dailyGoal: 15,
    });
    await completeRecallLesson(page);
    await expect(page.locator(".lx-lesson-result")).toHaveAttribute("data-lesson-result-state", "daily-goal");
    await expectStableScreenshot(page, "lesson-result-daily-goal-dark-desktop.png");
    expect(runtimeErrors).toEqual([]);
  });
});
