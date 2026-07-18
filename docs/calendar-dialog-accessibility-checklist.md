# Calendar dialog accessibility checklist

Этот документ фиксирует release contract календарного dialog и переиспользуемого `AccessibleDialog` primitive.

## Автоматический контракт

1. Dialog рендерится через portal как отдельный дочерний элемент `body`.
2. При открытии фоновые body children получают `inert` и `aria-hidden="true"`.
3. Верхний dialog в modal stack остаётся единственным интерактивным слоем.
4. `body` блокирует scroll на время открытого modal и восстанавливает исходные inline styles после закрытия.
5. Initial focus устанавливается на статический заголовок dialog.
6. Tab и Shift+Tab циклически остаются внутри dialog, включая случай initial focus на `tabIndex=-1` элементе.
7. Попытка программно перевести focus на фон возвращает focus в активный dialog.
8. Escape, backdrop и кнопка закрытия используют один `onClose` contract.
9. После закрытия focus возвращается на фактический trigger, если он ещё подключён к DOM.
10. Повторное открытие не оставляет stale portal, `inert`, `aria-hidden` или body scroll lock.
11. Исходные значения `inert`, `aria-hidden`, `overflow` и `padding-right` восстанавливаются, а не сбрасываются безусловно.
12. Nested dialogs изолируют предыдущий portal и после закрытия возвращают его в активное состояние.

Автоматическое покрытие находится в:

- `frontend/e2e/calendar-dialog-accessibility.spec.ts`;
- `frontend/e2e/accessibility-keyboard.spec.ts`;
- обязательных `test:e2e:a11y` и `test:e2e:ui` gates.

## Keyboard desktop

Проверить Chrome, Firefox и Safari/Edge:

1. Открыть dialog через header trigger «Уведомления».
2. Убедиться, что focus находится на заголовке «Напоминание об английском».
3. Нажать Tab: focus переходит на кнопку закрытия.
4. Вернуть focus на заголовок и нажать Shift+Tab: focus переходит на последний provider action.
5. Продолжить Tab и Shift+Tab по нескольким циклам; focus не должен выходить на header, main content или mobile navigation.
6. Нажать Escape и проверить возврат focus на header trigger.
7. Открыть dialog через карточку «Настроить календарь» на экране прогресса, закрыть кнопкой и проверить возврат focus на карточку.
8. Закрыть кликом по backdrop и проверить тот же результат.
9. Открыть и закрыть dialog не менее пяти раз подряд.
10. После каждого закрытия проверить, что страница снова прокручивается.

## VoiceOver — macOS

Проверить Safari:

- dialog объявляется с названием и описанием;
- VoiceOver cursor начинает внутри dialog;
- Web Rotor не показывает фоновые controls как доступные;
- Control+Option navigation не уходит на фон;
- Escape и кнопка закрытия возвращают VoiceOver cursor к trigger;
- повторное открытие не создаёт дублированный dialog landmark.

## VoiceOver — iOS/iPadOS

Проверить Safari и установленный PWA:

- после double tap по trigger фокус VoiceOver находится на заголовке dialog;
- swipe navigation посещает только содержимое dialog;
- элементы фонового экрана не доступны через touch exploration;
- backdrop не позволяет активировать скрытые controls;
- Magic Keyboard Tab/Shift+Tab остаются внутри dialog;
- Escape на внешней клавиатуре закрывает dialog;
- после закрытия VoiceOver возвращается к соответствующему trigger;
- body не остаётся заблокированным после поворота экрана и повторного открытия.

## TalkBack — Android

Проверить Chrome и установленный PWA:

- dialog role, title и description объявляются;
- swipe navigation не посещает фоновые элементы;
- touch exploration по области за backdrop не активирует приложение;
- внешняя клавиатура циклически удерживается внутри dialog;
- Back/Escape behavior не оставляет невидимый modal layer;
- повторное открытие сохраняет корректный focus restore.

## Pointer и touch isolation

1. Открыть dialog.
2. Попытаться нажать видимые элементы header или mobile navigation за backdrop.
3. Убедиться, что pointer event не достигает фонового приложения.
4. Проверить backdrop close только при нажатии непосредственно на backdrop, а не внутри dialog.
5. Проверить scroll wheel, trackpad и touch scroll: фон не прокручивается.
6. После закрытия все pointer и scroll interactions восстанавливаются.

## State restoration

Перед открытием вручную задать тестовому body/application root нестандартные значения:

- `aria-hidden="false"`;
- существующий `inert` на отдельном sibling;
- inline `overflow`;
- inline `padding-right`.

После закрытия должны восстановиться именно исходные значения. Primitive не должен удалять состояние, которым владеет другой слой приложения.

## Nested dialog readiness

Для будущего confirmation/settings dialog:

1. Открыть первый dialog.
2. Открыть второй dialog через portal.
3. Первый portal должен стать `inert` и `aria-hidden`.
4. Focus должен оставаться во втором dialog.
5. После закрытия второго dialog первый снова становится активным.
6. Focus возвращается на trigger внутри первого dialog.
7. Body scroll остаётся заблокированным до закрытия последнего dialog.
8. После закрытия последнего dialog фон и body styles полностью восстанавливаются.

## Release blockers

Релиз блокируется, если:

- focus открывается на фоне или остаётся на trigger;
- Tab/Shift+Tab покидает dialog;
- программный `.focus()` позволяет активировать фон;
- фон остаётся доступен screen reader;
- pointer interaction достигает фоновых controls;
- Escape и кнопка закрытия дают разный focus restore;
- закрытие удаляет чужие `aria-hidden`, `inert` или body styles;
- повторное открытие создаёт несколько portal roots;
- после закрытия остаётся `overflow: hidden`;
- Axe обнаруживает нарушение dialog name, hidden focus или focus order.

Browser emulation и Axe не заменяют реальные VoiceOver и TalkBack. Физическая проверка по матрице выше остаётся обязательной частью release evidence.
