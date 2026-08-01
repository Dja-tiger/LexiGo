import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutUrl = new URL("../app/layout.tsx", import.meta.url);
const sharedCatalogCssUrl = new URL("../app/catalog-enhancements.css", import.meta.url);
const phrasesCssUrl = new URL("../app/phrases.css", import.meta.url);
const compatibilityCssUrl = new URL("../app/phrases-compat.css", import.meta.url);

const layout = readFileSync(layoutUrl, "utf8");
const sharedCatalogCss = readFileSync(sharedCatalogCssUrl, "utf8");
const phrasesCss = readFileSync(phrasesCssUrl, "utf8");

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
    ]);

    for (const [selector, expected] of selectorCounts) {
      expect(occurrences(phrasesCss, selector), `canonical selector ${selector}`).toBe(expected);
    }
  });
});
