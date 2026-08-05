import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveTarget = {
  visualHeight: number;
  visualWidth: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  height: number;
  width: number;
  centerX: number;
  centerY: number;
  perimeterHits: boolean[];
  pseudoContent: string;
};

type GeneratedTarget = Omit<EffectiveTarget, "visualHeight" | "visualWidth" | "pseudoContent">;

function perimeterHitResults(
  control: HTMLElement,
  top: number,
  right: number,
  bottom: number,
  left: number,
): boolean[] {
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const inset = 1;

  return [
    [centerX, top + inset],
    [right - inset, centerY],
    [centerX, bottom - inset],
    [left + inset, centerY],
  ].map(([x, y]) => {
    const hit = document.elementFromPoint(x, y);
    return hit === control || (hit instanceof Node && control.contains(hit));
  });
}

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
  return control.evaluate((element) => {
    const button = element as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    const hitSlop = window.getComputedStyle(button, "::before");
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
      return hit === button || (hit instanceof Node && button.contains(hit));
    });

    return {
      visualHeight: rect.height,
      visualWidth: rect.width,
      top,
      right,
      bottom,
      left,
      height: bottom - top,
      width: right - left,
      centerX,
      centerY,
      perimeterHits,
      pseudoContent: hitSlop.content,
    };
  });
}

async function generatedTarget(control: Locator): Promise<GeneratedTarget> {
  return control.evaluate((element) => {
    const target = element as HTMLElement;
    const rect = target.getBoundingClientRect();
    const style = window.getComputedStyle(target);
    const hitSlop = window.getComputedStyle(target, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const top = rect.top + borderTop + (Number.parseFloat(hitSlop.top) || 0);
    const right = rect.right - borderRight - (Number.parseFloat(hitSlop.right) || 0);
    const bottom = rect.bottom - borderBottom - (Number.parseFloat(hitSlop.bottom) || 0);
    const left = rect.left + borderLeft + (Number.parseFloat(hitSlop.left) || 0);
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
      return hit === target || (hit instanceof Node && target.contains(hit));
    });

    return {
      top,
      right,
      bottom,
      left,
      height: bottom - top,
      width: right - left,
      centerX,
      centerY,
      perimeterHits,
    };
  });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 shared header streak touch target", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("the live streak button exposes a separated 44/48px target and keeps Progress navigation", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The shared header streak target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    const coarseProject = testInfo.project.name !== "desktop-chromium";
    await page.setViewportSize(coarseProject ? { width: 820, height: 1180 } : { width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();

    const streak = page.getByRole("button", { name: /^\d+ дн\.$/ });
    const profile = page.getByRole("button", { name: "Открыть профиль", exact: true });
    const reminderDetails = page.locator(".lx-route-reminder-entry");
    const reminder = reminderDetails.locator("> summary");
    await expect(streak).toBeVisible();
    await expect(profile).toBeVisible();
    await expect(reminder).toBeVisible();

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));
    const streakTarget = await effectiveTarget(streak);
    const profileTarget = await effectiveTarget(profile);
    const reminderTarget = await generatedTarget(reminder);

    expect(streakTarget.height).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
    expect(streakTarget.width).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
    expect(streakTarget.height).toBeCloseTo(streakTarget.visualHeight, 3);
    expect(streakTarget.width).toBeCloseTo(streakTarget.visualWidth, 3);
    expect(streakTarget.pseudoContent).toBe("none");
    expect(streakTarget.perimeterHits, "all four streak border-box points must resolve inside the button")
      .toEqual([true, true, true, true]);

    expect(reminderTarget.height).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
    expect(reminderTarget.width).toBeGreaterThanOrEqual(expectedMinimum - 0.1);
    expect(reminderTarget.perimeterHits, "the shifted reminder surface must remain fully operable")
      .toEqual([true, true, true, true]);
    expect(
      streakTarget.left - reminderTarget.right,
      "the reminder and streak targets must remain separated",
    ).toBeGreaterThanOrEqual(1);
    expect(
      profileTarget.left - streakTarget.right,
      "the streak and profile effective target rectangles must remain separated",
    ).toBeGreaterThanOrEqual(1);

    await page.mouse.click(reminderTarget.left + 1, reminderTarget.centerY);
    await expect(reminderDetails).toHaveAttribute("open", "");
    await page.mouse.click(reminderTarget.left + 1, reminderTarget.centerY);
    await expect(reminderDetails).not.toHaveAttribute("open", "");

    await streak.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(streak).toBeFocused();
    const focus = await streak.evaluate((element) => {
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

    await page.mouse.click(streakTarget.centerX, streakTarget.bottom - 1);
    await expect(page).toHaveURL(/\/progress(?:\?.*)?$/);
    await expect(page.getByRole("main", { name: "Прогресс", exact: true })).toBeVisible();
  });

  test("the existing phone-width responsive owner keeps the streak hidden", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "android-chromium",
      "One coarse-pointer phone viewport is sufficient to protect the intentional hidden state.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();
    await expect(page.locator("button.lx-streak")).toBeHidden();
  });
});