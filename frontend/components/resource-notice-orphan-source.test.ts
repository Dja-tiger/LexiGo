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

const SESSION_NOTICE_BUTTON_RULE = `.lx-session-notice button {
  min-height: 40px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 11px;
  padding: 8px 13px;
  color: inherit;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 800;
}`;

const SESSION_NOTICE_CONNECTIVITY_RULE = `.lx-session-notice.offline,
.lx-session-notice.timeout { border-color: rgba(101, 191, 255, 0.3); color: #c7e8ff; background: rgba(13, 55, 84, 0.94); }`;

const SESSION_NOTICE_MALFORMED_RULE = `.lx-session-notice.malformed { border-color: rgba(205, 158, 255, 0.32); color: #ead7ff; background: rgba(57, 31, 83, 0.94); }`;

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

  it("keeps the retired selector family physically absent from production CSS", () => {
    const stylesheet = stripComments(mobilePWAStyles);

    expect(occurrences(stylesheet, LEGACY_RESOURCE_NOTICE_PREFIX)).toBe(0);
    expect(stylesheet).not.toContain(".lx-resource-notice");
  });

  it("preserves the exact live session-notice declarations after grouped-selector reduction", () => {
    const stylesheet = stripComments(mobilePWAStyles);

    expect(stylesheet).toContain(".lx-resource-stack {");
    expect(stylesheet).toContain(".lx-session-notice {");
    expect(occurrences(stylesheet, SESSION_NOTICE_BUTTON_RULE)).toBe(1);
    expect(occurrences(stylesheet, SESSION_NOTICE_CONNECTIVITY_RULE)).toBe(1);
    expect(occurrences(stylesheet, SESSION_NOTICE_MALFORMED_RULE)).toBe(1);
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

  it("protects live route-stack and session-shell consumers", () => {
    expect(executableConsumers("lx-resource-stack").length).toBeGreaterThan(0);
    expect(bootstrapSource).toContain("lx-session-notice");
    expect(mobilePWAStyles).toContain("@media (display-mode: standalone)");
  });
});
