import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const appDirectory = path.join(process.cwd(), "app");
const stylesheets = {
  premium: readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8"),
  adaptive: readFileSync(path.join(appDirectory, "adaptive-layout.css"), "utf8"),
  composer: readFileSync(path.join(appDirectory, "adaptive-lesson-composer.css"), "utf8"),
} as const;
const phrasesStylesheet = readFileSync(path.join(appDirectory, "phrases.css"), "utf8");
const phrasesTabletStylesheet = readFileSync(
  path.join(appDirectory, "phrases-tablet-layout.css"),
  "utf8",
);
const routeNavigationStylesheet = readFileSync(
  path.join(appDirectory, "route-navigation.css"),
  "utf8",
);
const profileStylesheet = readFileSync(path.join(appDirectory, "profile.css"), "utf8");
const profileTabletStylesheet = readFileSync(
  path.join(appDirectory, "profile-tablet-layout.css"),
  "utf8",
);

type StylesheetName = keyof typeof stylesheets;

type ComposerSnapshot = Readonly<{
  setupDisplay: string;
  setupColumnCount: number;
  setupCardWidth: number;
  setupActionsWidth: number;
  sourceColumns: number;
  sourceGridTemplateColumns: string;
  sourceButtonGridTemplateColumns: string;
  footerDisplay: string;
  footerGridTemplateColumns: string;
  submitDisplay: string;
  horizontalOverflow: boolean;
}>;

const cascadeOrders: ReadonlyArray<Readonly<{
  name: string;
  order: readonly StylesheetName[];
}>> = [
  {
    name: "production order",
    order: ["premium", "adaptive", "composer"],
  },
  {
    name: "canonical-first fallback-last order",
    order: ["composer", "adaptive", "premium"],
  },
  {
    name: "adaptive-first premium-last order",
    order: ["adaptive", "composer", "premium"],
  },
];

const cases: ReadonlyArray<Readonly<{
  width: number;
  expectedSourceColumns: number;
  expectedFooterDisplay: "grid" | "contents";
  expectedSetupColumns: number;
}>> = [
  { width: 719, expectedSourceColumns: 1, expectedFooterDisplay: "grid", expectedSetupColumns: 0 },
  { width: 720, expectedSourceColumns: 1, expectedFooterDisplay: "grid", expectedSetupColumns: 0 },
  { width: 760, expectedSourceColumns: 1, expectedFooterDisplay: "grid", expectedSetupColumns: 0 },
  { width: 761, expectedSourceColumns: 1, expectedFooterDisplay: "grid", expectedSetupColumns: 0 },
  { width: 767, expectedSourceColumns: 1, expectedFooterDisplay: "grid", expectedSetupColumns: 0 },
  { width: 768, expectedSourceColumns: 3, expectedFooterDisplay: "contents", expectedSetupColumns: 1 },
  { width: 1099, expectedSourceColumns: 3, expectedFooterDisplay: "contents", expectedSetupColumns: 1 },
  { width: 1100, expectedSourceColumns: 3, expectedFooterDisplay: "contents", expectedSetupColumns: 2 },
];

