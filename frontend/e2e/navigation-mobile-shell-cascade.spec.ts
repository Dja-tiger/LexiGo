import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const appDirectory = path.join(process.cwd(), "app");
const stylesheets = {
  globals: readFileSync(path.join(appDirectory, "globals.css"), "utf8"),
  tokens: readFileSync(path.join(appDirectory, "design-tokens.css"), "utf8"),
  premium: readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8"),
  mobile: readFileSync(path.join(appDirectory, "mobile-pwa-fixes.css"), "utf8"),
  adaptive: readFileSync(path.join(appDirectory, "adaptive-navigation.css"), "utf8"),
  routedChrome: readFileSync(path.join(appDirectory, "adaptive-knowledge-coach-home.css"), "utf8"),
  scenarioCatalog: readFileSync(path.join(appDirectory, "scenario-catalog.css"), "utf8"),
  learningSwitch: readFileSync(path.join(appDirectory, "learning-section-switch.css"), "utf8"),
} as const;

type StylesheetName = keyof typeof stylesheets;

type ShellSnapshot = Readonly<{
  minHeight: string;
  marginLeft: string;
  paddingTop: string;
  backgroundColor: string;
  brandAlignSelf: string;
  toolsAlignSelf: string;
  logoWidth: string;
  logoHeight: string;
  avatarWidth: string;
  avatarHeight: string;
  viewPaddingTop: string;
  resourceStackMatchesMainContent: boolean;
  switchWidth: string;
  switchMarginTop: string;
  switchMarginRight: string;
  switchMarginBottom: string;
  switchMarginLeft: string;
  headerNav: string;
  railNav: string;
  mobileNav: string;
  horizontalOverflow: boolean;
}>;

type ExpectedInvariant = Omit<ShellSnapshot, "backgroundColor" | "horizontalOverflow">;

const cascadeOrders: ReadonlyArray<Readonly<{
  name: string;
  order: readonly StylesheetName[];
}>> = [
  {
    name: "production order",
    order: [
      "globals",
      "tokens",
      "premium",
      "mobile",
      "adaptive",
      "routedChrome",
      "scenarioCatalog",
      "learningSwitch",
    ],
  },
  {
    name: "learning-first scenario-last adversarial order",
    order: [
      "globals",
      "tokens",
      "learningSwitch",
      "routedChrome",
      "adaptive",
      "premium",
      "mobile",
      "scenarioCatalog",
    ],
  },
  {
    name: "scenario-first mobile-first adversarial order",
    order: [
      "globals",
      "tokens",
      "scenarioCatalog",
      "mobile",
      "premium",
      "learningSwitch",
      "routedChrome",
      "adaptive",
    ],
  },
];

