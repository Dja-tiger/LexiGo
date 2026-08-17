import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";

type Appearance = "light" | "dark";

type ReviewedBaseline = Readonly<{
  width: 768;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const appDirectory = path.join(process.cwd(), "app");
const compactHomeStylesheet = readFileSync(path.join(appDirectory, "compact-home.css"), "utf8");
const adaptiveHomeStylesheet = readFileSync(
  path.join(appDirectory, "adaptive-knowledge-coach-home.css"),
  "utf8",
);
const tabletProgressStylesheet = readFileSync(
  path.join(appDirectory, "home-tablet-progress-spacing.css"),
  "utf8",
);

const REVIEW_REQUIRED: ReviewedBaseline = {
  width: 768,
  height: 0,
  sha256: "REVIEW_REQUIRED",
  sourceRun: 0,
  sourceHeadSha: "REVIEW_REQUIRED",
};

const BASELINES: Record<Appearance, ReviewedBaseline> = {
  light: REVIEW_REQUIRED,
  dark: REVIEW_REQUIRED,
};

function progressRowsMarkup(): string {
  return `<!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; min-width: 0; }
          body { width: 100%; overflow-x: hidden; }
          .lx-routed-app { width: 100%; min-width: 0; }
          .lx-main-content { width: 100%; min-width: 0; }
          .lx-progress-list { width: min(520px, 100%); }
        </style>
        <style data-owner="compact-home">${compactHomeStylesheet}</style>
        <style data-owner="adaptive-home">${adaptiveHomeStylesheet}</style>
        <style data-owner="tablet-progress">${tabletProgressStylesheet}</style>
      </head>
      <body>
        <main class="lx-routed-app">
          <section class="lx-main-content" aria-label="Главная">
            <div class="lx-progress-list">
              <div><span>Готово к повторению</span><strong>4</strong></div>
              <div><span>Закреплено за неделю</span><strong>16</strong></div>
              <div><span>Серия</span><strong>7 дн.</strong></div>
            </div>
          </section>
        </main>
      </body>
    </html>`;
}

async function readRowGeometry(page: Page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".lx-progress-list > div"));
    return {
      documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      clientWidth: document.documentElement.clientWidth,
      rows: rows.map((row) => {
        const label = row.querySelector<HTMLElement>("span");
        const value = row.querySelector<HTMLElement>("strong");
        if (!label || !value) throw new Error("Missing Home progress label/value owner");
        const rowStyle = window.getComputedStyle(row);
        const labelRect = label.getBoundingClientRect();
        const valueRect = value.getBoundingClientRect();
        return {
          display: rowStyle.display,
          gap: rowStyle.gap,
          justifyContent: rowStyle.justifyContent,
          labelRight: labelRect.right,
          valueLeft: valueRect.left,
          separation: valueRect.left - labelRect.right,
        };
      }),
    };
  });
}

async function installAppearance(page: Page, appearance: Appearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({
    colorScheme: appearance,
    reducedMotion: "reduce",
  });
}

