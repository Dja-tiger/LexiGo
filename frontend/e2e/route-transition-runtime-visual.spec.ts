import { createHash } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type Appearance = "light" | "dark";
type TransitionRoute = "dictionary" | "phrases" | "learn";

type ReviewedTransitionBaseline = Readonly<{
  width: 390;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const BASELINES: Record<`${TransitionRoute}.${Appearance}`, ReviewedTransitionBaseline> = {
  "dictionary.light": {
    width: 390,
    height: 1197,
    sha256: "4487459cea3e1347768e381ce393aeeecfb3f1e22b47e01554810cb6508b556d",
    sourceRun: 32046365625,
    sourceHeadSha: "43e80f5b1b0d6c778f53147ba6a115fefc94df0b",
  },
  "dictionary.dark": {
    width: 390,
    height: 1197,
    sha256: "9104709d0b7f742ae22f18bacfe605a7658eb0db0b539e93b597ff8779cd855c",
    sourceRun: 32046365625,
    sourceHeadSha: "43e80f5b1b0d6c778f53147ba6a115fefc94df0b",
  },
  "phrases.light": {
    width: 390,
    height: 1616,
    sha256: "91cc3fabe4cc7369e1c67992a28d4199b0a68028e354098fe17a78f5ddf93318",
    sourceRun: 32046365625,
    sourceHeadSha: "43e80f5b1b0d6c778f53147ba6a115fefc94df0b",
  },
  "phrases.dark": {
    width: 390,
    height: 1616,
    sha256: "066a3ba05e676501a6025214567bdbdd901c8b820e8cb632003e5fc44a00b6b9",
    sourceRun: 32046365625,
    sourceHeadSha: "43e80f5b1b0d6c778f53147ba6a115fefc94df0b",
  },
  "learn.light": {
    width: 390,
    height: 1212,
    sha256: "14732c934d4b91a89415174ccd01a9c1a9c4134c9b07c21229401c48bb544425",
    sourceRun: 32093144691,
    sourceHeadSha: "928b0186a688545aadcd9b82d84e5940f79f0ab6",
  },
  "learn.dark": {
    width: 390,
    height: 1212,
    sha256: "012800cae78c9639a97908b7a1d687e8b4893f47cc2cf615ecb6d04667827dc5",
    sourceRun: 32046365625,
    sourceHeadSha: "43e80f5b1b0d6c778f53147ba6a115fefc94df0b",
  },
};

async function installAppearance(page: Page, appearance: Appearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({ colorScheme: appearance, reducedMotion: "reduce" });
}

async function clickVisiblePrimaryNavigation(page: Page, view: "home" | "learn" | "library"): Promise<void> {
  const link = page.locator(`[data-navigation-view="${view}"]:visible`).first();
  await expect(link).toBeVisible();
  await link.click();
}

async function expectCompactShell(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const visibleNavigation = Array.from(document.querySelectorAll<HTMLElement>("[data-route-navigation]"))
      .filter((node) => {
        const style = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((node) => node.dataset.routeNavigation ?? "");
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      visibleNavigation,
    };
  });

  expect(geometry.innerWidth).toBe(390);
  expect(geometry.innerHeight).toBe(844);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.visibleNavigation).toEqual(["mobile"]);
}

