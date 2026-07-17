from pathlib import Path

app = Path("frontend/components/lexigo-premium-app.tsx")
source = app.read_text()
old = '''        setLessonStarted(true);
        setLessonComplete(lessonItems.length === 0);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setServerSkippedItems(0);
'''
new = '''        setLessonStarted(true);
        setLessonComplete(lessonItems.length === 0);
        setServerLessonCompleted(false);
        setServerNextIndex(null);
        setServerSkippedItems(0);
'''
if source.count(old) != 1:
    raise SystemExit(f"frontend indentation target count={source.count(old)}")
app.write_text(source.replace(old, new))

css = Path("frontend/app/premium-ui.css")
source = css.read_text()
old = '''  .lx-lesson-navigation { display: grid; grid-template-columns: 1fr 1fr; }
  .lx-lesson-navigation .wide { grid-column: 1 / -1; grid-row: 1; }
'''
new = '''  .lx-lesson-navigation { grid-template-columns: 1fr; }
  .lx-lesson-navigation .wide { grid-column: 1; grid-row: 1; }
'''
if source.count(old) != 1:
    raise SystemExit(f"mobile lesson navigation target count={source.count(old)}")
css.write_text(source.replace(old, new))
