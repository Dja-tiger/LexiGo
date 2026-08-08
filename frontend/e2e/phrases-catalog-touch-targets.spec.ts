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

async function scrollEffectiveTargetIntoView(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const hitSlop = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const topInset = Number.parseFloat(hitSlop.top) || 0;
    const bottomInset = Number.parseFloat(hitSlop.bottom) || 0;
    const targetTop = rect.top + borderTop + topInset;
    const targetBottom = rect.bottom - borderBottom - bottomInset;
    const margin = 8;

    if (targetTop < margin) {
      window.scrollBy(0, targetTop - margin);
    } else if (targetBottom > window.innerHeight - margin) {
      window.scrollBy(0, targetBottom - window.innerHeight + margin);
    }
  });
}

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
  await scrollEffectiveTargetIntoView(control);
  return control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const hitSlop = window.getComputedStyle(element, "::before");
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
      return hit === element || (hit instanceof Node && element.contains(hit));
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

async function expectEffectiveMinimum(control: Locator, minimum: number): Promise<EffectiveTarget> {
  const target = await effectiveTarget(control);
  expect(target.targetHeight).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.targetWidth).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.perimeterHits, "all four effective-target perimeter points must resolve inside the owning control")
    .toEqual([true, true, true, true]);
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  return target;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Phrases catalog touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("live catalog controls expose contained 44/48px targets without changing 36px pills and radio rows", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Phrases catalog target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/phrases", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("main", { name: "Технические фразы", exact: true })).toBeVisible();

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));

      const catalogKind = page.getByRole("navigation", { name: "Тип каталога", exact: true });
      const kindTarget = await expectEffectiveMinimum(catalogKind.getByRole("button").first(), expectedMinimum);
      expect(kindTarget.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);

      const topics = page.getByRole("navigation", { name: "Быстрый выбор темы", exact: true });
      const firstTopic = topics.getByRole("button").first();
      const topicTarget = await expectEffectiveMinimum(firstTopic, expectedMinimum);
      expect(topicTarget.visualHeight).toBeCloseTo(36, 3);

      const filterRows = page.locator(".lx-phrases-filters fieldset label");
      expect(await filterRows.count()).toBeGreaterThanOrEqual(2);
      const firstFilterTarget = await expectEffectiveMinimum(filterRows.nth(0), expectedMinimum);
      const secondFilterTarget = await expectEffectiveMinimum(filterRows.nth(1), expectedMinimum);
      expect(firstFilterTarget.visualHeight).toBeCloseTo(36, 3);
      expect(secondFilterTarget.visualHeight).toBeCloseTo(36, 3);
      expect(
        secondFilterTarget.targetTop - firstFilterTarget.targetBottom,
        "adjacent expanded radio-row targets must not overlap",
      ).toBeGreaterThanOrEqual(1);

      const searchSubmit = page.getByRole("button", { name: "Найти", exact: true });
      const submitTarget = await expectEffectiveMinimum(searchSubmit, expectedMinimum);
      expect(submitTarget.visualHeight).toBeCloseTo(44, 3);

      const lessonAction = page.getByRole("button", { name: "Урок по теме", exact: true });
      const lessonTarget = await expectEffectiveMinimum(lessonAction, expectedMinimum);
      expect(lessonTarget.visualHeight).toBeCloseTo(44, 3);

      const sort = page.getByRole("combobox", { name: "Сортировка каталога", exact: true });
      await sort.scrollIntoViewIfNeeded();
      const sortBox = await sort.boundingBox();
      expect(sortBox).not.toBeNull();
      if (sortBox) {
        expect(sortBox.height).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
      }

      await firstTopic.focus();
      await expect(firstTopic).toBeFocused();
      const focus = await firstTopic.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          focusVisible: element.matches(":focus-visible"),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
      expect(focus.focusVisible).toBe(true);
      expect(focus.outlineStyle).not.toBe("none");
      expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);

      await expectNoHorizontalOverflow(page);
    }
  });
});
