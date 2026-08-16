import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

import {
  captureRuntimeErrors,
  installQualityGateAPI,
} from "./support/quality-gates";
import {
  installActiveLessonFixture,
  openActiveLesson,
} from "./support/active-lesson-fixture";
import { installCanonicalWordDetailFixture } from "./support/word-detail-fixture";

type ExplicitAppearance = "light" | "dark";

const TABLET_VIEWPORT = { width: 768, height: 1024 } as const;
const VIEWPORT_TOLERANCE_PX = 1;

const AUTHENTICATED_ROUTES = [
  {
    name: "home",
    url: "/",
    heading: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/,
  },
  { name: "learn", url: "/learn", heading: "Соберите один сфокусированный урок" },
  { name: "progress", url: "/progress", heading: "Прогресс" },
  { name: "dictionary", url: "/dictionary", heading: "Словарь" },
  { name: "word detail", url: "/words/101", heading: "rollback" },
  { name: "phrases", url: "/phrases", heading: "Находите готовые формулировки" },
  {
    name: "phrase detail",
    url: "/phrases/identify-root-cause",
    heading: "We need to identify the root cause.",
  },
  { name: "profile", url: "/profile", heading: "Профиль" },
] as const;

const TABLET_SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000205",
    email: "tablet-parity@example.com",
    displayName: "Tablet Parity",
    createdAt: "2026-08-17T00:00:00Z",
  },
  tokens: {
    accessToken: "tablet-parity-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const TABLET_ONBOARDING_PROMPT = {
  position: 0,
  id: 20501,
  kind: "word",
  lemma: "schema evolution",
  phonetic: "/ˈskiːmə/",
  partOfSpeech: "noun",
  topic: "Data Engineering",
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installOnboardingTabletAPI(context: BrowserContext): Promise<void> {
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "tablet-parity-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/auth/refresh") {
      return fulfillJSON(route, 200, TABLET_SESSION);
    }
    if (path === "/api/v1/auth/sessions") {
      return fulfillJSON(route, 200, { sessions: [] });
    }
    if (path === "/api/v1/onboarding" && request.method() === "GET") {
      return fulfillJSON(route, 200, { state: "not_started", total: 0, marked: 0 });
    }
    if (path === "/api/v1/onboarding/start" && request.method() === "POST") {
      return fulfillJSON(route, 200, {
        state: "in_progress",
        total: 1,
        marked: 0,
        current: TABLET_ONBOARDING_PROMPT,
      });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: `${request.method()} ${path}` },
    });
  });
}

