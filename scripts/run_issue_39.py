from pathlib import Path
import re
import runpy


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:80]!r}")
    target.write_text(source.replace(old, new), encoding="utf-8")


codemod = Path("scripts/apply_issue_39.py")
source = codemod.read_text(encoding="utf-8")
obsolete = '''if 'new APIError(' in source:
    raise RuntimeError("unexpected direct APIError construction remains")
'''
if source.count(obsolete) != 1:
    raise RuntimeError(f"APIError invariant anchor count={source.count(obsolete)}")
codemod.write_text(source.replace(obsolete, ""), encoding="utf-8")
runpy.run_path(str(codemod), run_name="__main__")

premium = "frontend/components/lexigo-premium-app.tsx"
replace_once(
    premium,
    '    if (!session || currentItem.wordId === undefined) {',
    '    if (!session || !activeLesson || currentItem.wordId === undefined) {',
)
replace_once(premium, '          lessonVersion: activeLesson?.version,', '          lessonVersion: activeLesson.version,')

e2e = "frontend/e2e/lesson-flow.spec.ts"
replace_once(
    e2e,
    'import { expect, test, type BrowserContext, type Page } from "@playwright/test";',
    'import { expect, test, type Page } from "@playwright/test";',
)
replace_once(
    e2e,
    '''  await second.reload();
  await expect(second.getByText("Слово 2 из 2")).toBeVisible();''',
    '''  await second.reload();
  await second.getByRole("button", { name: "Продолжить урок", exact: true }).click();
  await expect(second.getByText("Слово 2 из 2")).toBeVisible();''',
)

repository = Path("backend/internal/learning/lesson_repository.go")
source = repository.read_text(encoding="utf-8")
old = '''\tif err := rows.Err(); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("iterate lesson items: %w", err)
\t}

\tif lesson.Status == "active" {'''
new = '''\tif err := rows.Err(); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("iterate lesson items: %w", err)
\t}
\trows.Close()

\tif lesson.Status == "active" {'''
if source.count(old) != 1:
    raise RuntimeError(f"lesson rows close anchor count={source.count(old)}")
repository.write_text(source.replace(old, new), encoding="utf-8")

openapi = Path("api/openapi.yaml")
api = openapi.read_text(encoding="utf-8")
api = api.replace('          enum: [15, 30, 60, all]', '          enum: ["15", "30", "60", all]')
pattern = r'''    LessonItem:\n      allOf:\n        - \$ref: "#/components/schemas/UserWord"\n        - type: object\n          required: \[position\]\n          properties:\n            position: \{ type: integer, minimum: 0 \}\n            rating:\n              type: \[string, "null"\]\n              enum: \[again, almost, known, null\]\n            reviewedAt:\n              type: \[string, "null"\]\n              format: date-time\n'''
replacement = '''    LessonItem:
      type: object
      required: [position, id, kind, lemma, translation, phonetic, partOfSpeech, topic, examples, note, status]
      properties:
        position: { type: integer, minimum: 0 }
        id: { type: integer, format: int64 }
        kind: { type: string, enum: [word, phrase] }
        slug: { type: string }
        lemma: { type: string }
        translation: { type: string }
        phonetic: { type: string }
        partOfSpeech: { type: string }
        topic: { type: string }
        examples:
          type: array
          items: { type: string }
        note: { type: string }
        status: { type: string, enum: [new, learning, review, mastered] }
        rating:
          type: [string, "null"]
          enum: [again, almost, known, null]
        reviewedAt:
          type: [string, "null"]
          format: date-time
'''
api, count = re.subn(pattern, replacement, api, count=1)
if count != 1:
    raise RuntimeError(f"OpenAPI LessonItem replacement count={count}")
openapi.write_text(api, encoding="utf-8")

print("Issue 39 deterministic runner completed")
