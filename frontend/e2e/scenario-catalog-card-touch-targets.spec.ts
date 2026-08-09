import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  QUALITY_SCENARIOS,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type EffectiveTarget = EffectiveRect & {
  visualHeight: number;
  visualWidth: number;
  targetHeight: number;
  targetWidth: number;
  perimeterHits: boolean[];
  pseudoBackground: string;
  pseudoBorderWidths: string[];
  pseudoBoxShadow: string;
};

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
  // `scrollIntoViewIfNeeded()` may leave a fully intersecting control beneath the
  // fixed mobile navigation in WebKit. Center the control before real-hit
  // sampling so elementFromPoint measures the target itself, not the app chrome.
  await control.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await expect(control).toBeVisible();

  return control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const pseudo = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const pseudoTop = rect.top + borderTop + (Number.parseFloat(pseudo.top) || 0);
    const pseudoRight = rect.right - borderRight - (Number.parseFloat(pseudo.right) || 0);
    const pseudoBottom = rect.bottom - borderBottom - (Number.parseFloat(pseudo.bottom) || 0);
    const pseudoLeft = rect.left + borderLeft + (Number.parseFloat(pseudo.left) || 0);
    const top = Math.min(rect.top, pseudoTop);
    const right = Math.max(rect.right, pseudoRight);
    const bottom = Math.max(rect.bottom, pseudoBottom);
    const left = Math.min(rect.left, pseudoLeft);
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    const inset = 1;
    const perimeterHits = [
      [centerX, top + inset],
      [right - inset, centerY],
      [centerX, bottom - inset],
      [left + inset, centerY],
    ].map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === element || (hit instanceof Node && element.contains(hit));
    });

    return {
      visualHeight: rect.height,
      visualWidth: rect.width,
      top,
      right,
      bottom,
      left,
      targetHeight: bottom - top,
      targetWidth: right - left,
      perimeterHits,
      pseudoBackground: pseudo.backgroundColor,
      pseudoBorderWidths: [
        pseudo.borderTopWidth,
        pseudo.borderRightWidth,
        pseudo.borderBottomWidth,
        pseudo.borderLeftWidth,
      ],
      pseudoBoxShadow: pseudo.boxShadow,
    };
  });
}

async function effectiveRectsInCommonFrame(controls: Locator): Promise<EffectiveRect[]> {
  return controls.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const pseudo = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const pseudoTop = rect.top + borderTop + (Number.parseFloat(pseudo.top) || 0);
    const pseudoRight = rect.right - borderRight - (Number.parseFloat(pseudo.right) || 0);
    const pseudoBottom = rect.bottom - borderBottom - (Number.parseFloat(pseudo.bottom) || 0);
    const pseudoLeft = rect.left + borderLeft + (Number.parseFloat(pseudo.left) || 0);

    return {
      top: Math.min(rect.top, pseudoTop),
      right: Math.max(rect.right, pseudoRight),
      bottom: Math.max(rect.bottom, pseudoBottom),
      left: Math.min(rect.left, pseudoLeft),
    };
  }));
}

function intersects(first: EffectiveRect, second: EffectiveRect): boolean {
  const overlapWidth = Math.min(first.right, second.right) - Math.max(first.left, second.left);
  const overlapHeight = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return overlapWidth > 0.5 && overlapHeight > 0.5;
}

function expectIndependent(rects: EffectiveRect[], label: string): void {
  for (let first = 0; first < rects.length; first += 1) {
    for (let second = first + 1; second < rects.length; second += 1) {
      expect(intersects(rects[first], rects[second]), `${label} ${first} and ${second} must not intersect`).toBe(false);
    }
  }
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Scenario Catalog card-link touch targets", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("catalog cards expose independent 44/48px real-hit links without changing paint", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Scenario Catalog card-link target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const viewport = testInfo.project.name === "desktop-chromium"
      ? { width: 1440, height: 900 }
      : { width: 390, height: 844 };
    await page.setViewportSize(viewport);
    await page.goto("/scenarios", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Рабочие сценарии", exact: true })).toBeVisible();
    const links = page.getByRole("link", { name: /^Открыть сценарий «/ });
    await expect(links).toHaveCount(QUALITY_SCENARIOS.length);

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));

    for (let index = 0; index < QUALITY_SCENARIOS.length; index += 1) {
      const link = links.nth(index);
      await expect(link).toHaveAttribute("href", `/scenarios/${QUALITY_SCENARIOS[index].slug}`);
      const target = await effectiveTarget(link);
      expect(target.visualHeight).toBeCloseTo(44, 3);
      expect(target.visualWidth).toBeGreaterThanOrEqual(44 - 0.5);
      expect(target.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
      expect(target.targetWidth).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
      expect(target.perimeterHits, "all four effective-target perimeter points must resolve inside the owning card link")
        .toEqual([true, true, true, true]);
      expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
      expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
      expect(target.pseudoBoxShadow).toBe("none");
    }

    const listing = page.locator(".lx-scenario-catalog-listing");
    await listing.scrollIntoViewIfNeeded();
    expectIndependent(await effectiveRectsInCommonFrame(links), "Scenario Catalog card-link targets");

    const first = links.first();
    await first.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    const focus = await first.evaluate((element) => {
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

    await expectNoHorizontalOverflow(page);

    await first.click();
    await expect(page).toHaveURL(`/scenarios/${QUALITY_SCENARIOS[0].slug}`);
  });
});
