import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";
import {
  CANONICAL_RELATED_PHRASES,
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

type EffectiveTarget = {
  visualTop: number;
  visualRight: number;
  visualBottom: number;
  visualLeft: number;
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
      visualTop: rect.top,
      visualRight: rect.right,
      visualBottom: rect.bottom,
      visualLeft: rect.left,
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

function targetOverlap(left: EffectiveTarget, right: EffectiveTarget): boolean {
  const horizontalIntersection = Math.min(left.targetRight, right.targetRight)
    - Math.max(left.targetLeft, right.targetLeft);
  const verticalIntersection = Math.min(left.targetBottom, right.targetBottom)
    - Math.max(left.targetTop, right.targetTop);
  return horizontalIntersection > 0.5 && verticalIntersection > 0.5;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Word Detail related-phrase touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
    await installCanonicalWordDetailFixture(page);
  });

  test("all live phrase pills expose transparent non-overlapping 44/48px targets", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Word Detail related-phrase contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1100 });
      await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();

      const list = page.getByRole("list", { name: "Связанные фразы" });
      await expect(list).toBeVisible();
      const actions = list.getByRole("button");
      await expect(actions).toHaveCount(CANONICAL_RELATED_PHRASES.length);

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));
      const rowGap = await list.evaluate((element) => Number.parseFloat(window.getComputedStyle(element).rowGap));
      expect(rowGap).toBe(expectedMinimum === 48 ? 14 : 10);

      const targets: EffectiveTarget[] = [];
      for (const phrase of CANONICAL_RELATED_PHRASES) {
        const action = list.getByRole("button", { name: phrase.lemma, exact: true });
        await expect(action).toBeVisible();
        const target = await effectiveTarget(action);
        targets.push(target);

        expect(target.visualHeight).toBeGreaterThanOrEqual(34);
        expect(target.targetHeight).toBeCloseTo(Math.max(target.visualHeight, expectedMinimum), 2);
        expect(target.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
        expect(target.targetWidth).toBeCloseTo(target.visualWidth, 2);
        expect(target.perimeterHits, `all four perimeter points must resolve inside ${phrase.lemma}`)
          .toEqual([true, true, true, true]);
        expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
        expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
        expect(target.pseudoBoxShadow).toBe("none");
      }

      expect(targets[0]?.visualHeight).toBeCloseTo(34, 2);
      for (let leftIndex = 0; leftIndex < targets.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < targets.length; rightIndex += 1) {
          expect(
            targetOverlap(targets[leftIndex], targets[rightIndex]),
            `effective targets ${leftIndex} and ${rightIndex} must not overlap at ${width}px`,
          ).toBe(false);
        }
      }

      const firstAction = list.getByRole("button", {
        name: CANONICAL_RELATED_PHRASES[0].lemma,
        exact: true,
      });
      await firstAction.focus();
      await expect(firstAction).toBeFocused();
      const focus = await firstAction.evaluate((element) => {
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

      const firstTarget = targets[0];
      await page.mouse.click(
        (firstTarget.targetLeft + firstTarget.targetRight) / 2,
        firstTarget.targetBottom - 1,
      );
      await page.waitForURL((url) => url.pathname === "/phrases/prepare-a-rollback-plan");
      await expectNoHorizontalOverflow(page);
    }
  });
});
