import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveTarget = {
  label: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  visualWidth: number;
  visualHeight: number;
  perimeterHits: boolean[];
};

async function reminderTarget(button: Locator): Promise<EffectiveTarget> {
  return button.evaluate((element) => {
    const control = element as HTMLButtonElement;
    const svg = control.querySelector<SVGSVGElement>(":scope > svg");
    if (!svg) throw new Error("Reminder SVG hit surface was not found");

    const rect = svg.getBoundingClientRect();
    const style = window.getComputedStyle(svg);
    const paddingX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
    const paddingY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const inset = 1;
    const points = [
      [rect.left + inset, rect.top + rect.height / 2],
      [rect.right - inset, rect.top + rect.height / 2],
      [rect.left + rect.width / 2, rect.top + inset],
      [rect.left + rect.width / 2, rect.bottom - inset],
    ];
    const perimeterHits = points.map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === control || hit === svg || (hit instanceof Node && control.contains(hit));
    });

    return {
      label: control.getAttribute("aria-label") ?? control.className,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      visualWidth: rect.width - paddingX,
      visualHeight: rect.height - paddingY,
      perimeterHits,
    };
  });
}

async function expectReminderTarget(button: Locator, expectedMinimum: number): Promise<EffectiveTarget> {
  await expect(button).toBeVisible();
  const target = await reminderTarget(button);
  expect(target.width).toBe(expectedMinimum);
  expect(target.height).toBe(expectedMinimum);
  expect(target.visualWidth).toBeCloseTo(19, 3);
  expect(target.visualHeight).toBeCloseTo(19, 3);
  expect(target.perimeterHits, `${target.label} perimeter must resolve inside the button`).toEqual([
    true,
    true,
    true,
    true,
  ]);

  await button.focus();
  const focus = await button.evaluate((element) => {
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
  return target;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Dictionary reminder touch target", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("the 19px reminder icon exposes a non-overlapping 44/48px hit surface", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The reminder target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    const compact = testInfo.project.name !== "desktop-chromium";
    await page.setViewportSize(compact ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();

    const expectedMinimum = await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches ? 48 : 44);
    const reminder = page.getByRole("button", { name: "Напоминание о занятии" });
    const target = await expectReminderTarget(reminder, expectedMinimum);
    const avatarBox = await page.getByRole("button", { name: "Открыть профиль" }).boundingBox();
    expect(avatarBox).not.toBeNull();
    expect((avatarBox?.x ?? 0) - target.right).toBeGreaterThanOrEqual(4);
    await expectNoHorizontalOverflow(page);
  });
});
