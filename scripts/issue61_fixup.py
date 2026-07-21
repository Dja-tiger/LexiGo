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

path.write_text(text, encoding="utf-8")
