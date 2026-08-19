import { expect, test, type Locator, type Page } from "@playwright/test";

import { installQualityGateAPI } from "./support/quality-gates";

type EffectiveRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

async function effectiveTarget(control: Locator) {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });

  return control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const pseudo = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const topInset = Number.parseFloat(pseudo.top) || 0;
    const rightInset = Number.parseFloat(pseudo.right) || 0;
    const bottomInset = Number.parseFloat(pseudo.bottom) || 0;
    const leftInset = Number.parseFloat(pseudo.left) || 0;
    const pseudoTop = rect.top + borderTop + topInset;
    const pseudoRight = rect.right - borderRight - rightInset;
    const pseudoBottom = rect.bottom - borderBottom - bottomInset;
    const pseudoLeft = rect.left + borderLeft + leftInset;
    const targetTop = Math.min(rect.top, pseudoTop);
    const targetRight = Math.max(rect.right, pseudoRight);
    const targetBottom = Math.max(rect.bottom, pseudoBottom);
    const targetLeft = Math.min(rect.left, pseudoLeft);
    const centerX = (targetLeft + targetRight) / 2;
    const centerY = (targetTop + targetBottom) / 2;
    const perimeterInset = 1;
    const perimeterHits = [
      [centerX, targetTop + perimeterInset],
      [targetRight - perimeterInset, centerY],
      [centerX, targetBottom - perimeterInset],
      [targetLeft + perimeterInset, centerY],
    ].map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === element || (hit instanceof Node && element.contains(hit));
    });

    return {
      visualHeight: rect.height,
      visualWidth: rect.width,
      targetHeight: targetBottom - targetTop,
      targetWidth: targetRight - targetLeft,
      targetRect: {
        top: targetTop,
        right: targetRight,
        bottom: targetBottom,
        left: targetLeft,
      },
      perimeterHits,
      pseudoBackground: pseudo.backgroundColor,
      pseudoBorderWidths: [
        pseudo.borderTopWidth,
        pseudo.borderRightWidth,
        pseudo.borderBottomWidth,
        pseudo.borderLeftWidth,
      ],
      pseudoBoxShadow: pseudo.boxShadow,
    };
  });
}

async function effectiveTargetRects(controls: Locator): Promise<EffectiveRect[]> {
  // Measure every candidate in one browser evaluation after the individual hit
  // checks have finished. Mobile calendar controls live inside a scrollable
  // bottom sheet; viewport-relative rectangles sampled before and after
  // scrollIntoView() belong to different coordinate frames and cannot be
  // compared for overlap.
  return controls.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const pseudo = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const topInset = Number.parseFloat(pseudo.top) || 0;
    const rightInset = Number.parseFloat(pseudo.right) || 0;
    const bottomInset = Number.parseFloat(pseudo.bottom) || 0;
    const leftInset = Number.parseFloat(pseudo.left) || 0;
    const pseudoTop = rect.top + borderTop + topInset;
    const pseudoRight = rect.right - borderRight - rightInset;
    const pseudoBottom = rect.bottom - borderBottom - bottomInset;
    const pseudoLeft = rect.left + borderLeft + leftInset;

    return {
      top: Math.min(rect.top, pseudoTop),
      right: Math.max(rect.right, pseudoRight),
      bottom: Math.max(rect.bottom, pseudoBottom),
      left: Math.min(rect.left, pseudoLeft),
    };
  }));
}

function targetsIntersect(first: EffectiveRect, second: EffectiveRect): boolean {
  const overlapWidth = Math.min(first.right, second.right) - Math.max(first.left, second.left);
  const overlapHeight = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return overlapWidth > 0.5 && overlapHeight > 0.5;
}

async function expectTarget(control: Locator, minimum: number) {
  await expect(control).toBeVisible();
  const target = await effectiveTarget(control);
  expect(target.targetHeight).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.targetWidth).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.perimeterHits).toEqual([true, true, true, true]);
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  return target;
}

