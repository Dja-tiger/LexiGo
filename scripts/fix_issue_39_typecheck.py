from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
source = path.read_text(encoding="utf-8")
old = '''type LessonReviewResponse = {
  lessonId: string;
  lessonCurrentIndex: number;
  lessonVersion: number;
  lessonCompleted: boolean;
'''
new = '''type LessonReviewResponse = {
  lessonId: string;
  lessonCurrentIndex: number;
  lessonVersion: number;
  lastReviewedAt: string;
  lessonCompleted: boolean;
'''
count = source.count(old)
if count != 1:
    raise RuntimeError(f"expected one LessonReviewResponse anchor, found {count}")
path.write_text(source.replace(old, new), encoding="utf-8")
print("Issue 39 LessonReviewResponse contract fixed")
