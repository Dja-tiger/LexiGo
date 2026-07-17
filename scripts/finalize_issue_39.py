from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:100]!r}")
    target.write_text(source.replace(old, new), encoding="utf-8")


repository_path = "backend/internal/learning/lesson_repository.go"
repository = Path(repository_path)
source = repository.read_text(encoding="utf-8")

if "if !validLessonState(lesson.Status, lesson.CurrentIndex, lesson.Items)" not in source:
    replace_once(
        repository_path,
        '''\tif lesson.Status == "active" {
\t\tif lesson.CurrentIndex < 0 || lesson.CurrentIndex >= len(lesson.Items) || lesson.Items[lesson.CurrentIndex].Rating != nil {
\t\t\treturn LessonSession{}, ErrInvalidLessonState
\t\t}
\t}
\tif lesson.Status == "completed" && lesson.CurrentIndex != len(lesson.Items) {
\t\treturn LessonSession{}, ErrInvalidLessonState
\t}
''',
        '''\tif !validLessonState(lesson.Status, lesson.CurrentIndex, lesson.Items) {
\t\treturn LessonSession{}, ErrInvalidLessonState
\t}
''',
    )

source = repository.read_text(encoding="utf-8")
if "discardResult, err := tx.Exec" not in source:
    replace_once(
        repository_path,
        '''\tif _, err := tx.Exec(ctx, `
\t\tupdate lesson_sessions
\t\tset status = 'discarded', version = version + 1, updated_at = now()
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active' and version = $3
\t`, lessonID, userID, expectedVersion); err != nil {
\t\treturn fmt.Errorf("discard lesson: %w", err)
\t}
''',
        '''\tdiscardResult, err := tx.Exec(ctx, `
\t\tupdate lesson_sessions
\t\tset status = 'discarded', version = version + 1, updated_at = now()
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active' and version = $3
\t`, lessonID, userID, expectedVersion)
\tif err != nil {
\t\treturn fmt.Errorf("discard lesson: %w", err)
\t}
\tif discardResult.RowsAffected() != 1 {
\t\treturn ErrLessonVersionConflict
\t}
''',
    )

state_file = Path("backend/internal/learning/lesson_state.go")
if not state_file.exists():
    state_file.write_text('''package learning

func validLessonState(status string, currentIndex int, items []LessonItem) bool {
\tswitch status {
\tcase "active":
\t\tif len(items) == 0 || currentIndex < 0 || currentIndex >= len(items) {
\t\t\treturn false
\t\t}
\t\tfor index, item := range items {
\t\t\tif index < currentIndex {
\t\t\t\tif item.Rating == nil {
\t\t\t\t\treturn false
\t\t\t\t}
\t\t\t\tcontinue
\t\t\t}
\t\t\tif item.Rating != nil {
\t\t\t\treturn false
\t\t\t}
\t\t}
\t\treturn true
\tcase "completed":
\t\tif currentIndex != len(items) {
\t\t\treturn false
\t\t}
\t\tfor _, item := range items {
\t\t\tif item.Rating == nil {
\t\t\t\treturn false
\t\t\t}
\t\t}
\t\treturn true
\tcase "discarded":
\t\treturn currentIndex >= 0 && currentIndex <= len(items)
\tdefault:
\t\treturn false
\t}
}
''', encoding="utf-8")

state_test = Path("backend/internal/learning/lesson_state_test.go")
if not state_test.exists():
    state_test.write_text('''package learning

import "testing"

func TestValidLessonState(t *testing.T) {
\trating := RatingKnown
\ttests := []struct {
\t\tname         string
\t\tstatus       string
\t\tcurrentIndex int
\t\titems        []LessonItem
\t\twant         bool
\t}{
\t\t{name: "new active lesson", status: "active", currentIndex: 0, items: []LessonItem{{}, {}}, want: true},
\t\t{name: "resumed active lesson", status: "active", currentIndex: 1, items: []LessonItem{{Rating: &rating}, {}}, want: true},
\t\t{name: "negative index", status: "active", currentIndex: -1, items: []LessonItem{{}}, want: false},
\t\t{name: "index outside items", status: "active", currentIndex: 2, items: []LessonItem{{}, {}}, want: false},
\t\t{name: "empty active lesson", status: "active", currentIndex: 0, items: nil, want: false},
\t\t{name: "current item already rated", status: "active", currentIndex: 0, items: []LessonItem{{Rating: &rating}}, want: false},
\t\t{name: "gap before current item", status: "active", currentIndex: 1, items: []LessonItem{{}, {}}, want: false},
\t\t{name: "future item already rated", status: "active", currentIndex: 1, items: []LessonItem{{Rating: &rating}, {}, {Rating: &rating}}, want: false},
\t\t{name: "completed lesson", status: "completed", currentIndex: 2, items: []LessonItem{{Rating: &rating}, {Rating: &rating}}, want: true},
\t\t{name: "completed lesson with missing rating", status: "completed", currentIndex: 2, items: []LessonItem{{Rating: &rating}, {}}, want: false},
\t\t{name: "completed lesson with wrong index", status: "completed", currentIndex: 1, items: []LessonItem{{Rating: &rating}, {Rating: &rating}}, want: false},
\t}

\tfor _, test := range tests {
\t\tt.Run(test.name, func(t *testing.T) {
\t\t\tif got := validLessonState(test.status, test.currentIndex, test.items); got != test.want {
\t\t\t\tt.Fatalf("validLessonState() = %v, want %v", got, test.want)
\t\t\t}
\t\t})
\t}
}
''', encoding="utf-8")

print("Issue 39 final invariants applied")
