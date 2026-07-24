#!/usr/bin/env python3
"""Migrate legacy lesson assertions to the canonical Issue #193 presentation."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSON_FLOW = ROOT / "frontend" / "e2e" / "lesson-flow.spec.ts"
ACTIVE_SPEC = ROOT / "frontend" / "e2e" / "active-lesson-figma.spec.ts"


def replace(source: str, old: str, new: str, expected: int, label: str) -> str:
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: expected {expected} matches, found {count}")
    return source.replace(old, new)


def main() -> None:
    source = LESSON_FLOW.read_text(encoding="utf-8")
    source = replace(
        source,
        '  await expect(first.getByText("Слово 1 из 2")).toBeVisible();\n'
        '  await expect(second.getByText("Слово 1 из 2")).toBeVisible();',
        '  await expect(first.getByRole("progressbar", { name: "Прогресс урока" })).toHaveAttribute("aria-valuetext", "1 из 2 элементов");\n'
        '  await expect(second.getByRole("progressbar", { name: "Прогресс урока" })).toHaveAttribute("aria-valuetext", "1 из 2 элементов");',
        1,
        "initial server position",
    )
    source = replace(
        source,
        '  await expect(second.getByText("Слово 2 из 2")).toBeVisible();',
        '  await expect(second.getByRole("progressbar", { name: "Прогресс урока" })).toHaveAttribute("aria-valuetext", "2 из 2 элементов");',
        2,
        "resynchronized server position",
    )
    source = replace(
        source,
        '  await expect(second.getByRole("button", { name: /absolute: уже оценено/ })).toHaveCount(0);\n'
        '  await expect(second.getByLabel("absolute: уже оценено")).toBeVisible();',
        '  await expect(second.getByRole("heading", { name: "build" })).toBeVisible();\n'
        '  await expect(second.getByText("absolute: уже оценено")).toHaveCount(0);',
        1,
        "removed related-items sidebar",
    )
    source = replace(
        source,
        '  await expect(page.getByText("ПЕРЕВЕДИТЕ СЛОВО")).toBeVisible();',
        '  await expect(page.getByText("ВВЕДИТЕ ОТВЕТ", { exact: true })).toBeVisible();',
        2,
        "canonical Recall eyebrow",
    )
    source = replace(
        source,
        '  await expect(page.getByText("Техническая фраза", { exact: true })).toBeVisible();',
        '  await expect(page.getByRole("heading", { name: "roll ____" })).toBeVisible();',
        1,
        "canonical phrase prompt",
    )
    LESSON_FLOW.write_text(source, encoding="utf-8")

    active = ACTIVE_SPEC.read_text(encoding="utf-8")
    active = replace(
        active,
        '      document.body.style.zoom = "2";',
        '      document.body.style.setProperty("zoom", "2");',
        1,
        "typed CSS zoom",
    )
    ACTIVE_SPEC.write_text(active, encoding="utf-8")


if __name__ == "__main__":
    main()
