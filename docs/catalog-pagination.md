# Catalog pagination and bounded rendering

LexiGo catalog screens use server-side pagination instead of requesting and mounting the complete vocabulary.

## API contract

`GET /api/v1/words` and `GET /api/v1/words/due` accept:

- `kind=word|phrase|all`;
- `source=mixed|noun|verb|adjective|phrases|daily-life|travel|data-engineering|backend`;
- exact `topic`;
- text `query` over lemma, translation and topic;
- `sort=default|az|za`;
- one-based `page` and `limit` from 1 to 100.

The response includes the current `items`, page-local `count`, global `total`, `page`, `pageSize`, `totalPages`, `hasPrevious` and `hasNext`. The repository reads count and rows in one repeatable-read snapshot.

## Frontend behavior

Catalog pages request 48 entries. Changing page replaces the current entries instead of appending them, so the number of mounted cards remains bounded. Search, topic filtering and sorting are sent to the API. Guest phrase browsing applies the same 48-entry boundary to the bundled fallback catalog.

Authenticated phrase pages are requested only when the user enters the phrase catalog; unrelated views do not start a background catalog request. Session restoration clears the bundled fallback before the authenticated page is shown, and both authenticated and guest views keep at most 48 phrase cards mounted. A retry reloads only the failed bounded catalog request and does not restart successful account resources.

The UI announces the visible range, exposes previous/next navigation, and supplies global position and set size to result items. Browser history retains the selected page and restores scroll when returning from a phrase card.

The “Все и сразу” study mode is now a paginated reference view. It does not create a lesson session and never sends the entire catalog as `wordIds`. Normal server lessons are capped at 60 items.

## Regression coverage

- backend integration verifies 125 filtered phrase records across three pages, A–Z/Z–A sorting, search and the 100-record API cap;
- Android Playwright coverage uses four-times CPU throttling with a mocked 1,000-entry catalog, verifies a maximum of 48 mounted records throughout hydration, page navigation, history/scroll restoration, accessible result positions and paginated reference mode.
