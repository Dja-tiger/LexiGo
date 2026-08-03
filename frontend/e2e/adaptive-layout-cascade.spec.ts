import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const appDirectory = path.join(process.cwd(), "app");
const stylesheets = {
  premium: readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8"),
  adaptive: readFileSync(path.join(appDirectory, "adaptive-layout.css"), "utf8"),
  composer: readFileSync(path.join(appDirectory, "adaptive-lesson-composer.css"), "utf8"),
} as const;

type StylesheetName = keyof typeof stylesheets;

type ComposerSnapshot = Readonly<{
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
}>> = [
  { width: 719, expectedSourceColumns: 1, expectedFooterDisplay: "grid" },
  { width: 720, expectedSourceColumns: 1, expectedFooterDisplay: "grid" },
  { width: 760, expectedSourceColumns: 1, expectedFooterDisplay: "grid" },
  { width: 761, expectedSourceColumns: 1, expectedFooterDisplay: "grid" },
  { width: 767, expectedSourceColumns: 1, expectedFooterDisplay: "grid" },
  { width: 768, expectedSourceColumns: 3, expectedFooterDisplay: "contents" },
  { width: 1099, expectedSourceColumns: 3, expectedFooterDisplay: "contents" },
  { width: 1100, expectedSourceColumns: 3, expectedFooterDisplay: "contents" },
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

    return {
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
        expect(snapshot.submitDisplay, `${cascade.name} submit display`).toBe("grid");
        expect(snapshot.sourceButtonGridTemplateColumns, `${cascade.name} source button columns`).not.toBe("none");
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