async function prepareTabletAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
  await page.setViewportSize(TABLET_VIEWPORT);
  await page.emulateMedia({
    colorScheme: appearance,
    reducedMotion: "reduce",
  });
  await page.addInitScript((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function expectTabletEnvironment(page: Page, appearance: ExplicitAppearance): Promise<void> {
  expect(page.viewportSize()).toEqual(TABLET_VIEWPORT);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);

  const media = await page.evaluate(() => ({
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));
  expect(media.reducedMotion).toBe(true);
  expect(media.dark).toBe(appearance === "dark");
}

async function expectHorizontalTabletGeometry(page: Page): Promise<void> {
  const geometry = await page.evaluate(({ tolerance }) => {
    const viewportWidth = document.documentElement.clientWidth;
    const contentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    );
    const main = document.querySelector<HTMLElement>("#lexigo-main-content");
    const mainRect = main?.getBoundingClientRect() ?? null;
    const selector = [
      "a[href]",
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const offenders = Array.from(document.querySelectorAll<HTMLElement>(selector))
      .flatMap((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const rendered = style.display !== "none"
          && style.visibility !== "hidden"
          && style.visibility !== "collapse"
          && Number.parseFloat(style.opacity || "1") > 0
          && rect.width > 0
          && rect.height > 0;
        if (!rendered) return [];

        // Controls completely outside the horizontal viewport can legitimately
        // belong to an overflow-owned scroller. Partially visible controls must
        // keep their full focusable box inside the viewport at the current state.
        const intersectsViewport = rect.right > 0 && rect.left < viewportWidth;
        if (!intersectsViewport) return [];
        if (rect.left >= -tolerance && rect.right <= viewportWidth + tolerance) return [];

        const label = element.getAttribute("aria-label")
          ?? element.getAttribute("title")
          ?? element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80)
          ?? "";
        return [{
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: element.className,
          label,
          left: rect.left,
          right: rect.right,
          width: rect.width,
        }];
      });

    return {
      viewportWidth,
      contentWidth,
      main: mainRect
        ? { left: mainRect.left, right: mainRect.right, width: mainRect.width }
        : null,
      offenders,
    };
  }, { tolerance: VIEWPORT_TOLERANCE_PX });

  expect(geometry.viewportWidth).toBe(TABLET_VIEWPORT.width);
  expect(geometry.contentWidth).toBeLessThanOrEqual(
    geometry.viewportWidth + VIEWPORT_TOLERANCE_PX,
  );
  expect(geometry.main, "#lexigo-main-content must exist for every canonical route").not.toBeNull();
  expect(geometry.main?.left ?? 0).toBeGreaterThanOrEqual(-VIEWPORT_TOLERANCE_PX);
  expect(geometry.main?.right ?? 0).toBeLessThanOrEqual(
    geometry.viewportWidth + VIEWPORT_TOLERANCE_PX,
  );
  expect(geometry.offenders, JSON.stringify(geometry.offenders, null, 2)).toEqual([]);
}

async function expectOrdinaryRouteShell(page: Page): Promise<void> {
  await expect(page.locator(".lx-route-nav:visible")).toHaveCount(1);
}

async function expectFocusedRouteShell(page: Page): Promise<void> {
  await expect(page.locator(".lx-route-nav:visible")).toHaveCount(0);
}

test.describe("#205 consolidated 768×1024 tablet parity matrix", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const appearance of ["light", "dark"] as const) {
    for (const route of AUTHENTICATED_ROUTES) {
      test(`${route.name} is structurally usable at 768×1024 ${appearance}`, async ({ context, page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop-chromium", "canonical tablet structural evidence runs once in Chromium");

        await prepareTabletAppearance(page, appearance);
        await installQualityGateAPI(context);
        await installCanonicalWordDetailFixture(page);
        const runtimeErrors = captureRuntimeErrors(page);

        await page.goto(route.url, { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: route.heading })).toBeVisible({ timeout: 15_000 });
        await expectTabletEnvironment(page, appearance);
        await expectOrdinaryRouteShell(page);
        await expectHorizontalTabletGeometry(page);
        expect(runtimeErrors).toEqual([]);
      });
    }

    test(`active lesson is structurally usable at 768×1024 ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "canonical tablet structural evidence runs once in Chromium");

      await prepareTabletAppearance(page, appearance);
      await installActiveLessonFixture(page, "recall");
      const runtimeErrors = captureRuntimeErrors(page);

      await openActiveLesson(page);
      await expect(page.locator(".lx-active-lesson")).toBeVisible();
      await expectTabletEnvironment(page, appearance);
      await expectFocusedRouteShell(page);
      await expectHorizontalTabletGeometry(page);
      expect(runtimeErrors).toEqual([]);
    });

    test(`onboarding is structurally usable at 768×1024 ${appearance}`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop-chromium", "canonical tablet structural evidence runs once in Chromium");

      await prepareTabletAppearance(page, appearance);
      await installOnboardingTabletAPI(context);
      const runtimeErrors = captureRuntimeErrors(page);

      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-route-client-island="onboarding"]')).toBeVisible();
      await expect(page.getByRole("heading", { name: "Настроим полезный первый урок" })).toBeVisible();
      await expect(page.getByRole("radiogroup", { name: "Ваша рабочая роль" })).toBeVisible();
      await expectTabletEnvironment(page, appearance);
      await expectFocusedRouteShell(page);
      await expectHorizontalTabletGeometry(page);
      expect(runtimeErrors).toEqual([]);
    });
  }
});
