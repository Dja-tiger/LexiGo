from __future__ import annotations

from pathlib import Path
import runpy
import textwrap

ROOT = Path(__file__).resolve().parents[1]
BASE = runpy.run_path(str(ROOT / "scripts/issue61_browser_fix.py"))


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_required(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise RuntimeError(f"{path}: marker not found: {old[:180]!r}")
    write(path, content.replace(old, new, 1))


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
        '  await visibleNavigation(page).getByRole("link", { name: "Фразы", exact: true }).click();',
        '  await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();',
    )


def align_headings() -> None:
    replacements = {
        '"Каталог слов и терминов"': '"Находите и изучайте материал в контексте"',
        '"Готовые формулировки для работы"': '"Находите готовые формулировки"',
        '"Настройте урок под текущую задачу"': '"Соберите один сфокусированный урок"',
    }
    for file_path in (ROOT / "frontend/e2e").glob("*.spec.ts"):
        content = file_path.read_text(encoding="utf-8")
        updated = content
        for old, new in replacements.items():
            updated = updated.replace(old, new)
        if updated != content:
            file_path.write_text(updated, encoding="utf-8")


def align_dictionary_pwa() -> None:
    path = "frontend/e2e/dictionary-pwa.spec.ts"
    replace_required(
        path,
        'test("dictionary filters, alias search, deep link and bounded lesson are URL-driven", async ({ context, page }, testInfo) => {',
        'test("dictionary filters, alias search, deep link and composer delegation are URL-driven", async ({ context, page }, testInfo) => {',
    )
    replace_required(
        path,
        '''  await page.getByRole("button", { name: "Изучить текущую страницу" }).click();
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
  expect(api.lessonRequests).toHaveLength(1);
  expect(api.lessonRequests[0].wordIds).toHaveLength(48);
  expect(new Set(api.lessonRequests[0].wordIds as number[]).size).toBe(48);''',
        '''  await page.getByRole("button", { name: "Настроить урок по текущей выборке" }).click();
  await expect(page).toHaveURL(/\/learn(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Смешанная практика/ })).toHaveAttribute("aria-checked", "true");
  expect(api.lessonRequests).toHaveLength(0);''',
    )


def verify_extended_contracts() -> None:
    stale = (
        '"Каталог слов и терминов"',
        '"Готовые формулировки для работы"',
        '"Настройте урок под текущую задачу"',
        'name: "Изучить текущую страницу"',
        'name: "Фразы", exact: true',
        'headerRoute(page, "phrases")',
        'clickPrimaryNavigation(page, "phrases")',
        'visibleRouteLink(page, "phrases")',
        '.lx-progress-stats button',
    )
    for file_path in (ROOT / "frontend/e2e").glob("*.spec.ts"):
        content = file_path.read_text(encoding="utf-8")
        for marker in stale:
            if marker in content:
                raise RuntimeError(f"{file_path.relative_to(ROOT)}: stale IA contract: {marker}")


def main() -> None:
    steps = (
        ("accessibility keyboard", BASE["align_accessibility_keyboard"]),
        ("route focus", BASE["align_route_focus"]),
        ("App Router", BASE["align_app_router"]),
        ("UI ownership", align_ui_ownership),
        ("account hydration", BASE["align_account_hydration"]),
        ("dictionary PWA", align_dictionary_pwa),
        ("headings", align_headings),
        ("base stale verification", BASE["verify_no_stale_contracts"]),
        ("extended stale verification", verify_extended_contracts),
    )
    for label, step in steps:
        print(f"[issue61-v2] {label}", flush=True)
        step()
    print("[issue61-v2] browser contract migration complete", flush=True)


if __name__ == "__main__":
    main()
