# Route focus and screen reader release checklist

LexiGo использует клиентскую навигацию через query string и History API. До перехода на полноценные Next.js routes каждый переход обязан соблюдать приведённый ниже accessibility contract.

## Автоматический контракт

1. Первый keyboard stop страницы — ссылка «Перейти к основному содержимому».
2. Ссылка переводит фокус на единственный основной landmark `<main>`.
3. После программной смены экрана фокус переводится на основной landmark только один раз.
4. Локальные обновления данных, review, retry и изменение состояния панели не запускают route focus.
5. Активный пункт desktop и mobile navigation получает `aria-current="page"`.
6. После перехода polite live region объявляет название нового экрана.
7. Перед `pushState` текущая history entry получает актуальную позицию прокрутки.
8. `popstate` восстанавливает target, фокус и сохранённую позицию прокрутки.
9. Browser native scroll restoration отключается только на время жизни приложения, чтобы не конкурировать с управляемым восстановлением.
10. При `prefers-reduced-motion: reduce` route scroll и skip-link transition выполняются без заметной анимации.
11. После сохранения оценки урока фокус с удаляемой rating-кнопки переводится на доступную кнопку продолжения.
12. В документе существует только один `<main>` landmark.

Автоматические проверки находятся в:

- `frontend/lib/navigation-history.test.ts`;
- `frontend/e2e/route-focus-management.spec.ts`;
- `frontend/e2e/accessibility-keyboard.spec.ts`.

## Desktop keyboard walkthrough

Проверять в актуальных Chrome/Chromium, Safari/WebKit и Firefox.

### Skip link

1. Открыть приложение без предварительного фокуса.
2. Нажать Tab один раз.
3. Убедиться, что появилась ссылка «Перейти к основному содержимому».
4. Нажать Enter.
5. Убедиться, что screen reader объявил основной landmark текущего экрана и header был пропущен.

### Основная навигация

1. Перейти последовательно на Главную, Обучение, Фразы, Словарь и Прогресс.
2. После каждого перехода проверить:
   - фокус находится на основном landmark;
   - новый `h1` доступен сразу после landmark;
   - активный navigation item объявляется как текущая страница;
   - live region произносит название нового экрана один раз;
   - URL и `document.title` соответствуют экрану.
3. Убедиться, что повторная загрузка progress/catalog resources не перемещает фокус.

### Back и Forward

1. На длинном экране Фраз прокрутить страницу примерно до середины.
2. Перейти на Прогресс.
3. Нажать browser Back.
4. Проверить возврат на Фразы, фокус основного landmark и восстановление прежней позиции.
5. Нажать browser Forward.
6. Проверить возврат на Прогресс, его фокус и сохранённую позицию.
7. Повторить между Словарём, деталями элемента и предыдущим экраном.

### Урок

1. Начать серверный урок.
2. Перейти к rating controls клавиатурой.
3. Сохранить оценку Space или Enter.
4. Убедиться, что после удаления rating controls фокус находится на кнопке «Дальше» или «К результатам».
5. Убедиться, что экран повторно не объявляется как новый route.
6. Проверить, что фоновые обновления статистики не меняют фокус.

## Screen reader matrix

### VoiceOver — macOS

- Safari и Chrome;
- Quick Nav включён и выключен;
- rotor показывает единственный main landmark;
- `aria-current="page"` объявляется для активной навигации;
- route announcement не дублируется с `h1`;
- Back/Forward возвращают логичный контекст.

### NVDA — Windows

- Firefox и Chrome;
- browse mode и focus mode;
- клавиша `D` находит один main landmark;
- skip-link работает до header navigation;
- live announcement произносится один раз;
- review update не отправляет пользователя в начало документа.

### JAWS — Windows

- Chrome или Edge;
- список landmarks содержит один main;
- список ссылок содержит доступную skip-link;
- текущий navigation item имеет корректное объявление;
- History navigation не теряет virtual cursor context.

### VoiceOver — iOS/iPadOS

- Safari и установленный PWA;
- touch exploration и внешняя клавиатура;
- mobile navigation объявляет текущую страницу;
- переход экрана объявляется без повторного чтения всего header;
- Back gesture восстанавливает экран и прокрутку;
- reduced motion проверяется при включённом системном «Уменьшение движения».

### TalkBack — Android

- Chrome и установленный PWA;
- swipe navigation и внешняя клавиатура;
- main landmark и heading доступны после перехода;
- нижняя навигация правильно объявляет текущий пункт;
- системная настройка удаления анимаций приводит к мгновенному scroll behavior.

## Reduced motion

1. Включить системное уменьшение движения.
2. Перезагрузить приложение.
3. Проверить переходы между всеми основными экранами.
4. Убедиться, что нет smooth scroll, длительных transitions и повторяющихся animations.
5. Проверить появление skip-link: состояние должно меняться практически мгновенно.
6. Выключить настройку и подтвердить сохранение обычного короткого scroll transition.

## Release blocker

Релиз блокируется при любом из следующих дефектов:

- skip-link отсутствует или не является первым keyboard stop;
- в документе более одного main landmark;
- после route transition фокус остаётся на control предыдущего экрана;
- route announcement отсутствует или дублируется;
- локальное обновление данных переводит фокус на main;
- активная навигация не имеет `aria-current="page"`;
- Back/Forward возвращают неправильный экран или теряют scroll position;
- rating control удаляется с потерей фокуса;
- reduced motion игнорируется;
- VoiceOver, TalkBack, NVDA или JAWS не могут определить новый экран.

Browser emulation покрывает DOM, History API, focus, scroll и ARIA contracts. Физические устройства и реальные assistive technologies остаются обязательной частью release evidence и не заменяются Playwright-проверками.
