import { expect, test, type Page } from "@playwright/test";

type ExplicitAppearance = "light" | "dark";

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
          backend: 100, academicTechnicalEnglish: 0,
        },
        topics: [],
      }),
    });
  });
}

async function installActiveLessonMock(page: Page) {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "service-worker-e2e-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/catalog/metadata") return route.fallback();
    if (path === "/api/v1/auth/refresh") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "00000000-0000-0000-0000-000000000078",
            email: "service-worker@example.com",
            displayName: "Service Worker Tester",
            createdAt: "2026-01-01T00:00:00Z",
          },
          tokens: { accessToken: "service-worker-e2e-token", tokenType: "Bearer", expiresIn: 900 },
        }),
      });
    }
    if (path === "/api/v1/progress") {
      const emptyMode = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          dueNow: 0, dueWords: 0, duePhrases: 0, totalWords: 1, totalPhrases: 0, newWords: 1,
          learningWords: 0, reviewWords: 0, masteredWords: 0, masteredPhrases: 0, reviewsToday: 0,
          successfulToday: 0, objectiveReviewsToday: 0, objectiveSuccessfulToday: 0, reviewsTotal: 0,
          dailyGoal: 30, currentStreak: 0, longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0,
          retainedPhrasesWeek: 0, eventSchemaVersion: 2,
          modes: { study: emptyMode, recall: emptyMode, choice: emptyMode, legacy: emptyMode },
        }),
      });
    }
    if (path === "/api/v1/lessons/active") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000780",
          source: "mixed",
          studyMode: "study",
          lessonSize: "1",
          currentIndex: 0,
          version: 1,
          status: "active",
          items: [{
            id: 78,
            kind: "word",
            position: 0,
            lemma: "secure",
            translation: "безопасный",
            phonetic: "/sɪˈkjʊr/",
            partOfSpeech: "adjective",
            topic: "Security",
            examples: ["Keep the session secure."],
            note: "",
            status: "new",
          }],
          createdAt: "2026-07-21T00:00:00Z",
          updatedAt: "2026-07-21T00:00:00Z",
        }),
      });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], count: 0 }) });
    }
    if (path === "/api/v1/performance/rum") return route.fulfill({ status: 202, body: "" });
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "not_mocked", message: path } }),
    });
  });
}

async function installAppearancePreference(
  page: Page,
  appearance: ExplicitAppearance,
  options: { recovered?: boolean } = {},
) {
  await page.addInitScript(({ appearance, recovered }) => {
    window.localStorage.setItem("lexigo.appearance.v1", appearance);
    if (!recovered) return;
    window.sessionStorage.setItem("lexigo.service-worker.recovery.v1", JSON.stringify({
      version: 1,
      reason: "service-worker-update",
      requestedAt: "2026-08-24T18:00:00.000Z",
      fromBuild: "previous-build",
      href: "http://127.0.0.1:3000/",
      resumeHref: "http://127.0.0.1:3000/",
      lessonActive: false,
    }));
  }, { appearance, recovered: options.recovered ?? false });
}

