import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type EffectiveTarget = {
  visualHeight: number;
  visualWidth: number;
  targetTop: number;
  targetRight: number;
  targetBottom: number;
  targetLeft: number;
  targetHeight: number;
  targetWidth: number;
  perimeterHits: boolean[];
  pseudoBackground: string;
  pseudoBorderWidths: string[];
  pseudoBoxShadow: string;
};

async function scrollEffectiveTargetIntoView(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    /*
     * Playwright considers a control visible even when a fixed mobile-nav
     * overlay covers part of it. Center the painted owner before probing its
     * transparent perimeter so elementFromPoint measures the target itself,
     * not an unrelated fixed navigation layer.
     */
    element.scrollIntoView({ block: "center", inline: "nearest" });

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const hitSlop = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const topInset = Number.parseFloat(hitSlop.top) || 0;
    const bottomInset = Number.parseFloat(hitSlop.bottom) || 0;
    const targetTop = rect.top + borderTop + topInset;
    const targetBottom = rect.bottom - borderBottom - bottomInset;
    const margin = 8;

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
    const hitSlop = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderRight = Number.parseFloat(style.borderRightWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
    const topInset = Number.parseFloat(hitSlop.top) || 0;
    const rightInset = Number.parseFloat(hitSlop.right) || 0;
    const bottomInset = Number.parseFloat(hitSlop.bottom) || 0;
    const leftInset = Number.parseFloat(hitSlop.left) || 0;
    const targetTop = rect.top + borderTop + topInset;
    const targetRight = rect.right - borderRight - rightInset;
    const targetBottom = rect.bottom - borderBottom - bottomInset;
    const targetLeft = rect.left + borderLeft + leftInset;
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
      targetTop,
      targetRight,
      targetBottom,
      targetLeft,
      targetHeight: targetBottom - targetTop,
      targetWidth: targetRight - targetLeft,
      perimeterHits,
      pseudoBackground: hitSlop.backgroundColor,
      pseudoBorderWidths: [
        hitSlop.borderTopWidth,
        hitSlop.borderRightWidth,
        hitSlop.borderBottomWidth,
        hitSlop.borderLeftWidth,
      ],
      pseudoBoxShadow: hitSlop.boxShadow,
    };
  });
}

async function effectiveVerticalGap(rows: Locator): Promise<number> {
  await rows.nth(1).scrollIntoViewIfNeeded();
  return rows.evaluateAll((elements) => {
    const [first, second] = elements;
    if (!first || !second) {
      return Number.NaN;
    }

    const target = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const hitSlop = window.getComputedStyle(element, "::before");
      const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
      const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
      const topInset = Number.parseFloat(hitSlop.top) || 0;
      const bottomInset = Number.parseFloat(hitSlop.bottom) || 0;
      return {
        top: rect.top + borderTop + topInset,
        bottom: rect.bottom - borderBottom - bottomInset,
      };
    };

    const firstTarget = target(first);
    const secondTarget = target(second);
    return secondTarget.top - firstTarget.bottom;
  });
}

