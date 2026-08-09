import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveTarget = {
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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Progress guest login touch target", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await context.clearCookies();
    await installQualityGateAPI(context, { authenticated: false });
  });

  test("guest login exposes a 44/48px real-hit target without changing the painted button", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Progress guest-login target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const viewport = testInfo.project.name === "desktop-chromium"
      ? { width: 768, height: 844 }
      : { width: 390, height: 844 };
    await page.setViewportSize(viewport);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });

    const main = page.getByRole("main", { name: "Прогресс", exact: true });
    await expect(main).toBeVisible();
    await expect(page.getByRole("heading", {
      level: 1,
      name: "Войдите, чтобы видеть результат обучения",
      exact: true,
    })).toBeVisible();

    const login = main.getByRole("button", { name: "Войти и открыть прогресс", exact: true });
    await expect(login).toBeVisible();
    await expect(main.getByRole("button")).toHaveCount(1);

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));
    const target = await effectiveTarget(login);
    expect(target.visualHeight).toBeCloseTo(44, 3);
    expect(target.visualWidth).toBeGreaterThanOrEqual(44 - 0.5);
    expect(target.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
    expect(target.targetWidth).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
    expect(target.perimeterHits, "all four effective-target perimeter points must resolve inside the login button")
      .toEqual([true, true, true, true]);
    expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
    expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
    expect(target.pseudoBoxShadow).toBe("none");

    await login.focus();
    await expect(login).toBeFocused();
    const focus = await login.evaluate((element) => {
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

    await login.click();
    await expect(page).toHaveURL(/\/profile\?session=required&return_to=%2Fprogress$/);
  });
});
