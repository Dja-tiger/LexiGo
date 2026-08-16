import { createHash } from "node:crypto";

import { expect, test, type BrowserContext, type Page, type Route, type TestInfo } from "@playwright/test";

type ExplicitAppearance = "light" | "dark";
type FirstUseVisualBaseline =
  | "guest-compact-light"
  | "guest-compact-dark"
  | "guest-desktop-light"
  | "guest-desktop-dark"
  | "role-compact-light"
  | "role-compact-dark"
  | "resume-desktop-light"
  | "resume-desktop-dark";

const APPROVED_SHA256: Record<FirstUseVisualBaseline, string> = {
  "guest-compact-light": "PENDING_MANUAL_REVIEW",
  "guest-compact-dark": "PENDING_MANUAL_REVIEW",
  "guest-desktop-light": "PENDING_MANUAL_REVIEW",
  "guest-desktop-dark": "PENDING_MANUAL_REVIEW",
  "role-compact-light": "PENDING_MANUAL_REVIEW",
  "role-compact-dark": "PENDING_MANUAL_REVIEW",
  "resume-desktop-light": "PENDING_MANUAL_REVIEW",
  "resume-desktop-dark": "PENDING_MANUAL_REVIEW",
};

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000201",
    email: "first-use-visual@example.com",
    displayName: "First Use Visual",
    createdAt: "2026-08-16T00:00:00Z",
  },
  tokens: {
    accessToken: "first-use-visual-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROMPT = {
  position: 4,
  id: 20101,
  kind: "word",
  lemma: "schema evolution",
  phonetic: "/ˈskiːmə/",
  partOfSpeech: "noun",
  topic: "Data Engineering",
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAppearance(page: Page, appearance: ExplicitAppearance) {
  await page.addInitScript((value) => {
    localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function installGuestAPI(context: BrowserContext) {
  await context.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/refresh") {
      return json(route, 401, { error: { code: "unauthorized", message: "guest" } });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function installOnboardingAPI(context: BrowserContext, mode: "role" | "resume") {
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "first-use-visual-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/auth/sessions") return json(route, 200, { sessions: [] });
    if (path === "/api/v1/onboarding" && request.method() === "GET") {
      if (mode === "resume") {
        return json(route, 200, {
          state: "in_progress",
          total: 12,
          marked: 4,
          current: PROMPT,
        });
      }
      return json(route, 200, { state: "not_started", total: 0, marked: 0 });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function settle(page: Page, appearance: ExplicitAppearance) {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function captureForReview(
  page: Page,
  testInfo: TestInfo,
  baselineName: FirstUseVisualBaseline,
) {
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: false,
    scale: "css",
  });
  await testInfo.attach(`${baselineName}.png`, {
    body: screenshot,
    contentType: "image/png",
  });
  const actualSha256 = createHash("sha256").update(screenshot).digest("hex");
  await testInfo.attach(`${baselineName}.json`, {
    body: Buffer.from(JSON.stringify({ baselineName, actualSha256 }, null, 2)),
    contentType: "application/json",
  });
  expect(
    actualSha256,
    `${baselineName} requires manual Linux PNG review before its hash is approved`,
  ).toBe(APPROVED_SHA256[baselineName]);
}

test.describe("First Use reviewed OpenPencil visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const appearance of ["light", "dark"] as const) {
    test(`Guest Home compact ${appearance}`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-compact", "390×844 Guest Home evidence only");
      testInfo.annotations.push({ type: "openpencil", description: `Guest Home / Mobile / ${appearance}` });
      await installAppearance(page, appearance);
      await installGuestAPI(context);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-route-client-island="guest-home"]')).toBeVisible();
      await settle(page, appearance);
      await captureForReview(page, testInfo, `guest-compact-${appearance}`);
    });

    test(`Guest Home desktop ${appearance}`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-desktop", "1440×1024 Guest Home evidence only");
      testInfo.annotations.push({ type: "openpencil", description: `Guest Home / Desktop / ${appearance}` });
      await page.setViewportSize({ width: 1440, height: 1024 });
      await installAppearance(page, appearance);
      await installGuestAPI(context);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-route-client-island="guest-home"]')).toBeVisible();
      await settle(page, appearance);
      await captureForReview(page, testInfo, `guest-desktop-${appearance}`);
    });

    test(`Onboarding role compact ${appearance}`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-compact", "390×844 role-step evidence only");
      testInfo.annotations.push({ type: "openpencil", description: `Onboarding / Role / Mobile / ${appearance}` });
      await installAppearance(page, appearance);
      await installOnboardingAPI(context, "role");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Настроим полезный первый урок" })).toBeVisible();
      await settle(page, appearance);
      await captureForReview(page, testInfo, `role-compact-${appearance}`);
    });

    test(`Diagnostic resume desktop ${appearance}`, async ({ context, page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-desktop", "1440×1024 resume evidence only");
      testInfo.annotations.push({ type: "openpencil", description: `Diagnostic Resume / Desktop / ${appearance}` });
      await page.setViewportSize({ width: 1440, height: 1024 });
      await installAppearance(page, appearance);
      await installOnboardingAPI(context, "resume");
      await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Продолжим диагностику" })).toBeVisible();
      await settle(page, appearance);
      await captureForReview(page, testInfo, `resume-desktop-${appearance}`);
    });
  }
});
