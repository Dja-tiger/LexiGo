import { expect, test, type Page } from "@playwright/test";

async function installCatalogMock(page: Page) {
  await page.route("**/api/v1/catalog/metadata", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        catalogVersion: "sha256:service-worker-e2e",
        updatedAt: "2026-07-19T00:00:00Z",
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
        },
        topics: [],
      }),
    });
  });
}

async function installServiceWorkerMock(page: Page, options: { registrationError?: boolean } = {}) {
  await page.addInitScript(({ registrationError }) => {
    type MockSnapshot = {
      messages: unknown[];
      registeredURL: string;
      updateCount: number;
    };

    class MockWorker extends EventTarget {
      state: ServiceWorkerState = "installed";
      scriptURL: string;

      constructor(scriptURL: string) {
        super();
        this.scriptURL = scriptURL;
      }

      postMessage(message: unknown) {
        snapshot.messages.push(message);
      }
    }

    class MockRegistration extends EventTarget {
      active: ServiceWorker | null;
      installing: ServiceWorker | null = null;
      navigationPreload = {} as NavigationPreloadManager;
      onupdatefound: ((this: ServiceWorkerRegistration, ev: Event) => unknown) | null = null;
      paymentManager = undefined;
      pushManager = {} as PushManager;
      scope = "http://127.0.0.1:3000/";
      updateViaCache: ServiceWorkerUpdateViaCache = "none";
      waiting: ServiceWorker | null;

      constructor(active: MockWorker, waiting: MockWorker) {
        super();
        this.active = active as unknown as ServiceWorker;
        this.waiting = waiting as unknown as ServiceWorker;
      }

      async getNotifications() {
        return [];
      }

      async showNotification() {
        return undefined;
      }

      async unregister() {
        return true;
      }

      async update() {
        snapshot.updateCount += 1;
        return this as unknown as ServiceWorkerRegistration;
      }
    }

    const snapshot: MockSnapshot = {
      messages: [],
      registeredURL: "",
      updateCount: 0,
    };
    const active = new MockWorker("http://127.0.0.1:3000/sw.js?build=incompatible-a");
    const waiting = new MockWorker("http://127.0.0.1:3000/sw.js?build=incompatible-b");
    const registration = new MockRegistration(active, waiting);
    const container = new EventTarget() as ServiceWorkerContainer & EventTarget;

    Object.assign(container, {
      controller: active as unknown as ServiceWorker,
      ready: Promise.resolve(registration as unknown as ServiceWorkerRegistration),
      async getRegistration() {
        return registration as unknown as ServiceWorkerRegistration;
      },
      async getRegistrations() {
        return [registration as unknown as ServiceWorkerRegistration];
      },
      async register(scriptURL: string) {
        snapshot.registeredURL = scriptURL;
        if (registrationError) throw new Error("registration denied");
        return registration as unknown as ServiceWorkerRegistration;
      },
      startMessages() {},
    });

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: container,
    });
    Object.defineProperty(window, "__serviceWorkerMock", {
      configurable: true,
      value: {
        snapshot: () => ({ ...snapshot, messages: [...snapshot.messages] }),
      },
    });
  }, options);
}

async function serviceWorkerSnapshot(page: Page) {
  return page.evaluate(() => (
    window as unknown as { __serviceWorkerMock: { snapshot: () => { messages: unknown[]; registeredURL: string; updateCount: number } } }
  ).__serviceWorkerMock.snapshot());
}

test.describe.configure({ timeout: 45_000 });

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The update contract is asserted once in Chromium.");
  await installCatalogMock(page);
});

test("a waiting incompatible build activates only after explicit confirmation", async ({ page }) => {
  await installServiceWorkerMock(page);
  await page.goto("/");

  const update = page.getByTestId("service-worker-update");
  await expect(update).toContainText("Доступно обновление LexiGo");
  expect((await serviceWorkerSnapshot(page)).registeredURL).toContain("/sw.js?build=");

  await update.getByRole("button", { name: "Обновить сейчас" }).click();

  await expect(update).toContainText("Активируем новую версию");
  await expect.poll(async () => (await serviceWorkerSnapshot(page)).messages).toEqual([
    { type: "LEXIGO_SKIP_WAITING" },
  ]);
  const recovery = await page.evaluate(() => JSON.parse(
    window.sessionStorage.getItem("lexigo.service-worker.recovery.v1") ?? "null",
  ));
  expect(recovery).toMatchObject({
    version: 1,
    reason: "service-worker-update",
    lessonActive: false,
  });
});

test("an update can wait until the active lesson route is left", async ({ page }) => {
  await installServiceWorkerMock(page);
  await page.goto("/");
  await page.evaluate(() => window.history.pushState({}, "", "/lesson/active?source=mixed"));

  const update = page.getByTestId("service-worker-update");
  const defer = update.getByRole("button", { name: "После урока" });
  await expect(defer).toBeVisible();
  await defer.click();
  await expect(update).toContainText("автоматически после выхода из урока");
  expect((await serviceWorkerSnapshot(page)).messages).toEqual([]);

  await page.evaluate(() => window.history.pushState({}, "", "/"));

  await expect.poll(async () => (await serviceWorkerSnapshot(page)).messages, { timeout: 5000 }).toEqual([
    { type: "LEXIGO_SKIP_WAITING" },
  ]);
});

test("registration failures are visible and logged instead of being swallowed", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await installServiceWorkerMock(page, { registrationError: true });
  await page.goto("/");

  await expect(page.getByTestId("service-worker-error")).toContainText("Автоматическое обновление временно недоступно");
  await expect.poll(() => errors.some((message) => message.includes("Service worker registration failed"))).toBe(true);
});
