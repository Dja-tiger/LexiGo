import { expect, test, type Locator, type Route } from "@playwright/test";

import { installQualityGateAPI } from "./support/quality-gates";

async function fulfillJSON(route: Route, status: number, body: unknown, headers: Record<string, string> = {}) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

async function scrollEffectiveTargetIntoView(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await control.evaluate((element) => {
    /*
     * Playwright visibility is based on the painted control and does not prove
     * that transparent hit slop is clear of fixed mobile chrome. Center the
     * painted owner before viewport-relative elementFromPoint probes, then
     * keep the union of the button border box and pseudo hit surface inside a
     * small viewport margin.
     */
    element.scrollIntoView({ block: "center", inline: "nearest" });

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const pseudo = window.getComputedStyle(element, "::before");
    const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(style.borderBottomWidth) || 0;
    const topInset = Number.parseFloat(pseudo.top) || 0;
    const bottomInset = Number.parseFloat(pseudo.bottom) || 0;
    const pseudoTop = rect.top + borderTop + topInset;
    const pseudoBottom = rect.bottom - borderBottom - bottomInset;
    const targetTop = Math.min(rect.top, pseudoTop);
    const targetBottom = Math.max(rect.bottom, pseudoBottom);
    const margin = 8;

    if (targetTop < margin) {
      window.scrollBy(0, targetTop - margin);
    } else if (targetBottom > window.innerHeight - margin) {
      window.scrollBy(0, targetBottom - window.innerHeight + margin);
    }
  });
}

async function effectiveTarget(control: Locator) {
  await scrollEffectiveTargetIntoView(control);
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

test.describe("Issue #74 system-state action touch targets", () => {
  test("Dictionary retry keeps the 44px paint box and exposes a real 44/48px target", async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "System-state target acceptance runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    await installQualityGateAPI(context);
    let failSearch = true;
    await context.route("**/api/v1/words**", async (route) => {
      const requestURL = new URL(route.request().url());
      if (requestURL.pathname !== "/api/v1/words") return route.fallback();
      if (requestURL.searchParams.get("query") !== "target-gap") return route.fallback();
      if (failSearch) {
        return fulfillJSON(
          route,
          503,
          { error: { code: "catalog_temporarily_unavailable", message: "retry" } },
          { "x-correlation-id": "issue-74-system-state-target" },
        );
      }
      return fulfillJSON(route, 200, {
        items: [],
        count: 0,
        total: 0,
        page: 1,
        pageSize: 48,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    });

    await page.goto("/dictionary");
    const search = page.getByRole("searchbox", { name: "Поиск по словарю" });
    await search.fill("target-gap");
    await search.press("Enter");

    const error = page.getByRole("alert", { name: "Словарь недоступен" });
    await expect(error).toContainText("Код запроса: issue-74-system-state-target");
    const retry = error.getByRole("button", { name: "Повторить", exact: true });
    await expect(retry).toBeVisible();

    const expectedMinimum = await page.evaluate(() => (
      window.matchMedia("(pointer: coarse)").matches ? 48 : 44
    ));
    const target = await effectiveTarget(retry);
    expect(target.visualHeight).toBeGreaterThanOrEqual(44 - 0.5);
    expect(target.targetHeight).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
    expect(target.targetWidth).toBeGreaterThanOrEqual(expectedMinimum - 0.5);
    expect(target.perimeterHits).toEqual([true, true, true, true]);
    expect(target.pseudoBackground).toBe("rgba(0, 0, 0, 0)");
    expect(target.pseudoBorderWidths).toEqual(["0px", "0px", "0px", "0px"]);
    expect(target.pseudoBoxShadow).toBe("none");

    await error.focus();
    await page.keyboard.press("Tab");
    await expect(retry).toBeFocused();
    const focus = await retry.evaluate((element) => {
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

    failSearch = false;
    await retry.click();
    await expect(error).toHaveCount(0);
    await expect(search).toHaveValue("target-gap");
  });
});
