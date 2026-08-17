import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installQualityGateAPI,
} from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";
type CanonicalNavigation = "mobile" | "rail";
type CanonicalLearnState = "collapsed" | "manual" | "desktop";

type CanonicalLearnCase = {
  name: string;
  width: number;
  height: number;
  appearance: ExplicitAppearance;
  navigation: CanonicalNavigation;
  state: CanonicalLearnState;
  canvas: string;
  figmaNode: string;
  designContract: string;
};

const CANONICAL_LEARN_CASES: readonly CanonicalLearnCase[] = [
  {
    name: "mobile collapsed Light",
    width: 390,
    height: 844,
    appearance: "light",
    navigation: "mobile",
    state: "collapsed",
    canvas: "#f4f7f5",
    figmaNode: "202:6",
    designContract: "Figma 202:6 — mobile recommended/collapsed",
  },
  {
    name: "mobile collapsed Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    navigation: "mobile",
    state: "collapsed",
    canvas: "#10211d",
    figmaNode: "202:6",
    designContract: "Figma 202:6 geometry + explicit Dark tokens",
  },
  {
    name: "mobile manual Light",
    width: 390,
    height: 844,
    appearance: "light",
    navigation: "mobile",
    state: "manual",
    canvas: "#f4f7f5",
    figmaNode: "203:5",
    designContract: "Figma 203:5 — mobile manual settings",
  },
  {
    name: "mobile manual Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    navigation: "mobile",
    state: "manual",
    canvas: "#10211d",
    figmaNode: "203:5",
    designContract: "Figma 203:5 geometry + explicit Dark tokens",
  },
  {
    name: "desktop full Light",
    width: 1440,
    height: 1024,
    appearance: "light",
    navigation: "rail",
    state: "desktop",
    canvas: "#f4f7f5",
    figmaNode: "204:2",
    designContract: "Figma 204:2 — desktop full composer",
  },
  {
    name: "desktop full Dark",
    width: 1440,
    height: 1024,
    appearance: "dark",
    navigation: "rail",
    state: "desktop",
    canvas: "#10211d",
    figmaNode: "204:2",
    designContract: "Figma 204:2 geometry + explicit Dark tokens",
  },
] as const;

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function expectLearnRouteOwner(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === "/learn" && url.search === "");
  await expect(page.locator('[data-route-client-island="learn"]')).toBeVisible();
  await expect(page.locator('#lexigo-main-content[aria-label="Обучение"]')).toBeVisible();
  await expect(page.locator('.lx-progressive-lesson-composer[aria-label="Настройка следующего урока"]')).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
}

async function expectCollapsedComposer(page: Page): Promise<void> {
  const shell = page.locator('.lx-progressive-lesson-composer[aria-label="Настройка следующего урока"]');
  const recommendation = page.getByRole("article", { name: "Рекомендуемый урок" });
  const configure = page.getByRole("button", { name: "Настроить урок" });
  const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения" });

  await expect(shell).toHaveAttribute("data-mobile-expanded", "false");
  await expect(recommendation).toBeVisible();
  await expect(configure).toBeVisible();
  await expect(configure).toHaveAttribute("aria-expanded", "false");
  await expect(modeGroup).toBeHidden();
  await expect(page.getByRole("button", { name: "Начать рекомендуемый урок" })).toBeEnabled();
}

async function expandManualComposer(page: Page): Promise<void> {
  const configure = page.getByRole("button", { name: "Настроить урок" });
  await expect(configure).toHaveAttribute("aria-expanded", "false");
  await configure.click();
}

async function expectManualComposer(page: Page): Promise<void> {
  const shell = page.locator('.lx-progressive-lesson-composer[aria-label="Настройка следующего урока"]');
  const manualSummary = page.getByRole("button", { name: /Ручная настройка/ });

  await expect(shell).toHaveAttribute("data-mobile-expanded", "true");
  await expect(manualSummary).toBeVisible();
  await expect(manualSummary).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("radiogroup", { name: "Режим обучения" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Раздел обучения" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Размер урока" })).toBeVisible();
}

async function expectDesktopComposer(page: Page): Promise<void> {
  const shell = page.locator('.lx-progressive-lesson-composer[aria-label="Настройка следующего урока"]');

  await expect(shell).toHaveAttribute("data-mobile-expanded", "false");
  await expect(page.getByRole("article", { name: "Рекомендуемый урок" })).toBeHidden();
  await expect(page.getByRole("radiogroup", { name: "Режим обучения" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Раздел обучения" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Размер урока" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Начать урок", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Начать рекомендуемый урок" })).toBeHidden();
}