function composerMarkup(order: readonly StylesheetName[]): string {
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
          .lx-main-content { width: calc(100% - 32px); min-width: 0; margin: 0 16px; }
          .lx-setup-card { width: 100%; min-width: 0; }
        </style>
        ${cascade}
      </head>
      <body>
        <main class="lx-routed-app" data-route-path="/learn">
          <section class="lx-main-content" aria-label="Обучение">
            <div class="lx-progressive-lesson-composer">
              <div class="lx-setup-card">
                <div class="lx-setup-block">
                  <div class="lx-source-selector">
                    <button type="button"><span class="lx-section-icon">A</span><div><strong>Mixed</strong><small>Words and phrases</small></div></button>
                    <button type="button"><span class="lx-section-icon">B</span><div><strong>Nouns</strong><small>Systems and objects</small></div></button>
                    <button type="button"><span class="lx-section-icon">C</span><div><strong>Verbs</strong><small>Actions and processes</small></div></button>
                  </div>
                </div>
                <div class="lx-setup-footer">
                  <fieldset><legend>Lesson size</legend><div class="lx-size-control"><button type="button">15</button></div></fieldset>
                  <div class="lx-setup-actions">
                    <div class="lx-setup-submit"><p>Ready</p><button class="lx-button" type="button">Start</button></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>`;
}

async function readComposerSnapshot(page: Page): Promise<ComposerSnapshot> {
  return page.evaluate(() => {
    const element = (selector: string): HTMLElement => {
      const match = document.querySelector(selector);
      if (!(match instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
      return match;
    };
    const style = (selector: string): CSSStyleDeclaration => window.getComputedStyle(element(selector));

    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>(".lx-source-selector > button"),
    );
    const firstTop = buttons[0]?.getBoundingClientRect().top;
    if (firstTop === undefined) throw new Error("Missing source buttons");
    const sourceColumns = buttons.filter(
      (button) => Math.abs(button.getBoundingClientRect().top - firstTop) < 0.5,
    ).length;
    const footerStyle = style(".lx-setup-footer");
    const setupCard = element(".lx-setup-card");
    const setupActions = element(".lx-setup-actions");
    const setupStyle = window.getComputedStyle(setupCard);

    return {
      setupDisplay: setupStyle.display,
      setupColumnCount: setupStyle.display === "grid"
        ? setupStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length
        : 0,
      setupCardWidth: setupCard.getBoundingClientRect().width,
      setupActionsWidth: setupActions.getBoundingClientRect().width,
      sourceColumns,
      sourceGridTemplateColumns: style(".lx-source-selector").gridTemplateColumns,
      sourceButtonGridTemplateColumns: style(
        ".lx-source-selector > button",
      ).gridTemplateColumns,
      footerDisplay: footerStyle.display,
      footerGridTemplateColumns:
        footerStyle.display === "contents" ? "not-applicable" : footerStyle.gridTemplateColumns,
      submitDisplay: style(".lx-setup-submit").display,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

function phrasesTabletMarkup(): string {
  return `<!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; min-width: 0; }
          body { width: 100%; overflow-x: hidden; }
          .lx-routed-app, .lx-app, .lx-phrases-catalog { width: 100%; min-width: 0; }
          .lx-app { padding: 0 20px; }
        </style>
        <style data-owner="phrases">${phrasesStylesheet}</style>
        <style data-owner="phrases-tablet">${phrasesTabletStylesheet}</style>
      </head>
      <body>
        <main class="lx-routed-app" data-route-path="/phrases">
          <section class="lx-app" data-route-client-island="phrases">
            <div class="lx-phrases-catalog">
              <div class="lx-phrases-workspace">
                <aside class="lx-phrases-filters" aria-label="Фильтры"><label><span>Topic</span><select><option>All</option></select></label></aside>
                <section class="lx-phrases-results-panel">
                  <ol class="lx-phrases-results"><li><a href="#one"><span class="lx-phrases-result-copy"><strong>Identify the root cause before retrying</strong></span></a></li></ol>
                </section>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>`;
}

function profileTabletMarkup(): string {
  return `<!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root { --lx-navigation-rail-width: 88px; }
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; min-width: 0; }
          body { width: 100%; overflow-x: hidden; }
          .lx-routed-app { width: 100%; min-width: 0; }
        </style>
        <style data-owner="route-navigation">${routeNavigationStylesheet}</style>
        <style data-owner="profile">${profileStylesheet}</style>
        <style data-owner="profile-tablet">${profileTabletStylesheet}</style>
      </head>
      <body>
        <main class="lx-routed-app" data-route-path="/profile">
          <nav class="lx-route-nav lx-route-nav--rail" data-route-navigation="rail"><a class="active" href="#profile">Profile</a></nav>
          <section class="lx-profile-app">
            <div class="lx-main-content" id="profile-main"><div class="lx-profile-view"><h1>Профиль</h1></div></div>
          </section>
        </main>
      </body>
    </html>`;
}

test.describe("adaptive Lesson Composer computed cascade", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Computed ownership is asserted once per Chromium project.");

  for (const current of cases) {
    test(`three stylesheet orders preserve the canonical composer at ${current.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: current.width, height: 800 });

      let referenceSnapshot: ComposerSnapshot | null = null;
      for (const cascade of cascadeOrders) {
        await page.setContent(composerMarkup(cascade.order));
        const snapshot = await readComposerSnapshot(page);

        expect(snapshot.sourceColumns, `${cascade.name} source columns`).toBe(
          current.expectedSourceColumns,
        );
        expect(snapshot.footerDisplay, `${cascade.name} footer display`).toBe(
          current.expectedFooterDisplay,
        );
        expect(snapshot.setupColumnCount, `${cascade.name} outer composer columns`).toBe(
          current.expectedSetupColumns,
        );
        expect(snapshot.submitDisplay, `${cascade.name} submit display`).toBe("grid");
        expect(snapshot.sourceButtonGridTemplateColumns, `${cascade.name} source button columns`).not.toBe("none");
        expect(snapshot.horizontalOverflow, `${cascade.name} horizontal overflow`).toBe(false);
        if (current.expectedSetupColumns === 1) {
          expect(
            snapshot.setupActionsWidth / snapshot.setupCardWidth,
            `${cascade.name} tablet action surface width`,
          ).toBeGreaterThan(0.9);
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

test.describe("Issue #571 tablet route layout contracts", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Tablet cascade ownership is asserted once per Chromium project.");

  for (const width of [767, 768, 1099, 1100] as const) {
    test(`Phrases preserves usable workspace ownership at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(phrasesTabletMarkup());

      const snapshot = await page.evaluate(() => {
        const workspace = document.querySelector<HTMLElement>(".lx-phrases-workspace");
        const filters = document.querySelector<HTMLElement>(".lx-phrases-filters");
        const results = document.querySelector<HTMLElement>(".lx-phrases-results-panel");
        if (!workspace || !filters || !results) throw new Error("Missing Phrases tablet owners");
        const style = window.getComputedStyle(workspace);
        return {
          display: style.display,
          columns: style.display === "grid"
            ? style.gridTemplateColumns.split(/\s+/).filter(Boolean).length
            : 0,
          filtersDisplay: window.getComputedStyle(filters).display,
          filtersWidth: filters.getBoundingClientRect().width,
          resultsWidth: results.getBoundingClientRect().width,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });

      expect(snapshot.horizontalOverflow).toBe(false);
      if (width <= 767) {
        expect(snapshot.display).toBe("block");
        expect(snapshot.filtersDisplay).toBe("none");
      } else if (width <= 1099) {
        expect(snapshot.display).toBe("grid");
        expect(snapshot.columns).toBe(1);
        expect(snapshot.filtersDisplay).not.toBe("none");
        expect(snapshot.filtersWidth).toBeGreaterThan(400);
        expect(snapshot.resultsWidth).toBeGreaterThan(400);
      } else {
        expect(snapshot.display).toBe("grid");
        expect(snapshot.columns).toBe(2);
      }
    });
  }

  for (const width of [720, 768, 1099] as const) {
    test(`Profile main content clears the tablet rail at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(profileTabletMarkup());

      const snapshot = await page.evaluate(() => {
        const rail = document.querySelector<HTMLElement>(".lx-route-nav--rail");
        const main = document.querySelector<HTMLElement>("#profile-main");
        if (!rail || !main) throw new Error("Missing Profile tablet owners");
        const railRect = rail.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();
        return {
          railDisplay: window.getComputedStyle(rail).display,
          railRight: railRect.right,
          mainLeft: mainRect.left,
          mainRight: mainRect.right,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });

      expect(snapshot.railDisplay).toBe("flex");
      expect(snapshot.mainLeft).toBeGreaterThanOrEqual(snapshot.railRight + 8);
      expect(snapshot.mainRight).toBeLessThanOrEqual(width + 1);
      expect(snapshot.horizontalOverflow).toBe(false);
    });
  }
});
