# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lesson-flow.spec.ts >> study: persists exposure with the current lesson version
- Location: e2e/lesson-flow.spec.ts:95:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('0 элементов готовы')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('0 элементов готовы')

```

```yaml
- alert
- main:
  - button "L LexiGo":
    - text: L
    - strong: LexiGo
  - navigation "Основная навигация":
    - button "Главная"
    - button "Обучение"
    - button "Фразы"
    - button "Словарь"
    - button "Прогресс"
  - button "Уведомления"
  - button "Открыть профиль": L
  - article:
    - text: ТЕХНИЧЕСКИЙ АНГЛИЙСКИЙ
    - heading "Продолжайте учиться каждый день ✦" [level=1]:
      - text: Продолжайте учиться каждый день
      - emphasis: ✦
    - paragraph: Регулярная практика помогает быстрее понимать документацию, обсуждать архитектуру и увереннее писать рабочие сообщения.
    - button "Начать изучение"
    - button "Начать повторение"
  - article:
    - text: Ваш прогресс Актуальные данные аккаунта
    - button "Подробнее"
    - button "К повторению 0 0 слов · 0 фраз":
      - text: К повторению
      - strong: "0"
      - text: 0 слов · 0 фраз
    - button "Серия дней 0 Рекорд 0":
      - text: Серия дней
      - strong: "0"
      - text: Рекорд 0
    - button "Сохранено за неделю 0 Retained items":
      - text: Сохранено за неделю
      - strong: "0"
      - text: Retained items
    - button "Общий прогресс 0% Освоенные элементы":
      - text: Общий прогресс
      - strong: 0%
      - text: Освоенные элементы
    - text: Цель на сегодня
    - strong: 0 / 30
    - text: 0%
  - text: Режимы обучения
  - heading "Выберите удобный формат" [level=2]
  - button "Простое изучение слов Вы видите слово, перевод, пример использования и примечание одновременно. Начать":
    - strong: Простое изучение слов
    - paragraph: Вы видите слово, перевод, пример использования и примечание одновременно.
    - emphasis: Начать
  - button "Технические фразы Изучайте профессиональные формулировки из реальных рабочих ситуаций. Открыть":
    - strong: Технические фразы
    - paragraph: Изучайте профессиональные формулировки из реальных рабочих ситуаций.
    - emphasis: Открыть
  - button "Смешанная практика Слова и фразы чередуются для более устойчивого запоминания. Начать":
    - strong: Смешанная практика
    - paragraph: Слова и фразы чередуются для более устойчивого запоминания.
    - emphasis: Начать
  - button "Аналитика прогресса Смотрите очередь, retained items, серию и освоенные материалы. Открыть":
    - strong: Аналитика прогресса
    - paragraph: Смотрите очередь, retained items, серию и освоенные материалы.
    - emphasis: Открыть
  - article:
    - text: Пример карточки слова
    - 'button "Произнести: incident"'
    - heading "incident" [level=3]
    - paragraph: /ˈɪnsɪdənt/
    - term: Перевод
    - definition: инцидент, происшествие
    - term: Пример
    - definition: We need to identify the cause of the incident.
    - button "Открыть простое изучение"
  - text: Разделы для изучения
  - heading "Соберите урок по теме" [level=2]
  - button "Все разделы"
  - button "Существительные 383 слов":
    - strong: Существительные
    - text: 383 слов
  - button "Глаголы 179 слов":
    - strong: Глаголы
    - text: 179 слов
  - button "Прилагательные 193 слов":
    - strong: Прилагательные
    - text: 193 слов
  - button "Технические фразы 124 фразы":
    - strong: Технические фразы
    - text: 124 фразы
  - button "A1 Для жизни 55 слов и терминов":
    - text: A1
    - strong: Для жизни
    - text: 55 слов и терминов
  - button "✈ Путешествия 55 слов и терминов":
    - text: ✈
    - strong: Путешествия
    - text: 55 слов и терминов
  - button "DB Data Engineer 55 слов и терминов":
    - text: DB
    - strong: Data Engineer
    - text: 55 слов и терминов
  - button "</> Backend 55 слов и терминов":
    - text: </>
    - strong: Backend
    - text: 55 слов и терминов
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | type LessonMode = "study" | "recall" | "choice";
  4   | type RequestRecord = Record<string, unknown>;
  5   | 
  6   | type MockLesson = {
  7   |   reviewCalls: () => number;
  8   |   lessonRequests: () => RequestRecord[];
  9   |   reviewRequests: () => RequestRecord[];
  10  | };
  11  | 
  12  | const SESSION = {
  13  |   user: { id: "00000000-0000-0000-0000-000000000035", email: "lesson@example.com", displayName: "Lesson Tester", createdAt: "2026-01-01T00:00:00Z" },
  14  |   tokens: { accessToken: "e2e-access-token", tokenType: "Bearer", expiresIn: 900 },
  15  | };
  16  | const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
  17  | const PROGRESS = {
  18  |   dueNow: 0, dueWords: 0, duePhrases: 0, totalWords: 4, totalPhrases: 0, newWords: 4, learningWords: 0,
  19  |   reviewWords: 0, masteredWords: 0, masteredPhrases: 0, reviewsToday: 0, successfulToday: 0,
  20  |   objectiveReviewsToday: 0, objectiveSuccessfulToday: 0, reviewsTotal: 0, dailyGoal: 30, currentStreak: 0,
  21  |   longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0, retainedPhrasesWeek: 0, eventSchemaVersion: 2,
  22  |   modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
  23  | };
  24  | const WORDS = [
  25  |   { id: 101, lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },
  26  |   { id: 102, lemma: "build", translation: "собирать", phonetic: "/bɪld/", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "", status: "new" },
  27  |   { id: 103, lemma: "cache", translation: "кэш", phonetic: "/kæʃ/", partOfSpeech: "noun", topic: "Backend", examples: ["Clear the cache."], note: "", status: "new" },
  28  |   { id: 104, lemma: "durable", translation: "надёжный", phonetic: "/ˈdjʊərəbl/", partOfSpeech: "adjective", topic: "Data", examples: ["Use durable storage."], note: "", status: "new" },
  29  | ];
  30  | 
  31  | function lessonItems(count: number, ratings: Record<number, "again" | "almost" | "known"> = {}) {
  32  |   return WORDS.slice(0, count).map((item, position) => ({ ...item, kind: "word", position, ...(ratings[item.id] ? { rating: ratings[item.id], reviewedAt: "2026-07-17T00:00:00Z" } : {}) }));
  33  | }
  34  | 
  35  | async function installBaseRoutes(page: Page) {
  36  |   await page.context().addCookies([{ name: "lexigo_csrf", value: "e2e-csrf-token", url: "http://127.0.0.1:3000", sameSite: "Lax" }]);
  37  | }
  38  | 
  39  | async function installLessonAPI(page: Page, itemCount: number, reviewDelayMs = 0): Promise<MockLesson> {
  40  |   let reviewCalls = 0;
  41  |   let reviewedItems = 0;
  42  |   let version = 1;
  43  |   const selectedItems = lessonItems(itemCount);
  44  |   const lessonRequests: RequestRecord[] = [];
  45  |   const reviewRequests: RequestRecord[] = [];
  46  |   await installBaseRoutes(page);
  47  | 
  48  |   await page.route("**/api/v1/**", async (route) => {
  49  |     const request = route.request();
  50  |     const url = new URL(request.url());
  51  |     const path = url.pathname;
  52  |     if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
  53  |     if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
  54  |     if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], count: 0 }) });
  55  |     if (path === "/api/v1/words" || path === "/api/v1/words/due") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
  56  |     if (path === "/api/v1/lessons/active") return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "active_lesson_not_found", message: "active lesson was not found" } }) });
  57  |     if (path === "/api/v1/lessons" && request.method() === "POST") {
  58  |       const payload = request.postDataJSON() as RequestRecord;
  59  |       lessonRequests.push(payload);
  60  |       return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
  61  |         id: "00000000-0000-0000-0000-000000000350", source: "mixed", studyMode: payload.studyMode, lessonSize: String(itemCount),
  62  |         currentIndex: 0, version: 1, status: "active", items: selectedItems, createdAt: "2026-07-17T00:00:00Z", updatedAt: "2026-07-17T00:00:00Z",
  63  |       }) });
  64  |     }
  65  |     if (path.endsWith("/review") && request.method() === "POST") {
  66  |       const payload = request.postDataJSON() as RequestRecord;
  67  |       reviewCalls += 1;
  68  |       reviewRequests.push(payload);
  69  |       if (payload.lessonVersion !== version) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "lesson_version_conflict", message: "stale" } }) });
  70  |       if (reviewDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, reviewDelayMs));
  71  |       reviewedItems += 1;
  72  |       version += 1;
  73  |       const completed = reviewedItems === itemCount;
  74  |       return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
  75  |         wordId: selectedItems[Math.min(reviewedItems - 1, selectedItems.length - 1)].id, status: "learning", easiness: 2.5,
  76  |         intervalDays: 1, repetitions: reviewedItems, dueAt: "2026-07-18T00:00:00Z", lastReviewedAt: "2026-07-17T00:00:00Z",
  77  |         lessonId: "00000000-0000-0000-0000-000000000350", lessonCurrentIndex: reviewedItems, lessonVersion: version,
  78  |         lessonCompleted: completed, lessonReviewedItems: reviewedItems, lessonSkippedItems: 0, lessonTotalItems: itemCount,
  79  |       }) });
  80  |     }
  81  |     return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  82  |   });
  83  |   return { reviewCalls: () => reviewCalls, lessonRequests: () => lessonRequests, reviewRequests: () => reviewRequests };
  84  | }
  85  | 
  86  | async function openLesson(page: Page, mode: LessonMode) {
  87  |   await page.goto("/?view=learn");
> 88  |   await expect(page.getByText("0 элементов готовы")).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  89  |   const label = mode === "study" ? "Простое изучение слов" : mode === "recall" ? "Вспомнить самому" : "Выбрать вариант";
  90  |   await page.getByRole("button", { name: new RegExp(label) }).click();
  91  |   await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  92  |   await expect(page).toHaveURL(/view=lesson/);
  93  | }
  94  | 
  95  | test("study: persists exposure with the current lesson version", async ({ page }) => {
  96  |   const api = await installLessonAPI(page, 2, 350);
  97  |   await openLesson(page, "study");
  98  |   expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "study" });
  99  |   await expect(page.getByRole("button", { name: "← Предыдущее недоступно", exact: true })).toBeDisabled();
  100 | 
  101 |   const known = page.getByRole("button", { name: "Знал", exact: true });
  102 |   await known.evaluate((element) => { const button = element as HTMLButtonElement; button.click(); button.click(); });
  103 |   await expect(page.getByRole("button", { name: "Дальше", exact: true })).toBeEnabled();
  104 |   expect(api.reviewCalls()).toBe(1);
  105 |   expect(api.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "study", answerRevealed: true });
  106 |   expect(api.reviewRequests()[0]).not.toHaveProperty("correct");
  107 | 
  108 |   await page.getByRole("button", { name: "Дальше", exact: true }).click();
  109 |   await page.getByRole("button", { name: "Не знал", exact: true }).click();
  110 |   expect(api.reviewRequests()[1]).toMatchObject({ lessonVersion: 2 });
  111 |   await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
  112 | });
  113 | 
  114 | test("recall and choice send versioned objective payloads", async ({ page }) => {
  115 |   const recall = await installLessonAPI(page, 1);
  116 |   await openLesson(page, "recall");
  117 |   await page.locator("#premium-answer").fill("абсолютный");
  118 |   await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  119 |   await page.getByRole("button", { name: "Почти", exact: true }).click();
  120 |   expect(recall.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "recall", correct: true });
  121 | });
  122 | 
  123 | type SharedState = { version: number; currentIndex: number; ratings: Record<number, "known">; reviewEvents: number };
  124 | 
  125 | async function installSharedAPI(page: Page, state: SharedState) {
  126 |   await installBaseRoutes(page);
  127 |   await page.route("**/api/v1/**", async (route) => {
  128 |     const request = route.request();
  129 |     const path = new URL(request.url()).pathname;
  130 |     if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
  131 |     if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
  132 |     if (path === "/api/v1/words" || path === "/api/v1/words/due") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
  133 |     if (path === "/api/v1/lessons/active") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
  134 |       id: "00000000-0000-0000-0000-000000000390", source: "mixed", studyMode: "study", lessonSize: "2",
  135 |       currentIndex: state.currentIndex, version: state.version, status: "active", items: lessonItems(2, state.ratings),
  136 |       createdAt: "2026-07-17T00:00:00Z", updatedAt: "2026-07-17T00:00:00Z",
  137 |     }) });
  138 |     if (path.endsWith("/review") && request.method() === "POST") {
  139 |       const payload = request.postDataJSON() as RequestRecord;
  140 |       if (payload.lessonVersion !== state.version) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "lesson_version_conflict", message: "stale lesson" } }) });
  141 |       const word = WORDS[state.currentIndex];
  142 |       state.ratings[word.id] = "known";
  143 |       state.currentIndex += 1;
  144 |       state.version += 1;
  145 |       state.reviewEvents += 1;
  146 |       return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
  147 |         wordId: word.id, status: "learning", easiness: 2.5, intervalDays: 0, repetitions: 0, dueAt: "2026-07-18T00:00:00Z",
  148 |         lastReviewedAt: "2026-07-17T00:00:00Z", lessonId: "00000000-0000-0000-0000-000000000390",
  149 |         lessonCurrentIndex: state.currentIndex, lessonVersion: state.version, lessonCompleted: false,
  150 |         lessonReviewedItems: state.currentIndex, lessonSkippedItems: 0, lessonTotalItems: 2,
  151 |       }) });
  152 |     }
  153 |     return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  154 |   });
  155 | }
  156 | 
  157 | async function resumeFromHome(page: Page) {
  158 |   await page.goto("/");
  159 |   await page.getByRole("button", { name: "Продолжить урок", exact: true }).first().click();
  160 |   await expect(page).toHaveURL(/view=lesson/);
  161 | }
  162 | 
  163 | test("stale device resynchronizes to the server position without duplicate review", async ({ context }) => {
  164 |   const state: SharedState = { version: 1, currentIndex: 0, ratings: {}, reviewEvents: 0 };
  165 |   const first = await context.newPage();
  166 |   const second = await context.newPage();
  167 |   await installSharedAPI(first, state);
  168 |   await installSharedAPI(second, state);
  169 | 
  170 |   await resumeFromHome(first);
  171 |   await resumeFromHome(second);
  172 |   await expect(first.getByText("Слово 1 из 2")).toBeVisible();
  173 |   await expect(second.getByText("Слово 1 из 2")).toBeVisible();
  174 | 
  175 |   await first.getByRole("button", { name: "Знал", exact: true }).click();
  176 |   expect(state.reviewEvents).toBe(1);
  177 | 
  178 |   await second.getByRole("button", { name: "Знал", exact: true }).click();
  179 |   await expect(second.locator(".lx-error[role=\"alert\"]")).toContainText("Урок изменён на другом устройстве");
  180 |   await expect(second.getByText("Слово 2 из 2")).toBeVisible();
  181 |   expect(state.reviewEvents).toBe(1);
  182 |   await expect(second.getByRole("button", { name: "← Предыдущее недоступно", exact: true })).toBeDisabled();
  183 |   await expect(second.getByRole("button", { name: /absolute: уже оценено/ })).toHaveCount(0);
  184 |   await expect(second.getByLabel("absolute: уже оценено")).toBeVisible();
  185 | 
  186 |   await second.reload();
  187 |   await second.getByRole("button", { name: "Продолжить урок", exact: true }).click();
  188 |   await expect(second.getByText("Слово 2 из 2")).toBeVisible();
```