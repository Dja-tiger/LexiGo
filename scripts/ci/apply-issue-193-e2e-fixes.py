#!/usr/bin/env python3
"""Apply confirmed Issue #193 accessibility, selector and stale-contract fixes."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, source: str) -> None:
    (ROOT / path).write_text(source, encoding="utf-8")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


def replace_all(source: str, old: str, new: str, minimum: int, label: str) -> str:
    count = source.count(old)
    if count < minimum:
        raise RuntimeError(f"{label}: expected at least {minimum} matches, found {count}")
    return source.replace(old, new)


def patch_css() -> None:
    path = "frontend/app/active-lesson.css"
    source = read(path)
    source = replace_once(
        source,
        "  --lx-active-primary-soft: color-mix(in srgb, var(--ak-color-primary) 14%, var(--ak-color-surface));\n",
        "  --lx-active-primary-soft: color-mix(in srgb, var(--ak-color-primary) 14%, var(--ak-color-surface));\n"
        "  /* 5.29:1 on the light surface; see active-lesson.test.ts. */\n"
        "  --lx-active-retained-foreground: #187a59;\n",
        "light retained foreground token",
    )
    source = replace_all(
        source,
        "color: var(--ak-color-retained);",
        "color: var(--lx-active-retained-foreground);",
        5,
        "retained foreground usage",
    )
    source = replace_once(
        source,
        "@media (prefers-reduced-motion: reduce) {\n",
        "@media (prefers-color-scheme: dark) {\n"
        "  .lx-active-lesson {\n"
        "    /* 8.08:1 on the dark surface. */\n"
        "    --lx-active-retained-foreground: #52d6ad;\n"
        "  }\n"
        "}\n\n"
        "@media (prefers-reduced-motion: reduce) {\n",
        "dark retained foreground token",
    )
    write(path, source)


def patch_contract_test() -> None:
    path = "frontend/app/active-lesson.test.ts"
    source = read(path)
    source = replace_once(
        source,
        'const premiumAppSource = readFileSync(path.join(componentDirectory, "lexigo-premium-app.tsx"), "utf8");\n',
        'const premiumAppSource = readFileSync(path.join(componentDirectory, "lexigo-premium-app.tsx"), "utf8");\n\n'
        'function channelToLinear(channel: number): number {\n'
        '  const value = channel / 255;\n'
        '  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;\n'
        '}\n\n'
        'function relativeLuminance(hex: string): number {\n'
        '  const value = hex.replace("#", "");\n'
        '  const [red, green, blue] = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));\n'
        '  return (0.2126 * channelToLinear(red)) + (0.7152 * channelToLinear(green)) + (0.0722 * channelToLinear(blue));\n'
        '}\n\n'
        'function contrastRatio(foreground: string, background: string): number {\n'
        '  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((left, right) => right - left);\n'
        '  return (values[0] + 0.05) / (values[1] + 0.05);\n'
        '}\n',
        "WCAG contrast helpers",
    )
    source = replace_once(
        source,
        '    const cssWithoutComments = styleSource.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "");\n'
        '    expect(cssWithoutComments).not.toMatch(/#[0-9a-f]{3,8}\\b/i);',
        '    const cssWithoutComments = styleSource.replace(/\\/\\*[\\s\\S]*?\\*\\//g, "");\n'
        '    const approvedForegroundTokens = Array.from(\n'
        '      cssWithoutComments.matchAll(/--lx-active-retained-foreground:\\s*(#[0-9a-f]{6})/gi),\n'
        '      (match) => match[1].toLowerCase(),\n'
        '    );\n'
        '    expect(approvedForegroundTokens).toEqual(["#187a59", "#52d6ad"]);\n'
        '    expect(contrastRatio("#187a59", "#ffffff")).toBeGreaterThanOrEqual(4.5);\n'
        '    expect(contrastRatio("#52d6ad", "#142d26")).toBeGreaterThanOrEqual(4.5);\n'
        '    const cssWithoutApprovedForegrounds = cssWithoutComments.replace(\n'
        '      /--lx-active-retained-foreground:\\s*#[0-9a-f]{6};/gi,\n'
        '      "",\n'
        '    );\n'
        '    expect(cssWithoutApprovedForegrounds).not.toMatch(/#[0-9a-f]{3,8}\\b/i);',
        "approved foreground contract",
    )
    write(path, source)


def patch_active_spec() -> None:
    path = "frontend/e2e/active-lesson-figma.spec.ts"
    source = read(path)
    source = replace_all(
        source,
        '{ name: "Знал" }',
        '{ name: "Знал", exact: true }',
        5,
        "exact Known selectors",
    )
    source = replace_once(
        source,
        'await page.getByRole("button", { name: "Сохранить и выйти" }).click();',
        'await page.getByRole("dialog", { name: "Закрыть урок?" })\n'
        '      .getByRole("button", { name: "Сохранить и выйти", exact: true })\n'
        '      .click();',
        "scoped safe-exit confirmation",
    )
    source = replace_once(
        source,
        '    await expect(page).toHaveURL(/\\/lesson\\/active$/);',
        '    await expect.poll(() => new URL(page.url()).pathname).toBe("/lesson/active");',
        "browser Back pathname assertion",
    )
    source = replace_once(
        source,
        '    expect(styles.transitionDuration).toBe("0.00001s");',
        '    expect(Number.parseFloat(styles.transitionDuration)).toBeLessThanOrEqual(0.00001);',
        "computed duration normalization",
    )
    write(path, source)


def patch_visual_spec() -> None:
    path = "frontend/e2e/visual-regression.spec.ts"
    source = read(path)
    source = replace_all(
        source,
        '{ name: "Знал" }',
        '{ name: "Знал", exact: true }',
        1,
        "visual Known selector",
    )
    write(path, source)


def patch_review_outbox() -> None:
    path = "frontend/e2e/review-outbox-auth-lifecycle.spec.ts"
    source = read(path)
    source = replace_once(
        source,
        '  await expect(page.getByText("Слово 1 из 1")).toBeVisible();',
        '  await expect(page.getByRole("progressbar", { name: "Прогресс урока" }))\n'
        '    .toHaveAttribute("aria-valuetext", "1 из 1 элементов");',
        "outbox active position assertion",
    )
    write(path, source)


def patch_adaptive_navigation() -> None:
    path = "frontend/e2e/adaptive-navigation.spec.ts"
    source = read(path)
    source = replace_once(
        source,
        '  await expect(page.getByText("Урок в процессе", { exact: true })).toBeVisible();',
        '  await expect(page.getByRole("region", { name: "Воспроизведение" })).toBeVisible();',
        "focused lesson identity",
    )
    source = replace_once(
        source,
        '  await expect(page.locator(".lx-queue-notice")).toContainText("Сохранить и выйти");\n'
        '  await expect(page.getByRole("heading", { name: "viewport" })).toBeVisible();\n\n'
        '  await page.getByRole("button", { name: "Сохранить и выйти", exact: true }).click();',
        '  await expect(page.locator(".lx-queue-notice")).toContainText("Сохранить и выйти");\n'
        '  const exitDialog = page.getByRole("dialog", { name: "Закрыть урок?" });\n'
        '  await expect(exitDialog).toBeVisible();\n'
        '  await expect(page.getByRole("heading", { name: "viewport" })).toBeVisible();\n\n'
        '  await exitDialog.getByRole("button", { name: "Сохранить и выйти", exact: true }).click();',
        "browser-history exit dialog",
    )
    write(path, source)


def patch_accessibility_keyboard() -> None:
    path = "frontend/e2e/accessibility-keyboard.spec.ts"
    source = read(path)
    source = replace_once(
        source,
        '  await expect(page.getByRole("button", { name: "Не знал" })).toBeVisible();\n'
        '  await expect(page.getByRole("tab", { name: "Карточка" })).toBeVisible();',
        '  await expect(page.getByRole("progressbar", { name: "Прогресс урока" }))\n'
        '    .toHaveAttribute("aria-valuetext", "2 из 2 элементов");\n'
        '  await expect(page.getByRole("heading", { name: "keyboard access" })).toBeVisible();',
        "keyboard second-card assertion",
    )
    old_test = re.compile(
        r'test\("lesson tabs remain reachable and expose an unclipped inner focus ring", async \(\{ page \}, testInfo\) => \{\n'
        r'.*?\n\}\);\n',
        re.DOTALL,
    )
    new_test = '''test("focused Study controls remain reachable and expose an unclipped focus ring", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Focused lesson geometry is deterministic in the desktop Chromium release profile.");
  await page.goto("/learn");
  const studyMode = page.getByRole("radio", { name: /Простое изучение слов/ });
  await studyMode.press("Space");
  await expect(studyMode).toHaveAttribute("aria-checked", "true");

  const startLesson = page.getByRole("button", { name: "Начать урок", exact: true });
  await expect(startLesson).toBeEnabled();
  await startLesson.press("Enter");
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);

  const speech = page.getByRole("button", { name: /Произнести: keyboard/ });
  await speech.focus();
  await expectVisibleFocusRing(speech);
  await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeVisible();
  await expectKeyboardAxeBaseline(page);
});
'''
    source, count = old_test.subn(new_test, source, count=1)
    if count != 1:
        raise RuntimeError(f"focused Study keyboard test: expected one block, found {count}")
    write(path, source)


def patch_ui_ownership() -> None:
    path = "frontend/e2e/ui-ownership.spec.ts"
    source = read(path)
    old_test = re.compile(
        r'test\("lesson tabs and speech stay declarative through repeated state transitions", async \(\{ page \}\) => \{\n'
        r'.*?\n\}\);\n',
        re.DOTALL,
    )
    new_test = '''test("focused lesson and speech stay declarative through repeated state transitions", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await revealLessonComposerControls(page);

  await page.getByRole("radio", { name: /Простое изучение слов/ }).click();
  await page.getByRole("button", { name: "Начать урок" }).click();
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
  await expect(page.locator(".lx-active-lesson")).toHaveCount(1);

  const speech = page.locator('[data-speech-text="absolute"] > button');
  await expect(speech).toHaveAttribute("aria-label", "Произнести: absolute");
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await speech.click();
    await expect(speech).toHaveClass(/speaking/);
    await expect(speech).toHaveAttribute("aria-label", "Остановить произношение: absolute");
    await speech.click();
    await expect(speech).not.toHaveClass(/speaking/);
  }

  const closeLesson = page.viewportSize()!.width < 768
    ? page.getByRole("button", { name: "Закрыть", exact: true })
    : page.getByRole("button", { name: "Закрыть урок" });
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await closeLesson.click();
    const dialog = page.getByRole("dialog", { name: "Закрыть урок?" });
    await expect(dialog).toHaveCount(1);
    await dialog.getByRole("button", { name: "Продолжить урок", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }

  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await expect(page.locator(".lx-active-lesson")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "build" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});
'''
    source, count = old_test.subn(new_test, source, count=1)
    if count != 1:
        raise RuntimeError(f"focused lesson ownership test: expected one block, found {count}")
    write(path, source)


def patch_agents() -> None:
    path = ".agents/AGENTS.md"
    source = read(path)
    exact_rule = (
        '- **Используйте унифицированные элементы.** Если после раскрытия настроек кнопка на мобильном и на десктопе называется одинаково («Начать урок»), используйте единый селектор (`page.getByRole("button", { name: "Начать урок", exact: true })`), а не пытайтесь угадать текст для разных девайсов.\n'
    )
    source = replace_once(
        source,
        exact_rule,
        exact_rule
        + '- **Пересекающиеся accessible names требуют `exact: true`.** Кнопки «Знал»/«Не знал» и «Сохранить и выйти»/«Назад — сохранить и выйти из урока» намеренно содержат общие фрагменты. Для таких controls всегда используйте точное имя или scope через ближайший `dialog`, `group` или `region`; strict-mode violation нельзя скрывать `.first()`.\n',
        "exact accessible-name rule",
    )
    additions = '''

### 2026-07-24 — Contrast semantic token недостаточен для мелкого текста на surface

- **Симптом:** blocking axe audit обнаружил `color-contrast` 3.42:1 у `Сохранено` и eyebrow активного урока.
- **Первопричина:** базовый retained token предназначен для статуса/акцента, но не обеспечивает WCAG AA 4.5:1 для текста 12–14 px на белой surface.
- **Профилактика:** сохранять базовый semantic status token для fills/borders, а для мелкого foreground-текста вводить локальный token только после расчёта Light/Dark contrast; не отключать axe rule и не увеличивать шрифт как замену проверке.
- **Обязательная проверка:** unit-расчёт contrast ratio >= 4.5 для обеих appearance surfaces и blocking axe audit route/dialog.
- **Область действия:** status labels, eyebrow, compact captions и feedback text на semantic surfaces.

### 2026-07-24 — Computed CSS duration сериализуется по-разному

- **Симптом:** reduced-motion E2E ожидал строку `0.00001s`, Chromium/WebKit вернули эквивалентную запись `1e-05s`.
- **Первопричина:** тест сравнивал формат сериализации computed style, а не числовую длительность transition.
- **Профилактика:** числовые CSS values из `getComputedStyle` нормализовать через `Number.parseFloat` и проверять семантический предел; не менять runtime value под формат одного browser engine.
- **Обязательная проверка:** reduced-motion test проходит в Chromium и WebKit при duration <= 0.00001s.
- **Область действия:** motion, duration, opacity, transform и другие computed CSS assertions.

### 2026-07-24 — Redesign удалил legacy controls, но E2E продолжил искать старую структуру

- **Симптом:** lesson, accessibility и ownership suites искали `Слово N`, `Урок в процессе` и tabs `Карточка/Пример/Контекст`, которых нет в canonical Active Lesson.
- **Первопричина:** тесты проверяли внутреннюю legacy-разметку и копирайт вместо устойчивых contract semantics новой production slice.
- **Профилактика:** при замене canonical screen одновременно мигрировать все потребляющие suites на roles/state contracts: progressbar `aria-valuetext`, route region, prompt heading, focusable controls и dialog; удалённый UX не сохранять только ради старого теста.
- **Обязательная проверка:** repository search не находит удалённые Active Lesson selectors, а lesson/a11y/ui ownership suites проходят во всех configured projects.
- **Область действия:** route redesign, Playwright selectors, accessibility journeys и React ownership tests.

### 2026-07-24 — Первичный visual baseline отсутствует

- **Симптом:** visual regression сохранил `*-actual.png` и завершился ошибкой `A snapshot doesn't exist` для новых Active Lesson states.
- **Первопричина:** production state новый и ещё не имел утверждённого Linux snapshot; отдельный Dark scenario до baseline дополнительно блокировался нестрогим selector.
- **Профилактика:** сначала устранить runtime/test defects и вручную сверить actual artifact с Figma, затем генерировать baseline только в project Linux container; добавлять в commit только явно перечисленные новые screenshots.
- **Обязательная проверка:** повторный `npm run test:e2e:visual` сравнивает существующие Linux baselines без `--update-snapshots` и проходит.
- **Область действия:** visual regression, new canonical frames, Linux rendering environment.
'''
    if "### 2026-07-24 — Contrast semantic token" in source:
        raise RuntimeError("AGENTS prevention entries already exist")
    source += additions
    write(path, source)


def main() -> None:
    patch_css()
    patch_contract_test()
    patch_active_spec()
    patch_visual_spec()
    patch_review_outbox()
    patch_adaptive_navigation()
    patch_accessibility_keyboard()
    patch_ui_ownership()
    patch_agents()


if __name__ == "__main__":
    main()
