import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const labelsOwner = readFileSync(new URL("../app/mobile-navigation-labels.css", import.meta.url), "utf8");
const routeNavigation = readFileSync(new URL("../app/route-navigation.css", import.meta.url), "utf8");
const adaptiveHome = readFileSync(new URL("../app/adaptive-knowledge-coach-home.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const routeRuntime = readFileSync(new URL("./route-primary-navigation.tsx", import.meta.url), "utf8");
const navigationModel = readFileSync(new URL("../lib/navigation.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

function declarationNames(source: string): string[] {
  return Array.from(source.matchAll(/^\s*([\w-]+)\s*:/gm), (match) => match[1]);
}

describe("Issue #74 canonical mobile navigation label ownership", () => {
  it("loads one final owner after every route presentation layer", () => {
    expect(layout).toContain('import "./mobile-navigation-labels.css";');
    for (const earlierOwner of [
      "./route-navigation.css",
      "./adaptive-knowledge-coach-home.css",
      "./scenario-catalog.css",
      "./profile.css",
      "./header-streak-touch-targets.css",
    ]) {
      expect(layout).toContain(`import "${earlierOwner}";`);
      expect(layout.indexOf(`import "${earlierOwner}";`))
        .toBeLessThan(layout.indexOf('import "./mobile-navigation-labels.css";'));
    }
    expect(layout.indexOf('import "./mobile-navigation-labels.css";'))
      .toBeLessThan(layout.indexOf('import "./active-lesson-queued-state.css";'));
    expect(layout.match(/mobile-navigation-labels\.css/g)).toHaveLength(1);
  });

  it("targets only the confirmed mounted route-owned four-link mobile navigation", () => {
    expect(routeRuntime).toContain('const labelMode = variant === "mobile" ? "short" : "full";');
    expect(routeRuntime).toContain('className={`lx-route-nav lx-route-nav--${variant}`}');
    expect(routeRuntime).toContain("{PRIMARY_NAVIGATION.map((entry) => {");
    expect(routeRuntime).toContain("<span>{labelMode === \"short\" ? entry.shortLabel : entry.label}</span>");
    expect(navigationModel).toContain('{ view: "home", label: "Главная", shortLabel: "Главная" }');
    expect(navigationModel).toContain('{ view: "learn", label: "Обучение", shortLabel: "Учить" }');
    expect(navigationModel).toContain('{ view: "library", label: "Словарь", shortLabel: "Словарь" }');
    expect(navigationModel).toContain('{ view: "progress", label: "Прогресс", shortLabel: "Прогресс" }');

    const mountedOwner = ".lx-routed-app:has(.lx-route-nav--mobile) .lx-route-nav--mobile";
    expect(labelsOwner).toContain(mountedOwner);
    expect(labelsOwner).toContain(`${mountedOwner} a {`);
    expect(labelsOwner).not.toContain("\n  .lx-routed-app .lx-route-nav--mobile a {");
    expect(labelsOwner).not.toContain(".lx-mobile-nav");
    expect(labelsOwner).not.toContain(".lx-route-nav--rail");
    expect(labelsOwner).not.toContain(".lx-route-nav--header");
    expect(labelsOwner).not.toContain(".lx-primary-navigation");
  });

  it("wins the live 11px cascade with a 12px rem-responsive label floor", () => {
    expect(routeNavigation).toContain("@media (max-width: 390px)");
    expect(routeNavigation).toContain("font-size: 11px;");
    expect(routeNavigation).toContain("overflow: hidden;");
    expect(routeNavigation).toContain("text-overflow: ellipsis;");
    expect(routeNavigation).toContain("white-space: nowrap;");
    expect(adaptiveHome).toContain(".lx-routed-app .lx-route-nav--mobile a {");
    expect(adaptiveHome).toContain("font-size: 11px;");
    expect(adaptiveHome).toContain("padding: 0 24px calc(92px + env(safe-area-inset-bottom));");

    expect(labelsOwner).toContain("--lx-route-mobile-navigation-label-size: max(12px, 0.75rem);");
    expect(labelsOwner).toContain("@media (max-width: 390px)");
    expect(labelsOwner).toContain(":has(.lx-route-nav--mobile) .lx-route-nav--mobile a {");
    expect(labelsOwner).toContain("font-size: var(--lx-route-mobile-navigation-label-size);");
    expect(labelsOwner).toContain("overflow: visible;");
    expect(labelsOwner).toContain("text-overflow: clip;");
    expect(labelsOwner).toContain("white-space: normal;");
    expect(labelsOwner).toContain("overflow-wrap: anywhere;");
  });

  it("preserves default geometry and grows mounted navigation with enlarged text", () => {
    expect(labelsOwner).toContain("--lx-route-mobile-navigation-block-size: max(");
    expect(labelsOwner).toContain("calc(33.6px + 2.4rem)");
    expect(labelsOwner).toContain("min-block-size: var(--lx-route-mobile-navigation-block-size);");
    expect(labelsOwner).toContain("min-block-size: max(54px, calc(25.2px + 2.4em));");
    expect(labelsOwner).toContain(':has(.lx-route-nav--mobile) .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]),');
    expect(labelsOwner).toContain(':has(.lx-route-nav--mobile) .lx-app[data-route-client-island="dictionary"]:not(.lx-lesson-focus-mode)');
    expect(labelsOwner).toContain("padding-bottom: calc(");
    expect(labelsOwner).toContain("+ 20px");
    expect(labelsOwner).toContain("+ env(safe-area-inset-bottom)");
    expect(labelsOwner).toContain("min-inline-size: 0;");
  });

  it("does not take painted chrome, route behavior or desktop ownership", () => {
    const declarations = declarationNames(labelsOwner);
    for (const prohibited of [
      "position",
      "top",
      "right",
      "bottom",
      "left",
      "display",
      "grid-template-columns",
      "gap",
      "border",
      "border-radius",
      "background",
      "box-shadow",
      "color",
      "transform",
      "z-index",
      "pointer-events",
    ]) {
      expect(declarations, `${prohibited} must remain owned by route presentation`)
        .not.toContain(prohibited);
    }

    expect(labelsOwner).not.toContain("href");
    expect(labelsOwner).not.toContain("aria-");
    expect(labelsOwner).not.toContain("data-navigation-view");
  });

  it("registers the focused proof in UI, accessibility and responsive commands", () => {
    for (const commandName of ["test:e2e:ui", "test:e2e:a11y", "test:e2e:responsive"] as const) {
      const command = packageJSON.scripts?.[commandName] ?? "";
      expect(command).toContain("e2e/mobile-navigation-labels.spec.ts");
      expect(command.match(/e2e\/mobile-navigation-labels\.spec\.ts/g)).toHaveLength(1);
    }
  });
});
