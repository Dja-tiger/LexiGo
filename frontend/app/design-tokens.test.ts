import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const frontendRoot = process.cwd();
const tokenCSS = readFileSync(resolve(frontendRoot, "app/design-tokens.css"), "utf8");
const layoutSource = readFileSync(resolve(frontendRoot, "app/layout.tsx"), "utf8");

function declaration(name: string): string {
  const match = tokenCSS.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`));
  if (!match) throw new Error(`Token ${name} was not found`);
  return match[1].trim();
}

describe("design token contract", () => {
  it("defines every foundation category", () => {
    const requiredTokens = [
      "--lx-color-bg-canvas",
      "--lx-color-surface-default",
      "--lx-color-text-primary",
      "--lx-color-feedback-danger",
      "--lx-font-family-sans",
      "--lx-text-body",
      "--lx-space-4",
      "--lx-radius-lg",
      "--lx-size-touch-min",
      "--lx-shadow-lg",
      "--lx-duration-normal",
      "--lx-ease-emphasized",
    ];

    requiredTokens.forEach((token) => expect(tokenCSS).toContain(`${token}:`));
  });

  it("keeps the spacing scale on a four-pixel grid", () => {
    expect(declaration("--lx-space-1")).toBe("0.25rem");
    expect(declaration("--lx-space-2")).toBe("0.5rem");
    expect(declaration("--lx-space-4")).toBe("1rem");
    expect(declaration("--lx-space-12")).toBe("3rem");
  });

  it("maps legacy variables to semantic roles", () => {
    expect(declaration("--lx-bg")).toBe("var(--lx-color-bg-canvas)");
    expect(declaration("--lx-panel")).toBe("var(--lx-color-surface-default)");
    expect(declaration("--lx-text")).toBe("var(--lx-color-text-primary)");
    expect(declaration("--lx-danger")).toBe("var(--lx-color-feedback-danger)");
    expect(declaration("--lx-shadow")).toBe("var(--lx-shadow-xl)");
  });

  it("loads the semantic layer after the legacy premium stylesheet", () => {
    const premiumIndex = layoutSource.indexOf('import "./premium-ui.css";');
    const tokensIndex = layoutSource.indexOf('import "./design-tokens.css";');

    expect(premiumIndex).toBeGreaterThan(-1);
    expect(tokensIndex).toBeGreaterThan(premiumIndex);
  });

  it("removes optional motion through shared tokens", () => {
    const reducedMotionBlock = tokenCSS.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]+)\}\s*@media \(max-width: 760px\)/)?.[1];

    expect(reducedMotionBlock).toBeDefined();
    expect(reducedMotionBlock).toContain("--lx-duration-fast: 0ms;");
    expect(reducedMotionBlock).toContain("--lx-duration-normal: 0ms;");
    expect(reducedMotionBlock).toContain("--lx-duration-slow: 0ms;");
    expect(reducedMotionBlock).toContain("--lx-motion-distance-enter: 0px;");
  });
});