async function installServiceWorkerMock(
  page: Page,
  options: { registrationError?: boolean; waiting?: boolean } = {},
) {
  await page.addInitScript(({ registrationError, waiting }) => {
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

      constructor(active: MockWorker, waitingWorker: MockWorker | null) {
        super();
        this.active = active as unknown as ServiceWorker;
        this.waiting = waitingWorker as unknown as ServiceWorker | null;
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
    const waitingWorker = new MockWorker("http://127.0.0.1:3000/sw.js?build=incompatible-b");
    const registration = new MockRegistration(active, waiting === false ? null : waitingWorker);
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

async function semanticPresentationSnapshot(page: Page, selector: string, primaryButtonName?: string) {
  return page.locator(selector).evaluate((element, buttonName) => {
    const resolveColor = (value: string) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    const resolveBackground = (value: string) => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = value;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return resolved;
    };

    const surfaceStyle = getComputedStyle(element);
    const strong = element.querySelector("strong");
    const copy = element.querySelector("span");
    const primary = buttonName
      ? Array.from(element.querySelectorAll<HTMLButtonElement>("button"))
        .find((button) => button.textContent?.trim() === buttonName)
      : null;
    const primaryStyle = primary ? getComputedStyle(primary) : null;

    return {
      appearance: document.documentElement.dataset.lexigoAppearance,
      backgroundColor: surfaceStyle.backgroundColor,
      backgroundImage: surfaceStyle.backgroundImage,
      color: surfaceStyle.color,
      strongColor: strong ? getComputedStyle(strong).color : "",
      copyColor: copy ? getComputedStyle(copy).color : "",
      primaryBackgroundColor: primaryStyle?.backgroundColor ?? "",
      primaryBackgroundImage: primaryStyle?.backgroundImage ?? "",
      primaryBorderColor: primaryStyle?.borderColor ?? "",
      primaryColor: primaryStyle?.color ?? "",
      tokenSurface: resolveColor("var(--ak-color-surface)"),
      tokenTextMain: resolveColor("var(--ak-color-text-main)"),
      tokenTextMuted: resolveColor("var(--ak-color-text-muted)"),
      tokenPrimary: resolveColor("var(--ak-color-primary)"),
      tokenRetained: resolveColor("var(--ak-color-retained)"),
      tokenWeak: resolveColor("var(--ak-color-weak)"),
      successBackground: resolveBackground("color-mix(in srgb, var(--ak-color-retained) 10%, var(--ak-color-surface))"),
      errorBackground: resolveBackground("color-mix(in srgb, var(--ak-color-weak) 10%, var(--ak-color-surface))"),
    };
  }, primaryButtonName);
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
  await installActiveLessonMock(page);
  await page.goto("/lesson/active?source=mixed");
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);

  const update = page.getByTestId("service-worker-update");
  const defer = update.getByRole("button", { name: "После урока" });
  await expect(defer).toBeVisible();
  await defer.click();
  await expect(update).toContainText("автоматически после выхода из урока");
  expect((await serviceWorkerSnapshot(page)).messages).toEqual([]);

  await page.getByRole("button", { name: "Открыть профиль", exact: true }).click();
  await expect(page).toHaveURL(/\/profile(?:\?|$)/);

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

for (const appearance of ["light", "dark"] as const) {
  test(`update surface uses ${appearance} semantic appearance tokens`, async ({ page }) => {
    await installAppearancePreference(page, appearance);
    await installServiceWorkerMock(page);
    await page.goto("/");

    await expect(page.getByTestId("service-worker-update")).toBeVisible();
    const snapshot = await semanticPresentationSnapshot(
      page,
      '[data-testid="service-worker-update"]',
      "Обновить сейчас",
    );

    expect(snapshot.appearance).toBe(appearance);
    expect(snapshot.backgroundColor).toBe(snapshot.tokenSurface);
    expect(snapshot.backgroundImage).toBe("none");
    expect(snapshot.color).toBe(snapshot.tokenTextMain);
    expect(snapshot.strongColor).toBe(snapshot.tokenTextMain);
    expect(snapshot.copyColor).toBe(snapshot.tokenTextMuted);
    expect(snapshot.primaryBackgroundColor).toBe(snapshot.tokenPrimary);
    expect(snapshot.primaryBackgroundImage).toBe("none");
    expect(snapshot.primaryBorderColor).toBe(snapshot.tokenPrimary);
    expect(snapshot.primaryColor).toBe(snapshot.tokenSurface);
  });

  test(`error surface uses ${appearance} weak semantic state`, async ({ page }) => {
    await installAppearancePreference(page, appearance);
    await installServiceWorkerMock(page, { registrationError: true });
    await page.goto("/");

    await expect(page.getByTestId("service-worker-error")).toBeVisible();
    const snapshot = await semanticPresentationSnapshot(page, '[data-testid="service-worker-error"]');

    expect(snapshot.appearance).toBe(appearance);
    expect(snapshot.backgroundColor).toBe(snapshot.errorBackground);
    expect(snapshot.backgroundImage).toBe("none");
    expect(snapshot.color).toBe(snapshot.tokenTextMain);
    expect(snapshot.strongColor).toBe(snapshot.tokenWeak);
    expect(snapshot.copyColor).toBe(snapshot.tokenTextMuted);
  });

  test(`updated surface uses ${appearance} retained semantic state`, async ({ page }) => {
    await installAppearancePreference(page, appearance, { recovered: true });
    await installServiceWorkerMock(page, { waiting: false });
    await page.goto("/");

    const updated = page.locator(".lx-sw-update--success");
    await expect(updated).toContainText("LexiGo обновлён");
    const snapshot = await semanticPresentationSnapshot(page, ".lx-sw-update--success");

    expect(snapshot.appearance).toBe(appearance);
    expect(snapshot.backgroundColor).toBe(snapshot.successBackground);
    expect(snapshot.backgroundImage).toBe("none");
    expect(snapshot.color).toBe(snapshot.tokenTextMain);
    expect(snapshot.strongColor).toBe(snapshot.tokenRetained);
    expect(snapshot.copyColor).toBe(snapshot.tokenTextMuted);
  });
}
