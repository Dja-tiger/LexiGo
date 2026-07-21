#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).with_name("issue61_apply.py")
text = path.read_text(encoding="utf-8")
old = "    '  { view: \"phrases\", label: \"Фразы\", shortLabel: \"Фразы\", path: \"/phrases\" },\\n',"
new = "    '  { view: \"phrases\", label: \"Фразы\", shortLabel: \"Фразы\" },\\n',"
if text.count(old) != 1:
    raise RuntimeError(f"expected one outdated navigation marker, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
