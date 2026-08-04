import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const appDirectory = path.join(process.cwd(), "app");
const stylesheets = {
  premium: readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8"),
  phrases: readFileSync(path.join(appDirectory, "phrases.css"), "utf8"),
  catalog: readFileSync(path.join(appDirectory, "catalog-enhancements.css"), "utf8"),
} as const;

type StylesheetName = keyof typeof stylesheets;

type GridSnapshot = Readonly<{
  display: string;
  columns: number;
  gridTemplateColumns: string;
  gap: string;
  marginTop: string;
  horizontalOverflow: boolean;
}>;

const cascadeOrders: ReadonlyArray<Readonly<{
  name: string;
  order: readonly StylesheetName[];
}>> = [
  {
    name: "production order",
    order: ["premium", "phrases", "catalog"],
  },
  {
    name: "canonical-first fallback-last order",
    order: ["phrases", "catalog", "premium"],
  },
  {
    name: "shared-first canonical-last order",
    order: ["catalog", "premium", "phrases"],
  },
];

const widths = [390, 760, 761, 1040, 1041, 1440] as const;

function phrasesMarkup(order: readonly StylesheetName[]): string {
  const cascade = order
    .map((name) => `<style data-owner="${name}">${stylesheets[name]}</style>`)
    .join("\n");

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
          .lx-app { width: 100%; min-width: 0; padding: 0 20px; }
          .lx-phrases-catalog { width: 100%; min-width: 0; }
        </style>
        ${cascade}
      </head>
      <body>
        <main class="lx-routed-app" data-route-path="/phrases">
          <section class="lx-app" data-route-client-island="phrases">
            <div class="lx-phrases-catalog">
              <ol class="lx-phrases-results lx-phrase-grid" aria-label="Результаты каталога фраз">
                <li><a href="#one">One</a></li>
                <li><a href="#two">Two</a></li>
                <li><a href="#three">Three</a></li>
              </ol>
            </div>
          </section>
        </main>
      </body>
    </html>`;
}

async function readGridSnapshot(page: Page): Promise<GridSnapshot> {
  return page.evaluate(() => {
    const grid = document.querySelector<HTMLElement>(".lx-phrase-grid");
    if (!grid) throw new Error("Missing .lx-phrase-grid");

    const items = Array.from(grid.children).filter(
      (item): item is HTMLElement => item instanceof HTMLElement,
    );
    const firstLeft = items[0]?.getBoundingClientRect().left;
    const firstTop = items[0]?.getBoundingClientRect().top;
    if (firstLeft === undefined || firstTop === undefined) throw new Error("Missing grid items");

    const columns = items.filter((item) => {
      const rect = item.getBoundingClientRect();
      return Math.abs(rect.top - firstTop) < 0.5;
    }).length;
    const style = window.getComputedStyle(grid);

    return {
      display: style.display,
      columns,
      gridTemplateColumns: style.gridTemplateColumns,
      gap: style.gap,
      marginTop: style.marginTop,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

test.describe("Phrases result grid computed cascade", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Computed ownership is asserted once per Chromium project.");

  for (const width of widths) {
    test(`three stylesheet orders preserve the canonical one-column grid at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });

      let referenceSnapshot: GridSnapshot | null = null;
      for (const cascade of cascadeOrders) {
        await page.setContent(phrasesMarkup(cascade.order));
        const snapshot = await readGridSnapshot(page);

        expect(snapshot.display, `${cascade.name} display`).toBe("grid");
        expect(snapshot.columns, `${cascade.name} columns`).toBe(1);
        expect(snapshot.gap, `${cascade.name} gap`).toBe("10px");
        expect(snapshot.gridTemplateColumns, `${cascade.name} template`).not.toBe("none");
        expect(snapshot.horizontalOverflow, `${cascade.name} horizontal overflow`).toBe(false);

        if (referenceSnapshot === null) {
          referenceSnapshot = snapshot;
        } else {
          expect(snapshot).toEqual(referenceSnapshot);
        }
      }
    });
  }
});
