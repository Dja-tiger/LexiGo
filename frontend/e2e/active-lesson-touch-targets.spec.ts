import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  QUALITY_PROGRESS,
  QUALITY_SESSION,
  QUALITY_WORDS,
} from "./support/quality-gates";

type LessonMode = "study" | "recall";

type EffectiveTarget = {
  visualHeight: number;
  targetHeight: number;
  targetWidth: number;
  targetTop: number;
  targetRight: number;
  targetBottom: number;
  targetLeft: number;
  viewportWidth: number;
  viewportHeight: number;
  perimeterHits: boolean[];
};

function activeLesson(mode: LessonMode) {
  return {
    id: "00000000-0000-0000-0000-000000000740",
    source: "mixed",
    studyMode: mode,
    lessonSize: "15",
    currentIndex: 0,
    version: 1,
    status: "active",
    items: [{ ...QUALITY_WORDS[2], position: 0 }],
    createdAt: "2026-08-08T00:00:00Z",
    updatedAt: "2026-08-08T00:00:00Z",
  };
}

async function installActiveLessonAPI(page: Page, mode: LessonMode): Promise<void> {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "active-targets-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body: unknown;

    if (path === "/api/v1/auth/refresh") body = QUALITY_SESSION;
    else if (path === "/api/v1/progress") body = QUALITY_PROGRESS;
    else if (path === "/api/v1/lessons/active") body = activeLesson(mode);
    else {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "not_mocked", message: `${request.method()} ${path}` } }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

async function openSavedLesson(page: Page, mode: LessonMode): Promise<void> {
  await installActiveLessonAPI(page, mode);
  await page.goto("/lesson/active", { waitUntil: "domcontentloaded" });
  const resume = page.getByRole("button", { name: "Продолжить урок", exact: true });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-mode", mode);
}

async function scrollExpandedTargetIntoView(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    const button = element as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    const hitSlop = window.getComputedStyle(button, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const topInset = Number.parseFloat(hitSlop.top) || 0;
    const bottomInset = Number.parseFloat(hitSlop.bottom) || 0;
    const targetTop = rect.top + borderTop + topInset;
    const targetBottom = rect.bottom - borderBottom - bottomInset;
    const viewportInset = 1;
    let deltaY = 0;

    if (targetBottom > window.innerHeight - viewportInset) {
      deltaY = targetBottom - (window.innerHeight - viewportInset);
    } else if (targetTop < viewportInset) {
      deltaY = targetTop - viewportInset;
    }

    if (Math.abs(deltaY) > 0.01) window.scrollBy(0, deltaY);
  });
}

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
  await scrollExpandedTargetIntoView(control);
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
    const targetTop = rect.top + borderTop + topInset;
    const targetRight = rect.right - borderRight - rightInset;
    const targetBottom = rect.bottom - borderBottom - bottomInset;
    const targetLeft = rect.left + borderLeft + leftInset;
    const centerX = (targetLeft + targetRight) / 2;
    const centerY = (targetTop + targetBottom) / 2;
    const inset = 1;
    const points = [
      [centerX, targetTop + inset],
      [targetRight - inset, centerY],
      [centerX, targetBottom - inset],
      [targetLeft + inset, centerY],
    ];

    return {
      visualHeight: rect.height,
      targetHeight: targetBottom - targetTop,
      targetWidth: targetRight - targetLeft,
      targetTop,
      targetRight,
      targetBottom,
      targetLeft,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      perimeterHits: points.map(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return hit === button || (hit instanceof Node && button.contains(hit));
      }),
    };
  });
}

async function expectedMinimum(page: Page): Promise<number> {
  return page.evaluate(() => window.matchMedia("(pointer: coarse)").matches ? 48 : 44);
}

async function expectTarget(control: Locator, minimum: number): Promise<void> {
  await expect(control).toBeVisible();
  const target = await effectiveTarget(control);
  expect(target.targetHeight).toBeGreaterThanOrEqual(minimum - 0.1);
  expect(target.targetWidth).toBeGreaterThanOrEqual(minimum - 0.1);
  expect(target.targetTop).toBeGreaterThanOrEqual(-0.1);
  expect(target.targetLeft).toBeGreaterThanOrEqual(-0.1);
  expect(target.targetRight).toBeLessThanOrEqual(target.viewportWidth + 0.1);
  expect(target.targetBottom).toBeLessThanOrEqual(target.viewportHeight + 0.1);
  expect(target.perimeterHits).toEqual([true, true, true, true]);
}

async function expectKeyboardFocus(control: Locator, page: Page): Promise<void> {
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
  expect(focus.outlineStyle !== "none" || focus.boxShadow !== "none").toBe(true);
  if (focus.outlineStyle !== "none") expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThan(0);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

function supportedTargetProject(projectName: string): boolean {
  return ["desktop-chromium", "ios-webkit", "android-chromium"].includes(projectName);
}

test.describe("Issue #74 Active Lesson live-control touch targets", () => {
  test("study utility, confidence and compact header controls expose 44/48px targets", async ({ page }, testInfo) => {
    test.skip(!supportedTargetProject(testInfo.project.name), "Covered in desktop Chromium, iOS WebKit and Android Chromium.");

    const compact = testInfo.project.name !== "desktop-chromium";
    await page.setViewportSize(compact ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await openSavedLesson(page, "study");
    const minimum = await expectedMinimum(page);

    const listen = page.locator(".lx-active-lesson__utilities button");
    await expect(listen).toHaveText("Прослушать");
    await expectTarget(listen, minimum);

    for (const label of ["Не знал", "Почти", "Знал"]) {
      await expectTarget(page.getByRole("button", { name: label, exact: true }), minimum);
    }

    if (compact) {
      await expectTarget(page.getByRole("button", { name: "Назад — сохранить и выйти из урока", exact: true }), minimum);
      await expectTarget(page.getByRole("button", { name: "Закрыть", exact: true }), minimum);
    }

    await expectNoHorizontalOverflow(page);
  });

  test("recall text action preserves paint while exposing the platform target", async ({ page }, testInfo) => {
    test.skip(!supportedTargetProject(testInfo.project.name), "Covered in desktop Chromium, iOS WebKit and Android Chromium.");

    const compact = testInfo.project.name !== "desktop-chromium";
    await page.setViewportSize(compact ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await openSavedLesson(page, "recall");
    const minimum = await expectedMinimum(page);
    const reveal = page.getByRole("button", { name: "Не помню — показать ответ", exact: true });

    const before = await effectiveTarget(reveal);
    expect(before.visualHeight).toBeGreaterThanOrEqual(43.5);
    expect(before.visualHeight).toBeLessThanOrEqual(44.5);
    await expectTarget(reveal, minimum);
    await expectKeyboardFocus(reveal, page);

    await reveal.click();
    await expect(page.getByText("Правильный ответ:", { exact: false })).toBeVisible();
    for (const label of ["Не знал", "Почти", "Знал"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeEnabled();
    }
    await expectNoHorizontalOverflow(page);
  });
});
