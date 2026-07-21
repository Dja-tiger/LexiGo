#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
E2E = ROOT / "frontend" / "e2e"

replacements = {
    '"Готовые формулировки для работы"': '"Находите готовые формулировки"',
    '"Настройте урок под текущую задачу"': '"Соберите один сфокусированный урок"',
    '/Продолжайте учиться/': '/готовы к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок/',
}

counts = {old: 0 for old in replacements}
for path in sorted(E2E.glob("*.spec.ts")):
    text = path.read_text(encoding="utf-8")
    updated = text
    for old, new in replacements.items():
        count = updated.count(old)
        counts[old] += count
        if count:
            updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding="utf-8")

for old, count in counts.items():
    if count == 0:
        raise RuntimeError(f"expected at least one browser contract occurrence for {old!r}")

adaptive = E2E / "adaptive-navigation.spec.ts"
text = adaptive.read_text(encoding="utf-8")
old_switch = '  await page.getByRole("button", { name: "Рабочие фразы" }).click();\n'
if text.count(old_switch) != 1:
    raise RuntimeError(f"expected one obsolete phrase switch after Progress, found {text.count(old_switch)}")
text = text.replace(old_switch, '  await clickNavigationView(page, "library");\n', 1)
old_primary = '  await clickNavigationView(page, "phrases");\n'
if text.count(old_primary) != 1:
    raise RuntimeError(f"expected one obsolete primary phrases navigation, found {text.count(old_primary)}")
text = text.replace(old_primary, '  await clickNavigationView(page, "library");\n', 1)
adaptive.write_text(text, encoding="utf-8")

print("Updated browser contracts:")
for old, count in counts.items():
    print(f"- {old}: {count}")
