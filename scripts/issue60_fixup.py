#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).with_name("issue60_apply.py")
content = path.read_text(encoding="utf-8")

helper_anchor = '''def sub_once(path: str, pattern: str, replacement: str) -> None:\n'''
helper = '''def replace_first(path: str, old: str, new: str) -> None:\n    content = read(path)\n    count = content.count(old)\n    if count < 1:\n        raise RuntimeError(f"{path}: expected at least one literal match, found {count}")\n    write(path, content.replace(old, new, 1))\n\n\n'''
if helper not in content:
    if helper_anchor not in content:
        raise RuntimeError("Unable to locate helper insertion point")
    content = content.replace(helper_anchor, helper + helper_anchor, 1)

old_call = '''replace_once(\n    "frontend/e2e/lesson-flow.spec.ts",\n    \'\'\'  const reviewRequests: RequestRecord[] = [];\\n  await installBaseRoutes(page);\'\'\',\n    \'\'\'  const reviewRequests: RequestRecord[] = [];\\n  const suggestionRequests: RequestRecord[] = [];\\n  await installBaseRoutes(page);\'\'\',\n)'''
new_call = old_call.replace("replace_once(", "replace_first(", 1)
if old_call not in content:
    raise RuntimeError("Unable to locate ambiguous Playwright replacement")
content = content.replace(old_call, new_call, 1)
path.write_text(content, encoding="utf-8")
