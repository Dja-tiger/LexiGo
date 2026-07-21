#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
E2E = ROOT / "frontend" / "e2e"


def replace_exact(path: Path, old: str, new: str, expected: int = 1) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{path.relative_to(ROOT)}: expected {expected} occurrence(s), found {count}: {old!r}")
    path.write_text(text.replace(old, new, expected), encoding="utf-8")


# Update release-gate expectations after the intentionally changed screen headings.
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

# Phrases are a canonical route inside the Dictionary product area. Preserve
# phrase scroll/detail state when the user leaves and returns through Dictionary.
app = ROOT / "frontend" / "components" / "lexigo-premium-app.tsx"
replace_exact(
    app,
    '    const destination = navigationTabs.destination("phrases");\n',
    '    const destination = navigationTabs.destination("library");\n',
)

route_navigation = ROOT / "frontend" / "components" / "route-primary-navigation.tsx"
replace_exact(
    route_navigation,
    'type RouteIconName = "home" | "learn" | "phrases" | "library" | "progress";\n',
    'type RouteIconName = "home" | "learn" | "library" | "progress";\n',
)
replace_exact(
    route_navigation,
    '  "phrases",\n',
    "",
)
replace_exact(
    route_navigation,
    '  if (name === "phrases") return <svg {...common}><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>;\n',
    "",
)
replace_exact(
    route_navigation,
    '        const active = activeView === entry.view;\n',
    '        const active = activeView === entry.view\n          || (entry.view === "library" && activeView === "phrases");\n',
)

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
print("- grouped /phrases under the Dictionary primary navigation state")
