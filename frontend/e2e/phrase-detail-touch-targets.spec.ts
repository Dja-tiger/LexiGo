import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PHRASES,
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

type EffectiveRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

async function scrollEffectiveTargetIntoView(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    /*
     * Fixed compact navigation can cover a control that Playwright otherwise
     * considers visible. Center the painted owner before probing transparent
     * perimeter ownership so elementFromPoint measures the target itself.
     */
    element.scrollIntoView({ block: "center", inline: "nearest" });

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
  await expect(control).toBeVisible();
  const target = await effectiveTarget(control);
  expect(target.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);
  expect(target.targetHeight).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.targetWidth).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(
    target.perimeterHits,
    "all four effective-target perimeter points must resolve inside the owning Phrase Detail control",
  ).toEqual([true, true, true, true]);
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  return target;
}

async function effectiveRects(controls: Locator): Promise<EffectiveRect[]> {
  return controls.evaluateAll((elements) => elements.map((element) => {
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
    return {
      top: rect.top + borderTop + topInset,
      right: rect.right - borderRight - rightInset,
      bottom: rect.bottom - borderBottom - bottomInset,
      left: rect.left + borderLeft + leftInset,
    };
  }));
}

function intersection(left: EffectiveRect, right: EffectiveRect): { width: number; height: number } {
  return {
    width: Math.min(left.right, right.right) - Math.max(left.left, right.left),
    height: Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top),
  };
}

async function expectIndependentMainActions(page: Page): Promise<void> {
  const actions = page.locator(".lx-phrase-detail-actions > button");
  await expect(actions).toHaveCount(2);
  await actions.first().evaluate((element) => element.parentElement?.scrollIntoView({ block: "center" }));
  const rects = await effectiveRects(actions);
  expect(rects).toHaveLength(2);
  const overlap = intersection(rects[0], rects[1]);
  expect(
    overlap.width <= 0 || overlap.height <= 0,
    `expanded Phrase Detail main-action targets must not overlap: ${JSON.stringify({ rects, overlap })}`,
  ).toBe(true);
}

async function expectVisibleKeyboardFocus(page: Page, control: Locator): Promise<void> {
  await control.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(control).toBeFocused();
  const focus = await control.evaluate((element) => {
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
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function openPhraseDetail(page: Page): Promise<void> {
  await page.goto(`/phrases/${QUALITY_PHRASES[0].slug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: QUALITY_PHRASES[0].lemma })).toBeVisible();
  await expect(page.locator('[data-route-client-island="phrases"]')).toBeVisible();
}

test.describe("Issue #74 Phrase Detail touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("live Phrase Detail actions expose independent 44/48px paint-inert targets", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "Phrase Detail target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [820, 390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await openPhraseDetail(page);

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));

      const back = page.getByRole("button", { name: "К списку фраз", exact: true });
      const listen = page.locator(".lx-phrase-listen");
      const configure = page.getByRole("button", { name: "Настроить урок", exact: true });
      const otherPhrases = page.getByRole("button", { name: "К другим фразам", exact: true });

      await expect(listen).toContainText("Прослушать");
      for (const control of [back, listen, configure, otherPhrases]) {
        await expectEffectiveMinimum(control, expectedMinimum);
      }

      const practice = page.getByRole("complementary", { name: "Практика фразы", exact: true })
        .getByRole("button", { name: "Начать практику", exact: true });
      if (width >= 768) {
        await expectEffectiveMinimum(practice, expectedMinimum);
      } else {
        await expect(practice).toBeHidden();
      }

      await expectIndependentMainActions(page);
      await expectVisibleKeyboardFocus(page, back);
      await expectNoHorizontalOverflow(page);
    }
  });
});
