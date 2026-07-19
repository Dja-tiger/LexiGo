# Dictionary catalog

The LexiGo dictionary is a user-specific, paginated catalog of words and technical terms.

## URL state

The `library` view stores the selected section, topic, learning status, search query, sort order, page and optional item detail in the URL. Browser history therefore restores the exact result set and scroll position.

## API

`GET /api/v1/words` accepts the existing pagination filters plus `status=new|learning|review|mastered`. Search covers lemma, translation, topic and configured aliases. `GET /api/v1/words/{wordID}` returns the authenticated user's full item card.

## Rendering and lessons

The frontend mounts at most 48 result cards. Opening a detail creates a shareable URL. Starting a lesson from the dictionary sends only the currently visible page, preserving the 60-item server limit and avoiding an unbounded catalog payload.

The catalog is loaded only while the Dictionary view is active; home, progress and lesson screens do not start background dictionary requests.
