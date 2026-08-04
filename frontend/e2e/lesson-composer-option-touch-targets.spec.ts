import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type TargetRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  height: number;
  width: number;
};

type EffectiveTarget = TargetRect & {
  visualHeight: number;
  visualWidth: number;
  perimeterHits: boolean[];
  pseudoBackground: string;
  pseudoBorderWidths: string[];
  pseudoBoxShadow: string;
};

const GROUP_NAMES = ["Режим обучения", "Раздел обучения", "Размер урока"] as const;

function targetRectForElement(control: HTMLElement): TargetRect {
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
  const pseudoTop = rect.top + borderTop + topInset;
  const pseudoRight = rect.right - borderRight - rightInset;
  const pseudoBottom = rect.bottom - borderBottom - bottomInset;
  const pseudoLeft = rect.left + borderLeft + leftInset;
  const top = Math.min(rect.top, pseudoTop);
  const right = Math.max(rect.right, pseudoRight);
  const bottom = Math.max(rect.bottom, pseudoBottom);
  const left = Math.min(rect.left, pseudoLeft);

  return {
    top,
    right,
    bottom,
    left,
    height: bottom - top,
    width: right - left,
  };
}

async function centerForHitTesting(control: Locator): Promise<void> {
  await control.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  });
  await expect(control).toBeInViewport();
}

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
  return control.evaluate((element) => {
    const button = element as HTMLButtonElement;
    const visual = button.getBoundingClientRect();
    const hitSlop = window.getComputedStyle(button, "::before");
    const target = targetRectForElement(button);
    const centerX = (target.left + target.right) / 2;
    const centerY = (target.top + target.bottom) / 2;
    const inset = 1;
    const perimeterHits = [
      [centerX, target.top + inset],
      [target.right - inset, centerY],
      [centerX, target.bottom - inset],
      [target.left + inset, centerY],
    ].map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === button || (hit instanceof Node && button.contains(hit));
    });

    return {
      ...target,
      visualHeight: visual.height,
      visualWidth: visual.width,
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

async function groupTargetRects(group: Locator): Promise<TargetRect[]> {
  return group.getByRole("radio").evaluateAll((elements) => (
    elements.map((element) => targetRectForElement(element as HTMLElement))
  ));
}

function overlapArea(first: TargetRect, second: TargetRect): number {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  return width * height;
}

async function expectNoTargetOverlap(group: Locator): Promise<void> {
  const targets = await groupTargetRects(group);
  expect(targets.length).toBeGreaterThan(1);
  for (let leftIndex = 0; leftIndex < targets.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < targets.length; rightIndex += 1) {
      expect(
        overlapArea(targets[leftIndex], targets[rightIndex]),
        `radio targets ${leftIndex} and ${rightIndex} must not overlap`,
      ).toBeLessThanOrEqual(0.1);
    }
  }
}

async function expectTransparentHitSlop(target: EffectiveTarget): Promise<void> {
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  expect(target.perimeterHits, "all target perimeter points must resolve to the owning radio")
    .toEqual([true, true, true, true]);
}

async function expectSelectedRadioFocus(group: Locator, page: Page): Promise<void> {
  const selected = group.getByRole("radio", { checked: true });
  await expect(selected).toHaveCount(1);
  await centerForHitTesting(selected);
  await selected.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(selected).toBeFocused();
  const focus = await selected.evaluate((element) => {
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

async function selectAlternateRadio(group: Locator): Promise<void> {
  const radios = group.getByRole("radio");
  const count = await radios.count();
  let selectedIndex = -1;
  let alternateIndex = -1;

  for (let index = 0; index < count; index += 1) {
    if (await radios.nth(index).getAttribute("aria-checked") === "true") {
      selectedIndex = index;
    } else if (alternateIndex === -1) {
      alternateIndex = index;
    }
  }

  expect(selectedIndex).toBeGreaterThanOrEqual(0);
  expect(alternateIndex).toBeGreaterThanOrEqual(0);
  const selected = radios.nth(selectedIndex);
  const alternate = radios.nth(alternateIndex);
  await centerForHitTesting(alternate);
  await alternate.click();
  await expect(alternate).toHaveAttribute("aria-checked", "true");
  await expect(selected).toHaveAttribute("aria-checked", "false");
  await expect(alternate).toHaveAttribute("tabindex", "0");
  await expect(selected).toHaveAttribute("tabindex", "-1");
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Lesson Composer option touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("all live mobile option radios expose separated 44/48px targets", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The option target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Обучение", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Настроить урок", exact: true }).click();
    await expect(page.getByRole("button", { name: /Ручная настройка/ })).toBeVisible();

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));

    for (const groupName of GROUP_NAMES) {
      const group = page.getByRole("radiogroup", { name: groupName, exact: true });
      await expect(group).toBeVisible();
      const radios = group.getByRole("radio");
      expect(await radios.count()).toBeGreaterThanOrEqual(2);
      await expectNoTargetOverlap(group);

      for (let index = 0; index < await radios.count(); index += 1) {
        const radio = radios.nth(index);
        await centerForHitTesting(radio);
        const target = await effectiveTarget(radio);
        expect(target.visualHeight).toBeGreaterThanOrEqual(44 - 0.1);
        expect(target.height).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
        expect(target.width).toBeCloseTo(target.visualWidth, 3);
        await expectTransparentHitSlop(target);
      }

      await expectSelectedRadioFocus(group, page);
      await selectAlternateRadio(group);
    }

    await expectNoHorizontalOverflow(page);
  });
});
