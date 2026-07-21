from __future__ import annotations

from pathlib import Path
import textwrap

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_required(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise RuntimeError(f"{path}: marker not found: {old[:160]!r}")
    write(path, content.replace(old, new, 1))


def replace_region(path: str, start_marker: str, end_marker: str, replacement: str) -> None:
    content = read(path)
    start = content.find(start_marker)
    if start < 0:
        raise RuntimeError(f"{path}: start marker not found: {start_marker!r}")
    end_start = content.find(end_marker, start)
    if end_start < 0:
        raise RuntimeError(f"{path}: end marker not found: {end_marker!r}")
    end = end_start + len(end_marker)
    write(path, content[:start] + replacement + content[end:])


def align_accessibility_keyboard() -> None:
    replace_required(
        "frontend/e2e/accessibility-keyboard.spec.ts",
        '    headerRoute(page, "phrases"),\n',
        "",
    )


def align_route_focus() -> None:
    replace_region(
        "frontend/e2e/route-focus-management.spec.ts",
        '  await clickPrimaryNavigation(page, "phrases");',
        '  await expectMainFocus(page, "Технические фразы");',
        textwrap.dedent(
            '''
              await clickPrimaryNavigation(page, "library");
              await expect(page).toHaveURL(/\/dictionary$/);
              await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
              await page.getByRole("navigation", { name: "Тип каталога" }).getByRole("button", { name: "Рабочие фразы" }).click();
              await expect(page).toHaveURL(/\/phrases$/);
              await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
              await expectMainFocus(page, "Технические фразы");
            '''
        ).strip(),
    )


def align_app_router() -> None:
    path = "frontend/e2e/app-router-routes.spec.ts"
    replace_required(
        path,
        'function visibleRouteLink(page: Page, view: "home" | "learn" | "phrases" | "library" | "progress") {',
        'function visibleRouteLink(page: Page, view: "home" | "learn" | "library" | "progress") {',
    )
    replace_required(
        path,
        'test("direct primary routes render, remain canonical and expose the active semantic link", async ({ page }) => {',
        'test("direct routes render, remain canonical and expose the owning semantic link", async ({ page }) => {',
    )
    replace_required(
        path,
        '    { path: "/phrases", view: "phrases", heading: "Находите готовые формулировки" },',
        '    { path: "/phrases", view: "library", navigationPath: "/dictionary", heading: "Находите готовые формулировки" },',
    )
    replace_required(
        path,
        '    await expect(link).toHaveAttribute("href", entry.path);',
        '    await expect(link).toHaveAttribute("href", "navigationPath" in entry ? entry.navigationPath : entry.path);',
    )

    content = read(path)
    test_start = content.find('test("semantic route links support a real new tab and browser Back/Forward"')
    block_start = content.find("  await learn.click();", test_start)
    end_marker = '  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();'
    block_end_start = content.find(end_marker, block_start)
    if min(test_start, block_start, block_end_start) < 0:
        raise RuntimeError(f"{path}: semantic route transition block not found")
    block_end = block_end_start + len(end_marker)
    replacement = textwrap.dedent(
        '''
          await learn.click();
          await expect(page).toHaveURL(/\/learn$/);
          await visibleRouteLink(page, "library").click();
          await expect(page).toHaveURL(/\/dictionary$/);
          await page.getByRole("navigation", { name: "Тип каталога" }).getByRole("button", { name: "Рабочие фразы" }).click();
          await expect(page).toHaveURL(/\/phrases$/);
          await page.goBack();
          await expect(page).toHaveURL(/\/dictionary$/);
          await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
          await page.goBack();
          await expect(page).toHaveURL(/\/learn$/);
          await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
          await page.goForward();
          await expect(page).toHaveURL(/\/dictionary$/);
          await page.goForward();
          await expect(page).toHaveURL(/\/phrases$/);
          await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
        '''
    ).strip()
    write(path, content[:block_start] + replacement + content[block_end:])


def align_ui_ownership() -> None:
    path = "frontend/e2e/ui-ownership.spec.ts"
    content = read(path)
    start = content.find('test("home collections and the dictionary catalog remain unique through React navigation"')
    end = content.find('\ntest("phrase sorting is React state', start)
    if min(start, end) < 0:
        raise RuntimeError(f"{path}: legacy Home ownership test block not found")
    replacement = textwrap.dedent(
        '''
        test("home intent cards, dictionary catalog and composer collections remain unique through React navigation", async ({ page }) => {
          const runtimeErrors = watchRuntimeErrors(page);
          await page.goto("/");
          await expect(page.getByRole("heading", { name: /готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок/ })).toBeVisible();

          for (let cycle = 0; cycle < 3; cycle += 1) {
            await expect(page.locator(".lx-home-paths article")).toHaveCount(3);
            await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();
            await expect(page).toHaveURL(/\/dictionary$/);
            await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
            await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
            await expect(page.locator(".lx-dictionary-toolbar")).toHaveCount(1);
            await visibleNavigation(page).getByRole("link", { name: "Главная", exact: true }).click();
            await expect(page).toHaveURL(/\/$/);
            await expect(page.locator(".lx-home-paths article")).toHaveCount(3);
          }

          await page.locator(".lx-home-paths").getByRole("button", { name: "Настроить урок" }).click();
          await expect(page).toHaveURL(/\/learn$/);
          await expect(page.locator('[data-lexigo-collection]')).toHaveCount(4);
          await page.locator('[data-lexigo-collection="travel"]').click();
          await expect(page.locator('[data-lexigo-collection="travel"]')).toHaveAttribute("aria-checked", "true");
          expect(runtimeErrors).toEqual([]);
        });
        '''
    ).strip() + "\n"
    write(path, content[:start] + replacement + content[end:])
    replace_required(
        path,
        '    await visibleNavigation(page).getByRole("link", { name: "Фразы", exact: true }).click();',
        '    await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();',
    )


def align_account_hydration() -> None:
    path = "frontend/e2e/account-hydration.spec.ts"
    replace_required(
        path,
        '  const dueCard = page.locator(".lx-progress-stats button").filter({ hasText: "К повторению" });\n  await expect(dueCard.locator("strong")).toHaveText("7");\n  await expect(dueCard.locator("small")).toHaveText("4 слов · 3 фраз");',
        '  const dueCard = page.locator(".lx-progress-list div").filter({ hasText: "К повторению" });\n  await expect(dueCard.locator("strong")).toHaveText("7");',
    )
    replace_required(
        path,
        '  await visibleNavigation(page).getByRole("link", { name: "Фразы", exact: true }).click();\n  await expect(page).toHaveURL(/\\/phrases$/);',
        '  await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();\n  await page.getByRole("navigation", { name: "Тип каталога" }).getByRole("button", { name: "Рабочие фразы" }).click();\n  await expect(page).toHaveURL(/\\/phrases$/);',
    )
    replace_required(
        path,
        '  await expect(dueCard.locator("strong")).toHaveText("7");\n  await expect(dueCard.locator("small")).toHaveText("4 слов · 3 фраз");\n\n  expect(requests.progressRequests()).toBe(1);',
        '  await expect(dueCard.locator("strong")).toHaveText("7");\n\n  expect(requests.progressRequests()).toBe(1);',
    )


def verify_no_stale_contracts() -> None:
    stale_patterns = (
        'headerRoute(page, "phrases")',
        'clickPrimaryNavigation(page, "phrases")',
        'visibleRouteLink(page, "phrases")',
        'getByRole("link", { name: "Фразы", exact: true })',
        '.lx-progress-stats button',
    )
    for file_path in (ROOT / "frontend/e2e").glob("*.spec.ts"):
        content = file_path.read_text(encoding="utf-8")
        for pattern in stale_patterns:
            if pattern in content:
                raise RuntimeError(f"{file_path.relative_to(ROOT)}: stale IA contract: {pattern}")


def main() -> None:
    steps = (
        ("accessibility keyboard", align_accessibility_keyboard),
        ("route focus", align_route_focus),
        ("App Router", align_app_router),
        ("UI ownership", align_ui_ownership),
        ("account hydration", align_account_hydration),
        ("stale contract verification", verify_no_stale_contracts),
    )
    for label, step in steps:
        print(f"[issue61] {label}", flush=True)
        step()
    print("[issue61] browser contract migration complete", flush=True)


if __name__ == "__main__":
    main()
