import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();

function readSource(...segments: string[]): string {
  return readFileSync(path.join(frontendDirectory, ...segments), "utf8");
}

function rgb(hex: string): [number, number, number] {
  const normalized = hex.replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) throw new Error(`Invalid color ${hex}`);
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16)) as [number, number, number];
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function rootLightVariables(css: string): Record<string, string> {
  const block = css.match(/^:root\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!block) throw new Error("First Use root token block is missing");
  return Object.fromEntries(
    [...block.matchAll(/--fu-([a-z0-9-]+):\s*(#[0-9a-f]{6});/gi)].map((match) => [match[1], match[2].toLowerCase()]),
  );
}

describe("First Use canonical route and accessibility contracts", () => {
  it("registers /onboarding as a real App Router route instead of mounting over not-found", () => {
    const page = readSource("app", "onboarding", "page.tsx");

    expect(page).toContain('title: "Первичная настройка · LexiGo"');
    expect(page).toContain("export default function OnboardingPage()");
    expect(page).toMatch(/return null;/);
  });

  it("exposes semantic progressbars for onboarding and diagnostic progress", () => {
    const onboarding = readSource("components", "lexigo-onboarding-app.tsx");

    expect(onboarding.match(/role="progressbar"/g)).toHaveLength(2);
    expect(onboarding).toContain('aria-label="Шаг настройки"');
    expect(onboarding).toContain('aria-valuetext="Шаг 1 из 3"');
    expect(onboarding).toContain('aria-label="Диагностический прогресс"');
    expect(onboarding).toContain("aria-valuenow={snapshot.marked}");
    expect(onboarding).toContain("aria-valuemax={snapshot.total}");
  });

  it("keeps the desktop diagnostic hierarchy aligned without fabricating design fixture content", () => {
    const onboarding = readSource("components", "lexigo-onboarding-app.tsx");
    const css = readSource("app", "first-use.css");

    expect(onboarding).toContain('className="lx-first-use-diagnostic-intro"');
    expect(onboarding).toContain("До выбора ответ скрыт. Диагностика не оценивает вас как экзамен.");
    expect(onboarding).toContain('className="lx-first-use-kicker lx-first-use-diagnostic-position"');
    expect(onboarding).toContain('className="lx-first-use-diagnostic-context-desktop"');
    expect(onboarding).toContain('`Тема: ${current.topic}`');
    expect(onboarding).not.toContain("We need a safe schema evolution plan before the next release.");

    const desktopBoundary = css.match(/@media \(min-width: 720px\) \{([\s\S]*?)\n\}\n\n@media \(max-width: 719px\)/)?.[1];
    expect(desktopBoundary).toBeTruthy();
    expect(desktopBoundary).toContain(".lx-first-use-diagnostic-intro");
    expect(desktopBoundary).toContain("font-size: 40px;");
    expect(desktopBoundary).toMatch(/\.lx-first-use-diagnostic-card \{[\s\S]*?border: 0;[\s\S]*?padding: 0;[\s\S]*?background: transparent;/);
    expect(desktopBoundary).toMatch(/\.lx-first-use-diagnostic > \.lx-first-use-progress \{[\s\S]*?clip-path: inset\(50%\);/);
    expect(desktopBoundary).toMatch(/\.lx-first-use-diagnostic \.lx-first-use-mark-group \{[\s\S]*?order: 3;/);
    expect(desktopBoundary).toMatch(/\.lx-first-use-diagnostic-resume-note \{[\s\S]*?order: 4;/);
  });

  it("keeps desktop loading and recoverable-error hierarchy separate from compact First Use presentation", () => {
    const onboarding = readSource("components", "lexigo-onboarding-app.tsx");
    const css = readSource("app", "first-use.css");

    expect(onboarding.match(/lx-first-use-diagnostic-intro lx-first-use-state-intro/g)).toHaveLength(2);
    expect(onboarding).toContain("Восстанавливаем first-use state и текущую диагностическую позицию.");
    expect(onboarding).toContain("Состояние связано напрямую с серверным onboarding contract.");
    expect(onboarding).toContain('className="lx-first-use-kicker lx-first-use-state-mobile-only"');
    expect(onboarding).toContain('className="lx-first-use-state-mobile-only">Подготавливаем диагностику</h1>');
    expect(onboarding).toContain('className="lx-first-use-skeleton-desktop"');
    expect(onboarding).toContain("Восстанавливаем текущую позицию без раскрытия будущих ответов.");
    expect(onboarding).toContain('retryAction ? " lx-first-use-message--recoverable" : ""');
    expect(onboarding).toContain('aria-busy="true"');
    expect(onboarding).toContain('role="alert"');
    expect(onboarding).toContain("Повторить");
    expect(onboarding).toContain("Вернуться назад");

    const genericNoteOwner = css.indexOf(".lx-first-use-note {");
    const desktopBoundaryStart = css.indexOf("@media (min-width: 720px)");
    expect(genericNoteOwner).toBeGreaterThan(-1);
    expect(desktopBoundaryStart).toBeGreaterThan(genericNoteOwner);

    const desktopBoundary = css.match(/@media \(min-width: 720px\) \{([\s\S]*?)\n\}\n\n@media \(max-width: 719px\)/)?.[1];
    expect(desktopBoundary).toBeTruthy();
    expect(desktopBoundary).toMatch(/\.lx-first-use-loading-note--mobile \{[\s\S]*?display: none;/);
    expect(desktopBoundary).toMatch(/\.lx-first-use-loading \.lx-first-use-skeletons \{[\s\S]*?gap: 32px;[\s\S]*?margin-top: 32px;/);
    expect(desktopBoundary).toContain(".lx-first-use-loading .lx-first-use-skeletons span:nth-child(5)");
    expect(desktopBoundary).toMatch(/\.lx-first-use-loading-note--desktop \{[\s\S]*?min-height: 74px;[\s\S]*?margin-top: 66px;/);
    expect(desktopBoundary).toMatch(/\.lx-first-use-message--recoverable \{[\s\S]*?justify-content: flex-start;[\s\S]*?padding-top: 35px;/);
    expect(desktopBoundary).toMatch(/\.lx-first-use-message--recoverable > \.lx-first-use-button--primary \{[\s\S]*?margin-top: 84px;/);
    expect(desktopBoundary).toMatch(/\.lx-first-use-message--recoverable > \.lx-first-use-button--secondary \{[\s\S]*?margin-top: 14px;/);

    const compactBoundary = css.match(/@media \(max-width: 719px\) \{([\s\S]*?)\n\}\n\n@media \(max-width: 390px\)/)?.[1];
    expect(compactBoundary).toBeTruthy();
    expect(compactBoundary).toMatch(/\.lx-first-use-loading-note--desktop,[\s\S]*?\.lx-first-use-skeletons \.lx-first-use-skeleton-desktop \{[\s\S]*?display: none;/);
    expect(compactBoundary).toMatch(/\.lx-first-use-state-mobile-only \{[\s\S]*?display: block;/);
    expect(compactBoundary).toMatch(/\.lx-first-use-loading-note--mobile \{[\s\S]*?display: grid;/);
  });

  it("keeps First Use Light foreground tokens WCAG AA against every surface they own", () => {
    const tokens = rootLightVariables(readSource("app", "first-use.css"));
    const threshold = 4.5;

    expect(contrastRatio(tokens.primary, tokens["primary-text"])).toBeGreaterThanOrEqual(threshold);
    expect(contrastRatio(tokens.primary, tokens.bg)).toBeGreaterThanOrEqual(threshold);
    expect(contrastRatio(tokens.primary, tokens.surface)).toBeGreaterThanOrEqual(threshold);
    expect(contrastRatio(tokens.primary, tokens.selected)).toBeGreaterThanOrEqual(threshold);
    expect(contrastRatio(tokens.success, tokens.bg)).toBeGreaterThanOrEqual(threshold);
    expect(contrastRatio(tokens.success, tokens.surface)).toBeGreaterThanOrEqual(threshold);
    expect(contrastRatio(tokens.success, tokens.mint)).toBeGreaterThanOrEqual(threshold);
  });
});
