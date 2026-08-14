import { expect, test, type Page } from "@playwright/test";

import { installQualityGateAPI } from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";
type CanonicalNavigation = "header" | "mobile";

type CanonicalProgressCase = {
  name: string;
  width: number;
  height: number;
  appearance: ExplicitAppearance;
  navigation: CanonicalNavigation;
  canvas: string;
  designContract: string;
};

const CANONICAL_PROGRESS_CASES: readonly CanonicalProgressCase[] = [
  {
    name: "mobile Light",
    width: 390,
    height: 844,
    appearance: "light",
    navigation: "mobile",
    canvas: "#f4f7f5",
    designContract: "Figma 76:6",
  },
  {
    name: "mobile Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    navigation: "mobile",
    canvas: "#10211d",
    designContract: "Figma 76:53",
  },
  {
    name: "desktop Light",
    width: 1440,
    height: 1024,
    appearance: "light",
    navigation: "header",
    canvas: "#f4f7f5",
    designContract: "Figma 76:154",
  },
  {
    name: "desktop Dark",
    width: 1440,
    height: 1024,
    appearance: "dark",
    navigation: "header",
    canvas: "#10211d",
    designContract: "Figma 76:154 geometry + explicit Dark tokens",
  },
] as const;

async function clickPrimaryNavigation(
  page: Page,
  view: "home" | "learn" | "library" | "progress",
): Promise<void> {
  const controls = page.locator(`[data-navigation-view="${view}"]`);
  const count = await controls.count();

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (await control.isVisible()) {
      await control.click();
      return;
    }
  }

  throw new Error(`No visible primary navigation control for ${view}`);
}

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function expectProgressRouteOwner(page: Page, appearance?: ExplicitAppearance): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === "/progress");
  await expect(page.locator('[data-route-client-island="progress"]')).toBeVisible();
  await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", "Прогресс");

  if (appearance) {
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  }
}

async function expectCanonicalProgressGeometry(
  page: Page,
  expected: CanonicalProgressCase,
): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    const island = document.querySelector<HTMLElement>('[data-route-client-island="progress"]');

    if (!main || !island) {
      throw new Error("Progress route geometry owner is not mounted");
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
      visibleNavigation,
    };
  });

  expect(geometry.innerWidth).toBe(expected.width);
  expect(geometry.innerHeight).toBe(expected.height);
  expect(geometry.canvas).toBe(expected.canvas);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);

  for (const owner of [geometry.main, geometry.island]) {
    expect(owner.width).toBeGreaterThan(0);
    expect(owner.left).toBeGreaterThanOrEqual(-1);
    expect(owner.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  }

  expect(geometry.visibleNavigation).toHaveLength(1);
  const navigation = geometry.visibleNavigation[0];
  expect(navigation.variant).toBe(expected.navigation);
  expect(navigation.box.left).toBeGreaterThanOrEqual(-1);
  expect(navigation.box.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(navigation.box.top).toBeGreaterThanOrEqual(-1);
  expect(navigation.box.bottom).toBeLessThanOrEqual(geometry.innerHeight + 1);
}

test("reuses one session bootstrap across direct Progress entry and repeated route-island navigation", async ({
  context,
  page,
}) => {
  let refreshRequests = 0;
  await installQualityGateAPI(context);
  await context.route("**/api/v1/auth/refresh", async (route) => {
    refreshRequests += 1;
    await route.fallback();
  });

  await page.goto("/progress");
  await expectProgressRouteOwner(page);
  await expect.poll(() => refreshRequests).toBe(1);

  const destinations = [
    { view: "home" as const, pathname: "/", label: "Главная" },
    { view: "learn" as const, pathname: "/learn", label: "Обучение" },
    { view: "library" as const, pathname: "/dictionary", label: "Словарь" },
  ];

  for (const destination of destinations) {
    await clickPrimaryNavigation(page, destination.view);
    await expect(page).toHaveURL((url) => url.pathname === destination.pathname);
    await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", destination.label);

    await clickPrimaryNavigation(page, "progress");
    await expectProgressRouteOwner(page);
    await expect.poll(() => refreshRequests).toBe(1);
  }

  await clickPrimaryNavigation(page, "home");
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", "Главная");

  await page.goBack();
  await expectProgressRouteOwner(page);
  await expect.poll(() => refreshRequests).toBe(1);

  await page.goForward();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.locator("#lexigo-main-content")).toHaveAttribute("aria-label", "Главная");
  await expect.poll(() => refreshRequests).toBe(1);

  await clickPrimaryNavigation(page, "progress");
  await expectProgressRouteOwner(page);
  await expect.poll(() => refreshRequests).toBe(1);
});

test.describe("canonical Progress Figma parity contract", () => {
  for (const canonicalCase of CANONICAL_PROGRESS_CASES) {
    test(`${canonicalCase.name} uses canonical geometry and route chrome (${canonicalCase.designContract})`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop-chromium",
        "Canonical Figma geometry is measured once in Chromium; the route/history contract remains cross-browser.",
      );

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installAppearance(page, canonicalCase.appearance);
      await installQualityGateAPI(context);

      await page.goto("/progress");
      await expectProgressRouteOwner(page, canonicalCase.appearance);
      await expectCanonicalProgressGeometry(page, canonicalCase);

      await page.reload({ waitUntil: "domcontentloaded" });
      await expectProgressRouteOwner(page, canonicalCase.appearance);
      await expectCanonicalProgressGeometry(page, canonicalCase);
    });
  }
});
