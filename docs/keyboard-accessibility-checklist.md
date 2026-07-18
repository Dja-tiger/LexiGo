# Keyboard accessibility release checklist

LexiGo должен полностью управляться клавиатурой без мыши. Этот документ является обязательным release evidence для изменений интерактивного UI.

## Архитектурный контракт

1. Использовать нативные `button`, `a`, `input`, `select` и `textarea` вместо кликабельных `div`.
2. Не применять положительный `tabindex`. Допустимы только естественный порядок, `tabindex="0"` для обоснованного custom control и `tabindex="-1"` для программного фокуса.
3. Не удалять browser outline без полноценной замены через `:focus-visible`.
4. Индикатор фокуса должен оставаться видимым на тёмных, светлых, градиентных и error-поверхностях.
5. Информация и действия, доступные при `hover`, должны быть доступны также при `focus-visible`.
6. Disabled controls исключаются из Tab-порядка и визуально не выглядят активными.
7. Модальные окна удерживают Tab/Shift+Tab внутри, закрываются по Escape и возвращают фокус инициатору.
8. Горизонтальные composite controls используют ожидаемые клавиши направления и roving `tabindex`.
9. Порядок DOM соответствует визуальному и смысловому порядку. CSS `order` не должен менять последовательность взаимодействия.
10. Sticky header и mobile bottom navigation не должны перекрывать автоматически прокрученный focus target.

## Автоматический CI gate

`frontend/e2e/accessibility-keyboard.spec.ts` выполняет:

- проверку порядка Tab в desktop header;
- измерение `:focus-visible` outline и дополнительного focus halo;
- активацию основных controls через Enter и Space;
- проверку roving focus учебных вкладок;
- проверку modal focus containment, Escape и возврата фокуса;
- запрет положительного `tabindex`;
- axe-проверки keyboard-related правил на Главной, Обучении, Фразах, Словаре, Прогрессе, Профиле, Уроке и календарном dialog;
- запуск в Chromium, WebKit, Android Chromium и iOS WebKit там, где поведение не зависит от платформенного Tab policy.

Новый интерактивный компонент не считается готовым, пока его основной keyboard flow не включён в этот gate или в специализированный browser test.

## Ручной desktop walkthrough

Проводить на актуальных Chrome/Chromium и Safari/WebKit.

### Глобальная навигация

- Нажать Tab с начала документа.
- Фокус последовательно проходит: логотип → Главная → Обучение → Фразы → Словарь → Прогресс → инструменты профиля.
- На каждом элементе виден контрастный индикатор, не зависящий от hover.
- Enter активирует текущий navigation control.
- Shift+Tab проходит тот же порядок в обратную сторону.

### Главная

- Все CTA, progress cards, режимы и тематические карточки достижимы Tab.
- Enter и Space запускают те же действия, что pointer click.
- Focus indicator не обрезается карточками с `overflow: hidden`.
- После автоматической прокрутки control не скрыт sticky header или bottom navigation.

### Обучение

- Режим, раздел и размер урока доступны в визуальном порядке сверху вниз.
- Space меняет выбранное значение один раз.
- Disabled «Начать урок» пропускается Tab до готовности composer.
- После выбора control его selected state остаётся различимым независимо от focus state.

### Фразы и Словарь

- Topic filters, sorting select и catalog cards достижимы без пропусков.
- Открытие и возврат из detail card выполняются Enter/Space.
- Ни один текст или CTA не появляется только при hover.

### Прогресс и Профиль

- Карточки со ссылочным поведением являются кнопками и активируются клавиатурой.
- Goal controls, retry actions, auth tabs, password toggle и submit доступны в смысловом порядке.
- При validation error фокус переходит к первому ошибочному полю.

### Урок

- «Сохранить и выйти», вкладки, answer controls, rating и переход вперёд достижимы без мыши.
- Вкладки поддерживают ArrowLeft, ArrowRight, Home и End с roving `tabindex`.
- Enter в recall input сверяет непустой ответ.
- После серверной ошибки focus/announcement попадает в error state.
- Disabled navigation не становится Tab stop.

### Календарь

- Enter на trigger открывает dialog.
- Фокус попадает на первый control dialog.
- Tab на последнем control возвращает фокус на первый.
- Shift+Tab на первом control возвращает фокус на последний.
- Escape закрывает dialog.
- После закрытия фокус возвращается на исходный trigger.

## Mobile и hardware keyboard

Перед публичным релизом повторить walkthrough на:

- iPhone/iPad с внешней клавиатурой и VoiceOver;
- Android с внешней клавиатурой и TalkBack;
- установленном iOS PWA;
- установленном Android PWA;
- tablet portrait и landscape, если orientation доступна.

Browser emulation подтверждает DOM, focus order и JavaScript contracts, но не заменяет device-level проверку системного focus rendering и assistive technology announcements.

## Критерий выпуска

Release блокируется, если обнаружено хотя бы одно из условий:

- focus indicator отсутствует или визуально сливается с поверхностью;
- focus target перекрыт или полностью обрезан;
- control доступен только мышью/touch;
- Tab попадает в скрытый, inert или disabled UI;
- modal позволяет фокусу уйти на фон;
- DOM-порядок расходится с визуальным порядком;
- axe keyboard gate сообщает нарушение;
- появился положительный `tabindex` без отдельного архитектурного решения.
