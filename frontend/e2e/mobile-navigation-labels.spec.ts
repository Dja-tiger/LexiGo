import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type NavigationMetrics = {
  navigation: { top: number; right: number; bottom: number; left: number; width: number; height: number };
  links: Array<{
    name: string;
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  }>;
  labels: Array<{
    text: string;
    fontSize: number;
    lineHeight: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
    overflow: string;
    textOverflow: string;
    whiteSpace: string;
  }>;
  appPaddingBottom: number;
  documentWidth: number;
  viewportWidth: number;
};

async function navigationMetrics(navigation: Locator): Promise<NavigationMetrics> {
  return navigation.evaluate((element) => {
    const navigationElement = element as HTMLElement;
    const navigationRect = navigationElement.getBoundingClientRect();
    const links = Array.from(navigationElement.querySelectorAll<HTMLAnchorElement>(":scope > a"));
    const labels = links.map((link) => {
      const label = link.querySelector<HTMLElement>(":scope > span > span");
      if (!label) throw new Error("mobile navigation label is missing");
      const rect = label.getBoundingClientRect();
      const style = window.getComputedStyle(label);
      return {
        text: label.textContent?.trim() ?? "",
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        clientWidth: label.clientWidth,
        clientHeight: label.clientHeight,
        scrollWidth: label.scrollWidth,
        scrollHeight: label.scrollHeight,
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      };
    });

    return {
      navigation: {
        top: navigationRect.top,
        right: navigationRect.right,
        bottom: navigationRect.bottom,
        left: navigationRect.left,
        width: navigationRect.width,
        height: navigationRect.height,
      },
      links: links.map((link) => {
        const rect = link.getBoundingClientRect();
        return {
          name: link.textContent?.trim() ?? "",
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      }),
      labels,
      appPaddingBottom: Number.parseFloat(window.getComputedStyle(document.querySelector<HTMLElement>(".lx-app")!).paddingBottom),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

function expectSeparatedTargets(metrics: NavigationMetrics): void {
  expect(metrics.links).toHaveLength(4);
  for (const link of metrics.links) {
    expect(link.width, `${link.name} target width`).toBeGreaterThanOrEqual(48);
    expect(link.height, `${link.name} target height`).toBeGreaterThanOrEqual(48);
  }

  for (let leftIndex = 0; leftIndex < metrics.links.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < metrics.links.length; rightIndex += 1) {
      const left = metrics.links[leftIndex];
      const right = metrics.links[rightIndex];
      const overlapInline = Math.min(left.right, right.right) - Math.max(left.left, right.left);
      const overlapBlock = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
      expect(
        overlapInline <= 0 || overlapBlock <= 0,
        `${left.name} and ${right.name} targets must not overlap`,
      ).toBe(true);
    }
  }
}

function expectReadableLabels(metrics: NavigationMetrics, minimumFontSize: number): void {
  expect(metrics.labels.map((label) => label.text)).toEqual(["Главная", "Учить", "Словарь", "Прогресс"]);
  for (const label of metrics.labels) {
    expect(label.fontSize, `${label.text} font size`).toBeGreaterThanOrEqual(minimumFontSize - 0.1);
    expect(label.lineHeight, `${label.text} line height`).toBeGreaterThanOrEqual(label.fontSize * 1.19);
    expect(label.overflow, `${label.text} overflow`).toBe("visible");
    expect(label.textOverflow, `${label.text} text overflow`).toBe("clip");
    expect(label.whiteSpace, `${label.text} white space`).toBe("normal");
    expect(label.scrollWidth, `${label.text} horizontal clipping`).toBeLessThanOrEqual(label.clientWidth + 1);
    expect(label.scrollHeight, `${label.text} vertical clipping`).toBeLessThanOrEqual(label.clientHeight + 1);
  }

  metrics.labels.forEach((label, index) => {
    const link = metrics.links[index];
    expect(label.left).toBeGreaterThanOrEqual(link.left - 0.1);
    expect(label.right).toBeLessThanOrEqual(link.right + 0.1);
    expect(label.top).toBeGreaterThanOrEqual(link.top - 0.1);
    expect(label.bottom).toBeLessThanOrEqual(link.bottom + 0.1);
  });
}

function expectNavigationReserve(metrics: NavigationMetrics): void {
  expect(metrics.navigation.bottom).toBeGreaterThanOrEqual(843);
  expect(metrics.navigation.bottom).toBeLessThanOrEqual(845);
  expect(metrics.appPaddingBottom).toBeGreaterThanOrEqual(metrics.navigation.height + 20);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

test.describe("Issue #74 mobile navigation label readability", () => {
  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("compact labels remain readable and reflow at 200% root text size", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The canonical mobile label contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();

    const navigation = page.getByRole("navigation", { name: "Мобильная навигация", exact: true });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link")).toHaveCount(4);

    const defaultMetrics = await navigationMetrics(navigation);
    expectSeparatedTargets(defaultMetrics);
    expectReadableLabels(defaultMetrics, 12);
    expectNavigationReserve(defaultMetrics);

    const firstLink = navigation.getByRole("link", { name: "Главная", exact: true });
    await firstLink.focus();
    await expect(firstLink).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(navigation.getByRole("link", { name: "Учить", exact: true })).toBeFocused();

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect.poll(async () => (
      Number.parseFloat(await navigation.getByText("Прогресс", { exact: true }).evaluate((label) => (
        window.getComputedStyle(label).fontSize
      )))
    )).toBeGreaterThanOrEqual(24);

    const enlargedMetrics = await navigationMetrics(navigation);
    expectSeparatedTargets(enlargedMetrics);
    expectReadableLabels(enlargedMetrics, 24);
    expectNavigationReserve(enlargedMetrics);
    expect(enlargedMetrics.navigation.height).toBeGreaterThan(defaultMetrics.navigation.height + 20);
    expect(enlargedMetrics.appPaddingBottom).toBeGreaterThan(defaultMetrics.appPaddingBottom + 20);

    await navigation.getByRole("link", { name: "Словарь", exact: true }).click();
    await expect(page).toHaveURL(/\/dictionary(?:\?.*)?$/);
    await expect(page.getByRole("main", { name: "Словарь", exact: true })).toBeVisible();
  });

  test("the narrowest supported route shell keeps four separated labels without document overflow", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "android-chromium",
      "One coarse-pointer 320px viewport protects the narrowest compact layout.",
    );

    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();

    const navigation = page.getByRole("navigation", { name: "Мобильная навигация", exact: true });
    const metrics = await navigationMetrics(navigation);
    expectSeparatedTargets(metrics);
    expectReadableLabels(metrics, 12);
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  });
});