async function applyTextZoom(page: Page, percent = 200): Promise<void> {
  const stylesheetPath = `/__e2e__/calendar-reminder-text-zoom-${percent}.css`;
  await page.route(`**${stylesheetPath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      body: `html { font-size: ${percent}% !important; }`,
    });
  });
  await page.addStyleTag({ url: new URL(stylesheetPath, page.url()).toString() });
  await expect.poll(async () => page.evaluate(() => (
    Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
  ))).toBeGreaterThanOrEqual(32);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe("Issue #74 calendar reminder touch targets", () => {
  test.describe.configure({ timeout: 90_000 });

  test("preview, close and weekday controls expose independent 44/48px targets", async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "Calendar target acceptance runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    await installQualityGateAPI(context);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));

    const routeEntry = page.locator(".lx-route-reminder-entry");
    const disclosure = routeEntry.locator(":scope > summary");
    await disclosure.click();
    const preview = routeEntry.getByRole("region", { name: "Текущее напоминание о занятии" });
    await expect(preview).toBeVisible();
    const previewAction = preview.getByRole("button", { name: "Настроить календарь" });
    const previewTarget = await expectTarget(previewAction, expectedMinimum);
    expect(previewTarget.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);

    await previewAction.click();
    const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
    await expect(dialog).toBeVisible();

    const close = dialog.getByRole("button", { name: "Закрыть" });
    const closeTarget = await expectTarget(close, expectedMinimum);
    expect(closeTarget.visualHeight).toBeLessThan(44);
    expect(closeTarget.visualWidth).toBeLessThan(44);

    await dialog.getByLabel("Повторение").selectOption("custom");
    const weekdays = dialog.locator(".lx-calendar-weekdays button");
    await expect(weekdays).toHaveCount(7);

    for (let index = 0; index < 7; index += 1) {
      await expectTarget(weekdays.nth(index), expectedMinimum);
    }

    const weekdayRects = await effectiveTargetRects(weekdays);
    for (let first = 0; first < weekdayRects.length; first += 1) {
      for (let second = first + 1; second < weekdayRects.length; second += 1) {
        expect(
          targetsIntersect(weekdayRects[first], weekdayRects[second]),
          `weekday targets ${first} and ${second} must remain independent`,
        ).toBe(false);
      }
    }

    const title = dialog.getByRole("heading", { name: "Напоминание об английском" });
    await title.focus();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    const focus = await close.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        focusVisible: element.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focus.focusVisible).toBe(true);
    expect(focus.outlineStyle).not.toBe("none");
    expect(focus.outlineWidth).toBeGreaterThanOrEqual(3);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("closed preview has no 320px / 200% overflow geometry and opens inside the viewport", async ({ context, page }, testInfo) => {
    test.skip(
      !["android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "Closed-preview reflow acceptance runs in the two coarse mobile browser projects.",
    );

    await installQualityGateAPI(context);
    await page.setViewportSize({ width: 320, height: 720 });

    const progressReady = page.waitForResponse((response) => (
      new URL(response.url()).pathname === "/api/v1/progress" && response.status() === 200
    ));
    const activeLessonReady = page.waitForResponse((response) => (
      new URL(response.url()).pathname === "/api/v1/lessons/active" && response.status() === 404
    ));

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await Promise.all([progressReady, activeLessonReady]);
    // With the deterministic fixture, this final CTA is reachable only after
    // both Home resource results have committed; measuring before it appears
    // can sample the transient loading layout instead of the calendar owner.
    await expect(page.getByRole("button", { name: "Повторить сейчас", exact: true })).toBeVisible();
    await applyTextZoom(page);

    const routeEntry = page.locator(".lx-route-reminder-entry");
    const disclosure = routeEntry.locator(":scope > summary");
    const preview = routeEntry.locator(":scope > .lx-route-reminder-preview");

    await expect(disclosure).toBeVisible();
    await expect(routeEntry).not.toHaveAttribute("open", "");
    await expect(preview).toBeHidden();

    const closedState = await preview.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        display: window.getComputedStyle(element).display,
        width: rect.width,
        height: rect.height,
      };
    });
    expect(closedState).toEqual({ display: "none", width: 0, height: 0 });
    await expectNoHorizontalOverflow(page);

    await disclosure.click();
    await expect(routeEntry).toHaveAttribute("open", "");
    await expect(preview).toBeVisible();

    const openRect = await preview.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
      };
    });
    expect(openRect.width).toBeGreaterThan(0);
    expect(openRect.left).toBeGreaterThanOrEqual(-0.5);
    expect(openRect.right).toBeLessThanOrEqual(320.5);
    await expect(preview.getByRole("button", { name: "Настроить календарь" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
