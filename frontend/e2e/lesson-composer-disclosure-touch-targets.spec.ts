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

async function centerForHitTesting(button: Locator): Promise<void> {
  await button.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  });
  await expect(button).toBeInViewport();
}

async function disclosureTarget(button: Locator): Promise<EffectiveTarget> {
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

    // An absolutely positioned pseudo-element is laid out from the button's
    // padding box, while the native button border box remains clickable too.
    // Measure the union of both surfaces rather than dropping the border area.
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

async function expectTransparentHitSlop(target: EffectiveTarget): Promise<void> {
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  expect(target.perimeterHits, "all target perimeter points must resolve to the disclosure owner")
    .toEqual([true, true, true, true]);
}

async function expectKeyboardFocus(button: Locator, page: Page): Promise<void> {
  await button.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(button).toBeFocused();
  const focus = await button.evaluate((element) => {
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
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Lesson Composer disclosure touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("collapsed and expanded live controls expose separated 44/48px hit surfaces", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The disclosure target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Обучение", exact: true })).toBeVisible();

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));
    const collapsed = page.getByRole("button", { name: "Настроить урок", exact: true });
    const recommendedStart = page.getByRole("button", { name: "Начать рекомендуемый урок", exact: true });
    await expect(collapsed).toBeVisible();
    await expect(collapsed).toHaveAttribute("aria-expanded", "false");
    await expect(recommendedStart).toBeVisible();
    await centerForHitTesting(collapsed);

    const collapsedTarget = await disclosureTarget(collapsed);
    const recommendedStartBox = await recommendedStart.boundingBox();
    expect(collapsedTarget.visualHeight).toBeCloseTo(44, 3);
    expect(collapsedTarget.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
    expect(collapsedTarget.targetWidth).toBeCloseTo(collapsedTarget.visualWidth, 3);
    await expectTransparentHitSlop(collapsedTarget);
    expect(recommendedStartBox).not.toBeNull();
    if (recommendedStartBox) {
      expect(
        collapsedTarget.targetTop - (recommendedStartBox.y + recommendedStartBox.height),
        "the disclosure hit surface must not overlap the recommended lesson start action",
      ).toBeGreaterThanOrEqual(1);
    }
    await expectKeyboardFocus(collapsed, page);

    await collapsed.click();
    await expect(collapsed).toBeHidden();
    const expanded = page.getByRole("button", { name: /Ручная настройка/ });
    const firstMode = page.getByRole("radio", { name: /Простое изучение слов/ });
    await expect(expanded).toBeVisible();
    await expect(expanded).toHaveAttribute("aria-expanded", "true");
    await expect(firstMode).toBeVisible();
    await centerForHitTesting(expanded);

    const expandedTarget = await disclosureTarget(expanded);
    const firstModeBox = await firstMode.boundingBox();
    expect(expandedTarget.visualHeight).toBeGreaterThanOrEqual(58 - 0.1);
    expect(expandedTarget.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
    expect(expandedTarget.targetWidth).toBeCloseTo(expandedTarget.visualWidth, 3);
    await expectTransparentHitSlop(expandedTarget);
    expect(firstModeBox).not.toBeNull();
    if (firstModeBox) {
      expect(
        firstModeBox.y - expandedTarget.targetBottom,
        "the expanded summary hit surface must remain separated from the first mode action",
      ).toBeGreaterThanOrEqual(1);
    }
    await expectKeyboardFocus(expanded, page);
    await expectNoHorizontalOverflow(page);

    await expanded.click();
    await expect(collapsed).toBeVisible();
    await expect(collapsed).toHaveAttribute("aria-expanded", "false");
  });
});
