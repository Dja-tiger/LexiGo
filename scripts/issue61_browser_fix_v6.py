from __future__ import annotations

from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    runpy.run_path(str(ROOT / "scripts/issue61_browser_fix_v5.py"), run_name="__main__")
    path = ROOT / "frontend/e2e/dictionary-pwa.spec.ts"
    content = path.read_text(encoding="utf-8")
    old = 'page.getByRole("status", { name: "Показано 1–48 из 60" }).first()'
    new = 'page.getByText("Показано 1–48 из 60", { exact: true }).first()'
    if old not in content:
        raise RuntimeError(f"dictionary pagination role locator not found: {old!r}")
    path.write_text(content.replace(old, new, 1), encoding="utf-8")
    print("[issue61-v6] duplicated pagination text locator aligned", flush=True)


if __name__ == "__main__":
    main()
