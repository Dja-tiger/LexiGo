import { resolve } from "node:path";

import {
  chromium,
  expect,
  test,
  type CDPSession,
  type Locator,
  type Page,
  type Worker,
} from "@playwright/test";

import {
  installActiveLessonFixture,
  openActiveLesson,
} from "./support/active-lesson-fixture";
import {
  captureRuntimeErrors,
  installDeterministicRuntime,
} from "./support/quality-gates";

type BrowserZoomResult = {
  tabId: number;
  url: string;
  previousZoom: number;
  zoom: number;
  mode: string | null;
  scope: string | null;
};

type BrowserLayoutMetrics = {
  cssLayoutViewport: {
    clientWidth: number;
    clientHeight: number;
  };
  cssVisualViewport: {
    clientWidth: number;
    clientHeight: number;
    scale: number;
    zoom: number;
  };
};

type DOMZoomMetrics = {
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  documentWidth: number;
  bodyWidth: number;
  rootFontSize: number;
  visualViewportScale: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

async function setBrowserZoom(
  worker: Worker,
  targetURL: string,
  zoomFactor: number,
): Promise<BrowserZoomResult> {
  return worker.evaluate(async ({ targetURL: exactTargetURL, zoomFactor: exactZoomFactor }) => {
    type ZoomController = {
      setZoomForURL: (url: string, factor: number) => Promise<BrowserZoomResult>;
    };
    const controller = (
      globalThis as typeof globalThis & { lexigoBrowserZoomController?: ZoomController }
    ).lexigoBrowserZoomController;

    if (!controller) {
      throw new Error("LexiGo browser zoom extension controller is unavailable.");
    }

    return controller.setZoomForURL(exactTargetURL, exactZoomFactor);
  }, { targetURL, zoomFactor });
}

async function readBrowserLayoutMetrics(cdp: CDPSession): Promise<BrowserLayoutMetrics> {
  return await cdp.send("Page.getLayoutMetrics") as BrowserLayoutMetrics;
}

async function readDOMZoomMetrics(page: Page): Promise<DOMZoomMetrics> {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    rootFontSize: Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize),
    visualViewportScale: window.visualViewport?.scale ?? 1,
  }));
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.contentWidth,
    `Active Lesson must not overflow horizontally: viewport=${dimensions.viewportWidth}px content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function expectVisibleFocus(locator: Locator): Promise<void> {
  await locator.focus();
  await expect(locator).toBeFocused();
  const focus = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineStyle: style.outlineStyle,
      boxShadow: style.boxShadow,
    };
  });
  expect(focus.focusVisible).toBe(true);
  const visibleOutline = focus.outlineWidth >= 2 && focus.outlineStyle !== "none";
  const visibleShadow = focus.boxShadow !== "none";
  expect(
    visibleOutline || visibleShadow,
    `Focused element must expose an outline or focus ring: ${JSON.stringify(focus)}`,
  ).toBe(true);
}

async function expectHorizontallyContained(
  locator: Locator,
  viewportWidth: number,
  label: string,
): Promise<void> {
  const count = await locator.count();
  expect(count, `${label} must resolve at least one element`).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    await expect(item, `${label}[${index}] must be visible`).toBeVisible();
    const box = await item.boundingBox();
    expect(box, `${label}[${index}] must have layout geometry`).not.toBeNull();
    if (!box) throw new Error(`${label}[${index}] has no layout geometry.`);
    expect(box.x, `${label}[${index}] must not clip on the inline start`).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `${label}[${index}] must not clip on the inline end`,
    ).toBeLessThanOrEqual(viewportWidth + 1);
  }
}

function rectanglesOverlap(left: Rect, right: Rect): boolean {
  return (
    left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
  );
}

async function expectNoOverlap(left: Locator, right: Locator, label: string): Promise<void> {
  const [leftBox, rightBox] = await Promise.all([left.boundingBox(), right.boundingBox()]);
  expect(leftBox, `${label}: left element must have geometry`).not.toBeNull();
  expect(rightBox, `${label}: right element must have geometry`).not.toBeNull();
  if (!leftBox || !rightBox) throw new Error(`${label}: missing layout geometry.`);
  expect(rectanglesOverlap(leftBox, rightBox), `${label}: elements must not overlap`).toBe(false);
}

async function expectVerticalOrder(upper: Locator, lower: Locator, label: string): Promise<void> {
  const [upperBox, lowerBox] = await Promise.all([upper.boundingBox(), lower.boundingBox()]);
  expect(upperBox, `${label}: upper element must have geometry`).not.toBeNull();
  expect(lowerBox, `${label}: lower element must have geometry`).not.toBeNull();
  if (!upperBox || !lowerBox) throw new Error(`${label}: missing layout geometry.`);
  expect(
    upperBox.y + upperBox.height,
    `${label}: upper element must end before lower element begins`,
  ).toBeLessThanOrEqual(lowerBox.y + 1);
}

test.describe("Active Lesson browser-owned zoom", () => {
  test.describe.configure({ timeout: 90_000 });

  test("desktop 200% browser zoom preserves canonical Recall prompt and feedback states", async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "visual-desktop", "true browser zoom runs once in authoritative desktop Chromium");

    const extensionPath = resolve(process.cwd(), "e2e/support/browser-zoom-extension");
    const context = await chromium.launchPersistentContext("", {
      baseURL: "http://127.0.0.1:3000",
      channel: "chromium",
      headless: true,
      locale: "ru-RU",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "allow",
      viewport: { width: 1440, height: 1024 },
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      const page = context.pages()[0] ?? await context.newPage();
      await installDeterministicRuntime(page);
      const fixture = await installActiveLessonFixture(page, "recall");
      const runtimeErrors = captureRuntimeErrors(page);

      await openActiveLesson(page);

      const activeLesson = page.locator(".lx-active-lesson");
      const topbar = page.locator(".lx-active-lesson__topbar");
      const brand = page.locator(".lx-active-lesson__brand");
      const saved = page.locator(".lx-active-lesson__saved");
      const mobileBack = page.getByRole("button", {
        name: "Назад — сохранить и выйти из урока",
        exact: true,
      });
      const mobileClose = page.getByRole("button", { name: "Закрыть", exact: true });
      const desktopClose = page.getByRole("button", { name: "Закрыть урок", exact: true });
      const workspace = page.locator(".lx-active-lesson__workspace");
      const progressRow = page.locator(".lx-active-lesson__progress-row");
      const progress = page.getByRole("progressbar", { name: "Прогресс урока", exact: true });
      const card = page.locator(".lx-active-lesson__card");
      const prompt = page.getByRole("heading", {
        name: "The pipeline is delayed by a ____ in the ingestion stage.",
        exact: true,
      });
      const answer = page.getByRole("textbox", { name: "Введите ответ", exact: true });
      const answerActions = page.locator(".lx-active-lesson__answer-actions");
      const reveal = page.getByRole("button", {
        name: "Не помню — показать ответ",
        exact: true,
      });
      const checkAnswer = page.getByRole("button", { name: "Сверить ответ", exact: true });
      const confidence = page.locator(".lx-active-lesson__confidence");
      const confidenceButtons = confidence.getByRole("button");
      const known = page.getByRole("button", { name: "Знал", exact: true });

      await expect(activeLesson).toBeVisible();
      await expect(activeLesson).toHaveAttribute("data-active-lesson-mode", "recall");
      await expect(page).toHaveURL(/\/lesson\/active$/);
      await expect(progress).toHaveAttribute("aria-valuetext", "1 из 3 элементов");
      await expect(prompt).toBeVisible();
      await expect(answer).toBeVisible();
      await expect(checkAnswer).toBeDisabled();
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo({ top: 0, behavior: "auto" });
      });

      let serviceWorker = context.serviceWorkers().find((worker) => (
        worker.url().startsWith("chrome-extension://")
      ));
      if (!serviceWorker) {
        serviceWorker = await context.waitForEvent("serviceworker", {
          predicate: (worker) => worker.url().startsWith("chrome-extension://"),
        });
      }
      expect(serviceWorker.url()).toMatch(/^chrome-extension:\/\/[a-z]+\/background\.js$/);

      const targetURL = page.url();
      const cdp = await context.newCDPSession(page);
      const normalizedZoom = await setBrowserZoom(serviceWorker, targetURL, 1);
      expect(normalizedZoom.url).toBe(targetURL);
      expect(normalizedZoom.zoom).toBeCloseTo(1, 5);
      expect(normalizedZoom.mode).toBe("automatic");
      expect(normalizedZoom.scope).toBe("per-tab");

      const beforeDOM = await readDOMZoomMetrics(page);
      const beforeCDP = await readBrowserLayoutMetrics(cdp);
      expect(beforeCDP.cssVisualViewport.zoom).toBeCloseTo(1, 5);
      expect(beforeDOM.rootFontSize).toBeGreaterThanOrEqual(16);

      const appliedZoom = await setBrowserZoom(serviceWorker, targetURL, 2);
      expect(appliedZoom.url).toBe(targetURL);
      expect(appliedZoom.previousZoom).toBeCloseTo(1, 5);
      expect(appliedZoom.zoom).toBeCloseTo(2, 5);
      expect(appliedZoom.mode).toBe("automatic");
      expect(appliedZoom.scope).toBe("per-tab");

      await expect.poll(async () => (
        await readBrowserLayoutMetrics(cdp)
      ).cssVisualViewport.zoom).toBeCloseTo(2, 4);
      await expect.poll(async () => (
        await readDOMZoomMetrics(page)
      ).innerWidth).toBeLessThanOrEqual(Math.ceil(beforeDOM.innerWidth / 1.9));

      const afterDOM = await readDOMZoomMetrics(page);
      const afterCDP = await readBrowserLayoutMetrics(cdp);
      expect(afterDOM.rootFontSize).toBeCloseTo(beforeDOM.rootFontSize, 5);
      expect(afterDOM.visualViewportScale).toBeCloseTo(1, 5);
      expect(afterDOM.innerWidth).toBeGreaterThanOrEqual(Math.floor(beforeDOM.innerWidth / 2.1));
      expect(afterDOM.innerWidth).toBeLessThanOrEqual(Math.ceil(beforeDOM.innerWidth / 1.9));
      expect(afterCDP.cssVisualViewport.zoom).toBeCloseTo(2, 4);
      expect(afterCDP.cssLayoutViewport.clientWidth).toBeCloseTo(afterDOM.innerWidth, 0);
      expect(afterCDP.cssVisualViewport.clientWidth).toBeCloseTo(afterDOM.innerWidth, 0);
      expect(afterDOM.documentWidth).toBeLessThanOrEqual(afterDOM.clientWidth + 1);
      expect(afterDOM.bodyWidth).toBeLessThanOrEqual(afterDOM.clientWidth + 1);

      await expect(mobileBack).toBeVisible();
      await expect(mobileClose).toBeVisible();
      await expect(brand).toBeHidden();
      await expect(saved).toBeHidden();
      await expect(desktopClose).toBeHidden();
      await expect(progressRow).toHaveCSS("display", "block");
      await expect(answerActions).toBeVisible();

      const responsiveStyles = await answerActions.evaluate((element) => ({
        actionColumns: window.getComputedStyle(element).gridTemplateColumns,
        workspaceWidth: window.getComputedStyle(
          document.querySelector(".lx-active-lesson__workspace") as Element,
        ).width,
      }));
      expect(responsiveStyles.actionColumns.split(/\s+/).filter(Boolean)).toHaveLength(1);

      await expectHorizontallyContained(activeLesson, afterDOM.clientWidth, "Active Lesson root");
      await expectHorizontallyContained(topbar, afterDOM.clientWidth, "Active Lesson topbar");
      await expectHorizontallyContained(mobileBack, afterDOM.clientWidth, "mobile Back");
      await expectHorizontallyContained(mobileClose, afterDOM.clientWidth, "mobile Close");
      await expectHorizontallyContained(workspace, afterDOM.clientWidth, "Active Lesson workspace");
      await expectHorizontallyContained(progressRow, afterDOM.clientWidth, "progress row");
      await expectHorizontallyContained(progress, afterDOM.clientWidth, "progress bar");
      await expectHorizontallyContained(card, afterDOM.clientWidth, "lesson card");
      await expectHorizontallyContained(prompt, afterDOM.clientWidth, "Recall prompt");
      await expectHorizontallyContained(answer, afterDOM.clientWidth, "Recall answer field");
      await expectHorizontallyContained(answerActions, afterDOM.clientWidth, "answer actions");
      await expectHorizontallyContained(reveal, afterDOM.clientWidth, "reveal action");
      await expectHorizontallyContained(checkAnswer, afterDOM.clientWidth, "check answer action");
      await expectHorizontallyContained(confidence, afterDOM.clientWidth, "confidence group");
      await expectHorizontallyContained(confidenceButtons, afterDOM.clientWidth, "confidence action");
      await expectVerticalOrder(topbar, workspace, "topbar and workspace");
      await expectNoOverlap(progressRow, card, "progress row and lesson card");
      await expectNoHorizontalOverflow(page);

      await expectVisibleFocus(mobileBack);
      await expectVisibleFocus(mobileClose);
      await expectVisibleFocus(answer);
      await expectVisibleFocus(reveal);

      await answer.fill("backlog");
      await expect(checkAnswer).toBeEnabled();
      await answer.press("Enter");

      const preparedFeedback = page.getByRole("status").filter({ hasText: "Ответ подготовлен" });
      const expectedAnswer = page.locator(".lx-active-lesson__expected-answer");
      await expect(preparedFeedback).toBeVisible();
      await expect(preparedFeedback).toBeFocused();
      await expect(expectedAnswer).toContainText("Правильный ответ: backlog");
      await expect(known).toBeEnabled();
      await expectHorizontallyContained(expectedAnswer, afterDOM.clientWidth, "expected answer");
      await expectHorizontallyContained(preparedFeedback, afterDOM.clientWidth, "prepared feedback");
      await expectNoHorizontalOverflow(page);

      await expectVisibleFocus(known);
      await known.press("Enter");

      const acceptedFeedback = page.getByRole("status").filter({ hasText: "Ответ принят" });
      const advance = page.getByRole("button", { name: "Дальше", exact: true });
      await expect(acceptedFeedback).toBeVisible();
      await expect(advance).toBeVisible();
      await expect(advance).toBeEnabled();
      await expect(advance).toBeFocused();
      await expectHorizontallyContained(acceptedFeedback, afterDOM.clientWidth, "accepted feedback");
      await expectHorizontallyContained(advance, afterDOM.clientWidth, "advance action");
      await expectNoHorizontalOverflow(page);

      await expect.poll(() => fixture.reviewRequests().length).toBe(1);
      expect(fixture.reviewRequests()[0]).toMatchObject({
        lessonVersion: 1,
        rating: "known",
        answerMode: "recall",
        answerRevealed: true,
        submittedAnswer: "backlog",
      });
      expect(runtimeErrors).toEqual([]);

      await testInfo.attach("active-lesson-browser-zoom-metrics.json", {
        body: Buffer.from(JSON.stringify({
          targetURL,
          normalizedZoom,
          appliedZoom,
          beforeDOM,
          beforeCDP,
          afterDOM,
          afterCDP,
          responsiveStyles,
        }, null, 2)),
        contentType: "application/json",
      });
    } finally {
      await context.close();
    }
  });
});
