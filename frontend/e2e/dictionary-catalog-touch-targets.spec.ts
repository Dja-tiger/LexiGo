import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_WORDS,
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

async function installTwoPageDictionary(context: BrowserContext): Promise<void> {
  await context.route(/\/api\/v1\/words(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const requestedPage = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const page = Math.min(requestedPage, 2);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: QUALITY_WORDS,
        count: QUALITY_WORDS.length,
        total: 96,
        page,
        pageSize: 48,
        totalPages: 2,
        hasPrevious: page > 1,
        hasNext: page < 2,
      }),
    });
  });
}

async function scrollEffectiveTargetIntoView(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const pseudo = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const pseudoTop = rect.top + borderTop + (Number.parseFloat(pseudo.top) || 0);
    const pseudoBottom = rect.bottom - borderBottom - (Number.parseFloat(pseudo.bottom) || 0);
    const targetTop = Math.min(rect.top, pseudoTop);
    const targetBottom = Math.max(rect.bottom, pseudoBottom);
    const margin = 10;

    if (targetTop < margin) {
      window.scrollBy(0, targetTop - margin);
    } else if (targetBottom > window.innerHeight - margin) {
      window.scrollBy(0, targetBottom - window.innerHeight + margin);
    }
  });
}

async function effectiveTarget(control: Locator): Promise<EffectiveTarget> {
  await scrollEffectiveTargetIntoView(control);
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

async function effectiveRects(controls: Locator): Promise<EffectiveRect[]> {
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

async function expectEffectiveMinimum(control: Locator, minimum: number): Promise<EffectiveTarget> {
  await expect(control).toBeVisible();
  const target = await effectiveTarget(control);
  expect(target.targetHeight).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.targetWidth).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.perimeterHits, "all four effective-target perimeter points must resolve inside the owning control")
    .toEqual([true, true, true, true]);
  expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow).toBe("none");
  return target;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe("Issue #74 Dictionary catalog touch targets", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
    await installTwoPageDictionary(context);
  });

  test("live filters and pagination expose independent 44/48px real-hit targets", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Dictionary catalog target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));

      const quickFilters = page.getByRole("navigation", { name: "Быстрые фильтры словаря", exact: true }).getByRole("button");
      await expect(quickFilters).toHaveCount(4);
      for (let index = 0; index < 4; index += 1) {
        const target = await expectEffectiveMinimum(quickFilters.nth(index), expectedMinimum);
        expect(target.visualHeight).toBeCloseTo(34, 3);
      }
      expectIndependent(await effectiveRects(quickFilters), "quick-filter targets");

      const weakFilter = page.getByRole("button", { name: "Слабые", exact: true });
      await weakFilter.click();
      await expect(weakFilter).toHaveAttribute("aria-pressed", "true");

      if (width <= 760) {
        const toggle = page.getByRole("button", { name: /Фильтры и сортировка/ });
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
      }

      const panel = page.getByRole("complementary", { name: "Фильтры словаря", exact: true });
      await expect(panel).toBeVisible();
      const panelButtons = panel.getByRole("button");
      await expect(panelButtons).toHaveCount(18);
      for (let index = 0; index < 18; index += 1) {
        await expectEffectiveMinimum(panelButtons.nth(index), expectedMinimum);
      }

      const firstSource = panel.getByRole("button", { name: "Все разделы", exact: true });
      const sourceTarget = await effectiveTarget(firstSource);
      expect(sourceTarget.visualHeight).toBeCloseTo(38, 3);
      const reset = panel.getByRole("button", { name: "Сбросить фильтры", exact: true });
      const resetTarget = await effectiveTarget(reset);
      expect(resetTarget.visualHeight).toBeGreaterThanOrEqual(46 - 0.5);

      for (const group of [
        panel.locator(".lx-dictionary-filter-stack").nth(0),
        panel.locator(".lx-dictionary-filter-grid"),
        panel.locator(".lx-dictionary-filter-stack").nth(1),
      ]) {
        const buttons = group.getByRole("button");
        expectIndependent(await effectiveRects(buttons), "panel-filter targets");
      }

      const verbs = panel.getByRole("button", { name: "Глаголы", exact: true });
      await verbs.click();
      await expect(verbs).toHaveAttribute("aria-pressed", "true");
      const alphabetical = panel.getByRole("button", { name: "По алфавиту A–Z", exact: true });
      await alphabetical.click();
      await expect(alphabetical).toHaveAttribute("aria-pressed", "true");

      const topic = page.getByRole("combobox", { name: "Тема словаря", exact: true });
      const topicLabel = topic.locator("xpath=..");
      await topic.scrollIntoViewIfNeeded();
      const [topicBox, topicLabelBox] = await Promise.all([topic.boundingBox(), topicLabel.boundingBox()]);
      expect(topicBox).not.toBeNull();
      expect(topicLabelBox).not.toBeNull();
      if (topicBox && topicLabelBox) {
        expect(topicBox.height).toBeGreaterThanOrEqual(44 - 0.5);
        expect(topicLabelBox.height).toBeGreaterThanOrEqual(48 - 0.5);
        const association = await topic.evaluate((element) => {
          const select = element as HTMLSelectElement;
          const label = select.closest("label");
          return {
            labelControlsSelect: label instanceof HTMLLabelElement && label.control === select,
            selectListsLabel: Boolean(label && select.labels && Array.from(select.labels).includes(label)),
          };
        });
        expect(association).toEqual({ labelControlsSelect: true, selectListsLabel: true });
      }

      const nextPage = page.getByRole("button", { name: "Следующая →", exact: true });
      const nextTarget = await expectEffectiveMinimum(nextPage, expectedMinimum);
      expect(nextTarget.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);
      await nextPage.click();
      await expect(page.getByText("Страница 2 из 2", { exact: true })).toBeVisible();
      const previousPage = page.getByRole("button", { name: "← Предыдущая", exact: true });
      await expectEffectiveMinimum(previousPage, expectedMinimum);

      const focusTarget = page.getByRole("button", { name: "Все", exact: true });
      await focusTarget.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(focusTarget).toBeFocused();
      const focus = await focusTarget.evaluate((element) => {
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

  test("guest catalog-kind switch exposes independent 44/48px real-hit targets", async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The guest Dictionary catalog-kind contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    await context.unroute("**/api/v1/**");
    await context.clearCookies();
    await installQualityGateAPI(context, { authenticated: false });

    const widths = testInfo.project.name === "desktop-chromium" ? [768] : [768, 390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/dictionary", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));
      const catalogKinds = page
        .getByRole("navigation", { name: "Тип каталога", exact: true })
        .getByRole("button");
      await expect(catalogKinds).toHaveCount(2);

      for (let index = 0; index < 2; index += 1) {
        const target = await expectEffectiveMinimum(catalogKinds.nth(index), expectedMinimum);
        if (width > 640) {
          expect(target.visualHeight).toBeCloseTo(44, 3);
        } else {
          expect(target.visualHeight).toBeGreaterThanOrEqual(48 - 0.5);
        }
      }
      expectIndependent(await effectiveRects(catalogKinds), "guest catalog-kind targets");

      const phrases = page.getByRole("button", { name: "Рабочие фразы", exact: true });
      await phrases.focus();
      await expect(phrases).toBeFocused();
      const focus = await phrases.evaluate((element) => {
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

      await phrases.click();
      await expect(page).toHaveURL(/\/phrases$/);
    }
  });
});