import { expect, test, type Locator, type Page } from "@playwright/test";

import {
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
  await control.scrollIntoViewIfNeeded();
  return control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const pseudo = window.getComputedStyle(element, "::before");
    const pseudoTop = rect.top + (Number.parseFloat(pseudo.top) || 0);
    const pseudoRight = rect.right - (Number.parseFloat(pseudo.right) || 0);
    const pseudoBottom = rect.bottom - (Number.parseFloat(pseudo.bottom) || 0);
    const pseudoLeft = rect.left + (Number.parseFloat(pseudo.left) || 0);
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

async function effectiveRects(controls: Locator): Promise<EffectiveRect[]> {
  return controls.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    const pseudo = window.getComputedStyle(element, "::before");
    const pseudoTop = rect.top + (Number.parseFloat(pseudo.top) || 0);
    const pseudoRight = rect.right - (Number.parseFloat(pseudo.right) || 0);
    const pseudoBottom = rect.bottom - (Number.parseFloat(pseudo.bottom) || 0);
    const pseudoLeft = rect.left + (Number.parseFloat(pseudo.left) || 0);

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

test.describe("Issue #74 Learning section switch touch targets", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("canonical Learn and Scenario switches expose independent 44/48px real-hit targets", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Learning subsection target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const viewport = testInfo.project.name === "desktop-chromium"
      ? { width: 1440, height: 900 }
      : { width: 390, height: 844 };
    await page.setViewportSize(viewport);

    for (const route of ["/learn", "/scenarios"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      const switcher = page.getByRole("navigation", { name: "Разделы обучения", exact: true });
      await expect(switcher).toBeVisible();
      const links = switcher.getByRole("link");
      await expect(links).toHaveCount(2);

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));

      for (let index = 0; index < 2; index += 1) {
        const target = await effectiveTarget(links.nth(index));
        expect(target.visualHeight).toBeCloseTo(44, 3);
        expect(target.visualWidth).toBeGreaterThanOrEqual(120 - 0.5);
        expect(target.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
        expect(target.targetWidth).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
        expect(target.perimeterHits, "all four effective-target perimeter points must resolve inside the owning link")
          .toEqual([true, true, true, true]);
        expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
        expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
        expect(target.pseudoBoxShadow).toBe("none");
      }

      expectIndependent(await effectiveRects(links), `${route} subsection targets`);

      const lessons = switcher.getByRole("link", { name: "Уроки", exact: true });
      const scenarios = switcher.getByRole("link", { name: "Сценарии", exact: true });
      if (route === "/learn") {
        await expect(lessons).toHaveAttribute("aria-current", "page");
        await expect(scenarios).not.toHaveAttribute("aria-current", "page");
      } else {
        await expect(scenarios).toHaveAttribute("aria-current", "page");
        await expect(lessons).not.toHaveAttribute("aria-current", "page");
      }

      await page.keyboard.press("Tab");
      await lessons.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(lessons).toBeFocused();
      const focus = await lessons.evaluate((element) => {
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
    }
  });
});
