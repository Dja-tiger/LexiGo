import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  installScenarioFixture,
  startScenario,
} from "./support/scenario-fixture";

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

async function expectedMinimum(page: Page): Promise<number> {
  return page.evaluate(() => window.matchMedia("(pointer: coarse)").matches ? 48 : 44);
}

async function expectTargetContract(control: Locator, minimum: number, label: string): Promise<void> {
  const target = await effectiveTarget(control);
  expect(target.targetHeight, `${label} effective height`).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.targetWidth, `${label} effective width`).toBeGreaterThanOrEqual(minimum - 0.5);
  expect(target.perimeterHits, `${label} four-side real-hit proof`).toEqual([true, true, true, true]);
  expect(target.pseudoBackground, `${label} pseudo background`).toBe("rgba(0, 0, 0, 0)");
  expect(target.pseudoBorderWidths, `${label} pseudo border`).toEqual(["0px", "0px", "0px", "0px"]);
  expect(target.pseudoBoxShadow, `${label} pseudo shadow`).toBe("none");
}

async function installCatalogMock(page: Page): Promise<void> {
  await page.route("**/api/v1/catalog/metadata", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        catalogVersion: "sha256:issue-74-final-targets",
        updatedAt: "2026-08-10T00:00:00Z",
        totals: { items: 800, words: 700, phrases: 100 },
        sources: {
          mixed: 800,
          noun: 200,
          verb: 200,
          adjective: 200,
          phrases: 100,
          dailyLife: 100,
          travel: 100,
          dataEngineering: 100,
          backend: 100,
          academicTechnicalEnglish: 0,
        },
        topics: [],
      }),
    });
  });
}

async function installServiceWorkerMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class MockWorker extends EventTarget {
      state: ServiceWorkerState = "installed";
      scriptURL: string;

      constructor(scriptURL: string) {
        super();
        this.scriptURL = scriptURL;
      }

      postMessage() {}
    }

    const active = new MockWorker("http://127.0.0.1:3000/sw.js?build=issue-74-active");
    const waiting = new MockWorker("http://127.0.0.1:3000/sw.js?build=issue-74-waiting");
    const registration = new EventTarget() as ServiceWorkerRegistration & EventTarget;
    Object.assign(registration, {
      active: active as unknown as ServiceWorker,
      installing: null,
      waiting: waiting as unknown as ServiceWorker,
      scope: "http://127.0.0.1:3000/",
      updateViaCache: "none",
      async update() {
        return registration;
      },
    });

    const container = new EventTarget() as ServiceWorkerContainer & EventTarget;
    Object.assign(container, {
      controller: active as unknown as ServiceWorker,
      ready: Promise.resolve(registration),
      async getRegistration() {
        return registration;
      },
      async getRegistrations() {
        return [registration];
      },
      async register() {
        return registration;
      },
      startMessages() {},
    });

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: container,
    });
  });
}

test.describe("Issue #74 final residual touch targets", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(({}, testInfo) => {
    test.skip(
      !["desktop-chromium", "android-chromium", "ios-webkit"].includes(testInfo.project.name),
      "The final target contract runs in desktop Chromium, Android Chromium and iOS WebKit.",
    );
  });

  test("Scenario Lesson route and safe-exit dialog expose 44/48px real-hit controls", async ({ page }) => {
    await installScenarioFixture(page);
    await startScenario(page);
    const minimum = await expectedMinimum(page);

    const routeButtons = page.locator(".lx-scenario button:visible:not(:disabled)");
    const routeCount = await routeButtons.count();
    expect(routeCount).toBeGreaterThan(0);
    for (let index = 0; index < routeCount; index += 1) {
      await expectTargetContract(routeButtons.nth(index), minimum, `Scenario route button ${index}`);
    }

    const close = page.getByRole("button", { name: /Закрыть(?: сценарий)?/, exact: true });
    await close.click();
    const dialog = page.getByRole("dialog", { name: "Сохранить черновик и закрыть сценарий?" });
    await expect(dialog).toBeVisible();
    const dialogButtons = dialog.locator("button:visible:not(:disabled)");
    const dialogCount = await dialogButtons.count();
    expect(dialogCount).toBeGreaterThanOrEqual(2);
    for (let index = 0; index < dialogCount; index += 1) {
      await expectTargetContract(dialogButtons.nth(index), minimum, `Scenario dialog button ${index}`);
    }

    expectIndependent(await effectiveRectsInCommonFrame(dialogButtons), "Scenario dialog targets");
  });

  test("Service Worker update banner exposes independent 44/48px real-hit actions", async ({ page }) => {
    await installCatalogMock(page);
    await installServiceWorkerMock(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const update = page.getByTestId("service-worker-update");
    await expect(update).toContainText("Доступно обновление LexiGo");
    const buttons = update.locator("button:visible:not(:disabled)");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);
    const minimum = await expectedMinimum(page);

    for (let index = 0; index < count; index += 1) {
      await expectTargetContract(buttons.nth(index), minimum, `Service Worker action ${index}`);
    }

    expectIndependent(await effectiveRectsInCommonFrame(buttons), "Service Worker update targets");
  });
});
