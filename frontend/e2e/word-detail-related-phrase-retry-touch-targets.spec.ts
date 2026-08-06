import { expect, test, type BrowserContext, type Locator, type Page, type Route } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";
import {
  CANONICAL_RELATED_PHRASES,
  CANONICAL_WORD_DETAIL,
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

async function fulfillJSON(
  route: Route,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

async function installRetryableRelatedPhraseFixture(
  context: BrowserContext,
): Promise<() => number> {
  let relatedRequestCount = 0;

  await context.route("**/api/v1/words/101", (route) => (
    fulfillJSON(route, 200, CANONICAL_WORD_DETAIL)
  ));
  await context.route("**/api/v1/words?*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      request.method() !== "GET"
      || url.pathname !== "/api/v1/words"
      || url.searchParams.get("kind") !== "phrase"
      || url.searchParams.get("query") !== CANONICAL_WORD_DETAIL.lemma
    ) {
      await route.fallback();
      return;
    }

    relatedRequestCount += 1;
    if (relatedRequestCount % 2 === 1) {
      await fulfillJSON(
        route,
        503,
        { error: { code: "related_phrases_temporarily_unavailable", message: "retry" } },
        { "x-correlation-id": `word-detail-related-phrases-${relatedRequestCount}` },
      );
      return;
    }

    await fulfillJSON(route, 200, {
      items: CANONICAL_RELATED_PHRASES,
      count: CANONICAL_RELATED_PHRASES.length,
      total: CANONICAL_RELATED_PHRASES.length,
      page: 1,
      pageSize: 3,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });

  return () => relatedRequestCount;
}

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

function rectanglesOverlap(
  left: { top: number; right: number; bottom: number; left: number },
  right: { top: number; right: number; bottom: number; left: number },
): boolean {
  const horizontalIntersection = Math.min(left.right, right.right) - Math.max(left.left, right.left);
  const verticalIntersection = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
  return horizontalIntersection > 0.5 && verticalIntersection > 0.5;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Word Detail related-phrase retry touch target", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("the conditional retry action exposes a transparent 44/48px target and preserves retry semantics", async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Word Detail related-phrase retry contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const getRelatedRequestCount = await installRetryableRelatedPhraseFixture(context);
    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [390, 320];

    for (const width of widths) {
      const requestCountBeforeEntry = getRelatedRequestCount();
      await page.setViewportSize({ width, height: 1100 });
      await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();

      const error = page.locator(".lx-word-detail-inline-error");
      await expect(error).toBeVisible();
      const message = error.locator("span");
      const retry = error.getByRole("button", { name: "Повторить", exact: true });
      await expect(message).toBeVisible();
      await expect(retry).toBeVisible();
      expect(getRelatedRequestCount()).toBe(requestCountBeforeEntry + 1);

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));
      const target = await effectiveTarget(retry);
      const messageBox = await message.boundingBox();
      expect(messageBox).not.toBeNull();
      const messageOverlap = rectanglesOverlap(
        {
          top: target.targetTop,
          right: target.targetRight,
          bottom: target.targetBottom,
          left: target.targetLeft,
        },
        {
          top: messageBox!.y,
          right: messageBox!.x + messageBox!.width,
          bottom: messageBox!.y + messageBox!.height,
          left: messageBox!.x,
        },
      );

      expect(target.visualHeight).toBeCloseTo(36, 2);
      expect(target.targetHeight).toBeCloseTo(Math.max(target.visualHeight, expectedMinimum), 2);
      expect(target.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
      expect(target.targetWidth).toBeCloseTo(target.visualWidth, 2);
      expect(target.perimeterHits).toEqual([true, true, true, true]);
      expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
      expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
      expect(target.pseudoBoxShadow).toBe("none");
      expect(messageOverlap).toBe(false);

      await retry.focus();
      await expect(retry).toBeFocused();
      const focus = await retry.evaluate((element) => {
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
      const list = page.getByRole("list", { name: "Связанные фразы" });
      await expect(list).toBeVisible();
      await expect(list.getByRole("button")).toHaveCount(CANONICAL_RELATED_PHRASES.length);
      expect(getRelatedRequestCount()).toBe(requestCountBeforeEntry + 2);
      await expect(error).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
  });
});