async function expectEffectiveMinimum(control: Locator, minimum: number): Promise<EffectiveTarget> {
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

test.describe("Issue #74 Phrases catalog touch targets", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("live catalog controls expose contained 44/48px targets without compact target overlap", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The Phrases catalog target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    const widths = testInfo.project.name === "desktop-chromium" ? [1440] : [820, 390, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/phrases", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("main", { name: "Технические фразы", exact: true })).toBeVisible();

      const expectedMinimum = await page.evaluate(() => (
        window.matchMedia("(pointer: coarse)").matches ? 48 : 44
      ));

      const catalogKind = page.getByRole("navigation", { name: "Тип каталога", exact: true });
      const kindTarget = await expectEffectiveMinimum(catalogKind.getByRole("button").first(), expectedMinimum);
      expect(kindTarget.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);

      const topics = page.getByRole("navigation", { name: "Быстрый выбор темы", exact: true });
      const firstTopic = topics.getByRole("button").first();
      const topicTarget = await expectEffectiveMinimum(firstTopic, expectedMinimum);
      const topicNavBox = await topics.boundingBox();
      expect(topicTarget.visualHeight).toBeCloseTo(36, 3);
      expect(topicNavBox).not.toBeNull();
      if (topicNavBox) {
        expect(topicTarget.targetTop).toBeGreaterThanOrEqual(topicNavBox.y - 0.5);
        expect(topicTarget.targetBottom).toBeLessThanOrEqual(topicNavBox.y + topicNavBox.height + 0.5);
      }

      if (width >= 768) {
        const filterRows = page.locator(".lx-phrases-filters fieldset label");
        expect(await filterRows.count()).toBeGreaterThanOrEqual(2);
        const gap = await effectiveVerticalGap(filterRows);
        expect(gap, "adjacent expanded radio-row targets must remain positively separated")
          .toBeGreaterThanOrEqual(1);
        await expectEffectiveMinimum(filterRows.nth(0), expectedMinimum);
        await expectEffectiveMinimum(filterRows.nth(1), expectedMinimum);
      }

      const searchSubmit = page.getByRole("button", { name: "Найти", exact: true });
      const submitTarget = await expectEffectiveMinimum(searchSubmit, expectedMinimum);
      if (width < 768) {
        expect(await searchSubmit.evaluate((element) => window.getComputedStyle(element).position)).toBe("absolute");
        expect(submitTarget.visualHeight).toBeCloseTo(36, 3);
      } else {
        expect(await searchSubmit.evaluate((element) => window.getComputedStyle(element).position)).toBe("relative");
        expect(submitTarget.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);
      }

      const lessonAction = page.getByRole("button", { name: "Урок по теме", exact: true });
      const lessonTarget = await expectEffectiveMinimum(lessonAction, expectedMinimum);
      if (width < 768) {
        /* 40px is the compact minimum; localized text may legitimately wrap taller. */
        expect(lessonTarget.visualHeight).toBeGreaterThanOrEqual(40 - 0.5);
      } else {
        expect(lessonTarget.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);
      }

      const sort = page.getByRole("combobox", { name: "Сортировка каталога", exact: true });
      const sortLabel = sort.locator("xpath=..");
      await sortLabel.scrollIntoViewIfNeeded();
      const [sortBox, sortLabelBox] = await Promise.all([sort.boundingBox(), sortLabel.boundingBox()]);
      expect(sortBox).not.toBeNull();
      expect(sortLabelBox).not.toBeNull();
      if (sortBox && sortLabelBox) {
        expect(sortBox.height).toBeGreaterThanOrEqual(44 - 0.5);
        expect(sortLabelBox.height).toBeGreaterThanOrEqual(expectedMinimum - 0.5);

        if (expectedMinimum === 48) {
          expect(sortBox.height).toBeCloseTo(44, 3);
          expect(sortLabelBox.y).toBeLessThan(sortBox.y - 0.5);
          expect(sortLabelBox.y + sortLabelBox.height).toBeGreaterThan(sortBox.y + sortBox.height + 0.5);

          const semanticAssociation = await sort.evaluate((element) => {
            const select = element as HTMLSelectElement;
            const label = select.closest("label");
            return {
              labelControlsSelect: label instanceof HTMLLabelElement && label.control === select,
              selectListsLabel: Boolean(label && select.labels && Array.from(select.labels).includes(label)),
            };
          });
          expect(semanticAssociation).toEqual({
            labelControlsSelect: true,
            selectListsLabel: true,
          });

          const hitPoint = {
            x: sortBox.x + sortBox.width / 2,
            y: sortLabelBox.y + 1,
          };
          const labelOwnsPaddingHit = await page.evaluate(({ x, y }) => {
            const hit = document.elementFromPoint(x, y);
            const label = document.querySelector(".lx-phrases-catalog > .lx-catalog-sort label");
            return Boolean(label && (hit === label || (hit instanceof Node && label.contains(hit))));
          }, hitPoint);
          expect(labelOwnsPaddingHit, "coarse sort-label padding must be a real clickable target outside the painted select")
            .toBe(true);

          await sortLabel.evaluate((element) => {
            const label = element as HTMLLabelElement;
            label.dataset.lexigoSortPaddingClick = "pending";
            label.addEventListener("click", (event) => {
              const mouseEvent = event as MouseEvent;
              label.dataset.lexigoSortPaddingClick = [
                event.isTrusted ? "trusted" : "untrusted",
                event.target === label ? "label" : "other",
                String(mouseEvent.clientX),
                String(mouseEvent.clientY),
              ].join("|");
            }, { once: true });
          });

          await page.mouse.click(hitPoint.x, hitPoint.y);
          const clickEvidence = await sortLabel.evaluate((element) => {
            const raw = (element as HTMLElement).dataset.lexigoSortPaddingClick ?? "";
            const [trust, target, clientX, clientY] = raw.split("|");
            return {
              trusted: trust === "trusted",
              targetIsLabel: target === "label",
              clientX: Number(clientX),
              clientY: Number(clientY),
            };
          });
          expect(clickEvidence.trusted, "coarse sort-label padding must receive a browser-trusted pointer click")
            .toBe(true);
          expect(clickEvidence.targetIsLabel, "the padding click must target the semantic label outside the painted select")
            .toBe(true);
          expect(Math.abs(clickEvidence.clientX - hitPoint.x)).toBeLessThanOrEqual(1.5);
          expect(Math.abs(clickEvidence.clientY - hitPoint.y)).toBeLessThanOrEqual(1.5);
        }
      }

      /*
       * Exercise :focus-visible through an actual keyboard transition. A direct
       * Locator.focus() after the trusted pointer probe above preserves the
       * browser's pointer modality in Chromium/WebKit, so :focus-visible may
       * correctly remain false even though the control itself is focused.
       */
      await firstTopic.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(firstTopic).toBeFocused();
      const focus = await firstTopic.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          focusVisible: element.matches(":focus-visible"),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
      expect(focus.focusVisible).toBe(true);
      expect(focus.outlineStyle).not.toBe("none");
      expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(3);

      await expectNoHorizontalOverflow(page);
    }
  });
});
