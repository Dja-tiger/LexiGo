import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";
import {
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

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

test.describe("Issue #74 Word Detail Back touch target", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
    await installCanonicalWordDetailFixture(page);
  });

  test("the live Back action exposes a transparent non-overlapping 44/48px target", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Word Detail Back contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
      await expect(page.getByRole("list", { name: "Связанные фразы" })).toBeVisible();

      const expectedName = width <= 600 ? "Слово" : "Словарь";
      const action = page.getByRole("button", { name: expectedName, exact: true });
      await expect(action).toBeVisible();

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));
      const target = await effectiveTarget(action);
      const sectionBox = await page.locator(".lx-word-detail").boundingBox();
      const layoutBox = await page.locator(".lx-word-detail-layout").boundingBox();
      const statusBox = await page.locator(".lx-word-detail-status-chip").boundingBox();
      const statusSeparation = statusBox ? statusBox.x - target.targetRight : Number.NaN;

      expect(target.visualHeight).toBeCloseTo(42, 3);
      expect(target.visualWidth).toBeGreaterThanOrEqual(expectedMinimum);
      expect(target.targetHeight).toBeCloseTo(expectedMinimum, 3);
      expect(target.targetWidth).toBeCloseTo(target.visualWidth, 3);
      expect(target.perimeterHits, "all four effective perimeter points must resolve inside the Back button")
        .toEqual([true, true, true, true]);
      expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
      expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
      expect(target.pseudoBoxShadow).toBe("none");

      expect(sectionBox).not.toBeNull();
      if (sectionBox) {
        expect(target.targetTop).toBeGreaterThanOrEqual(sectionBox.y - 0.5);
      }
      expect(layoutBox).not.toBeNull();
      if (layoutBox) {
        expect(target.targetBottom).toBeLessThanOrEqual(layoutBox.y - 0.5);
      }
      expect(statusBox).not.toBeNull();
      expect(statusSeparation, "the block-axis target must not expand toward the status chip").toBeGreaterThanOrEqual(8);

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
      await expectNoHorizontalOverflow(page);

      await page.mouse.click(
        (target.targetLeft + target.targetRight) / 2,
        target.targetBottom - 1,
      );
      await page.waitForURL((url) => url.pathname === "/dictionary");
      const restoredURL = new URL(page.url());
      expect(restoredURL.searchParams.get("source")).toBe("backend");
      expect(restoredURL.searchParams.get("topic")).toBe("Release");
      expect(restoredURL.searchParams.get("status")).toBe("review");
      expect(restoredURL.searchParams.get("page")).toBe("2");
      await expectNoHorizontalOverflow(page);
    }
  });
});
