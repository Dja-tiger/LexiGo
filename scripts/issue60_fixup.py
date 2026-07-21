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

ambiguous_calls = [
    '''replace_once(\n    "frontend/e2e/lesson-flow.spec.ts",\n    \'\'\'  const reviewRequests: RequestRecord[] = [];\\n  await installBaseRoutes(page);\'\'\',\n    \'\'\'  const reviewRequests: RequestRecord[] = [];\\n  const suggestionRequests: RequestRecord[] = [];\\n  await installBaseRoutes(page);\'\'\',\n)''',
    '''replace_once(\n    "frontend/e2e/lesson-flow.spec.ts",\n    \'\'\'    if (path.endsWith("/review") && request.method() === "POST") {\\n      const payload = request.postDataJSON() as RequestRecord;\'\'\',\n    \'\'\'    if (path.endsWith("/answer-suggestions") && request.method() === "POST") {\\n      const payload = request.postDataJSON() as RequestRecord;\\n      suggestionRequests.push(payload);\\n      return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({\\n        id: suggestionRequests.length, wordId: selectedItems[Math.max(0, reviewedItems - 1)].id, reviewEventId: payload.reviewEventId,\\n        exerciseKind: payload.exerciseKind, submittedAnswer: payload.submittedAnswer, status: "pending", createdAt: "2026-07-17T00:00:00Z",\\n      }) });\\n    }\\n    if (path.endsWith("/review") && request.method() === "POST") {\\n      const payload = request.postDataJSON() as RequestRecord;\'\'\',\n)''',
]

for old_call in ambiguous_calls:
    if old_call not in content:
        raise RuntimeError("Unable to locate ambiguous Playwright replacement")
    content = content.replace(old_call, old_call.replace("replace_once(", "replace_first(", 1), 1)

path.write_text(content, encoding="utf-8")
