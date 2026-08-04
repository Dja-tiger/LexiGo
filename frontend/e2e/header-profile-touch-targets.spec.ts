import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveTarget = {
  visualHeight: number;
  visualWidth: number;
  targetHeight: number;
  targetWidth: number;
  targetLeft: number;
  targetRight: number;
  perimeterHits: boolean[];
  pseudoBackground: string;
  pseudoBorderWidths: string[];
  pseudoBoxShadow: string;
};

async function profileTarget(button: Locator): Promise<EffectiveTarget> {
  return button.evaluate((element) => {
    const control = element as HTMLButtonElement;
    const rect = control.getBoundingClientRect();
    const style = window.getComputedStyle(control);
    const hitSlop = window.getComputedStyle(control, "::before");
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
    const perimeterHits = [
      [centerX, targetTop + inset],
      [targetRight - inset, centerY],
      [centerX, targetBottom - inset],
      [targetLeft + inset, centerY],
    ].map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === control || (hit instanceof Node && control.contains(hit));
    });

    return {
      visualHeight: rect.height,
      visualWidth: rect.width,
      targetHeight: targetBottom - targetTop,
      targetWidth: targetRight - targetLeft,
      targetLeft,
      targetRight,
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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 header profile touch target", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("the live profile button exposes a non-overlapping 44/48px square hit surface", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The header profile target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    const compact = testInfo.project.name !== "desktop-chromium";
    await page.setViewportSize(compact ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();

    const action = page.getByRole("button", { name: "Открыть профиль", exact: true });
    const reminder = page.locator(".lx-route-reminder-entry > summary");
    await expect(action).toBeVisible();
    await expect(reminder).toBeVisible();

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));
    const expectedPainted = compact ? 42 : 44;
    const target = await profileTarget(action);
    const reminderBox = await reminder.boundingBox();

    expect(target.visualHeight).toBeCloseTo(expectedPainted, 3);
    expect(target.visualWidth).toBeCloseTo(expectedPainted, 3);
    expect(target.targetHeight).toBeCloseTo(expectedMinimum, 3);
    expect(target.targetWidth).toBeCloseTo(expectedMinimum, 3);
    expect(target.perimeterHits, "all four target perimeter points must resolve inside the profile button")
      .toEqual([true, true, true, true]);
    expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
    expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
    expect(target.pseudoBoxShadow).toBe("none");

    expect(reminderBox).not.toBeNull();
    if (reminderBox) {
      const reminderRight = reminderBox.x + reminderBox.width;
      expect(
        target.targetLeft - reminderRight,
        "the profile hit surface must remain separated from the visible route reminder target",
      ).toBeGreaterThanOrEqual(1);
    }

    await action.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(action).toBeFocused();
    const focus = await action.evaluate((element) => {
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
    await expectNoHorizontalOverflow(page);
  });
});
