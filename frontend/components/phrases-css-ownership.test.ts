import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const sharedCatalogCssUrl = new URL("../app/catalog-enhancements.css", import.meta.url);
const premiumCssUrl = new URL("../app/premium-ui.css", import.meta.url);
const phrasesCssUrl = new URL("../app/phrases.css", import.meta.url);
const phraseDetailMinWidthCssUrl = new URL("../app/phrase-detail-min-width.css", import.meta.url);
const compatibilityCssUrl = new URL("../app/phrases-compat.css", import.meta.url);
const overlapManifestUrl = new URL("../app/global-feature-style-overlap-manifest.json", import.meta.url);
const phrasesCatalogUrl = new URL("./phrases-catalog.tsx", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);

const layout = readFileSync(layoutUrl, "utf8");
const sharedCatalogCss = readFileSync(sharedCatalogCssUrl, "utf8");
const premiumCss = readFileSync(premiumCssUrl, "utf8");
const phrasesCss = readFileSync(phrasesCssUrl, "utf8");
const phraseDetailMinWidthCss = readFileSync(phraseDetailMinWidthCssUrl, "utf8");
const phrasesCatalog = readFileSync(phrasesCatalogUrl, "utf8");
const packageJson = JSON.parse(readFileSync(packageUrl, "utf8")) as {
  scripts: Record<string, string>;
};
const overlapManifest = JSON.parse(readFileSync(overlapManifestUrl, "utf8")) as Array<{
  id: string;
  classification: string;
  evidence: string;
}>;

const canonicalCascadeBlock = `/* Issue #70: canonical Phrases computed-cascade ownership. */

.lx-app[data-route-client-island="phrases"] .lx-catalog-sort {
  border-color: var(--lx-phrases-border);
  color: var(--ak-color-text-main);
  background: var(--ak-color-surface);
  box-shadow: var(--ak-elevation-1);
  backdrop-filter: none;
}

.lx-app[data-route-client-island="phrases"] .lx-catalog-sort strong {
  color: var(--ak-color-text-main);
}

.lx-app[data-route-client-island="phrases"] .lx-catalog-sort small {
  color: var(--ak-color-text-muted);
}

.lx-app[data-route-client-island="phrases"] .lx-catalog-sort select {
  border-color: var(--lx-phrases-border);
  color: var(--ak-color-text-main);
  background: var(--ak-color-surface);
}

.lx-app[data-route-client-island="phrases"] .lx-phrases-topic-chips button[aria-pressed="true"] {
  color: #10211d;
  font-weight: 700;
}

/* Keep the first result below the restored catalog viewport boundary. */
.lx-app[data-route-client-island="phrases"] .lx-phrases-results {
  padding-top: 24px;
}

.lx-app[data-route-client-island="phrases"] .lx-phrase-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin: 0;
  list-style: none;
}

@media (forced-colors: active) {
  .lx-app[data-route-client-island="phrases"] .lx-catalog-sort,
  .lx-app[data-route-client-island="phrases"] .lx-catalog-sort select {
    border: 1px solid CanvasText;
    color: CanvasText;
    background: Canvas;
    box-shadow: none;
  }

  .lx-app[data-route-client-island="phrases"] .lx-phrases-topic-chips button[aria-pressed="true"] {
    color: HighlightText;
    background: Highlight;
  }
}`;

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

