from __future__ import annotations

from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]


def replace_all_required(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    content = file_path.read_text(encoding="utf-8")
    count = content.count(old)
    if count == 0:
        raise RuntimeError(f"{path}: marker not found: {old!r}")
    file_path.write_text(content.replace(old, new), encoding="utf-8")
    print(f"[issue61-v4] {path}: replaced {count} occurrence(s)", flush=True)


def replace_required(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    content = file_path.read_text(encoding="utf-8")
    if old not in content:
        raise RuntimeError(f"{path}: marker not found: {old!r}")
    file_path.write_text(content.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    runpy.run_path(str(ROOT / "scripts/issue61_browser_fix_v3.py"), run_name="__main__")

    broad_home_heading = "/готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок/"
    precise_home_heading = "/готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/"
    changed = 0
    for file_path in (ROOT / "frontend/e2e").glob("*.spec.ts"):
        content = file_path.read_text(encoding="utf-8")
        count = content.count(broad_home_heading)
        if count:
            file_path.write_text(content.replace(broad_home_heading, precise_home_heading), encoding="utf-8")
            changed += count
    if changed == 0:
        raise RuntimeError("broad Home heading matcher was not found")
    print(f"[issue61-v4] precise Home heading matchers: {changed}", flush=True)

    replace_all_required(
        "frontend/e2e/accessibility-keyboard.spec.ts",
        'page.getByRole("heading", { name: target.heading })',
        'page.getByRole("heading", { level: 1, name: target.heading })',
    )
    replace_all_required(
        "frontend/e2e/app-router-routes.spec.ts",
        'page.getByRole("heading", { name: entry.heading })',
        'page.getByRole("heading", { level: 1, name: entry.heading })',
    )

    replace_required(
        "frontend/e2e/information-architecture.spec.ts",
        'page.getByRole("region", { name: "Персональный прогресс доступен после входа" })',
        'page.getByRole("status", { name: "Персональный прогресс доступен после входа" })',
    )
    replace_required(
        "frontend/e2e/information-architecture.spec.ts",
        'await expect(page).toHaveURL(/\\/word\\/101/);',
        'await expect(page).toHaveURL(/\\/words\\/101/);',
    )
    replace_required(
        "frontend/e2e/dictionary-pwa.spec.ts",
        'page.getByText("Показаны 1–48 из 60", { exact: false })',
        'page.getByText("Показано 1–48 из 60", { exact: false })',
    )

    stale = (
        broad_home_heading,
        'getByRole("region", { name: "Персональный прогресс доступен после входа" })',
        'toHaveURL(/\\/word\\/101/)',
        'getByText("Показаны 1–48 из 60"',
    )
    for file_path in (ROOT / "frontend/e2e").glob("*.spec.ts"):
        content = file_path.read_text(encoding="utf-8")
        for marker in stale:
            if marker in content:
                raise RuntimeError(f"{file_path.relative_to(ROOT)}: stale assertion: {marker}")

    print("[issue61-v4] canonical browser assertions aligned", flush=True)


if __name__ == "__main__":
    main()
