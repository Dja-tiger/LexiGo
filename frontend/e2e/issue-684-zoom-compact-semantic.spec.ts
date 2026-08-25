import { resolve } from "node:path";

import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type Page,
  type Worker,
} from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type ExplicitAppearance = "light" | "dark";

type BrowserZoomResult = Readonly<{
  tabId: number;
  url: string;
  previousZoom: number;
  zoom: number;
  mode: string | null;
  scope: string | null;
}>;

async function setBrowserZoom(worker: Worker, targetURL: string, zoomFactor: number): Promise<BrowserZoomResult> {
  return worker.evaluate(async ({ targetURL: exactTargetURL, zoomFactor: exactZoomFactor }) => {
    type ZoomController = { setZoomForURL: (url: string, factor: number) => Promise<BrowserZoomResult> };
    const controller = (globalThis as typeof globalThis & {
      lexigoBrowserZoomController?: ZoomController;
    }).lexigoBrowserZoomController;
    if (!controller) throw new Error("LexiGo browser zoom extension controller is unavailable.");
    return controller.setZoomForURL(exactTargetURL, exactZoomFactor);
  }, { targetURL, zoomFactor });
}

async function browserZoomWorker(context: BrowserContext): Promise<Worker> {
  const existing = context.serviceWorkers().find((worker) => /^chrome-extension:\/\/[a-z]+\/background\.js$/.test(worker.url()));
  if (existing) return existing;
  const worker = await context.waitForEvent("serviceworker", { timeout: 10_000 });
  expect(worker.url()).toMatch(/^chrome-extension:\/\/[a-z]+\/background\.js$/);
  return worker;
}

async function expectSemanticCompactPaint(page: Page, appearance: ExplicitAppearance): Promise<void> {
  const mobile = page.locator('[data-route-navigation="mobile"]');
  await expect(mobile).toBeVisible();
  await expect(page.locator('[data-route-navigation="rail"]')).toBeHidden();
  await expect(page.locator('[data-route-navigation="header"]')).toBeHidden();

  const result = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>('[data-route-navigation="mobile"]');
    if (!nav) throw new Error("Issue #684 mobile RouteChrome is not mounted");
    const active = nav.querySelector<HTMLElement>("a.active");
    const inactive = nav.querySelector<HTMLElement>("a:not(.active)");
    if (!active || !inactive) throw new Error("Issue #684 requires active and inactive RouteChrome links");

    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.position = "fixed";
    probe.style.pointerEvents = "none";
    probe.style.background = "color-mix(in srgb, var(--ak-surface) 96%, transparent)";
    probe.style.borderTop = "1px solid var(--ak-border)";
    probe.style.color = "var(--ak-text-muted)";

    const activeProbe = document.createElement("div");
    activeProbe.setAttribute("aria-hidden", "true");
    activeProbe.style.position = "fixed";
    activeProbe.style.pointerEvents = "none";
    activeProbe.style.color = "var(--ak-primary)";
    activeProbe.style.background = "transparent";

    document.body.append(probe, activeProbe);
    const navStyle = window.getComputedStyle(nav);
    const inactiveStyle = window.getComputedStyle(inactive);
    const activeStyle = window.getComputedStyle(active);
    const probeStyle = window.getComputedStyle(probe);
    const activeProbeStyle = window.getComputedStyle(activeProbe);
    const rect = nav.getBoundingClientRect();

    const value = {
      viewportWidth: window.innerWidth,
      navigation: Array.from(document.querySelectorAll<HTMLElement>("[data-route-navigation]"))
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && box.width > 2 && box.height > 2;
        })
        .map((element) => element.dataset.routeNavigation ?? ""),
      geometry: {
        left: rect.left,
        right: rect.right,
        bottom: window.innerHeight - rect.bottom,
        borderRadius: navStyle.borderRadius,
        boxShadow: navStyle.boxShadow,
        gap: navStyle.gap,
      },
      actual: {
        backgroundColor: navStyle.backgroundColor,
        borderTopColor: navStyle.borderTopColor,
        inactiveColor: inactiveStyle.color,
        activeColor: activeStyle.color,
        activeBackgroundColor: activeStyle.backgroundColor,
      },
      expected: {
        backgroundColor: probeStyle.backgroundColor,
        borderTopColor: probeStyle.borderTopColor,
        inactiveColor: probeStyle.color,
        activeColor: activeProbeStyle.color,
        activeBackgroundColor: activeProbeStyle.backgroundColor,
      },
      tokens: {
        border: navStyle.getPropertyValue("--ak-border").trim(),
        surface: navStyle.getPropertyValue("--ak-surface").trim(),
        textMuted: navStyle.getPropertyValue("--ak-text-muted").trim(),
        primary: navStyle.getPropertyValue("--ak-primary").trim(),
      },
    };

    probe.remove();
    activeProbe.remove();
    return value;
  });

  expect(result.viewportWidth, `${appearance}: browser-owned 200% zoom must land at exact 720px`).toBe(720);
  expect(result.navigation, `${appearance}: #603 compact continuation must remain the only shared navigation owner`).toEqual(["mobile"]);
  expect(result.geometry.left, `${appearance}: semantic compact bar aligns to viewport start`).toBeCloseTo(0, 1);
  expect(result.geometry.right, `${appearance}: semantic compact bar aligns to viewport end`).toBeCloseTo(720, 1);
  expect(result.geometry.bottom, `${appearance}: semantic compact bar aligns to viewport bottom`).toBeCloseTo(0, 1);
  expect(result.geometry.borderRadius).toBe("0px");
  expect(result.geometry.boxShadow).toBe("none");
  expect(result.geometry.gap).toBe("0px");
  expect(result.actual, `${appearance}: effective paint must resolve through current semantic compact tokens`).toEqual(result.expected);

  for (const [name, token] of Object.entries(result.tokens)) {
    expect(token, `${appearance}: semantic token ${name} must resolve`).not.toBe("");
  }

  const serializedPaint = JSON.stringify(result.actual);
  for (const retiredRgb of ["8, 14, 27", "193, 173, 255", "104, 75, 220", "139, 92, 246", "51, 168, 255"]) {
    expect(serializedPaint, `${appearance}: retired paint ${retiredRgb} must not compute`).not.toContain(retiredRgb);
  }
}

