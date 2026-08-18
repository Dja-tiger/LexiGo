import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const appDirectory = path.join(process.cwd(), "app");
const stylesheets = {
  premium: readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8"),
  phrases: readFileSync(path.join(appDirectory, "phrases.css"), "utf8"),
  detailMinWidth: readFileSync(path.join(appDirectory, "phrase-detail-min-width.css"), "utf8"),
  catalog: readFileSync(path.join(appDirectory, "catalog-enhancements.css"), "utf8"),
} as const;

type StylesheetName = keyof typeof stylesheets;

type GridSnapshot = Readonly<{
  display: string;
  columns: number;
  gridTemplateColumns: string;
  gap: string;
  marginTop: string;
  paddingTop: string;
  horizontalOverflow: boolean;
}>;

type DetailSnapshot = Readonly<{
  routePaddingLeft: string;
  routePaddingRight: string;
  layoutPaddingLeft: string;
  layoutPaddingRight: string;
  layoutWidth: number;
  mainWidth: number;
  mainOffsetFromLayout: number;
  horizontalOverflow: boolean;
}>;

const cascadeOrders: ReadonlyArray<Readonly<{
  name: string;
  order: readonly StylesheetName[];
}>> = [
  {
    name: "production order",
    order: ["premium", "phrases", "detailMinWidth", "catalog"],
  },
  {
    name: "canonical-first fallback-last order",
    order: ["detailMinWidth", "phrases", "catalog", "premium"],
  },
  {
    name: "shared-first canonical-last order",
    order: ["catalog", "premium", "phrases", "detailMinWidth"],
  },
];

const widths = [390, 760, 761, 1040, 1041, 1440] as const;
const detailWidths = [320, 390] as const;

function stylesheetCascade(order: readonly StylesheetName[]): string {
  return order
    .map((name) => `<style data-owner="${name}">${stylesheets[name]}</style>`)
    .join("\n");
}

function phrasesMarkup(order: readonly StylesheetName[]): string {
  const cascade = stylesheetCascade(order);

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

function phraseDetailMarkup(order: readonly StylesheetName[]): string {
  const cascade = stylesheetCascade(order);

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
          .lx-phrase-detail { width: 100%; min-width: 0; }
        </style>
        ${cascade}
      </head>
      <body>
        <main class="lx-routed-app" data-route-path="/phrases/example">
          <section class="lx-app" data-route-client-island="phrases">
            <article class="lx-phrase-detail">
              <div class="lx-detail-card lx-phrase-detail-layout">
                <div class="lx-phrase-detail-main">
                  <section class="lx-phrase-detail-section">
                    <div>
                      <h2>Meaning</h2>
                      <p>A representative phrase detail body used to prove responsive cascade ownership.</p>
                    </div>
                  </section>
                </div>
              </div>
            </article>
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
    const firstTop = items[0]?.getBoundingClientRect().top;
    if (firstTop === undefined) throw new Error("Missing grid items");

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
      paddingTop: style.paddingTop,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

async function readDetailSnapshot(page: Page): Promise<DetailSnapshot> {
  return page.evaluate(() => {
    const route = document.querySelector<HTMLElement>(".lx-phrase-detail");
    const layout = document.querySelector<HTMLElement>(".lx-phrase-detail-layout");
    const main = document.querySelector<HTMLElement>(".lx-phrase-detail-main");
    if (!route || !layout || !main) throw new Error("Missing Phrase Detail geometry owner");

    const routeStyle = window.getComputedStyle(route);
    const layoutStyle = window.getComputedStyle(layout);
    const layoutRect = layout.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();

    return {
      routePaddingLeft: routeStyle.paddingLeft,
      routePaddingRight: routeStyle.paddingRight,
      layoutPaddingLeft: layoutStyle.paddingLeft,
      layoutPaddingRight: layoutStyle.paddingRight,
      layoutWidth: layoutRect.width,
      mainWidth: mainRect.width,
      mainOffsetFromLayout: mainRect.x - layoutRect.x,
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
        expect(snapshot.paddingTop, `${cascade.name} result spacing`).toBe("24px");
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

test.describe("Phrase Detail minimum-width computed cascade", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Computed ownership is asserted once per Chromium project.");

  for (const width of detailWidths) {
    test(`three stylesheet orders preserve Phrase Detail ownership at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });

      let referenceSnapshot: DetailSnapshot | null = null;
      for (const cascade of cascadeOrders) {
        await page.setContent(phraseDetailMarkup(cascade.order));
        const snapshot = await readDetailSnapshot(page);

        expect(snapshot.horizontalOverflow, `${cascade.name} horizontal overflow`).toBe(false);

        if (width === 320) {
          expect(snapshot.routePaddingLeft, `${cascade.name} route inline start`).toBe("16px");
          expect(snapshot.routePaddingRight, `${cascade.name} route inline end`).toBe("16px");
          expect(snapshot.layoutPaddingLeft, `${cascade.name} leaked detail-card start inset`).toBe("0px");
          expect(snapshot.layoutPaddingRight, `${cascade.name} leaked detail-card end inset`).toBe("0px");
          expect(snapshot.mainOffsetFromLayout, `${cascade.name} main start offset`).toBeCloseTo(0, 5);
          expect(snapshot.mainWidth, `${cascade.name} main readable width`).toBeCloseTo(snapshot.layoutWidth, 5);
        } else {
          expect(snapshot.routePaddingLeft, `${cascade.name} canonical route inline start`).toBe("24px");
          expect(snapshot.routePaddingRight, `${cascade.name} canonical route inline end`).toBe("24px");
          expect(snapshot.layoutPaddingLeft, `${cascade.name} canonical detail-card start inset`).toBe("30px");
          expect(snapshot.layoutPaddingRight, `${cascade.name} canonical detail-card end inset`).toBe("30px");
          expect(snapshot.mainOffsetFromLayout, `${cascade.name} canonical main start offset`).toBeCloseTo(30, 5);
          expect(snapshot.mainWidth, `${cascade.name} canonical main readable width`)
            .toBeCloseTo(snapshot.layoutWidth - 60, 5);
        }

        if (referenceSnapshot === null) {
          referenceSnapshot = snapshot;
        } else {
          expect(snapshot).toEqual(referenceSnapshot);
        }
      }
    });
  }
});