const cases: ReadonlyArray<Readonly<{ width: number; expected: ExpectedInvariant }>> = [
  {
    width: 360,
    expected: {
      minHeight: "54px",
      marginLeft: "-14px",
      paddingTop: "0px",
      brandAlignSelf: "end",
      toolsAlignSelf: "end",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "42px",
      avatarHeight: "42px",
      viewPaddingTop: "0px",
      resourceStackMatchesMainContent: false,
      switchWidth: "328px",
      switchMarginTop: "76px",
      switchMarginRight: "16px",
      switchMarginBottom: "20px",
      switchMarginLeft: "16px",
      headerNav: "none",
      railNav: "none",
      mobileNav: "grid",
    },
  },
  {
    width: 390,
    expected: {
      minHeight: "54px",
      marginLeft: "-14px",
      paddingTop: "0px",
      brandAlignSelf: "end",
      toolsAlignSelf: "end",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "42px",
      avatarHeight: "42px",
      viewPaddingTop: "0px",
      resourceStackMatchesMainContent: false,
      switchWidth: "342px",
      switchMarginTop: "76px",
      switchMarginRight: "24px",
      switchMarginBottom: "20px",
      switchMarginLeft: "24px",
      headerNav: "none",
      railNav: "none",
      mobileNav: "grid",
    },
  },
  {
    width: 719,
    expected: {
      minHeight: "54px",
      marginLeft: "-14px",
      paddingTop: "0px",
      brandAlignSelf: "end",
      toolsAlignSelf: "end",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "42px",
      avatarHeight: "42px",
      viewPaddingTop: "0px",
      resourceStackMatchesMainContent: false,
      switchWidth: "671px",
      switchMarginTop: "76px",
      switchMarginRight: "24px",
      switchMarginBottom: "20px",
      switchMarginLeft: "24px",
      headerNav: "none",
      railNav: "none",
      mobileNav: "grid",
    },
  },
  {
    width: 720,
    expected: {
      minHeight: "76px",
      marginLeft: "0px",
      paddingTop: "0px",
      brandAlignSelf: "center",
      toolsAlignSelf: "center",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "42px",
      avatarHeight: "42px",
      viewPaddingTop: "18px",
      resourceStackMatchesMainContent: true,
      switchWidth: "524px",
      switchMarginTop: "84px",
      switchMarginRight: "24px",
      switchMarginBottom: "20px",
      switchMarginLeft: "152px",
      headerNav: "none",
      railNav: "flex",
      mobileNav: "none",
    },
  },
  {
    width: 760,
    expected: {
      minHeight: "76px",
      marginLeft: "0px",
      paddingTop: "0px",
      brandAlignSelf: "center",
      toolsAlignSelf: "center",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "42px",
      avatarHeight: "42px",
      viewPaddingTop: "18px",
      resourceStackMatchesMainContent: true,
      switchWidth: "564px",
      switchMarginTop: "84px",
      switchMarginRight: "24px",
      switchMarginBottom: "20px",
      switchMarginLeft: "152px",
      headerNav: "none",
      railNav: "flex",
      mobileNav: "none",
    },
  },
  {
    width: 761,
    expected: {
      minHeight: "76px",
      marginLeft: "0px",
      paddingTop: "0px",
      brandAlignSelf: "center",
      toolsAlignSelf: "center",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "44px",
      avatarHeight: "44px",
      viewPaddingTop: "24px",
      resourceStackMatchesMainContent: true,
      switchWidth: "565px",
      switchMarginTop: "84px",
      switchMarginRight: "24px",
      switchMarginBottom: "20px",
      switchMarginLeft: "152px",
      headerNav: "none",
      railNav: "flex",
      mobileNav: "none",
    },
  },
  {
    width: 1024,
    expected: {
      minHeight: "96px",
      marginLeft: "0px",
      paddingTop: "0px",
      brandAlignSelf: "center",
      toolsAlignSelf: "center",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "44px",
      avatarHeight: "44px",
      viewPaddingTop: "24px",
      resourceStackMatchesMainContent: true,
      switchWidth: "724px",
      switchMarginTop: "84px",
      switchMarginRight: "40px",
      switchMarginBottom: "20px",
      switchMarginLeft: "260px",
      headerNav: "none",
      railNav: "flex",
      mobileNav: "none",
    },
  },
  {
    width: 1440,
    expected: {
      minHeight: "96px",
      marginLeft: "0px",
      paddingTop: "0px",
      brandAlignSelf: "auto",
      toolsAlignSelf: "auto",
      logoWidth: "34px",
      logoHeight: "34px",
      avatarWidth: "44px",
      avatarHeight: "44px",
      viewPaddingTop: "24px",
      resourceStackMatchesMainContent: false,
      switchWidth: "1140px",
      switchMarginTop: "84px",
      switchMarginRight: "40px",
      switchMarginBottom: "20px",
      switchMarginLeft: "260px",
      headerNav: "flex",
      railNav: "none",
      mobileNav: "none",
    },
  },
];

