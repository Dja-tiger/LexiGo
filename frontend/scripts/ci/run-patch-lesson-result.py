#!/usr/bin/env python3
from pathlib import Path
import shutil

SCRIPT = Path(__file__).with_name("patch-lesson-result.py")
source = SCRIPT.read_text()

path_replacements = {
    'APP = ROOT / "frontend/components/lexigo-premium-app.tsx"': 'APP = ROOT / "components/lexigo-premium-app.tsx"',
    'LAYOUT = ROOT / "frontend/app/layout.tsx"': 'LAYOUT = ROOT / "app/layout.tsx"',
    'PACKAGE = ROOT / "frontend/package.json"': 'PACKAGE = ROOT / "package.json"',
    'NEXT_SPEC = ROOT / "frontend/e2e/next-lesson-progression.spec.ts"': 'NEXT_SPEC = ROOT / "e2e/next-lesson-progression.spec.ts"',
}
for old, new in path_replacements.items():
    if old not in source:
        raise RuntimeError(f"codemod path marker missing: {old}")
    source = source.replace(old, new, 1)

helper_marker = "\ndef replace_regex(text: str, pattern: str, replacement: str, label: str) -> str:\n"
helper = '''
def replace_first(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"{label}: expected at least one match")
    return text.replace(old, new, 1)

'''
if "def replace_first(" not in source:
    if helper_marker not in source:
        raise RuntimeError("replace_regex helper marker missing")
    source = source.replace(helper_marker, helper + helper_marker, 1)

lines = source.splitlines()
label_index = next(index for index, line in enumerate(lines) if '"progress resource ref"' in line)
call_index = max(index for index in range(label_index) if lines[index] == "app = replace_once(")
lines[call_index] = "app = replace_first("
source = "\n".join(lines) + "\n"

namespace = {
    "__file__": str(SCRIPT),
    "__name__": "__main__",
}
exec(compile(source, str(SCRIPT), "exec"), namespace)

artifact_dir = Path("e2e/visual-regression.spec.ts-snapshots")
artifact_dir.mkdir(parents=True, exist_ok=True)
outputs = {
    Path("components/lexigo-premium-app.tsx"): "lesson-result-patched-lexigo-premium-app.tsx",
    Path("app/layout.tsx"): "lesson-result-patched-layout.tsx",
    Path("package.json"): "lesson-result-patched-package.json",
    Path("e2e/next-lesson-progression.spec.ts"): "lesson-result-patched-next-lesson-progression.spec.ts",
}
for source_path, artifact_name in outputs.items():
    shutil.copy2(source_path, artifact_dir / artifact_name)

(artifact_dir / "lesson-result-patch-success.txt").write_text("Lesson Result codemod completed in the CI workspace.\n")
raise SystemExit(42)
