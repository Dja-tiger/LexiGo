#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).with_name("issue61_apply.py")
text = path.read_text(encoding="utf-8")

navigation_old = "    '  { view: \"phrases\", label: \"Фразы\", shortLabel: \"Фразы\", path: \"/phrases\" },\\n',"
navigation_new = "    '  { view: \"phrases\", label: \"Фразы\", shortLabel: \"Фразы\" },\\n',"
if text.count(navigation_old) != 1:
    raise RuntimeError(f"expected one outdated navigation marker, found {text.count(navigation_old)}")
text = text.replace(navigation_old, navigation_new, 1)

lesson_old = '''replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'navigate({ view: "lesson", source: resolvedSource });\\n',
    'navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });\\n',
)
# The all-items branch has the same navigation statement.
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '      navigate({ view: "lesson", source: resolvedSource });\\n',
    '      navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });\\n',
)
'''
lesson_new = '''lesson_navigation = read("frontend/components/lexigo-premium-app.tsx")
lesson_navigation_old = 'navigate({ view: "lesson", source: resolvedSource });\\n'
lesson_navigation_new = 'navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });\\n'
if lesson_navigation.count(lesson_navigation_old) != 2:
    raise RuntimeError(f"frontend/components/lexigo-premium-app.tsx: expected two lesson navigation statements, found {lesson_navigation.count(lesson_navigation_old)}")
write("frontend/components/lexigo-premium-app.tsx", lesson_navigation.replace(lesson_navigation_old, lesson_navigation_new, 2))
'''
if text.count(lesson_old) != 1:
    raise RuntimeError(f"expected one lesson navigation patch block, found {text.count(lesson_old)}")
text = text.replace(lesson_old, lesson_new, 1)

source_selector_old = '''replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'onClick={() => setSource(option.value)} onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, setSource)}',
    'onClick={() => selectLessonSource(option.value)} onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, selectLessonSource)}',
)
'''
source_selector_new = '''replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '                    onClick={() => setSource(option.value)}\\n                    onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, setSource)}\\n',
    '                    onClick={() => selectLessonSource(option.value)}\\n                    onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, selectLessonSource)}\\n',
)
'''
if text.count(source_selector_old) != 1:
    raise RuntimeError(f"expected one source selector patch block, found {text.count(source_selector_old)}")
text = text.replace(source_selector_old, source_selector_new, 1)

home_plural_old = 'title: `${dueNow} ${plural(dueNow, ["элемент готов", "элемента готовы", "элементов готовы"])} к повторению`,'
home_plural_new = 'title: `${dueNow} ${russianPlural(dueNow, "элемент готов", "элемента готовы", "элементов готовы")} к повторению`,'
if text.count(home_plural_old) != 1:
    raise RuntimeError(f"expected one Home pluralization call, found {text.count(home_plural_old)}")
text = text.replace(home_plural_old, home_plural_new, 1)

anchor = '''# Primary navigation exposes four user intentions. Phrases remain a canonical
# catalog route and are reached from the Dictionary catalog switch.
'''
shared_plural_patch = '''# Reuse one Russian pluralization implementation across lesson composition and Home.
replace_once(
    "frontend/lib/lesson-composition.ts",
    "function plural(value: number, one: string, few: string, many: string): string {",
    "export function russianPlural(value: number, one: string, few: string, many: string): string {",
)
lesson_composition = read("frontend/lib/lesson-composition.ts")
if lesson_composition.count("plural(") != 3:
    raise RuntimeError(f"frontend/lib/lesson-composition.ts: expected three internal plural calls, found {lesson_composition.count('plural(')}")
write("frontend/lib/lesson-composition.ts", lesson_composition.replace("plural(", "russianPlural(", 3))
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    "  lessonPriorityDescription,\\n  type LessonComposition,\\n",
    "  lessonPriorityDescription,\\n  russianPlural,\\n  type LessonComposition,\\n",
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    "  const overallPercent = progress && catalogMetadata && catalogMetadata.totals.items > 0\\n    ? Math.round(((progress.masteredWords + progress.masteredPhrases) / catalogMetadata.totals.items) * 100)\\n    : 0;\\n",
    "",
)

'''
if text.count(anchor) != 1:
    raise RuntimeError(f"expected one primary navigation anchor, found {text.count(anchor)}")
text = text.replace(anchor, shared_plural_patch + anchor, 1)

path.write_text(text, encoding="utf-8")
