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
  minimum: number;
  perimeterHits: boolean[];
};

async function effectiveTarget(locator: Locator): Promise<EffectiveTarget> {
  return locator.evaluate((element) => {
    const control = element as HTMLElement;
    const rect = control.getBoundingClientRect();
    const tools = control.closest<HTMLElement>(".lx-header-tools");
    if (!tools) throw new Error("Header tools owner was not found");

    const minimum = Number.parseFloat(
      window.getComputedStyle(tools).getPropertyValue("--lx-shared-header-touch-target"),
    );
    const width = Math.max(rect.width, minimum);
    const height = Math.max(rect.height, minimum);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const inset = 1;
    const points = [
      [centerX - width / 2 + inset, centerY],
      [centerX + width / 2 - inset, centerY],
      [centerX, centerY - height / 2 + inset],
      [centerX, centerY + height / 2 - inset],
    ];
    const perimeterHits = points.map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === control || (hit instanceof Node && control.contains(hit));
    });

    return {
      label: control.getAttribute("aria-label") ?? control.textContent?.trim() ?? control.className,
      left: centerX - width / 2,
      right: centerX + width / 2,
      top: centerY - height / 2,
      bottom: centerY + height / 2,
      minimum,
      perimeterHits,
    };
  });
}

async function expectTarget(locator: Locator, expectedMinimum: number): Promise<EffectiveTarget> {
  await expect(locator).toBeVisible();
  const target = await effectiveTarget(locator);
  expect(target.minimum).toBe(expectedMinimum);
  expect(target.right - target.left).toBeGreaterThanOrEqual(expectedMinimum);
  expect(target.bottom - target.top).toBeGreaterThanOrEqual(expectedMinimum);
  expect(target.perimeterHits, `${target.label} perimeter must resolve to its control`).toEqual([
    true,
    true,
    true,
    true,
  ]);

  await locator.focus();
  const focus = await locator.evaluate((element) => {
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

function expectSeparated(left: EffectiveTarget, right: EffectiveTarget, minimumGap = 4): void {
  const first = left.left <= right.left ? left : right;
  const second = first === left ? right : left;
  expect(second.left - first.right).toBeGreaterThanOrEqual(minimumGap);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 shared header touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("home streak/avatar and dictionary reminder/avatar expose non-overlapping effective targets", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The shared target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    const compact = testInfo.project.name !== "desktop-chromium";
    await page.setViewportSize(compact ? { width: 390, height: 844 } : { width: 1440, height: 900 });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
    const expectedMinimum = await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches ? 48 : 44);
    const homeStreak = page.locator(".lx-header-tools button.lx-streak");
    const homeAvatar = page.locator(".lx-header-tools button.lx-avatar");
    const homeStreakTarget = await expectTarget(homeStreak, expectedMinimum);
    const homeAvatarTarget = await expectTarget(homeAvatar, expectedMinimum);
    expectSeparated(homeStreakTarget, homeAvatarTarget);
    await expectNoHorizontalOverflow(page);

    await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
    const reminder = page.getByRole("button", { name: "Напоминание о занятии" });
    const dictionaryAvatar = page.getByRole("button", { name: "Открыть профиль" });
    const reminderTarget = await expectTarget(reminder, expectedMinimum);
    const dictionaryAvatarTarget = await expectTarget(dictionaryAvatar, expectedMinimum);
    expectSeparated(reminderTarget, dictionaryAvatarTarget);
    await expectNoHorizontalOverflow(page);
  });
});
