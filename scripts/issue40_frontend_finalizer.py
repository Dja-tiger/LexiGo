from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one occurrence, found {count}")
    return source.replace(old, new, 1)


app_path = Path("frontend/components/lexigo-premium-app.tsx")
app = app_path.read_text(encoding="utf-8")
app = replace_once(
    app,
    "  function renderLearn() {\n",
    '''  function renderLearn() {
    const matchingLessonPreview = lessonPreview
      && lessonPreview.source === source
      && lessonPreview.studyMode === studyMode
      && lessonPreview.lessonSize === String(lessonSize)
      ? lessonPreview
      : null;
''',
    "renderLearn marker",
)
app = replace_once(
    app,
    '''              ) : previewingLesson ? (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>Рассчитываем…</strong><small>Проверяем due, new и доступность обоих типов.</small></div>
              ) : lessonPreview ? (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>{lessonCompositionDescription(lessonPreview.composition)}</strong><small>{lessonPriorityDescription(lessonPreview.composition)}</small>{lessonCompositionFallbackMessage(lessonPreview.composition) ? <em>{lessonCompositionFallbackMessage(lessonPreview.composition)}</em> : null}</div>
              ) : (
                <div className="lx-lesson-preview"><span>Состав урока</span><strong>Будет рассчитан сервером</strong><small>Локальный random selection не используется.</small></div>
''',
    '''              ) : previewingLesson || !matchingLessonPreview ? (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>Рассчитываем…</strong><small>Проверяем due, new и доступность обоих типов.</small></div>
              ) : (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>{lessonCompositionDescription(matchingLessonPreview.composition)}</strong><small>{lessonPriorityDescription(matchingLessonPreview.composition)}</small>{lessonCompositionFallbackMessage(matchingLessonPreview.composition) ? <em>{lessonCompositionFallbackMessage(matchingLessonPreview.composition)}</em> : null}</div>
''',
    "preview render block",
)
app = replace_once(
    app,
    '''<button className="lx-button primary large" type="button" disabled={busy || previewingLesson || Boolean(session && studyMode !== "all" && lessonPreview?.composition.total === 0)} onClick={() => startLesson()}>''',
    '''<button className="lx-button primary large" type="button" disabled={busy || Boolean(session && studyMode !== "all" && (!matchingLessonPreview || matchingLessonPreview.composition.total === 0))} onClick={() => startLesson()}>''',
    "lesson start disabled expression",
)
app_path.write_text(app, encoding="utf-8")

spec_path = Path("frontend/e2e/lesson-flow.spec.ts")
spec = spec_path.read_text(encoding="utf-8")
test_name = 'test("home review CTA requests a server-composed mixed due queue"'
if test_name not in spec:
    spec += '''

test("home review CTA requests a server-composed mixed due queue", async ({ page }) => {
  const mixedItems = [
    lessonItems(1)[0],
    { ...PHRASE, position: 1 },
  ];
  const api = await installLessonAPI(page, 2, 0, mixedItems);
  await page.goto("/");
  await page.getByRole("button", { name: "Начать повторение", exact: true }).click();
  await expect(page).toHaveURL(/view=lesson/);
  expect(api.lessonRequests()[0]).toMatchObject({ source: "mixed", studyMode: "recall", lessonSize: "30" });
  expect(api.lessonRequests()[0]).not.toHaveProperty("wordIds");
  await expect(page.getByText("ПЕРЕВЕДИТЕ СЛОВО")).toBeVisible();
});
'''
spec_path.write_text(spec, encoding="utf-8")