function shellMarkup(order: readonly StylesheetName[]): string {
  const cascade = order
    .map((name) => `<style data-owner="${name}">${stylesheets[name]}</style>`)
    .join("\n");

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${cascade}
      </head>
      <body>
        <main class="lx-routed-app" data-app-router-shell="true" data-route-path="/learn">
          <nav class="lx-learning-section-switch lx-learning-section-switch--learn" aria-label="Learning sections">
            <a class="active" aria-current="page" href="/learn">Lessons</a>
            <a href="/scenarios">Scenarios</a>
          </nav>
          <section class="lx-app">
            <header class="lx-header">
              <button class="lx-brand" type="button">
                <span class="lx-logo-mark"><span>L</span></span><strong>LexiGo</strong>
              </button>
              <nav class="lx-nav" aria-label="Header navigation"><button type="button">Home</button></nav>
              <div class="lx-header-tools"><button class="lx-avatar" type="button">A</button></div>
            </header>
            <div class="lx-app-shell">
              <nav class="lx-navigation-rail" aria-label="Rail navigation"><button type="button">Home</button></nav>
              <section class="lx-main-content" aria-label="Обучение">
                <div class="lx-resource-stack"><div class="lx-async-state">State</div></div>
                <div class="lx-view">Content</div>
              </section>
            </div>
            <nav class="lx-mobile-nav" aria-label="Mobile navigation"><button type="button">Home</button></nav>
          </section>
        </main>
      </body>
    </html>`;
}

async function readShellSnapshot(page: Page): Promise<ShellSnapshot> {
  return page.evaluate(() => {
    const element = (selector: string): HTMLElement => {
      const match = document.querySelector(selector);
      if (!(match instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
      return match;
    };
    const style = (selector: string): CSSStyleDeclaration => window.getComputedStyle(element(selector));

    const header = style(".lx-header");
    const logo = style(".lx-logo-mark");
    const avatar = style(".lx-avatar");
    const learningSwitch = style(".lx-learning-section-switch--learn");
    const resourceStackWidth = element(".lx-resource-stack").getBoundingClientRect().width;
    const mainContentWidth = element(".lx-main-content").getBoundingClientRect().width;

    return {
      minHeight: header.minHeight,
      marginLeft: header.marginLeft,
      paddingTop: header.paddingTop,
      backgroundColor: header.backgroundColor,
      brandAlignSelf: style(".lx-brand").alignSelf,
      toolsAlignSelf: style(".lx-header-tools").alignSelf,
      logoWidth: logo.width,
      logoHeight: logo.height,
      avatarWidth: avatar.width,
      avatarHeight: avatar.height,
      viewPaddingTop: style(".lx-view").paddingTop,
      resourceStackMatchesMainContent: Math.abs(resourceStackWidth - mainContentWidth) < 0.5,
      switchWidth: learningSwitch.width,
      switchMarginTop: learningSwitch.marginTop,
      switchMarginRight: learningSwitch.marginRight,
      switchMarginBottom: learningSwitch.marginBottom,
      switchMarginLeft: learningSwitch.marginLeft,
      headerNav: style(".lx-nav").display,
      railNav: style(".lx-navigation-rail").display,
      mobileNav: style(".lx-mobile-nav").display,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

function invariantSnapshot(snapshot: ShellSnapshot): ExpectedInvariant {
  const { backgroundColor: _backgroundColor, horizontalOverflow: _horizontalOverflow, ...invariant } = snapshot;
  return invariant;
}

test.describe("navigation/mobile-shell computed cascade", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Computed ownership is asserted once per Chromium project.");

  for (const current of cases) {
    test(`three stylesheet orders preserve routed owners at ${current.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: current.width, height: 800 });

      let referenceSnapshot: ShellSnapshot | null = null;
      for (const cascade of cascadeOrders) {
        await page.setContent(shellMarkup(cascade.order));
        const snapshot = await readShellSnapshot(page);

        expect(snapshot.horizontalOverflow, `${cascade.name} horizontal overflow`).toBe(false);
        expect(
          [snapshot.headerNav, snapshot.railNav, snapshot.mobileNav].filter((display) => display !== "none"),
          `${cascade.name} visible primary navigation`,
        ).toHaveLength(1);
        expect(invariantSnapshot(snapshot), cascade.name).toEqual(current.expected);

        if (referenceSnapshot === null) {
          referenceSnapshot = snapshot;
        } else {
          expect(snapshot).toEqual(referenceSnapshot);
        }
      }
    });
  }
});