async function expectReminderUsesSemanticTokens(page: Page): Promise<void> {
  const result = await page.locator(".lx-route-reminder-entry > summary").evaluate((summary) => {
    const root = document.documentElement;
    const rootStyle = window.getComputedStyle(root);
    const summaryStyle = window.getComputedStyle(summary);
    const icon = summary.querySelector<SVGElement>("svg");

    const resolveColorToken = (name: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${name})`;
      document.body.appendChild(probe);
      const color = window.getComputedStyle(probe).color;
      probe.remove();
      return color;
    };

    return {
      appearance: root.dataset.lexigoResolvedAppearance ?? "",
      surface: resolveColorToken("--ak-color-surface"),
      text: resolveColorToken("--ak-color-text-main"),
      primary: resolveColorToken("--ak-color-primary"),
      background: summaryStyle.backgroundColor,
      color: summaryStyle.color,
      iconColor: icon ? window.getComputedStyle(icon).color : "",
      canvasToken: rootStyle.getPropertyValue("--ak-color-canvas").trim(),
    };
  });

  expect(result.background).toBe(result.surface);
  expect(result.color).toBe(result.text);
  expect(result.iconColor).toBe(result.primary);
  expect(result.appearance).toMatch(/^(light|dark)$/);
  expect(result.canvasToken).not.toBe("");
}

async function expectMaterialsGeometry(page: Page): Promise<void> {
  const result = await page.locator(".lx-catalog-kind-navigation").evaluate((navigation) => {
    const buttons = Array.from(navigation.querySelectorAll<HTMLButtonElement>("button"));
    const navigationRect = navigation.getBoundingClientRect();
    return {
      navigationHeight: navigationRect.height,
      buttons: buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        return {
          height: rect.height,
          width: rect.width,
          whiteSpace: style.whiteSpace,
          scrollWidth: button.scrollWidth,
          clientWidth: button.clientWidth,
          scrollHeight: button.scrollHeight,
          clientHeight: button.clientHeight,
        };
      }),
    };
  });

  expect(result.buttons).toHaveLength(2);
  for (const button of result.buttons) {
    expect(button.height).toBeGreaterThanOrEqual(48);
    expect(button.width).toBeGreaterThan(0);
    expect(button.whiteSpace).toBe("nowrap");
    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth + 1);
    expect(button.scrollHeight).toBeLessThanOrEqual(button.clientHeight + 1);
  }
  expect(Math.abs(result.buttons[0].height - result.buttons[1].height)).toBeLessThanOrEqual(1);
}

async function settleRoute(page: Page, route: TransitionRoute, appearance: Appearance): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);

  if (route === "dictionary") {
    await expect(page).toHaveURL(/\/dictionary$/);
    await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Словарь" })).toBeVisible();
    await expectMaterialsGeometry(page);
  } else if (route === "phrases") {
    await expect(page).toHaveURL(/\/phrases$/);
    await expect(page.locator('[data-route-client-island="phrases"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
    await expectMaterialsGeometry(page);
  } else {
    await expect(page).toHaveURL(/\/learn$/);
    await expect(page.locator('[data-route-client-island="learn"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  }

  await expectCompactShell(page);
  await expectReminderUsesSemanticTokens(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function navigateFromHome(page: Page, route: TransitionRoute): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();

  if (route === "learn") {
    await clickVisiblePrimaryNavigation(page, "learn");
    return;
  }

  await clickVisiblePrimaryNavigation(page, "library");
  await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
  if (route === "phrases") {
    await page.locator(".lx-catalog-kind-navigation").getByRole("button", { name: "Рабочие фразы", exact: true }).click();
  }
}

async function captureTransitionEvidence(
  page: Page,
  testInfo: TestInfo,
  route: TransitionRoute,
  appearance: Appearance,
): Promise<void> {
  if (route === "learn") {
    const reminder = page.locator(".lx-route-reminder-entry");
    await reminder.locator(":scope > summary").click();
    await expect(reminder.getByRole("region", { name: "Текущее напоминание о занятии" })).toBeVisible();
  }

  const profileButton = page.getByRole("button", { name: "Открыть профиль" });
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    mask: await profileButton.count() > 0 ? [profileButton] : [],
    scale: "css",
  });
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };
  const baseline = BASELINES[`${route}.${appearance}`];

  await testInfo.attach(`route-transition-${route}-${appearance}.png`, {
    body: screenshot,
    contentType: "image/png",
  });
  await testInfo.attach(`route-transition-${route}-${appearance}.json`, {
    body: Buffer.from(JSON.stringify({
      issue: 577,
      route,
      appearance,
      viewport: { width: 390, height: 844 },
      provenance: {
        dictionary: "openpencil-screen-map dictionary.mobile.light / fig_4008",
        phrases: "openpencil-screen-map phrases.mobile.catalog.light / fig_7281",
        learn: "openpencil-screen-map learn.mobile.recommended / fig_6826",
      }[route],
      actual,
      approved: baseline,
    }, null, 2)),
    contentType: "application/json",
  });

  if (baseline.sha256 === "REVIEW_REQUIRED") {
    throw new Error(
      `REVIEW_REQUIRED ${route}.${appearance}: ${actual.width}x${actual.height} sha256=${actual.sha256}`,
    );
  }

  expect(
    actual,
    `${route}.${appearance}: reviewed Linux baseline from CI ${baseline.sourceRun} at ${baseline.sourceHeadSha}`,
  ).toEqual({
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  });
}

test.describe("Issue #577 compact route-transition runtime evidence", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  for (const appearance of ["light", "dark"] as const) {
    for (const route of ["dictionary", "phrases", "learn"] as const) {
      test(`${route} after Home client navigation — ${appearance}`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "visual-compact", "Issue #577 transition evidence is canonical 390×844 only");
        expect(page.viewportSize()).toEqual({ width: 390, height: 844 });

        await installAppearance(page, appearance);
        const runtimeErrors = captureRuntimeErrors(page);
        await navigateFromHome(page, route);
        await settleRoute(page, route, appearance);
        expect(runtimeErrors).toEqual([]);
        await captureTransitionEvidence(page, testInfo, route, appearance);
      });
    }
  }
});