describe("Phrases CSS ownership", () => {
  it("loads the route owner before the shared catalog base as an order-independence proof", () => {
    const routeImport = 'import "./phrases.css";';
    const sharedImport = 'import "./catalog-enhancements.css";';

    expect(layout).toContain(routeImport);
    expect(layout).toContain(sharedImport);
    expect(layout).not.toContain('import "./phrases-compat.css";');
    expect(occurrences(layout, routeImport)).toBe(1);
    expect(occurrences(layout, sharedImport)).toBe(1);
    expect(layout.indexOf(routeImport)).toBeLessThan(layout.indexOf(sharedImport));
    expect(existsSync(compatibilityCssUrl)).toBe(false);
  });

  it("keeps every overlapping route override more specific than the unscoped shared base", () => {
    const selectorPairs = [
      {
        shared: ".lx-catalog-sort",
        route: '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort',
      },
      {
        shared: ".lx-catalog-sort strong",
        route: '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort strong',
      },
      {
        shared: ".lx-catalog-sort small",
        route: '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort small',
      },
      {
        shared: ".lx-catalog-sort select",
        route: '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort select',
      },
    ] as const;

    for (const { shared, route } of selectorPairs) {
      expect(sharedCatalogCss, `shared selector ${shared}`).toContain(`${shared} {`);
      expect(phrasesCss, `route selector ${route}`).toContain(`${route} {`);
      expect(
        compareSpecificity(selectorSpecificity(route), selectorSpecificity(shared)),
        `${route} must outrank ${shared}`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps every moved route selector above its original shared-selector specificity", () => {
    expect(selectorSpecificity('.lx-app[data-route-client-island="phrases"] .lx-catalog-sort'))
      .toEqual([0, 3, 0]);
    expect(selectorSpecificity(".lx-catalog-sort")).toEqual([0, 1, 0]);
    expect(selectorSpecificity('.lx-app[data-route-client-island="phrases"] .lx-catalog-sort select'))
      .toEqual([0, 3, 1]);
    expect(selectorSpecificity(".lx-catalog-sort select")).toEqual([0, 1, 1]);
  });

  it("isolates the minimum-width Phrase Detail inset repair from canonical 390px", () => {
    const legacySelector = ".lx-detail-card";
    const routeSelector = '.lx-app[data-route-client-island="phrases"] .lx-phrase-detail-layout';
    const minWidthImport = 'import "./phrase-detail-min-width.css";';

    expect(premiumCss).toContain(
      ".lx-detail-card { border-radius: 28px; padding: 30px; }",
    );
    expect(layout).toContain(minWidthImport);
    expect(occurrences(layout, minWidthImport)).toBe(1);
    expect(layout.indexOf('import "./phrase-detail-touch-targets.css";'))
      .toBeLessThan(layout.indexOf(minWidthImport));
    expect(layout.indexOf(minWidthImport))
      .toBeLessThan(layout.indexOf('import "./catalog-enhancements.css";'));
    expect(phraseDetailMinWidthCss).toContain("@media (max-width: 359px)");
    expect(phraseDetailMinWidthCss).not.toContain("@media (max-width: 767px)");
    expect(occurrences(phraseDetailMinWidthCss, `${routeSelector} {`)).toBe(1);
    expect(phraseDetailMinWidthCss).toContain(`${routeSelector} {\n    padding: 0;\n  }`);
    expect(selectorSpecificity(legacySelector)).toEqual([0, 1, 0]);
    expect(selectorSpecificity(routeSelector)).toEqual([0, 3, 0]);
    expect(compareSpecificity(selectorSpecificity(routeSelector), selectorSpecificity(legacySelector)))
      .toBeGreaterThan(0);
  });

  it("preserves exactly four reviewed Phrases grid fallback conflicts", () => {
    const items = overlapManifest.filter((item) => item.id.startsWith(".lx-phrase-grid |"));

    expect(items).toHaveLength(4);
    expect(items.every((item) => item.classification === "requires-proof")).toBe(true);
    expect(items.map((item) => item.id).sort()).toEqual([
      '.lx-phrase-grid | gap | normal -> premium-ui.css [global] = "13px" -> phrases.css [global] = "10px"',
      '.lx-phrase-grid | grid-template-columns | normal -> premium-ui.css [@media (max-width: 1040px)] = "repeat(2, 1fr)" -> phrases.css [global] = "minmax(0, 1fr)"',
      '.lx-phrase-grid | grid-template-columns | normal -> premium-ui.css [@media (max-width: 760px)] = "1fr" -> phrases.css [global] = "minmax(0, 1fr)"',
      '.lx-phrase-grid | grid-template-columns | normal -> premium-ui.css [global] = "repeat(3, minmax(0, 1fr))" -> phrases.css [global] = "minmax(0, 1fr)"',
    ].sort());
  });

  it("preserves premium fallback geometry and gives the live island a stronger owner", () => {
    const fallbackSelector = ".lx-phrase-grid";
    const routeSelector = '.lx-app[data-route-client-island="phrases"] .lx-phrase-grid';

    expect(premiumCss).toContain(
      ".lx-phrase-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; margin-top: 18px; }",
    );
    expect(premiumCss).toContain(".lx-phrase-grid { grid-template-columns: repeat(2, 1fr); }");
    expect(premiumCss).toContain(".lx-phrase-grid, .lx-library-grid { grid-template-columns: 1fr; }");
    expect(phrasesCss).toContain(`${routeSelector} {`);
    expect(phrasesCss).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(phrasesCss).toContain("gap: 10px;");
    expect(selectorSpecificity(fallbackSelector)).toEqual([0, 1, 0]);
    expect(selectorSpecificity(routeSelector)).toEqual([0, 3, 0]);
    expect(compareSpecificity(selectorSpecificity(routeSelector), selectorSpecificity(fallbackSelector)))
      .toBeGreaterThan(0);
  });

  it("keeps the production grid reachable only below the Phrases route island", () => {
    expect(occurrences(phrasesCatalog, 'className="lx-phrases-results lx-phrase-grid"')).toBe(1);
    expect(phrasesCss).toContain('.lx-app[data-route-client-island="phrases"] .lx-phrase-grid');
    expect(phrasesCatalog).not.toContain('className="lx-phrase-grid"');
  });

  it("owns the complete route-scoped computed cascade exactly once", () => {
    expect(occurrences(phrasesCss, canonicalCascadeBlock)).toBe(1);
    expect(phrasesCss.trimEnd().endsWith(canonicalCascadeBlock)).toBe(true);
    expect(phrasesCss).not.toContain(
      "/* Issue #199 compatibility overrides verified against the full browser/axe matrix. */",
    );
  });

  it("keeps every moved selector unique in the canonical owner", () => {
    const selectorCounts = new Map<string, number>([
      ['.lx-app[data-route-client-island="phrases"] .lx-catalog-sort {', 1],
      ['.lx-app[data-route-client-island="phrases"] .lx-catalog-sort strong {', 1],
      ['.lx-app[data-route-client-island="phrases"] .lx-catalog-sort small {', 1],
      ['.lx-app[data-route-client-island="phrases"] .lx-catalog-sort select {', 2],
      ['.lx-app[data-route-client-island="phrases"] .lx-phrases-topic-chips button[aria-pressed="true"] {', 2],
      ['.lx-app[data-route-client-island="phrases"] .lx-phrases-results {', 1],
      ['.lx-app[data-route-client-island="phrases"] .lx-phrase-grid {', 1],
    ]);

    for (const [selector, expected] of selectorCounts) {
      expect(occurrences(phrasesCss, selector), `canonical selector ${selector}`).toBe(expected);
    }
  });

  it("registers the focused grid cascade proof in both authoritative UI commands", () => {
    const spec = "e2e/phrases-grid-cascade.spec.ts";
    expect(packageJson.scripts["test:e2e:ui"]).toContain(spec);
    expect(packageJson.scripts["test:e2e:responsive"]).toContain(spec);
  });
});
