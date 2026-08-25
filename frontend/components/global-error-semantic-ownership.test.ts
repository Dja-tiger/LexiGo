import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const globalErrorPath = path.join(frontendDirectory, "app", "global-error.tsx");
const globalErrorCSSPath = path.join(frontendDirectory, "app", "global-error.css");
const designTokensCSSPath = path.join(frontendDirectory, "app", "design-tokens.css");
const appearanceCSSPath = path.join(frontendDirectory, "app", "appearance.css");
const appearanceE2EPath = path.join(frontendDirectory, "e2e", "application-error-boundary-appearance.spec.ts");
const packagePath = path.join(frontendDirectory, "package.json");

const REQUIRED_BOOTSTRAP_TOKENS = [
  "--ak-color-canvas",
  "--ak-color-surface",
  "--ak-color-primary",
  "--ak-color-primary-soft",
  "--ak-color-weak",
  "--ak-color-text-main",
  "--ak-color-text-muted",
] as const;

const LEGACY_ROOT_ERROR_COLORS = [
  "#050914",
  "#f7f9ff",
  "#33415c",
  "#0c1324",
  "#b7c2d8",
  "#66738e",
] as const;

function requireRuleBlock(source: string, pattern: RegExp, owner: string): string {
  const match = source.match(pattern);
  if (!match?.[1]) {
    throw new Error(`Missing ${owner} CSS rule block`);
  }
  return match[1];
}

function requireTokenValue(block: string, token: string, owner: string): string {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`${escapedToken}\\s*:\\s*([^;]+);`));
  if (!match?.[1]) {
    throw new Error(`Missing ${token} in ${owner}`);
  }
  return match[1].trim().toLowerCase();
}

describe("root global-error semantic ownership", () => {
  it("loads only the dedicated fallback stylesheet and reuses appearance runtime", () => {
    const source = readFileSync(globalErrorPath, "utf8");

    expect(source).toContain('import "./global-error.css"');
    expect(source).toContain('import { subscribeAppearanceRuntime } from "@/lib/appearance-preference"');
    expect(source).toContain("useEffect(() => subscribeAppearanceRuntime(), []);");
    expect(source).not.toContain('import "./design-tokens.css"');
    expect(source).not.toContain('import "./appearance.css"');
    expect(source).not.toContain('import "./globals.css"');
    expect(source).not.toContain('import "./premium-ui.css"');
  });

  it("keeps the minimal root-error token mirror synchronized with canonical owners", () => {
    const fallbackCSS = readFileSync(globalErrorCSSPath, "utf8");
    const designTokensCSS = readFileSync(designTokensCSSPath, "utf8");
    const appearanceCSS = readFileSync(appearanceCSSPath, "utf8");

    const contexts = [
      {
        name: "base light",
        canonical: requireRuleBlock(designTokensCSS, /:root\s*\{([^}]*)\}/, "design-tokens base"),
        fallback: requireRuleBlock(fallbackCSS, /:root\s*\{([^}]*)\}/, "global-error base"),
      },
      {
        name: "system dark",
        canonical: requireRuleBlock(
          designTokensCSS,
          /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/,
          "design-tokens system dark",
        ),
        fallback: requireRuleBlock(
          fallbackCSS,
          /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/,
          "global-error system dark",
        ),
      },
      {
        name: "explicit light",
        canonical: requireRuleBlock(
          appearanceCSS,
          /:root\[data-lexigo-appearance="light"\]\s*\{([^}]*)\}/,
          "appearance explicit light",
        ),
        fallback: requireRuleBlock(
          fallbackCSS,
          /:root\[data-lexigo-appearance="light"\]\s*\{([^}]*)\}/,
          "global-error explicit light",
        ),
      },
      {
        name: "explicit dark",
        canonical: requireRuleBlock(
          appearanceCSS,
          /:root\[data-lexigo-appearance="dark"\]\s*\{([^}]*)\}/,
          "appearance explicit dark",
        ),
        fallback: requireRuleBlock(
          fallbackCSS,
          /:root\[data-lexigo-appearance="dark"\]\s*\{([^}]*)\}/,
          "global-error explicit dark",
        ),
      },
    ];

    for (const context of contexts) {
      for (const token of REQUIRED_BOOTSTRAP_TOKENS) {
        expect(requireTokenValue(context.fallback, token, context.name)).toBe(
          requireTokenValue(context.canonical, token, `canonical ${context.name}`),
        );
      }
    }
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

  it("keeps CSP-compatible Light/Dark computed-style proof in the blocking UI collection", () => {
    const e2e = readFileSync(appearanceE2EPath, "utf8");
    const packageSource = readFileSync(packagePath, "utf8");

    expect(packageSource).toContain("e2e/application-error-boundary-appearance.spec.ts");
    expect(e2e).toContain("global root error uses ${appearance} semantic appearance tokens");
    expect(e2e).toContain("global-error.css");
    expect(e2e).toContain("global-error-appearance-fixture");
    expect(e2e).toContain('link[rel="stylesheet"][nonce]');
    expect(e2e).toContain('script[nonce]');
    expect(e2e).toContain("style.nonce = nonce");
    expect(e2e).toContain("document.body.appendChild(fixture)");
    expect(e2e).toContain("fixture.remove()");
    expect(e2e).not.toContain("document.body.replaceChildren");
  });
});
