from pathlib import Path

path = Path("frontend/components/lexigo-premium-app.tsx")
content = path.read_text()

replacements = [
    (
        '''  navigationURL,
  parseNavigation,
  PRIMARY_NAVIGATION,''',
        '''  navigationURL,
  PRIMARY_NAVIGATION,''',
    ),
    (
        '''    setReviewing(true);
    setError("");
    let reviewSaved = false;
    try {''',
        '''    setReviewing(true);
    setError("");
    try {''',
    ),
    (
        '''      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      reviewSaved = true;
      setServerLessonCompleted''',
        '''      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      if (restoreFocusAfterSave) {
        window.requestAnimationFrame(() => lessonAdvanceRef.current?.focus({ preventScroll: true }));
      }
      setServerLessonCompleted''',
    ),
    (
        '''    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
      if (reviewSaved && restoreFocusAfterSave) {
        window.requestAnimationFrame(() => lessonAdvanceRef.current?.focus({ preventScroll: true }));
      }
    }''',
        '''    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
    }''',
    ),
    (
        '''          className="lx-route-announcement"
          role="status"''',
        '''          className="lx-route-announcement"
          data-announcement-id={routeAnnouncement.id}
          role="status"''',
    ),
]

for old, new in replacements:
    if old not in content:
        raise SystemExit(f"expected refinement block not found: {old[:100]}")
    content = content.replace(old, new, 1)

path.write_text(content)
