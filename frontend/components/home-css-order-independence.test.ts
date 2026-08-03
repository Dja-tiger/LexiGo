import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const premiumCssUrl = new URL("../app/premium-ui.css", import.meta.url);
const compactCssUrl = new URL("../app/compact-home.css", import.meta.url);
const sharedHomeCssUrl = new URL("../app/information-architecture.css", import.meta.url);
const adaptiveHomeCssUrl = new URL("../app/adaptive-knowledge-coach-home.css", import.meta.url);
const routedAppUrl = new URL("./routed-lexigo-app.tsx", import.meta.url);
const homeAppUrl = new URL("./lexigo-home-app.tsx", import.meta.url);

const layout = readFileSync(layoutUrl, "utf8");
const premiumCss = readFileSync(premiumCssUrl, "utf8");
const compactCss = readFileSync(compactCssUrl, "utf8");
const sharedHomeCss = readFileSync(sharedHomeCssUrl, "utf8");
const adaptiveHomeCss = readFileSync(adaptiveHomeCssUrl, "utf8");
const routedApp = readFileSync(routedAppUrl, "utf8");
const homeApp = readFileSync(homeAppUrl, "utf8");

type Specificity = readonly [ids: number, classLike: number, elements: number];

function occurrences(source: string, marker: string): number {
  return source.split(marker).length - 1;
}

function selectorSpecificity(selector: string): Specificity {
  const ids = selector.match(/#[a-zA-Z0-9_-]+/g)?.length ?? 0;
  const classes = selector.match(/\.[a-zA-Z0-9_-]+/g)?.length ?? 0;
  const attributes = selector.match(/\[[^\]]+\]/g)?.length ?? 0;
  const pseudoClasses = selector.match(/:(?!:)[a-zA-Z0-9_-]+(?:\([^)]*\))?/g)?.length ?? 0;
  const withoutNonElements = selector
    .replace(/#[a-zA-Z0-9_-]+/g, " ")
    .replace(/\.[a-zA-Z0-9_-]+/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/::?[a-zA-Z0-9_-]+(?:\([^)]*\))?/g, " ")
    .replace(/[>+~,*]/g, " ");
  const elements = withoutNonElements.match(/[a-zA-Z][a-zA-Z0-9_-]*/g)?.length ?? 0;

  return [ids, classes + attributes + pseudoClasses, elements];
}

function compareSpecificity(left: Specificity, right: Specificity): number {
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

describe("Home CSS source-order independence", () => {
  it("keeps canonical Home below the routed shell used by every compact selector", () => {
    expect(routedApp).toContain('className="lx-routed-app"');
    expect(routedApp).toContain("<LexigoBootstrappedApp");
    expect(homeApp).toContain('data-route-client-island="home"');
  });

  it("loads compact Home before the shared base as an adversarial order proof", () => {
    const premiumImport = 'import "./premium-ui.css";';
    const compactImport = 'import "./compact-home.css";';
    const sharedImport = 'import "./information-architecture.css";';
    const adaptiveImport = 'import "./adaptive-knowledge-coach-home.css";';

    for (const stylesheetImport of [premiumImport, compactImport, sharedImport, adaptiveImport]) {
      expect(occurrences(layout, stylesheetImport), stylesheetImport).toBe(1);
    }

    expect(layout.indexOf(premiumImport)).toBeLessThan(layout.indexOf(compactImport));
    expect(layout.indexOf(compactImport)).toBeLessThan(layout.indexOf(sharedImport));
    expect(layout.indexOf(sharedImport)).toBeLessThan(layout.indexOf(adaptiveImport));
  });

  it("route-scopes every compact selector without changing its responsive boundary", () => {
    const compactWithoutComments = compactCss.replace(/\/\*[\s\S]*?\*\//g, "");

    expect(compactWithoutComments).not.toMatch(/^\s*\.lx-(?!routed-app\b)/m);
    expect(occurrences(compactWithoutComments, ".lx-routed-app ")).toBe(26);
    expect(occurrences(compactWithoutComments, "@media (max-width: 760px)")).toBe(1);
    expect(occurrences(compactWithoutComments, "@media (max-width: 390px)")).toBe(1);
    expect(compactWithoutComments).not.toContain("!important");
  });

  it("keeps compact Home more specific than every overlapping shared selector", () => {
    const selectorPairs = [
      {
        shared: ".lx-home-next-action",
        compact: ".lx-routed-app .lx-home-next-action",
      },
      {
        shared: ".lx-home-next-action .lx-hero-card",
        compact: ".lx-routed-app .lx-home-next-action .lx-hero-card",
      },
      {
        shared: ".lx-home-next-action-copy",
        compact: ".lx-routed-app .lx-home-next-action-copy",
      },
      {
        shared: ".lx-home-next-action-copy h1",
        compact: ".lx-routed-app .lx-home-next-action-copy h1",
      },
      {
        shared: ".lx-home-next-action-copy p",
        compact: ".lx-routed-app .lx-home-next-action-copy p",
      },
      {
        shared: ".lx-home-next-action-copy .lx-button.primary",
        compact: ".lx-routed-app .lx-home-next-action-copy .lx-button.primary",
      },
      {
        shared: ".lx-home-next-action .lx-progress-panel",
        compact: ".lx-routed-app .lx-home-next-action .lx-progress-panel",
      },
    ] as const;

    for (const { shared, compact } of selectorPairs) {
      expect(sharedHomeCss, `shared selector ${shared}`).toContain(shared);
      expect(compactCss, `compact selector ${compact}`).toContain(compact);
      expect(
        compareSpecificity(selectorSpecificity(compact), selectorSpecificity(shared)),
        `${compact} must outrank ${shared}`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps the adaptive owner more specific than compact Home at narrower breakpoints", () => {
    const selectorPairs = [
      {
        compact: ".lx-routed-app .lx-home-next-action",
        adaptive: '.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-home-next-action',
      },
      {
        compact: ".lx-routed-app .lx-home-next-action .lx-hero-card",
        adaptive: '.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-hero-card',
      },
      {
        compact: ".lx-routed-app .lx-home-next-action-copy",
        adaptive: '.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-home-next-action-copy',
      },
      {
        compact: ".lx-routed-app .lx-home-next-action .lx-progress-panel",
        adaptive: '.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-progress-panel',
      },
    ] as const;

    for (const { compact, adaptive } of selectorPairs) {
      expect(compactCss, `compact selector ${compact}`).toContain(compact);
      expect(adaptiveHomeCss, `adaptive selector ${adaptive}`).toContain(adaptive);
      expect(
        compareSpecificity(selectorSpecificity(adaptive), selectorSpecificity(compact)),
        `${adaptive} must outrank ${compact}`,
      ).toBeGreaterThan(0);
    }
  });

  it("retains the shared premium declarations below the stronger Home owners", () => {
    expect(premiumCss).toContain(".lx-hero-card {");
    expect(premiumCss).toContain(".lx-hero-art {");
    expect(premiumCss).toContain(".lx-progress-panel {");
    expect(selectorSpecificity(".lx-hero-card")).toEqual([0, 1, 0]);
    expect(selectorSpecificity(".lx-routed-app .lx-home-next-action .lx-hero-card"))
      .toEqual([0, 3, 0]);
    expect(selectorSpecificity('.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-hero-card'))
      .toEqual([0, 4, 0]);
  });
});
