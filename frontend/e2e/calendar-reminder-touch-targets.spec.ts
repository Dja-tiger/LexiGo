import { expect, test, type Locator } from "@playwright/test";

import { installQualityGateAPI } from "./support/quality-gates";

type EffectiveRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

async function effectiveTarget(control: Locator) {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });

  return control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const pseudo = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const topInset = Number.parseFloat(pseudo.top) || 0;
    const rightInset = Number.parseFloat(pseudo.right) || 0;
    const bottomInset = Number.parseFloat(pseudo.bottom) || 0;
    const leftInset = Number.parseFloat(pseudo.left) || 0;
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
      return hit === element || (hit instanceof Node && element.contains(hit));
    });

    return {
      visualHeight: rect.height,
      visualWidth: rect.width,
      targetHeight: targetBottom - targetTop,
      targetWidth: targetRight - targetLeft,
      targetRect: {
        top: targetTop,
        right: targetRight,
        bottom: targetBottom,
        left: targetLeft,
      },
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

function targetsIntersect(first: EffectiveRect, second: EffectiveRect): boolean {
  const overlapWidth = Math.min(first.right, second.right) - Math.max(first.left, second.left);
  const overlapHeight = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return overlapWidth > 0.5 && overlapHeight > 0.5;
}

async function expectTarget(control: Locator, minimum: number) {
  await expect(control).toBeVisible();
  const target = await effectiveTarget(control);
  expect(target.targetHeight).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.targetWidth).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.perimeterHits).toEqual([true, true, true, true]);
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  return target;
}

test.describe("Issue #74 calendar reminder touch targets", () => {
  test.describe.configure({ timeout: 90_000 });

  test("preview, close and weekday controls expose independent 44/48px targets", async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "Calendar target acceptance runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    await installQualityGateAPI(context);
    await page.goto("/progress", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));

    const routeEntry = page.locator(".lx-route-reminder-entry");
    const disclosure = routeEntry.locator(":scope > summary");
    await disclosure.click();
    const preview = routeEntry.getByRole("region", { name: "Текущее напоминание о занятии" });
    await expect(preview).toBeVisible();
    const previewAction = preview.getByRole("button", { name: "Настроить календарь" });
    const previewTarget = await expectTarget(previewAction, expectedMinimum);
    expect(previewTarget.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);

    await previewAction.click();
    const dialog = page.getByRole("dialog", { name: "Напоминание об английском" });
    await expect(dialog).toBeVisible();

    const close = dialog.getByRole("button", { name: "Закрыть" });
    const closeTarget = await expectTarget(close, expectedMinimum);
    expect(closeTarget.visualHeight).toBeLessThan(44);
    expect(closeTarget.visualWidth).toBeLessThan(44);

    await dialog.getByLabel("Повторение").selectOption("custom");
    const weekdays = dialog.locator(".lx-calendar-weekdays button");
    await expect(weekdays).toHaveCount(7);

    const weekdayRects: EffectiveRect[] = [];
    for (let index = 0; index < 7; index += 1) {
      const weekday = weekdays.nth(index);
      const target = await expectTarget(weekday, expectedMinimum);
      weekdayRects.push(target.targetRect);
    }

    for (let first = 0; first < weekdayRects.length; first += 1) {
      for (let second = first + 1; second < weekdayRects.length; second += 1) {
        expect(
          targetsIntersect(weekdayRects[first], weekdayRects[second]),
          `weekday targets ${first} and ${second} must remain independent`,
        ).toBe(false);
      }
    }

    const title = dialog.getByRole("heading", { name: "Напоминание об английском" });
    await title.focus();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    const focus = await close.evaluate((element) => {
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

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});