async function settleHome(page: Page, appearance: Appearance): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
  await expect(page.locator(".lx-progress-list")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function expectRuntimeTabletGeometry(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".lx-progress-list > div"));
    const focusableSelector = [
      "a[href]",
      "button",
      "input",
      "select",
      "textarea",
      "summary",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const rowGeometry = rows.map((row) => {
      const label = row.querySelector<HTMLElement>("span");
      const value = row.querySelector<HTMLElement>("strong");
      if (!label || !value) throw new Error("Missing Home progress row children");
      const rowRect = row.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      const valueRect = value.getBoundingClientRect();
      return {
        display: window.getComputedStyle(row).display,
        rowLeft: rowRect.left,
        rowRight: rowRect.right,
        labelRight: labelRect.right,
        valueLeft: valueRect.left,
        separation: valueRect.left - labelRect.right,
      };
    });

    const focusableOffenders = Array.from(
      document.querySelectorAll<HTMLElement>(focusableSelector),
    ).flatMap((node) => {
      const style = window.getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const rendered = style.display !== "none"
        && style.visibility !== "hidden"
        && style.visibility !== "collapse"
        && Number.parseFloat(style.opacity || "1") > 0
        && box.width > 0
        && box.height > 0;
      if (!rendered) return [];
      const intersectsViewport = box.right > 0 && box.left < root.clientWidth;
      if (!intersectsViewport) return [];
      if (box.left >= -1 && box.right <= root.clientWidth + 1) return [];
      return [{
        tag: node.tagName.toLowerCase(),
        label: node.getAttribute("aria-label")
          ?? node.getAttribute("title")
          ?? node.textContent?.trim().replace(/\s+/g, " ").slice(0, 80)
          ?? "",
        left: box.left,
        right: box.right,
      }];
    });

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      rowGeometry,
      focusableOffenders,
    };
  });

  expect(geometry.innerWidth).toBe(768);
  expect(geometry.innerHeight).toBe(1024);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.rowGeometry).toHaveLength(3);
  for (const row of geometry.rowGeometry) {
    expect(row.display).toBe("flex");
    expect(row.rowLeft).toBeGreaterThanOrEqual(-1);
    expect(row.rowRight).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(row.separation, "Home progress label/value must have visible separation").toBeGreaterThanOrEqual(8);
  }
  expect(geometry.focusableOffenders).toEqual([]);
}

async function captureEvidence(
  page: Page,
  testInfo: TestInfo,
  appearance: Appearance,
): Promise<void> {
  const baseline = BASELINES[appearance];
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

  await testInfo.attach(`home-tablet-progress-${appearance}.png`, {
    body: screenshot,
    contentType: "image/png",
  });
  await testInfo.attach(`home-tablet-progress-${appearance}.json`, {
    body: Buffer.from(JSON.stringify({
      route: "/",
      appearance,
      viewport: { width: 768, height: 1024 },
      actual,
      approved: baseline,
    }, null, 2)),
    contentType: "application/json",
  });

  expect(
    actual,
    `home.${appearance}: manually review exact Linux evidence before replacing REVIEW_REQUIRED`,
  ).toEqual({
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  });
}

test.describe("Issue #574 Home tablet progress spacing", () => {
  test.describe.configure({ timeout: 90_000 });

  test("fills only the 761–1023px row-layout gap", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "visual-medium", "Boundary contract runs once in the 768px visual project");

    for (const width of [760, 761, 768, 1023, 1024] as const) {
      await page.setViewportSize({ width, height: 800 });
      await page.setContent(progressRowsMarkup());
      const snapshot = await readRowGeometry(page);
      expect(snapshot.documentWidth).toBeLessThanOrEqual(snapshot.clientWidth + 1);
      expect(snapshot.rows).toHaveLength(3);

      if (width <= 760 || (width >= 761 && width <= 1023)) {
        for (const row of snapshot.rows) {
          expect(row.display, `${width}px row display`).toBe("flex");
          expect(row.separation, `${width}px label/value separation`).toBeGreaterThanOrEqual(8);
        }
      } else {
        for (const row of snapshot.rows) {
          expect(row.display, "1024px remains outside the #574 companion interval").not.toBe("flex");
        }
      }
    }
  });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  for (const appearance of ["light", "dark"] as const) {
    test(`Home 768×1024 ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-medium", "Dedicated 768×1024 Home evidence only");
      expect(page.viewportSize()).toEqual({ width: 768, height: 1024 });

      await installAppearance(page, appearance);
      const runtimeErrors = captureRuntimeErrors(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", {
        name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Настройте урок под текущую задачу/,
      })).toBeVisible();
      await settleHome(page, appearance);
      await expectRuntimeTabletGeometry(page);
      expect(runtimeErrors).toEqual([]);
      await captureEvidence(page, testInfo, appearance);
    });
  }
});
