#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).with_name("issue114_apply.py")
content = path.read_text(encoding="utf-8")

anchor = '''def sub_once(path: str, pattern: str, replacement: str) -> None:\n'''
helpers = '''def replace_last(path: str, old: str, new: str) -> None:\n    content = read(path)\n    count = content.count(old)\n    if count < 1:\n        raise RuntimeError(f"{path}: expected at least one literal match, found {count}")\n    head, separator, tail = content.rpartition(old)\n    if not separator:\n        raise RuntimeError(f"{path}: unable to replace final literal match")\n    write(path, head + new + tail)\n\n\ndef replace_exact_count(path: str, old: str, new: str, expected: int) -> None:\n    content = read(path)\n    count = content.count(old)\n    if count != expected:\n        raise RuntimeError(f"{path}: expected {expected} literal matches, found {count}")\n    write(path, content.replace(old, new))\n\n\n'''
if anchor not in content:
    raise RuntimeError("Unable to locate helper insertion point")
content = content.replace(anchor, helpers + anchor, 1)

lesson_call = '''replace_once(\n    APP,\n    \'\'\'  useEffect(() => {\\n    if (!session || navigation.view !== "learn" || studyMode === "all") return;\'\'\','''
if lesson_call not in content:
    raise RuntimeError("Unable to locate ambiguous lesson preview replacement")
content = content.replace(lesson_call, lesson_call.replace("replace_once(", "replace_last(", 1), 1)

cleanup_call = '''replace_once(\n    APP,\n    \'\'\'      setPhraseCatalog([]);\\n      setPhraseCatalogPageInfo(paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);\'\'\',\n    \'\'\'      setPhraseCatalog([]);\\n      setRemotePhraseDetail(null);\\n      setPhraseDetailStatus({ slug: "", status: idleResourceStatus() });\\n      setPhraseCatalogPageInfo(paginateCatalogEntries(DEFAULT_PHRASE_CATALOG, 1).info);\'\'\',\n)'''
if cleanup_call not in content:
    raise RuntimeError("Unable to locate phrase cleanup replacement")
cleanup_replacement = cleanup_call.replace("replace_once(", "replace_exact_count(", 1)
cleanup_replacement = cleanup_replacement.rsplit("\n)", 1)[0] + "\n    2,\n)"
content = content.replace(cleanup_call, cleanup_replacement, 1)

path.write_text(content, encoding="utf-8")