async function expectCanonicalLearnGeometry(
  page: Page,
  canonicalCase: CanonicalLearnCase,
): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>('#lexigo-main-content[aria-label="Обучение"]');
    const island = document.querySelector<HTMLElement>('[data-route-client-island="learn"]');
    const composer = document.querySelector<HTMLElement>(
      '.lx-progressive-lesson-composer[aria-label="Настройка следующего урока"]',
    );

    if (!main || !island || !composer) {
      throw new Error("Learn route geometry owner is not mounted");
    }

    const rect = (node: HTMLElement) => {
      const value = node.getBoundingClientRect();
      return {
        left: value.left,
        right: value.right,
        top: value.top,
        bottom: value.bottom,
        width: value.width,
        height: value.height,
      };
    };

    const visibleNavigation = Array.from(
      document.querySelectorAll<HTMLElement>("[data-route-navigation]"),
    )
      .map((node) => {
        const style = window.getComputedStyle(node);
        return {
          variant: node.dataset.routeNavigation ?? "",
          display: style.display,
          visibility: style.visibility,
          box: rect(node),
        };
      })
      .filter((item) => (
        item.display !== "none"
        && item.visibility !== "hidden"
        && item.box.width > 0
        && item.box.height > 0
      ));

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth ?? 0,
      canvas: window.getComputedStyle(root).getPropertyValue("--ak-color-canvas").trim(),
      main: rect(main),
      island: rect(island),
      composer: rect(composer),
      visibleNavigation,
    };
  });

  expect(geometry.innerWidth).toBe(canonicalCase.width);
  expect(geometry.innerHeight).toBe(canonicalCase.height);
  expect(geometry.canvas).toBe(canonicalCase.canvas);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);

  for (const owner of [geometry.main, geometry.island, geometry.composer]) {
    expect(owner.width).toBeGreaterThan(0);
    expect(owner.left).toBeGreaterThanOrEqual(-1);
    expect(owner.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }

  expect(geometry.visibleNavigation).toHaveLength(1);
  const navigation = geometry.visibleNavigation[0];
  expect(navigation.variant).toBe(canonicalCase.navigation);
  expect(navigation.box.left).toBeGreaterThanOrEqual(-1);
  expect(navigation.box.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(navigation.box.top).toBeGreaterThanOrEqual(-1);
  expect(navigation.box.bottom).toBeLessThanOrEqual(geometry.innerHeight + 1);
}

test.describe.configure({ timeout: 90_000 });

test("Learn owns Home client navigation and real Back/Forward without a product fallback", async ({ context, page }) => {
  const mobileCase = CANONICAL_LEARN_CASES[0];
  await page.setViewportSize({ width: mobileCase.width, height: mobileCase.height });
  await installAppearance(page, mobileCase.appearance);
  await installQualityGateAPI(context);
  const runtimeErrors = captureRuntimeErrors(page);

  await page.goto("/");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
  await page.locator('[data-navigation-view="learn"]:visible').click();
  await expectLearnRouteOwner(page, mobileCase.appearance);
  await expectCollapsedComposer(page);
  await expectCanonicalLearnGeometry(page, mobileCase);
  expect(await page.evaluate(() => window.history.state?.lexigoRouteGraph)).toBe("learn");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
  await page.goForward();
  await expectLearnRouteOwner(page, mobileCase.appearance);
  await expectCollapsedComposer(page);
  await expectCanonicalLearnGeometry(page, mobileCase);
  expect(await page.evaluate(() => window.history.state?.lexigoRouteGraph)).toBe("learn");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expectLearnRouteOwner(page, mobileCase.appearance);
  await expectCollapsedComposer(page);
  await expectCanonicalLearnGeometry(page, mobileCase);
  expect(runtimeErrors).toEqual([]);
});

test.describe("canonical Learn Composer Figma parity contract", () => {
  for (const canonicalCase of CANONICAL_LEARN_CASES) {
    test(`${canonicalCase.name} uses canonical route ownership (${canonicalCase.designContract})`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop-chromium",
        "Canonical Learn Figma parity is measured once in Chromium; existing composer behavior, browser-owned zoom, reduced-motion and touch-target gates remain independent.",
      );

      testInfo.annotations.push({
        type: "figma",
        description: `${canonicalCase.figmaNode}: ${canonicalCase.designContract}`,
      });

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installAppearance(page, canonicalCase.appearance);
      await installQualityGateAPI(context);

      await page.goto("/learn");
      await expectLearnRouteOwner(page, canonicalCase.appearance);

      if (canonicalCase.state === "collapsed") {
        await expectCollapsedComposer(page);
      } else if (canonicalCase.state === "manual") {
        await expectCollapsedComposer(page);
        await expandManualComposer(page);
        await expectManualComposer(page);
      } else {
        await expectDesktopComposer(page);
      }

      await expectCanonicalLearnGeometry(page, canonicalCase);

      await page.reload({ waitUntil: "domcontentloaded" });
      await expectLearnRouteOwner(page, canonicalCase.appearance);

      if (canonicalCase.state === "desktop") {
        await expectDesktopComposer(page);
      } else {
        // Mobile manual expansion is intentionally local React state. Reload returns
        // both mobile Figma contracts to the canonical recommendation/collapsed owner.
        await expectCollapsedComposer(page);
      }

      await expectCanonicalLearnGeometry(page, canonicalCase);
    });
  }
});
