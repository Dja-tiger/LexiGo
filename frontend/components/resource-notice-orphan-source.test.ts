import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");
const libDirectory = path.join(frontendDirectory, "lib");

const mobilePWAStyles = readFileSync(path.join(appDirectory, "mobile-pwa-fixes.css"), "utf8");
const systemStateStyles = readFileSync(path.join(appDirectory, "system-states.css"), "utf8");
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const asyncStateSource = readFileSync(path.join(componentsDirectory, "async-state.tsx"), "utf8");
const bootstrapSource = readFileSync(path.join(componentsDirectory, "lexigo-bootstrapped-app.tsx"), "utf8");

const LEGACY_RESOURCE_NOTICE_PREFIX = "lx-resource-notice";

const LEGACY_SELECTOR_MARKERS = [
  ".lx-resource-notice {",
  ".lx-resource-notice > div {",
  ".lx-resource-notice strong {",
  ".lx-resource-notice span {",
  ".lx-resource-notice button,",
  ".lx-resource-notice.offline,",
  ".lx-resource-notice.timeout,",
  ".lx-resource-notice.malformed,",
] as const;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) return sourceFiles(absolutePath);
    if (!/\.(?:ts|tsx)$/.test(entry)) return [];
    if (/\.(?:test|spec)\.(?:ts|tsx)$/.test(entry)) return [];

    return [absolutePath];
  });
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

function executableConsumers(value: string): string[] {
  return [appDirectory, componentsDirectory, libDirectory]
    .flatMap(sourceFiles)
    .filter((file) => stripComments(readFileSync(file, "utf8")).includes(value))
    .map((file) => path.relative(frontendDirectory, file))
    .sort();
}

describe("legacy resource notice CSS reachability", () => {
  it("has no executable TypeScript or TSX consumer for the retired class family", () => {
    expect(executableConsumers(LEGACY_RESOURCE_NOTICE_PREFIX)).toEqual([]);
  });

  it("bounds the exact legacy selector inventory without absorbing live adjacent owners", () => {
    const stylesheet = stripComments(mobilePWAStyles);

    expect(occurrences(stylesheet, `.${LEGACY_RESOURCE_NOTICE_PREFIX}`)).toBe(8);
    for (const marker of LEGACY_SELECTOR_MARKERS) {
      expect(occurrences(stylesheet, marker), marker).toBe(1);
    }

    expect(stylesheet).toContain(".lx-resource-stack {");
    expect(stylesheet).toContain(".lx-session-notice {");
    expect(stylesheet).toContain(
      ".lx-resource-notice button,\n.lx-session-notice button {",
    );
    expect(stylesheet).toContain(
      ".lx-resource-notice.offline,\n.lx-resource-notice.timeout,\n.lx-session-notice.offline,\n.lx-session-notice.timeout {",
    );
    expect(stylesheet).toContain(
      ".lx-resource-notice.malformed,\n.lx-session-notice.malformed {",
    );
  });

  it("keeps resource errors on the canonical async-state presentation path", () => {
    expect(asyncStateSource).toContain("export function AsyncResourceNotice(");
    expect(asyncStateSource).toContain("<AsyncStatePanel");
    expect(asyncStateSource).toContain("compact");
    expect(asyncStateSource).toContain("className={`lx-async-state ${kind}");
    expect(asyncStateSource).not.toContain(LEGACY_RESOURCE_NOTICE_PREFIX);

    expect(systemStateStyles).toContain(".lx-async-state.compact {");
    expect(systemStateStyles).toContain(".lx-resource-stack .lx-async-state {");
    expect(layoutSource).toContain('import "./mobile-pwa-fixes.css";');
    expect(layoutSource).toContain('import "./system-states.css";');
    expect(layoutSource.indexOf('import "./mobile-pwa-fixes.css";'))
      .toBeLessThan(layoutSource.indexOf('import "./system-states.css";'));
  });

  it("protects live route-stack and session-shell consumers from a future deletion slice", () => {
    expect(executableConsumers("lx-resource-stack").length).toBeGreaterThan(0);
    expect(bootstrapSource).toContain("lx-session-notice");
    expect(mobilePWAStyles).toContain("@media (display-mode: standalone)");
  });
});
