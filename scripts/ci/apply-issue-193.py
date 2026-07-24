#!/usr/bin/env python3
"""Apply the focused Issue #193 integration patch.

The large legacy product container remains the owner of API/session/navigation
state. This script performs narrow, assertion-backed source transforms so the
new presentation component can be wired without rewriting unrelated routes.
"""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "frontend" / "components" / "lexigo-premium-app.tsx"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return source.replace(old, new, 1)


def remove_once(source: str, old: str, label: str) -> str:
    return replace_once(source, old, "", label)


def main() -> None:
    source = TARGET.read_text(encoding="utf-8")

    source = replace_once(
        source,
        'import { LessonComposerProgressiveShell } from "./lesson-composer-progressive-shell";\n',
        'import { ActiveLessonPresentation } from "./active-lesson-presentation";\n'
        'import { LessonComposerProgressiveShell } from "./lesson-composer-progressive-shell";\n',
        "active lesson import",
    )

    source = remove_once(source, '  exercisePromptLabel,\n', "exercisePromptLabel import")
    source = remove_once(source, '  normalizeAnswer,\n', "normalizeAnswer import")
    source = remove_once(source, 'type StudyView = "card" | "example" | "context";\n', "StudyView type")

    study_tabs_pattern = re.compile(
        r'const STUDY_TABS: Array<\{ value: StudyView; label: string; icon: IconName \}> = \[\n'
        r'.*?\n\];\n\n',
        re.DOTALL,
    )
    source, count = study_tabs_pattern.subn("", source, count=1)
    if count != 1:
        raise RuntimeError(f"STUDY_TABS: expected one block, found {count}")

    source = remove_once(
        source,
        'const STUDY_TAB_VALUES = STUDY_TABS.map((tab) => tab.value);\n',
        "STUDY_TAB_VALUES",
    )
    source = remove_once(
        source,
        '  const [studyView, setStudyView] = useState<StudyView>("card");\n',
        "studyView state",
    )
    source = remove_once(
        source,
        '  const [showChoices, setShowChoices] = useState(false);\n',
        "showChoices state",
    )

    source = replace_once(
        source,
        '        setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти». ");',
        '        setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти». ");',
        "noop guard",
    ) if '        setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти». ");' in source else source

    history_notice = '        setLessonQueueNotice("Чтобы перейти в другой раздел, нажмите «Сохранить и выйти».");\n'
    history_replacement = (
        history_notice
        + '        window.dispatchEvent(new Event("lexigo:request-lesson-exit"));\n'
    )
    # There are two identical notices: the first belongs to popstate, the second
    # to explicit in-app navigation. Only browser history should open the dialog.
    first_notice = source.find(history_notice)
    if first_notice < 0:
        raise RuntimeError("browser history lesson notice not found")
    source = source[:first_notice] + history_replacement + source[first_notice + len(history_notice):]

    handle_study_pattern = re.compile(
        r'  function handleStudyTabKeyDown\(event: React\.KeyboardEvent<HTMLButtonElement>, view: StudyView\) \{\n'
        r'    selectRovingControl\(event, STUDY_TAB_VALUES, view, setStudyView, "horizontal"\);\n'
        r'  \}\n\n',
    )
    source, count = handle_study_pattern.subn("", source, count=1)
    if count != 1:
        raise RuntimeError(f"handleStudyTabKeyDown: expected one block, found {count}")

    source = remove_once(source, '    setStudyView("card");\n', "reset study view")
    source = remove_once(source, '    setShowChoices(!rated && mode === "choice");\n', "reset choices")
    source = remove_once(source, '    setShowChoices(false);\n', "clear choices")

    header_pattern = re.compile(
        r'    if \(lessonNavigationLocked\) \{\n'
        r'      return \(\n'
        r'        <header className="lx-header lx-header--lesson">.*?'
        r'      \);\n'
        r'    \}\n\n',
        re.DOTALL,
    )
    source, count = header_pattern.subn(
        '    if (lessonNavigationLocked) return null;\n\n',
        source,
        count=1,
    )
    if count != 1:
        raise RuntimeError(f"focused lesson header: expected one block, found {count}")

    render_start = source.index("  function renderLesson() {")
    return_start = source.index(
        '    return (\n      <section className="lx-lesson-page">',
        render_start,
    )
    function_end = source.index("\n  }\n\n  const view =", return_start)

    pre_return = source[render_start:return_start]
    for declaration in (
        '    const remaining = Math.max(0, items.length - ratingValues.length);\n',
        '    const relatedItems = items.filter((item) => item.id !== currentItem.id && Boolean(ratings[item.id])).slice(0, 3);\n',
        '    const phraseCloze = currentItem.kind === "phrase" && currentItem.cloze;\n',
        '    const simpleStudy = studyMode === "study";\n',
    ):
        if declaration not in pre_return:
            raise RuntimeError(f"renderLesson declaration missing: {declaration.strip()}")
        pre_return = pre_return.replace(declaration, "", 1)

    replacement_return = '''    return (
      <ActiveLessonPresentation
        mode={studyMode}
        item={currentItem}
        currentIndex={currentIndex}
        itemCount={items.length}
        progressPercent={normalizeProgressValue(lessonPercent)}
        typedAnswer={typedAnswer}
        selectedAnswer={selectedAnswer}
        expectedAnswer={expectedAnswer}
        answerOptions={answerOptions}
        revealed={revealed}
        localCorrect={literalMatch}
        currentRating={currentRating}
        reviewing={reviewing}
        reviewFeedback={reviewFeedback}
        suggestionStatus={suggestionStatus}
        suggestionError={suggestionError}
        advance={advanceDecision}
        advanceButtonRef={lessonAdvanceRef}
        onTypedAnswerChange={setTypedAnswer}
        onReveal={() => setRevealed(true)}
        onChoice={(answer) => {
          setSelectedAnswer(answer);
          setRevealed(true);
        }}
        onRate={(rating, submittedAt, restoreFocusAfterSave) => {
          void rateCurrent(rating, submittedAt, restoreFocusAfterSave);
        }}
        onAdvance={nextItem}
        onExit={() => saveAndExitLesson()}
        onSubmitSuggestion={() => void submitAnswerSuggestion()}
      />
    );'''

    source = source[:render_start] + pre_return + replacement_return + source[function_end:]
    source = remove_once(
        source,
        '  const ratingValues = Object.values(ratings);\n',
        "ratingValues",
    )

    if "<section className=\"lx-lesson-page\">" in source:
        raise RuntimeError("legacy active lesson markup remains")
    if source.count("<ActiveLessonPresentation") != 1:
        raise RuntimeError("active lesson presentation was not wired exactly once")

    TARGET.write_text(source, encoding="utf-8")


if __name__ == "__main__":
    main()
