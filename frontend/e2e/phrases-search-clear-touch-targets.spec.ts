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

async function paddingRight(input: Locator): Promise<number> {
  return input.evaluate((element) => (
    Number.parseFloat(window.getComputedStyle(element).paddingRight) || 0
  ));
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Phrases search-clear touch target", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("the live clear icon exposes a contained non-overlapping 44/48px square hit surface", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Phrases search-clear contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/phrases", { waitUntil: "domcontentloaded" });
      const main = page.getByRole("main", { name: "Технические фразы", exact: true });
      await expect(main).toBeVisible();
      // PhrasesCatalog focuses the shared main surface from its layout effect.
      // Waiting for that client-owned side effect prevents a fast post-navigation
      // fill from racing React hydration and being reset by the controlled input.
      await expect(main).toBeFocused();

      const search = page.getByRole("searchbox", { name: "Поиск по фразам", exact: true });
      const emptyPaddingRight = await paddingRight(search);
      expect(emptyPaddingRight).toBeCloseTo(width <= 767 ? 108 : 48, 3);

      await search.fill("root cause");
      const action = page.getByRole("button", { name: "Очистить поиск", exact: true });
      const submit = page.getByRole("button", { name: "Найти", exact: true });
      await expect(action).toBeVisible();
      await expect(submit).toBeVisible();

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));
      const target = await effectiveTarget(action);
      const inputBox = await search.boundingBox();
      const actionBox = await action.boundingBox();
      const submitBox = await submit.boundingBox();
      const activePaddingRight = await paddingRight(search);

      expect(target.visualHeight).toBeCloseTo(36, 3);
      expect(target.visualWidth).toBeCloseTo(36, 3);
      expect(target.targetHeight).toBeCloseTo(expectedMinimum, 3);
      expect(target.targetWidth).toBeCloseTo(expectedMinimum, 3);
      expect(target.perimeterHits, "all four expanded perimeter points must resolve inside the clear button")
        .toEqual([true, true, true, true]);
      expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
      expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
      expect(target.pseudoBoxShadow).toBe("none");
      expect(activePaddingRight).toBeCloseTo(width <= 767 ? 120 : 48, 3);

      expect(inputBox).not.toBeNull();
      if (inputBox) {
        expect(target.targetTop).toBeGreaterThanOrEqual(inputBox.y - 0.5);
        expect(target.targetBottom).toBeLessThanOrEqual(inputBox.y + inputBox.height + 0.5);
        expect(target.targetLeft).toBeGreaterThanOrEqual(inputBox.x - 0.5);
        expect(target.targetRight).toBeLessThanOrEqual(inputBox.x + inputBox.width + 0.5);
      }

      expect(actionBox).not.toBeNull();
      expect(submitBox).not.toBeNull();
      if (actionBox && submitBox) {
        expect(
          submitBox.x - (actionBox.x + actionBox.width),
          "the painted clear and submit actions must remain visually separate",
        ).toBeGreaterThanOrEqual(width <= 767 ? 3 : 1);
        expect(
          submitBox.x - target.targetRight,
          "the expanded clear target must not overlap the visible submit action",
        ).toBeGreaterThanOrEqual(width <= 767 ? 3 : 1);
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
      expect(await paddingRight(search)).toBeCloseTo(width <= 767 ? 108 : 48, 3);
      await expectNoHorizontalOverflow(page);
    }
  });
});
