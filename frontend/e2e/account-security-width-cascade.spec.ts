import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const appDirectory = path.join(process.cwd(), "app");
const stylesheets = {
  account: readFileSync(path.join(appDirectory, "account-security.css"), "utf8"),
  adaptive: readFileSync(path.join(appDirectory, "adaptive-knowledge-coach-home.css"), "utf8"),
} as const;

type StylesheetName = keyof typeof stylesheets;

type WidthSnapshot = Readonly<{
  width: number;
  left: number;
  right: number;
  marginLeft: string;
  marginRight: string;
  boxSizing: string;
  horizontalOverflow: boolean;
}>;

const cascadeOrders: ReadonlyArray<Readonly<{
  name: string;
  order: readonly StylesheetName[];
}>> = [
  { name: "production order", order: ["account", "adaptive"] },
  { name: "fallback-first routed-last order", order: ["adaptive", "account"] },
  { name: "fallback replayed last", order: ["account", "adaptive", "adaptive"] },
];

const widths = [719, 720, 1023, 1024, 1099, 1100, 1440] as const;

function markup(order: readonly StylesheetName[]): string {
  const cascade = order
    .map((name, index) => `<style data-owner="${name}-${index}">${stylesheets[name]}</style>`)
    .join("\n");

  return `<!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root { --ak-shell-rail-width: 220px; }
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; min-width: 0; }
          body { width: 100%; overflow-x: hidden; }
          .lx-routed-app { width: 100%; min-height: 100vh; }
          .lx-account-security { min-height: 200px; }
        </style>
        ${cascade}
      </head>
      <body>
        <div class="lx-routed-app" data-route-path="/profile">
          <section class="lx-account-security" aria-label="Безопасность аккаунта"></section>
        </div>
      </body>
    </html>`;
}

async function snapshot(page: Page): Promise<WidthSnapshot> {
  return page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>(".lx-account-security");
    if (!panel) throw new Error("Missing Account Security panel");
    const rect = panel.getBoundingClientRect();
    const style = window.getComputedStyle(panel);
    return {
      width: Math.round(rect.width * 100) / 100,
      left: Math.round(rect.left * 100) / 100,
      right: Math.round((window.innerWidth - rect.right) * 100) / 100,
      marginLeft: style.marginLeft,
      marginRight: style.marginRight,
      boxSizing: style.boxSizing,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

function expectedGeometry(width: number): Readonly<{ panelWidth: number; left: number; right: number }> {
  if (width <= 719) {
    return { panelWidth: width - 24, left: 12, right: 12 };
  }
  if (width < 1024) {
    return { panelWidth: width - 40, left: 20, right: 20 };
  }

  const panelWidth = Math.min(1140, width - 220 - 80);
  const left = Math.max(220 + 40, (width + 220 - 1140) / 2);
  return { panelWidth, left, right: width - left - panelWidth };
}

test.describe("Account Security width computed cascade", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Computed ownership is asserted once per Chromium project.");

  for (const width of widths) {
    test(`all stylesheet orders preserve routed geometry at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const expected = expectedGeometry(width);
      let reference: WidthSnapshot | null = null;

      for (const cascade of cascadeOrders) {
        await page.setContent(markup(cascade.order));
        const current = await snapshot(page);

        expect(current.width, `${cascade.name} width`).toBeCloseTo(expected.panelWidth, 1);
        expect(current.left, `${cascade.name} left`).toBeCloseTo(expected.left, 1);
        expect(current.right, `${cascade.name} right`).toBeCloseTo(expected.right, 1);
        expect(current.horizontalOverflow, `${cascade.name} overflow`).toBe(false);
        if (width >= 1024) expect(current.boxSizing, `${cascade.name} box sizing`).toBe("border-box");

        if (reference === null) reference = current;
        else expect(current).toEqual(reference);
      }
    });
  }
});
