import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveTarget = {
  visualHeight: number;
  visualWidth: number;
  targetTop: number;
  targetRight: number;
  targetBottom: number;
  targetLeft: number;
  targetHeight: number;
  targetWidth: number;
  perimeterHits: boolean[];
  pseudoBackground: string;
  pseudoBorderWidths: string[];
  pseudoBoxShadow: string;
};

async function effectiveTarget(button: Locator): Promise<EffectiveTarget> {
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
    const perimeterInset = 1;
    const perimeterHits = [
      [centerX, targetTop + perimeterInset],
      [targetRight - perimeterInset, centerY],
      [centerX, targetBottom - perimeterInset],
      [targetLeft + perimeterInset, centerY],
    ].map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === control || (hit instanceof Node && control.contains(hit));
    });

    return {
      visualHeight: rect.height,
      visualWidth: rect.width,
      targetTop,
      targetRight,
      targetBottom,
      targetLeft,
      targetHeight: targetBottom - targetTop,
      targetWidth: targetRight - targetLeft,
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

test.describe("Issue #74 Dictionary search-clear touch target", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("the live clear icon exposes a contained transparent 44/48px square hit surface", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Dictionary search-clear contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();

      const search = page.getByRole("searchbox", { name: "Поиск по словарю", exact: true });
      await search.fill("durable");

      const action = page.getByRole("button", { name: "Очистить поиск", exact: true });
      await expect(action).toBeVisible();

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));
      const target = await effectiveTarget(action);
      const inputBox = await search.boundingBox();
      const actionBox = await action.boundingBox();

      expect(target.visualHeight).toBeCloseTo(36, 3);
      expect(target.visualWidth).toBeCloseTo(36, 3);
      expect(target.targetHeight).toBeCloseTo(expectedMinimum, 3);
      expect(target.targetWidth).toBeCloseTo(expectedMinimum, 3);
      expect(target.perimeterHits, "all four expanded perimeter points must resolve inside the clear button")
        .toEqual([true, true, true, true]);
      expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
      expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
      expect(target.pseudoBoxShadow).toBe("none");

      expect(inputBox).not.toBeNull();
      if (inputBox) {
        expect(target.targetTop).toBeGreaterThanOrEqual(inputBox.y - 0.5);
        expect(target.targetBottom).toBeLessThanOrEqual(inputBox.y + inputBox.height + 0.5);
        expect(target.targetLeft).toBeGreaterThanOrEqual(inputBox.x - 0.5);
        expect(target.targetRight).toBeLessThanOrEqual(inputBox.x + inputBox.width + 0.5);
      }

      expect(actionBox).not.toBeNull();
      if (inputBox && actionBox) {
        expect(
          inputBox.x + inputBox.width - (actionBox.x + actionBox.width),
          "the painted clear action must preserve its trailing inset inside the field",
        ).toBeGreaterThanOrEqual(6);
        expect(
          inputBox.x + inputBox.width - target.targetRight,
          "the expanded target must remain inside the search field",
        ).toBeGreaterThanOrEqual(0.5);
      }

      await action.focus();
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

      await action.click();
      await expect(search).toHaveValue("");
      await expect(action).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
  });
});
