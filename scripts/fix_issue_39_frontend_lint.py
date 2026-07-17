from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:120]!r}")
    target.write_text(source.replace(old, new), encoding="utf-8")


path = "frontend/components/lexigo-premium-app.tsx"
replace_once(path, 'import type { FormEvent } from "react";', 'import type { FormEvent, MouseEvent } from "react";')
replace_once(
    path,
    '    const timer = window.setTimeout(() => setCardStartedAt(Date.now()), 0);',
    '    const timer = window.setTimeout(() => setCardStartedAt(window.performance.now()), 0);',
)
replace_once(
    path,
    '  async function rateCurrent(rating: ReviewRating) {',
    '''  function handleRatingClick(event: MouseEvent<HTMLButtonElement>) {
    const rating = event.currentTarget.dataset.rating;
    if (rating === "again" || rating === "almost" || rating === "known") {
      void rateCurrent(rating, event.timeStamp);
    }
  }

  async function rateCurrent(rating: ReviewRating, submittedAt: number) {''',
)
replace_once(
    path,
    '          responseMs: Math.max(0, Date.now() - cardStartedAt),',
    '          responseMs: Math.max(0, Math.round(submittedAt - cardStartedAt)),',
)
replace_once(path, 'onClick={() => rateCurrent("again")}', 'data-rating="again" onClick={handleRatingClick}')
replace_once(path, 'onClick={() => rateCurrent("almost")}', 'data-rating="almost" onClick={handleRatingClick}')
replace_once(path, 'onClick={() => rateCurrent("known")}', 'data-rating="known" onClick={handleRatingClick}')
replace_once(
    path,
    '  function renderPhrases() {',
    '''  function startSelectedPhraseLesson() {
    if (!selectedPhrase) return;
    void startLesson(session, { source: "phrases", size: 15, mode: "study", items: [selectedPhrase] });
  }

  function renderPhrases() {''',
)
replace_once(
    path,
    'onClick={() => startLesson(session, { source: "phrases", size: 15, mode: "study", items: [selectedPhrase] })}>Изучить эту фразу',
    'onClick={startSelectedPhraseLesson}>Изучить эту фразу',
)
print("Issue 39 frontend lint fixes applied")
