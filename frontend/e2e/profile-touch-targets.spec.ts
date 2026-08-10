import { expect, test, type Locator, type Page } from "@playwright/test";

import { installQualityGateAPI } from "./support/quality-gates";

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
  pseudoPointerEvents: string;
};

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
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
      pseudoPointerEvents: pseudo.pointerEvents,
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

function computedColorAlpha(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "transparent") return 0;

  const legacyRgba = normalized.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+%?)\s*\)$/);
  const modernRgb = normalized.match(/^rgba?\(.+?\/\s*([\d.]+%?)\s*\)$/);
  const rawAlpha = legacyRgba?.[1] ?? modernRgb?.[1];
  if (!rawAlpha) return null;

  const alpha = Number.parseFloat(rawAlpha);
  if (!Number.isFinite(alpha)) return null;
  return rawAlpha.endsWith("%") ? alpha / 100 : alpha;
}

async function expectedMinimum(page: Page): Promise<number> {
  return page.evaluate(() => window.matchMedia("(pointer: coarse)").matches ? 48 : 44);
}

async function expectTargetContract(control: Locator, minimum: number, label: string): Promise<EffectiveTarget> {
  const target = await effectiveTarget(control);
  expect(target.targetHeight, `${label} effective height`).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.targetWidth, `${label} effective width`).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.perimeterHits, `${label} four-side real-hit proof`).toEqual([true, true, true, true]);
  expect(computedColorAlpha(target.pseudoBackground), `${label} pseudo background alpha`).toBe(0);
  expect(target.pseudoBorderWidths, `${label} pseudo border`).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow, `${label} pseudo shadow`).toBe("none");
  expect(target.pseudoPointerEvents, `${label} pseudo pointer ownership`).toBe("auto");
  return target;
}

async function expectFamilyContract(controls: Locator, minimum: number, label: string): Promise<EffectiveTarget[]> {
  const count = await controls.count();
  expect(count, `${label} controls`).toBeGreaterThan(0);
  const targets: EffectiveTarget[] = [];
  for (let index = 0; index < count; index += 1) {
    targets.push(await expectTargetContract(controls.nth(index), minimum, `${label} ${index}`));
  }
  expectIndependent(await effectiveRectsInCommonFrame(controls), `${label} effective targets`);
  return targets;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function applyTextZoom(page: Page, percent = 200): Promise<void> {
  const stylesheetPath = `/__e2e__/profile-touch-target-text-zoom-${percent}.css`;
  await page.route(`**${stylesheetPath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      body: `html { font-size: ${percent}% !important; }`,
    });
  });
  await page.addStyleTag({ url: new URL(stylesheetPath, page.url()).toString() });
  await expect.poll(async () => page.evaluate(() => (
    Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
  ))).toBeGreaterThanOrEqual(32);
}

const TARGET_PROJECTS = ["desktop-chromium", "android-chromium", "ios-webkit"];

test.describe("Issue #460 Profile touch targets", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(!TARGET_PROJECTS.includes(testInfo.project.name), "Profile target proof runs in the three release browser/device projects.");
    await installQualityGateAPI(context);
  });

  test("Profile compact controls expose independent 44/48px real-hit surfaces without repainting", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-route-client-island="profile"]')).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Дневная цель" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Оформление приложения" })).toBeVisible();

    const minimum = await expectedMinimum(page);
    const secondary = await expectFamilyContract(
      page.locator(".lx-profile-secondary-button:visible:not(:disabled)"),
      minimum,
      "Profile secondary button",
    );
    const goals = await expectFamilyContract(
      page.locator(".lx-profile-goal-option:visible:not(:disabled)"),
      minimum,
      "Profile goal option",
    );
    const appearance = await expectFamilyContract(
      page.locator(".lx-profile-appearance-option:visible:not(:disabled)"),
      minimum,
      "Profile appearance option",
    );

    expect(secondary.some((target) => target.visualHeight < minimum - 0.5), "secondary controls need effective expansion").toBe(true);
    expect(goals.some((target) => target.visualHeight < minimum - 0.5), "goal controls need effective expansion").toBe(true);
    expect(appearance.some((target) => target.visualHeight < minimum - 0.5), "appearance controls need effective expansion").toBe(true);
    await expectNoHorizontalOverflow(page);
  });

  test("320px / 200% text Profile retains independent coarse targets without horizontal overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ios-webkit", "The compact 200% reflow proof runs in iOS WebKit.");
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await applyTextZoom(page);

    await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
    const minimum = await expectedMinimum(page);
    expect(minimum).toBe(48);

    await expectFamilyContract(
      page.locator(".lx-profile-secondary-button:visible:not(:disabled)"),
      minimum,
      "Zoomed Profile secondary button",
    );
    await expectFamilyContract(
      page.locator(".lx-profile-goal-option:visible:not(:disabled)"),
      minimum,
      "Zoomed Profile goal option",
    );
    await expectFamilyContract(
      page.locator(".lx-profile-appearance-option:visible:not(:disabled)"),
      minimum,
      "Zoomed Profile appearance option",
    );
    await expectNoHorizontalOverflow(page);
  });

  test("forced colors keeps the interaction layer paint-inert and keyboard semantics operable", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Forced colors are asserted in desktop Chromium.");
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await page.goto("/profile", { waitUntil: "domcontentloaded" });

    const minimum = await expectedMinimum(page);
    const appearanceGroup = page.getByRole("radiogroup", { name: "Оформление приложения" });
    const light = appearanceGroup.getByRole("radio", { name: "Светлая: Всегда светлая" });
    await expectTargetContract(light, minimum, "Forced-colors appearance option");
    await light.focus();
    await page.keyboard.press("ArrowRight");
    await expect(appearanceGroup.getByRole("radio", { name: "Тёмная: Всегда тёмная" })).toBeFocused();
    await expect(appearanceGroup.getByRole("radio", { name: "Тёмная: Всегда тёмная" })).toHaveAttribute("aria-checked", "true");
    await expectNoHorizontalOverflow(page);
  });
});
