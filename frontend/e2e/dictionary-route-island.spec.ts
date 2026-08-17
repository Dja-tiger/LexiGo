import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installQualityGateAPI,
} from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";
type CanonicalNavigation = "mobile" | "rail";

type CanonicalDictionaryCase = {
  name: string;
  width: number;
  height: number;
  appearance: ExplicitAppearance;
  navigation: CanonicalNavigation;
  canvas: string;
  figmaNode: string;
  designContract: string;
};

const CANONICAL_DICTIONARY_CASES: readonly CanonicalDictionaryCase[] = [
  {
    name: "mobile Light",
    width: 390,
    height: 844,
    appearance: "light",
    navigation: "mobile",
    canvas: "#f4f7f5",
    figmaNode: "78:54",
    designContract: "Figma 78:54 — mobile Dictionary Light",
  },
  {
    name: "mobile Dark",
    width: 390,
    height: 844,
    appearance: "dark",
    navigation: "mobile",
    canvas: "#10211d",
    figmaNode: "78:54",
    designContract: "Figma 78:54 geometry + explicit Dark tokens",
  },
  {
    name: "desktop Light",
    width: 1440,
    height: 1024,
    appearance: "light",
    navigation: "rail",
    canvas: "#f4f7f5",
    figmaNode: "78:193",
    designContract: "Figma 78:193 — desktop Dictionary Light",
  },
  {
    name: "desktop Dark",
    width: 1440,
    height: 1024,
    appearance: "dark",
    navigation: "rail",
    canvas: "#10211d",
    figmaNode: "78:193",
    designContract: "Figma 78:193 geometry + explicit Dark tokens",
  },
] as const;

async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function expectDictionaryRouteOwner(
  page: Page,
  appearance: ExplicitAppearance,
): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === "/dictionary" && url.search === "");
  await expect(page.locator('[data-route-client-island="dictionary"]')).toHaveCount(1);
  await expect(page.locator('#lexigo-main-content[aria-label="Словарь"]')).toBeVisible();
  await expect(page.locator(".lx-dictionary-catalog")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Словарь" })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem"),
  ).toHaveCount(3);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
}

async function expectCompactMaterialsGeometry(page: Page): Promise<void> {
  const geometry = await page.locator(".lx-catalog-kind-navigation").evaluate((navigation) => {
    const root = document.documentElement;
    const buttons = Array.from(navigation.querySelectorAll<HTMLButtonElement>("button"));
    const boxes = buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      const style = window.getComputedStyle(button);
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        whiteSpace: style.whiteSpace,
        lineHeight: Number.parseFloat(style.lineHeight),
        scrollHeight: button.scrollHeight,
      };
    });
    return {
      viewportWidth: window.innerWidth,
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      boxes,
    };
  });

  expect(geometry.viewportWidth).toBe(390);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.boxes).toHaveLength(2);
  for (const box of geometry.boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.left).toBeGreaterThanOrEqual(-1);
    expect(box.right).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(box.whiteSpace).toBe("nowrap");
    expect(box.scrollHeight).toBeLessThanOrEqual(box.height + 1);
  }
  expect(Math.abs(geometry.boxes[0].height - geometry.boxes[1].height)).toBeLessThanOrEqual(1);
}

async function expectCanonicalDictionaryGeometry(
  page: Page,
  canonicalCase: CanonicalDictionaryCase,
): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector<HTMLElement>('#lexigo-main-content[aria-label="Словарь"]');
    const island = document.querySelector<HTMLElement>('[data-route-client-island="dictionary"]');
    const catalog = document.querySelector<HTMLElement>(".lx-dictionary-catalog");

    if (!main || !island || !catalog) {
      throw new Error("Dictionary route geometry owner is not mounted");
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
      catalog: rect(catalog),
      visibleNavigation,
    };
  });

  expect(geometry.innerWidth).toBe(canonicalCase.width);
  expect(geometry.innerHeight).toBe(canonicalCase.height);
  expect(geometry.canvas).toBe(canonicalCase.canvas);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);

  for (const owner of [geometry.main, geometry.island, geometry.catalog]) {
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

test("dictionary island stays canonical across Home, catalog-kind switches and Back/Forward", async ({ context, page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installAppearance(page, "light");
  await installQualityGateAPI(context);
  const runtimeErrors = captureRuntimeErrors(page);
  let refreshRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/v1/auth/refresh") refreshRequests += 1;
  });

  await page.goto("/dictionary");
  await expectDictionaryRouteOwner(page, "light");
  await expectCompactMaterialsGeometry(page);
  await expect.poll(() => refreshRequests).toBe(1);

  const routeNavigation = page.locator(".lx-route-nav:visible");
  await routeNavigation.getByRole("link", { name: "Главная", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toHaveCount(0);
  await expect(page.getByRole("heading", {
    level: 1,
    name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/,
  })).toBeVisible();

  await routeNavigation.getByRole("link", { name: "Словарь", exact: true }).click();
  await expectDictionaryRouteOwner(page, "light");
  await expectCompactMaterialsGeometry(page);

  const materialNavigation = page.locator(".lx-catalog-kind-navigation");
  await materialNavigation.getByRole("button", { name: "Рабочие фразы", exact: true }).click();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.locator('[data-route-client-island="phrases"]')).toHaveCount(1);
  await expectCompactMaterialsGeometry(page);

  await page.locator(".lx-catalog-kind-navigation").getByRole("button", { name: "Слова и термины", exact: true }).click();
  await expectDictionaryRouteOwner(page, "light");
  await expectCompactMaterialsGeometry(page);

  await page.goBack();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.locator('[data-route-client-island="phrases"]')).toHaveCount(1);
  await expectCompactMaterialsGeometry(page);
  await page.goBack();
  await expectDictionaryRouteOwner(page, "light");
  await expectCompactMaterialsGeometry(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expectDictionaryRouteOwner(page, "light");
  await expectCompactMaterialsGeometry(page);

  expect(refreshRequests).toBe(1);
  expect(runtimeErrors).toEqual([]);
});

test.describe("canonical Dictionary Figma parity contract", () => {
  for (const canonicalCase of CANONICAL_DICTIONARY_CASES) {
    test(`${canonicalCase.name} uses canonical route ownership (${canonicalCase.designContract})`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop-chromium",
        "Canonical Dictionary Figma parity is measured once in Chromium; existing history, PWA, browser-owned zoom, reduced-motion, touch-target and accessibility gates remain independent.",
      );

      testInfo.annotations.push({
        type: "figma",
        description: `${canonicalCase.figmaNode}: ${canonicalCase.designContract}`,
      });

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installAppearance(page, canonicalCase.appearance);
      await installQualityGateAPI(context);

      await page.goto("/dictionary");
      await expectDictionaryRouteOwner(page, canonicalCase.appearance);
      await expectCanonicalDictionaryGeometry(page, canonicalCase);

      await page.reload({ waitUntil: "domcontentloaded" });
      await expectDictionaryRouteOwner(page, canonicalCase.appearance);
      await expectCanonicalDictionaryGeometry(page, canonicalCase);
    });
  }
});
