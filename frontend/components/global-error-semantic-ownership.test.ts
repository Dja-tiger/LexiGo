import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const globalErrorPath = path.join(frontendDirectory, "app", "global-error.tsx");
const globalErrorCSSPath = path.join(frontendDirectory, "app", "global-error.css");
const appearanceE2EPath = path.join(frontendDirectory, "e2e", "application-error-boundary-appearance.spec.ts");
const packagePath = path.join(frontendDirectory, "package.json");

const LEGACY_ROOT_ERROR_COLORS = [
  "#050914",
  "#f7f9ff",
  "#33415c",
  "#0c1324",
  "#b7c2d8",
  "#66738e",
] as const;

describe("root global-error semantic ownership", () => {
  it("owns the token, appearance and root-error stylesheet dependencies it needs", () => {
    const source = readFileSync(globalErrorPath, "utf8");

    expect(source).toContain('import "./design-tokens.css"');
    expect(source).toContain('import "./appearance.css"');
    expect(source).toContain('import "./global-error.css"');
    expect(source).toContain('import { subscribeAppearanceRuntime } from "@/lib/appearance-preference"');
    expect(source).toContain("useEffect(() => subscribeAppearanceRuntime(), []);");
    expect(source).not.toContain('import "./globals.css"');
    expect(source).not.toContain('import "./premium-ui.css"');
  });

  it("preserves the root replacement and recovery lifecycle while removing inline paint", () => {
    const source = readFileSync(globalErrorPath, "utf8");

    expect(source).toContain("export default function GlobalError");
    expect(source).toContain('<html lang="ru">');
    expect(source).toContain('<body className="lx-global-error-body">');
    expect(source).toContain('role="alert"');
    expect(source).toContain("isVersionMismatchError(error)");
    expect(source).toContain("clearLexigoRuntimeState");
    expect(source).toContain("navigator.serviceWorker.getRegistrations()");
    expect(source).toContain("reset();");
    expect(source).toContain("window.location.reload()");
    expect(source).toContain('window.location.assign("/")');
    expect(source).toContain("Очистить кэш и обновить");
    expect(source).toContain("Повторите загрузку. Сессия и уже сохранённые ответы не удалены.");
    expect(source).not.toContain("style={{");
  });

  it("uses only current semantic palette ownership for root-error paint", () => {
    const source = readFileSync(globalErrorPath, "utf8");
    const css = readFileSync(globalErrorCSSPath, "utf8");

    for (const legacyColor of LEGACY_ROOT_ERROR_COLORS) {
      expect(source.toLowerCase()).not.toContain(legacyColor);
      expect(css.toLowerCase()).not.toContain(legacyColor);
    }

    expect(css).toContain(".lx-global-error-body");
    expect(css).toContain(".lx-global-error-card");
    expect(css).toContain(".lx-global-error-action--primary");
    expect(css).toContain(".lx-global-error-action--secondary");
    expect(css).toContain("var(--ak-color-canvas)");
    expect(css).toContain("var(--ak-color-surface)");
    expect(css).toContain("var(--ak-color-text-main)");
    expect(css).toContain("var(--ak-color-text-muted)");
    expect(css).toContain("var(--ak-color-weak)");
    expect(css).toContain("var(--ak-color-primary)");
    expect(css).toContain("var(--ak-color-primary-soft)");
    expect(css).toContain("color-mix(in srgb");
    expect(css).not.toContain("radial-gradient");
  });

  it("keeps Light/Dark computed-style proof in the blocking UI collection", () => {
    const e2e = readFileSync(appearanceE2EPath, "utf8");
    const packageSource = readFileSync(packagePath, "utf8");

    expect(packageSource).toContain("e2e/application-error-boundary-appearance.spec.ts");
    expect(e2e).toContain("global root error uses ${appearance} semantic appearance tokens");
    expect(e2e).toContain("global-error.css");
    expect(e2e).toContain("global-error-appearance-fixture");
    expect(e2e).toContain("document.body.appendChild(fixture)");
    expect(e2e).toContain("fixture.remove()");
    expect(e2e).not.toContain("document.body.replaceChildren");
  });
});
