import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const accountCss = readFileSync(new URL("../app/account-security.css", import.meta.url), "utf8");
const adaptiveCss = readFileSync(new URL("../app/adaptive-knowledge-coach-home.css", import.meta.url), "utf8");
const manifest = JSON.parse(
  readFileSync(new URL("../app/global-feature-style-overlap-manifest.json", import.meta.url), "utf8"),
) as Array<{ id: string; classification: string; evidence: string }>;
const panel = readFileSync(new URL("./account-security-panel.tsx", import.meta.url), "utf8");
const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const routed = readFileSync(new URL("./routed-lexigo-app.tsx", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts: Record<string, string>;
};

type Specificity = readonly [number, number, number];

function occurrences(source: string, marker: string): number {
  return source.split(marker).length - 1;
}

function specificity(selector: string): Specificity {
  const ids = selector.match(/#[\w-]+/g)?.length ?? 0;
  const classes = selector.match(/\.[\w-]+/g)?.length ?? 0;
  const attributes = selector.match(/\[[^\]]+\]/g)?.length ?? 0;
  const pseudoClasses = selector.match(/:(?!:)[\w-]+(?:\([^)]*\))?/g)?.length ?? 0;
  const elements = selector
    .replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?|[>+~,*]/g, " ")
    .match(/[a-zA-Z][\w-]*/g)?.length ?? 0;
  return [ids, classes + attributes + pseudoClasses, elements];
}

function compare(left: Specificity, right: Specificity): number {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

describe("Account Security CSS ownership", () => {
  it("preserves the single reviewed exact-selector conflict", () => {
    const items = manifest.filter((item) => item.id.startsWith(".lx-account-security | width |"));
    expect(items).toEqual([
      {
        id: '.lx-account-security | width | normal -> account-security.css [global] = "min(1540px, calc(100% - 40px))" -> adaptive-knowledge-coach-home.css [@media (min-width: 1024px)] = "min(1140px, calc(100vw - var(--ak-shell-rail-width) - 80px))"',
        classification: "requires-proof",
        evidence: expect.any(String),
      },
    ]);
  });

  it("preserves both unscoped fallbacks and adds one stronger routed owner", () => {
    const fallback = ".lx-account-security";
    const routedOwner = ".lx-routed-app .lx-account-security";

    expect(accountCss).toContain("width: min(1540px, calc(100% - 40px));");
    expect(adaptiveCss).toContain("width: min(1140px, calc(100vw - var(--ak-shell-rail-width) - 80px));");
    expect(accountCss).toContain(`${routedOwner} {`);
    expect(occurrences(accountCss, `${routedOwner} {`)).toBe(1);
    expect(accountCss).not.toContain("!important");
    expect(specificity(fallback)).toEqual([0, 1, 0]);
    expect(specificity(routedOwner)).toEqual([0, 2, 0]);
    expect(compare(specificity(routedOwner), specificity(fallback))).toBeGreaterThan(0);
  });

  it("keeps the current global import order observable but non-authoritative", () => {
    const accountImport = 'import "./account-security.css";';
    const adaptiveImport = 'import "./adaptive-knowledge-coach-home.css";';
    expect(layout).toContain(accountImport);
    expect(layout).toContain(adaptiveImport);
    expect(layout.indexOf(accountImport)).toBeLessThan(layout.indexOf(adaptiveImport));
  });

  it("proves the visible panel is profile-only and below the routed shell", () => {
    expect(panel).toContain('if (pathname !== "/profile") return null;');
    expect(panel).toContain('className="lx-account-security"');
    expect(bootstrap).toContain("<AccountSecurityPanel");
    expect(routed).toContain('className="lx-routed-app"');
    expect(routed).toContain("<LexigoBootstrappedApp");
    expect(routed.indexOf('className="lx-routed-app"')).toBeLessThan(routed.indexOf("<LexigoBootstrappedApp"));
  });

  it("preserves approved desktop values in the stronger owner", () => {
    const block = accountCss.match(
      /@media \(min-width: 1024px\) \{\s*\.lx-routed-app \.lx-account-security \{([\s\S]*?)\n  \}\n\}/,
    )?.[1];
    expect(block).toBeDefined();
    expect(block).toContain("box-sizing: border-box;");
    expect(block).toContain("width: min(1140px, calc(100vw - var(--ak-shell-rail-width) - 80px));");
    expect(block).toContain("margin-right: 40px;");
    expect(block).toContain("calc(var(--ak-shell-rail-width) + 40px)");
    expect(block).toContain("calc((100vw + var(--ak-shell-rail-width) - 1140px) / 2)");
  });

  it("registers the focused cascade proof in both authoritative commands", () => {
    const spec = "e2e/account-security-width-cascade.spec.ts";
    expect(packageJson.scripts["test:e2e:ui"]).toContain(spec);
    expect(packageJson.scripts["test:e2e:responsive"]).toContain(spec);
  });
});