async function runAppearance(appearance: ExplicitAppearance): Promise<void> {
  const extensionPath = resolve(process.cwd(), "e2e/support/browser-zoom-extension");
  const context = await chromium.launchPersistentContext("", {
    baseURL: "http://127.0.0.1:3000",
    channel: "chromium",
    headless: true,
    locale: "ru-RU",
    colorScheme: appearance,
    reducedMotion: "reduce",
    serviceWorkers: "allow",
    viewport: { width: 1440, height: 900 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  try {
    const page = context.pages()[0] ?? await context.newPage();
    await installDeterministicRuntime(page);
    await page.addInitScript((value) => window.localStorage.setItem("lexigo.appearance.v1", value), appearance);
    await installQualityGateAPI(context);
    const worker = await browserZoomWorker(context);
    const runtimeErrors = captureRuntimeErrors(page);

    await page.goto("/learn", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
    await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);

    const applied = await setBrowserZoom(worker, page.url(), 2);
    expect(applied.zoom).toBeCloseTo(2, 5);
    expect(applied.mode).toBe("automatic");
    expect(applied.scope).toBe("per-tab");
    await expect.poll(async () => page.evaluate(() => window.innerWidth)).toBe(720);

    await expectSemanticCompactPaint(page, appearance);
    expect(runtimeErrors, `${appearance}: runtime errors`).toEqual([]);
  } finally {
    await context.close();
  }
}

test.describe("Issue #684 semantic compact RouteChrome at exact 720px true browser zoom", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const appearance of ["light", "dark"] as const) {
    test(`late #603 compact owner resolves current semantic paint — ${appearance}`, async ({}, testInfo) => {
      test.skip(testInfo.project.name !== "visual-desktop", "Issue #684 true browser zoom runs once in authoritative desktop Chromium");
      await runAppearance(appearance);
    });
  }
});
