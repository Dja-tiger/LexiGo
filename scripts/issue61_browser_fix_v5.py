from __future__ import annotations

from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]


def replace_required(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    content = file_path.read_text(encoding="utf-8")
    if old not in content:
        raise RuntimeError(f"{path}: marker not found: {old!r}")
    file_path.write_text(content.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    runpy.run_path(str(ROOT / "scripts/issue61_browser_fix_v4.py"), run_name="__main__")

    replace_required(
        "frontend/e2e/dictionary-pwa.spec.ts",
        'await expect(page.getByText("Показано 1–48 из 60", { exact: false })).toBeVisible();',
        'await expect(page.getByRole("status", { name: "Показано 1–48 из 60" }).first()).toBeVisible();',
    )

    replace_required(
        "frontend/e2e/app-router-routes.spec.ts",
        '      const heading = page.getByRole("heading", { level: 1, name: entry.heading });',
        '      const heading = entry.path === "/"\n        ? page.locator(".lx-home-next-action h1")\n        : page.getByRole("heading", { level: 1, name: entry.heading });',
    )

    print("[issue61-v5] dynamic Home and duplicated pagination assertions stabilized", flush=True)


if __name__ == "__main__":
    main()
