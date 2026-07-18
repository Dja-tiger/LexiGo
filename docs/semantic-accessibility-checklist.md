# Semantic controls and language accessibility checklist

LexiGo использует нативные кнопки с ARIA-паттернами для одиночного выбора, вкладок и визуальных индикаторов прогресса. Этот документ фиксирует обязательный release contract для Issue #47.

## Автоматический контракт

1. Каждый взаимоисключающий выбор представлен `role="radiogroup"` и дочерними `role="radio"`.
2. В каждой radio group только выбранный элемент имеет `aria-checked="true"` и `tabIndex=0`.
3. Arrow keys меняют выбранный элемент и фокус; `Home` и `End` переходят к первому и последнему элементу.
4. Реальные multi-select controls используют `aria-pressed`, а не radio semantics.
5. Каждый tab имеет `aria-selected`, roving `tabIndex`, `aria-controls` и связанный `tabpanel`.
6. Tabs поддерживают Arrow Left/Right, `Home` и `End`.
7. Каждый progress indicator имеет доступное имя, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` и понятный `aria-valuetext`.
8. Английские слова, фразы, cloze и примеры помечены `lang="en"`; русский перевод — `lang="ru"`.
9. Показ результата ответа и сохранение review объявляются polite live region без дублирования.
10. Семантика создаётся React-компонентами и не исправляется после render через `MutationObserver` или imperative DOM patch.

Автоматическое покрытие находится в:

- `frontend/lib/accessibility-semantics.test.ts`;
- `frontend/e2e/accessibility-keyboard.spec.ts`;
- существующих lesson, dictionary PWA, route-focus и React ownership suites.

## Single-choice controls

Проверить группы:

- режим обучения;
- раздел обучения;
- размер урока;
- тема технических фраз;
- дневная цель.

Для каждой группы:

1. Перейти к группе клавишей Tab.
2. Убедиться, что Tab попадает только на выбранный radio.
3. Использовать Arrow keys и проверить одновременное изменение фокуса и выбранного значения.
4. Использовать `Home` и `End`.
5. Убедиться, что screen reader объявляет название группы, название варианта, позицию и состояние «выбрано».
6. Проверить Enter/Space и pointer/touch activation.

## Multi-select controls

В календарном диалоге выбрать пользовательское расписание и проверить кнопки дней недели:

- каждый день объявляется как toggle button;
- `aria-pressed` соответствует выбранному состоянию;
- можно выбрать несколько дней;
- отключение одного дня не сбрасывает остальные;
- нельзя снять последний обязательный день без понятного сохранения состояния.

## Tabs and tabpanels

### Lesson study views

1. Начать простой урок.
2. Перейти к вкладкам «Карточка», «Пример», «Контекст».
3. Проверить Arrow Left/Right, `Home` и `End`.
4. Убедиться, что выбран только один tab и в Tab order находится только он.
5. Проверить связь выбранного tab с `lesson-study-panel`.
6. Убедиться, что смена вкладки не переносит route focus и не прокручивает страницу неожиданно.

### Account mode

1. Открыть экран аккаунта без активной сессии.
2. Переключить «Вход» и «Регистрация» Arrow keys.
3. Проверить `aria-controls="auth-mode-panel"` и актуальный `aria-labelledby` panel.
4. Убедиться, что содержимое формы соответствует выбранному tab.

## Progress indicators

Проверить:

- общий прогресс каталога на главной;
- дневную цель на главной;
- дневную цель на экране прогресса;
- прогресс активного урока.

Screen reader должен объявлять назначение и текущее значение, например:

- «Общий прогресс каталога, 12 из 100 элементов, 12 процентов»;
- «Выполнение дневной цели, 8 из 30 ответов»;
- «Прогресс урока, 4 из 15 элементов».

Значения должны оставаться в допустимом диапазоне даже при временно неполных или некорректных данных.

## Language switching

Проверить произношение screen reader на следующих участках:

- preview слова на главной;
- карточки и detail технических фраз;
- список всех элементов;
- prompt, phonetic, cloze и example в уроке;
- русский перевод;
- выбранный и правильный ответы после проверки.

Ожидаемое поведение:

- английский контент читается английским голосом;
- русский перевод — русским голосом;
- UI labels остаются на языке интерфейса;
- mixed-language notes не получают ошибочную принудительную маркировку целиком.

## Live feedback

1. В recall mode ввести верный и неверный ответ.
2. Показать результат и убедиться, что feedback объявлен один раз.
3. Сохранить review.
4. Убедиться, что сначала объявляется сохранение, затем итоговая оценка.
5. Проверить отсутствие повторного route announcement.
6. Проверить, что визуально скрытый live region не создаёт дополнительный Tab stop.

## Screen reader matrix

### VoiceOver — macOS

- Safari и Chrome;
- Quick Nav включён и выключен;
- radio groups объявляют название и состояние;
- tabs корректно управляются Arrow keys;
- английские фразы переключают голос/произношение;
- progressbar объявляет значение и текст;
- live feedback не дублируется.

### NVDA — Windows

- Firefox и Chrome;
- browse mode и focus mode;
- radio groups работают стандартными клавишами;
- список form fields показывает корректные роли;
- tabpanel связан с выбранной вкладкой;
- English/Russian language switching слышим и корректен.

### JAWS — Windows

- Chrome или Edge;
- Forms Mode активируется предсказуемо;
- radio position и checked state корректны;
- progress indicators доступны через список form controls;
- review feedback произносится один раз.

### VoiceOver — iOS/iPadOS

- Safari и установленный PWA;
- touch exploration и внешняя клавиатура;
- swipe navigation не посещает radio siblings как отдельные Tab stops;
- double tap выбирает вариант;
- English content произносится английским голосом;
- progress и live feedback доступны после touch interaction.

### TalkBack — Android

- Chrome и установленный PWA;
- swipe и внешняя клавиатура;
- radio groups и toggle buttons различаются по роли;
- selected/pressed state объявляется;
- tabs и progressbar доступны без hover или pointer-only interaction.

## Axe и browser emulation

Автоматический browser gate выполняется в desktop Chromium, desktop WebKit, Android Chromium и iOS WebKit. Он проверяет ARIA roles/attributes, relationships, language tags, focus order и keyboard behavior.

Browser emulation не заменяет реальные VoiceOver, TalkBack, NVDA и JAWS. Физическая проверка по матрице выше остаётся обязательной частью release evidence.

## Release blockers

Релиз блокируется, если:

- одиночный выбор объявляется набором независимых кнопок;
- в radio group отсутствует или дублируется checked state;
- Arrow/Home/End не меняют фокус и выбор согласованно;
- multi-select ошибочно реализован как radio group;
- tab не связан с panel;
- progress indicator не имеет имени или текущего значения;
- английский учебный контент читается русским голосом из-за отсутствующего `lang`;
- feedback не объявляется либо объявляется несколько раз;
- semantic attributes добавляются imperative DOM patch после render;
- Axe обнаруживает серьёзное нарушение в затронутых сценариях.
