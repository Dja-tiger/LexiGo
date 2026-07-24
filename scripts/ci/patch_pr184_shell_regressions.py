#!/usr/bin/env python3
"""Apply deterministic shell/Home fixes discovered by hosted browser CI."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STYLE = ROOT / "frontend/app/adaptive-knowledge-coach-home.css"
STYLE_TEST = ROOT / "frontend/app/adaptive-knowledge-coach-home.test.ts"
ROUTE_FOCUS = ROOT / "frontend/e2e/route-focus-management.spec.ts"
ACCOUNT_DATA = ROOT / "frontend/e2e/account-data.spec.ts"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old in source:
        return source.replace(old, new, 1)
    if new in source:
        return source
    raise SystemExit(f"{label} did not match expected source")


def patch_style() -> None:
    source = STYLE.read_text(encoding="utf-8")
    source = replace_once(
        source,
        '''.lx-routed-app {
  min-height: 100vh;
  color: var(--ak-text);
  background: var(--ak-bg);
  --lx-bg: var(--ak-bg);
  --lx-bg-soft: var(--ak-bg-muted);
  --lx-panel: var(--ak-surface);
  --lx-panel-strong: var(--ak-surface);
  --lx-border: var(--ak-border);
  --lx-border-bright: var(--ak-brand);
  --lx-text: var(--ak-text);
  --lx-muted: var(--ak-text-muted);
  --lx-subtle: var(--ak-text-subtle);
  --lx-green: var(--ak-brand);
  --lx-blue: var(--ak-primary);
  --lx-danger: var(--ak-coral);
  --lx-orange: var(--ak-gold);
  --lx-shadow: var(--ak-shadow-md);
}

.lx-routed-app .lx-app {
  color: var(--ak-text);
}
''',
        '''.lx-routed-app {
  min-height: 100vh;
  background: var(--ak-bg);
}

/*
 * The production slice owns Home and route chrome only. Existing Learn,
 * Dictionary, Progress and Profile surfaces retain their established tokens
 * until their dedicated Figma slices are implemented.
 */
.lx-routed-app .lx-main-content[aria-label="Главная"] {
  color: var(--ak-text);
  --lx-bg: var(--ak-bg);
  --lx-bg-soft: var(--ak-bg-muted);
  --lx-panel: var(--ak-surface);
  --lx-panel-strong: var(--ak-surface);
  --lx-border: var(--ak-border);
  --lx-border-bright: var(--ak-brand);
  --lx-text: var(--ak-text);
  --lx-muted: var(--ak-text-muted);
  --lx-subtle: var(--ak-text-subtle);
  --lx-green: var(--ak-brand);
  --lx-blue: var(--ak-primary);
  --lx-danger: var(--ak-coral);
  --lx-orange: var(--ak-gold);
  --lx-shadow: var(--ak-shadow-md);
}
''',
        "semantic token ownership",
    )

    account_anchor = '''  .lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-view {
    padding-top: 24px;
  }
}
'''
    account_rules = '''  .lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-view {
    padding-top: 24px;
  }

  /* Account panels are mounted beside the product app, not inside .lx-app. */
  .lx-account-security {
    box-sizing: border-box;
    width: min(1140px, calc(100vw - var(--ak-shell-rail-width) - 80px));
    margin-right: 40px;
    margin-left: max(
      calc(var(--ak-shell-rail-width) + 40px),
      calc((100vw + var(--ak-shell-rail-width) - 1140px) / 2)
    );
  }
}
'''
    source = replace_once(source, account_anchor, account_rules, "desktop account panel offset")

    source = source.replace(
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) {",
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) {',
    )
    source = source.replace(
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-header {",
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-header {',
    )
    source = source.replace(
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-header-tools {",
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-header-tools {',
    )
    source = source.replace(
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-streak,\n  .lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-icon-button {",
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-streak,\n  .lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-icon-button {',
    )

    STYLE.write_text(source, encoding="utf-8")


def patch_style_test() -> None:
    source = STYLE_TEST.read_text(encoding="utf-8")
    source = replace_once(
        source,
        '''    expect(styleSource).not.toContain("history.pushState");
    expect(styleSource).not.toContain("data-route-client-island");
''',
        '''    expect(styleSource).not.toContain("history.pushState");
    expect(styleSource).toContain(':not([data-route-client-island="dictionary"])');
''',
        "dictionary route boundary contract",
    )
    anchor = '''  it("keeps Home focused on a single next-best action", () => {
'''
    addition = '''  it("does not recolor unfinished routes and keeps external account panels clear of the rail", () => {
    const routedAppBlock = styleSource.match(/\.lx-routed-app\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(routedAppBlock).not.toContain("--lx-panel:");
    expect(styleSource).toContain('.lx-main-content[aria-label="Главная"] {');
    expect(styleSource).toContain("calc(100vw - var(--ak-shell-rail-width) - 80px)");
    expect(styleSource).toContain("box-sizing: border-box;");
  });

'''
    if addition not in source:
        if source.count(anchor) != 1:
            raise SystemExit("style test insertion anchor was not found exactly once")
        source = source.replace(anchor, addition + anchor, 1)
    STYLE_TEST.write_text(source, encoding="utf-8")


def patch_route_focus() -> None:
    source = ROUTE_FOCUS.read_text(encoding="utf-8")
    source = replace_once(
        source,
        '''async function clickPrimaryNavigation(page: Page, view: "learn" | "library" | "progress") {
  const links = page.locator(`.lx-route-nav [data-navigation-view="${view}"]`);
  const count = await links.count();
  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    if (await link.isVisible()) {
      await link.click();
      return;
    }
  }
  throw new Error(`No visible route link for ${view}`);
}
''',
        '''async function visiblePrimaryNavigation(page: Page, view: "learn" | "library" | "progress") {
  const links = page.locator(`.lx-route-nav [data-navigation-view="${view}"]`);
  const count = await links.count();
  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    if (await link.isVisible()) return link;
  }
  throw new Error(`No visible route link for ${view}`);
}

async function clickPrimaryNavigation(page: Page, view: "learn" | "library" | "progress") {
  await (await visiblePrimaryNavigation(page, view)).click();
}
''',
        "visible primary navigation helper",
    )
    source = replace_once(
        source,
        '''  const progressNavigation = page.locator('.lx-route-nav--header [data-navigation-view="progress"]');
  await expect(progressNavigation).toBeVisible();
''',
        '''  const progressNavigation = await visiblePrimaryNavigation(page, "progress");
  await expect(progressNavigation).toBeVisible();
''',
        "reduced motion navigation selector",
    )
    ROUTE_FOCUS.write_text(source, encoding="utf-8")


def patch_account_data() -> None:
    source = ACCOUNT_DATA.read_text(encoding="utf-8")
    anchor = '''  const panel = page.getByRole("region", { name: "Данные и удаление аккаунта" });
  await expect(panel).toBeVisible();
  const exportCard = panel.getByRole("article").filter({ hasText: "Скачать JSON" });
'''
    replacement = '''  const panel = page.getByRole("region", { name: "Данные и удаление аккаунта" });
  await expect(panel).toBeVisible();

  const rail = page.locator('[data-route-navigation="rail"]');
  const [railBox, panelBox] = await Promise.all([rail.boundingBox(), panel.boundingBox()]);
  expect(railBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(railBox!.x + railBox!.width + 24);
  const horizontalOverflow = await page.evaluate(() => (
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
  ));
  expect(horizontalOverflow).toBeLessThanOrEqual(1);

  const exportCard = panel.getByRole("article").filter({ hasText: "Скачать JSON" });
'''
    source = replace_once(source, anchor, replacement, "account panel geometry regression")
    ACCOUNT_DATA.write_text(source, encoding="utf-8")


def main() -> None:
    patch_style()
    patch_style_test()
    patch_route_focus()
    patch_account_data()
    print("Applied PR 184 shell regression fixes")


if __name__ == "__main__":
    main()
