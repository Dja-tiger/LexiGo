import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const appDirectory = path.join(process.cwd(), "app");
const productionCascade = [
  readFileSync(path.join(appDirectory, "globals.css"), "utf8"),
  readFileSync(path.join(appDirectory, "design-tokens.css"), "utf8"),
  readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8"),
  readFileSync(path.join(appDirectory, "mobile-pwa-fixes.css"), "utf8"),
  readFileSync(path.join(appDirectory, "adaptive-navigation.css"), "utf8"),
].map((stylesheet) => `<style>${stylesheet}</style>`).join("\n");

const shellMarkup = `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${productionCascade}
    </head>
    <body>
      <main class="lx-routed-app">
        <section class="lx-app">
          <header class="lx-header">
            <button class="lx-brand" type="button">
              <span class="lx-logo-mark"><span>L</span></span>
              <strong>LexiGo</strong>
            </button>
            <nav class="lx-nav" aria-label="Header navigation"><button type="button">Home</button></nav>
            <div class="lx-header-tools"><button class="lx-avatar" type="button">A</button></div>
          </header>
          <div class="lx-app-shell">
            <nav class="lx-navigation-rail" aria-label="Rail navigation"><button type="button">Home</button></nav>
            <section class="lx-main-content">
              <div class="lx-resource-stack"><div class="lx-async-state">State</div></div>
              <div class="lx-view">Content</div>
            </section>
          </div>
          <nav class="lx-mobile-nav" aria-label="Mobile navigation"><button type="button">Home</button></nav>
        </section>
      </main>
    </body>
  </html>
`;

type ShellSnapshot = Readonly<{
  header: Readonly<{
    minHeight: string;
    marginLeft: string;
    paddingTop: string;
    backgroundColor: string;
  }>;
  brandAlignSelf: string;
  toolsAlignSelf: string;
  logo: Readonly<{ width: string; height: string }>;
  avatar: Readonly<{ width: string; height: string }>;
  viewPaddingTop: string;
  visibility: Readonly<{
    header: string;
    rail: string;
    mobile: string;
  }>;
  horizontalOverflow: boolean;
}>;

async function readShellSnapshot(page: Page): Promise<ShellSnapshot> {
  return page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
      return window.getComputedStyle(element);
    };

    const header = style(".lx-header");
    const logo = style(".lx-logo-mark");
    const avatar = style(".lx-avatar");

    return {
      header: {
        minHeight: header.minHeight,
        marginLeft: header.marginLeft,
        paddingTop: header.paddingTop,
        backgroundColor: header.backgroundColor,
      },
      brandAlignSelf: style(".lx-brand").alignSelf,
      toolsAlignSelf: style(".lx-header-tools").alignSelf,
      logo: { width: logo.width, height: logo.height },
      avatar: { width: avatar.width, height: avatar.height },
      viewPaddingTop: style(".lx-view").paddingTop,
      visibility: {
        header: style(".lx-nav").display,
        rail: style(".lx-navigation-rail").display,
        mobile: style(".lx-mobile-nav").display,
      },
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

test.describe("navigation/mobile-shell computed cascade", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Computed ownership is asserted once per Chromium project.");

  const cases: ReadonlyArray<Readonly<{
    width: number;
    expected: Omit<ShellSnapshot, "horizontalOverflow">;
  }>> = [
    {
      width: 390,
      expected: {
        header: {
          minHeight: "58px",
          marginLeft: "-14px",
          paddingTop: "12px",
          backgroundColor: "rgba(5, 9, 20, 0.96)",
        },
        brandAlignSelf: "end",
        toolsAlignSelf: "end",
        logo: { width: "30px", height: "38px" },
        avatar: { width: "42px", height: "42px" },
        viewPaddingTop: "18px",
        visibility: { header: "none", rail: "none", mobile: "grid" },
      },
    },
    {
      width: 719,
      expected: {
        header: {
          minHeight: "58px",
          marginLeft: "-14px",
          paddingTop: "12px",
          backgroundColor: "rgba(5, 9, 20, 0.96)",
        },
        brandAlignSelf: "end",
        toolsAlignSelf: "end",
        logo: { width: "30px", height: "38px" },
        avatar: { width: "42px", height: "42px" },
        viewPaddingTop: "18px",
        visibility: { header: "none", rail: "none", mobile: "grid" },
      },
    },
    {
      width: 720,
      expected: {
        header: {
          minHeight: "76px",
          marginLeft: "0px",
          paddingTop: "0px",
          backgroundColor: "rgba(5, 9, 20, 0.96)",
        },
        brandAlignSelf: "center",
        toolsAlignSelf: "center",
        logo: { width: "30px", height: "38px" },
        avatar: { width: "42px", height: "42px" },
        viewPaddingTop: "18px",
        visibility: { header: "none", rail: "flex", mobile: "none" },
      },
    },
    {
      width: 760,
      expected: {
        header: {
          minHeight: "76px",
          marginLeft: "0px",
          paddingTop: "0px",
          backgroundColor: "rgba(5, 9, 20, 0.96)",
        },
        brandAlignSelf: "center",
        toolsAlignSelf: "center",
        logo: { width: "30px", height: "38px" },
        avatar: { width: "42px", height: "42px" },
        viewPaddingTop: "18px",
        visibility: { header: "none", rail: "flex", mobile: "none" },
      },
    },
    {
      width: 761,
      expected: {
        header: {
          minHeight: "76px",
          marginLeft: "0px",
          paddingTop: "0px",
          backgroundColor: "rgba(5, 9, 20, 0.82)",
        },
        brandAlignSelf: "center",
        toolsAlignSelf: "center",
        logo: { width: "36px", height: "46px" },
        avatar: { width: "44px", height: "44px" },
        viewPaddingTop: "24px",
        visibility: { header: "none", rail: "flex", mobile: "none" },
      },
    },
    {
      width: 1024,
      expected: {
        header: {
          minHeight: "76px",
          marginLeft: "0px",
          paddingTop: "0px",
          backgroundColor: "rgba(5, 9, 20, 0.82)",
        },
        brandAlignSelf: "center",
        toolsAlignSelf: "center",
        logo: { width: "36px", height: "46px" },
        avatar: { width: "44px", height: "44px" },
        viewPaddingTop: "24px",
        visibility: { header: "none", rail: "flex", mobile: "none" },
      },
    },
  ];

  for (const current of cases) {
    test(`records the effective owners at ${current.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: current.width, height: 800 });
      await page.setContent(shellMarkup);

      const snapshot = await readShellSnapshot(page);
      expect(snapshot.horizontalOverflow).toBe(false);
      expect(snapshot).toEqual({ ...current.expected, horizontalOverflow: false });

      const visibleNavigationCount = Object.values(snapshot.visibility)
        .filter((display) => display !== "none").length;
      expect(visibleNavigationCount).toBe(1);
    });
  }
});
