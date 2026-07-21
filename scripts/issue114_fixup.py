#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).with_name("issue114_apply.py")
content = path.read_text(encoding="utf-8")

anchor = '''def sub_once(path: str, pattern: str, replacement: str) -> None:\n'''
helper = '''def replace_last(path: str, old: str, new: str) -> None:\n    content = read(path)\n    count = content.count(old)\n    if count < 1:\n        raise RuntimeError(f"{path}: expected at least one literal match, found {count}")\n    head, separator, tail = content.rpartition(old)\n    if not separator:\n        raise RuntimeError(f"{path}: unable to replace final literal match")\n    write(path, head + new + tail)\n\n\n'''
if helper not in content:
    if anchor not in content:
        raise RuntimeError("Unable to locate helper insertion point")
    content = content.replace(anchor, helper + anchor, 1)

old_call = '''replace_once(\n    APP,\n    \'\'\'  useEffect(() => {\\n    if (!session || navigation.view !== "learn" || studyMode === "all") return;\'\'\','''
new_call = old_call.replace("replace_once(", "replace_last(", 1)
if old_call not in content:
    raise RuntimeError("Unable to locate ambiguous lesson preview replacement")
content = content.replace(old_call, new_call, 1)
path.write_text(content, encoding="utf-8")
