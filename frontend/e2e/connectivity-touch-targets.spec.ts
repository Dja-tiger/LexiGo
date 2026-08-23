import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveTarget = {
  label: string;
  visualHeight: number;
  visualWidth: number;
  targetHeight: number;
  insetInlineStart: string;
  insetInlineEnd: string;
  perimeterHits: boolean[];
};

async function connectivityActionTarget(button: Locator): Promise<EffectiveTarget> {
  return button.evaluate((element) => {
    const control = element as HTMLButtonElement;
    const rect = control.getBoundingClientRect();
    const style = window.getComputedStyle(control);
    const hitSlop = window.getComputedStyle(control, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const topInset = Number.parseFloat(hitSlop.top) || 0;
    const bottomInset = Number.parseFloat(hitSlop.bottom) || 0;
    const targetTop = rect.top + borderTop + topInset;
    const targetBottom = rect.bottom - borderBottom - bottomInset;
    const centerX = rect.left + rect.width / 2;
    const inset = 1;
    const perimeterHits = [targetTop + inset, targetBottom - inset].map((y) => {
      const hit = document.elementFromPoint(centerX, y);
      return hit === control || (hit instanceof Node && control.contains(hit));
    });

    return {
      label: control.textContent?.trim() ?? control.className,
      visualHeight: rect.height,
      visualWidth: rect.width,
      targetHeight: targetBottom - targetTop,
      insetInlineStart: hitSlop.insetInlineStart,
      insetInlineEnd: hitSlop.insetInlineEnd,
      perimeterHits,
    };
  });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 connectivity action touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("the live offline action exposes a paint-inert 44/48px hit surface", async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The connectivity target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    const compact = testInfo.project.name !== "desktop-chromium";
    await page.setViewportSize(compact ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();

    await context.setOffline(true);
    const connectivity = page.getByRole("complementary", { name: "Состояние подключения и синхронизации" });
    await expect(connectivity.getByText("Нет подключения к сети", { exact: true })).toBeVisible();

    const action = connectivity.getByRole("button", { name: "Подробнее", exact: true });
    await expect(action).toBeVisible();
    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));
    const target = await connectivityActionTarget(action);

    expect(target.visualHeight).toBeGreaterThanOrEqual(39);
    expect(target.visualHeight).toBeLessThanOrEqual(41);
    expect(target.visualWidth).toBeGreaterThanOrEqual(expectedMinimum);
    expect(target.targetHeight).toBeCloseTo(expectedMinimum, 3);
    expect(target.insetInlineStart).toBe("0px");
    expect(target.insetInlineEnd).toBe("0px");
    expect(target.perimeterHits, `${target.label} top/bottom perimeter must resolve inside the button`)
      .toEqual([true, true]);

    await action.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
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
  });
});
