# Apple Calendar import checklist

Этот документ фиксирует release contract импорта повторяющегося напоминания LexiGo в Apple Calendar.

## Автоматический контракт

1. Клиент формирует ICS синхронно внутри пользовательского click handler.
2. В iOS/iPadOS при поддержке file sharing используется `navigator.canShare({ files })` и `navigator.share({ files })`.
3. До вызова `navigator.share` нет сетевого `await`, поэтому transient user activation не теряется.
4. Отмена системного share sheet (`AbortError`) не запускает download или navigation fallback.
5. При отсутствии file sharing используется Blob download с именем `lexigo-study-reminder.ics`.
6. Same-origin attachment endpoint используется только как последний fallback.
7. Endpoint возвращает `text/calendar; charset=utf-8`, `Content-Disposition: attachment` и `X-Content-Type-Options: nosniff`.
8. Для IANA timezone ICS содержит `VTIMEZONE`, `TZID`, `X-LIC-LOCATION`, `STANDARD`/`DAYLIGHT` и `TZOFFSETFROM`/`TZOFFSETTO`.
9. `DTSTART` и `DTEND` используют тот же `TZID`, поэтому повторение сохраняет локальное время после DST transition.
10. Для `UTC` используются date-time values с `Z` без избыточного `VTIMEZONE`.
11. Daily, weekdays и custom recurrence формируются через `RRULE`.
12. Уведомление формируется через `VALARM` с относительным `TRIGGER`.
13. Все content lines используют CRLF и складываются до 75 octets.
14. UI не сообщает об успешном действии до завершения share/download launch.
15. Share cancellation, download fallback и hard failure имеют разные статусы.

Автоматическое покрытие:

- `frontend/lib/calendar-reminder.test.ts`;
- `frontend/lib/apple-calendar-delivery.test.ts`;
- `frontend/app/api/calendar/reminder/route.test.ts`;
- `frontend/e2e/apple-calendar-pwa.spec.ts`;
- обязательные `test:e2e:ui` и `test:e2e:pwa` gates.

## iOS Safari

1. Открыть LexiGo в Safari.
2. Перейти в «Прогресс» и открыть «Настроить календарь».
3. Выбрать время, длительность, повторение и уведомление.
4. Нажать Apple Calendar.
5. Убедиться, что открывается системный share/import flow, а не новая пустая вкладка.
6. Выбрать Calendar или открыть переданный ICS.
7. Подтвердить импорт.
8. Проверить название, описание, время, дни повторения и уведомление.
9. Повторить для daily, weekdays и custom.
10. Отменить share sheet и убедиться, что приложение сообщает об отмене, не начинает загрузку и не покидает текущий экран.

## Установленный iOS/iPadOS PWA

1. Запустить приложение с Home Screen.
2. Повторить основной сценарий импорта.
3. Проверить, что PWA остаётся на экране прогресса после закрытия share sheet.
4. Проверить отсутствие error page, пустого webview и второй копии приложения.
5. Повторить после полного завершения PWA из app switcher.
6. Повторить при portrait и landscape orientation.
7. Проверить VoiceOver: кнопка, pending state и итоговый status объявляются один раз.
8. Проверить Magic Keyboard: focus остаётся в dialog во время запуска share flow.

## macOS Safari

1. Нажать Apple Calendar при доступном Web Share API.
2. Проверить системный share flow.
3. При отключённом/недоступном file sharing проверить загрузку `lexigo-study-reminder.ics`.
4. Открыть файл в Calendar.app.
5. Проверить recurrence и alert.
6. Удалить тестовое событие после проверки.

## DST и timezone

Проверить минимум две зоны:

- `Europe/Berlin` или другая зона с переходом CET/CEST;
- `America/New_York` или другая зона с отличающимися датами перехода.

Для каждой зоны:

1. Создать ежедневное событие за день до spring-forward transition.
2. Убедиться, что после transition занятие остаётся в выбранное локальное время.
3. Повторить для fall-back transition.
4. Проверить duration и alert на экземплярах до и после transition.
5. Проверить, что Calendar.app не создаёт дублированные recurrence instances.
6. Отдельно проверить fixed-offset/без-DST зону, например `Asia/Kolkata`.

## Проверка ICS

Перед релизом сохранить реальный файл и проверить:

- MIME: `text/calendar`;
- имя: `lexigo-study-reminder.ics`;
- UTF-8 кириллицу;
- CRLF line endings;
- отсутствие строк длиннее 75 octets после folding;
- сбалансированные `BEGIN`/`END` components;
- обязательные `VERSION`, `PRODID`, `UID`, `DTSTAMP`, `DTSTART`;
- `VTIMEZONE` для non-UTC timezone;
- `RRULE` и `VALARM`;
- отсутствие одновременно `DTEND` и `DURATION`.

Дополнительно прогнать файл через независимый RFC 5545/iCalendar validator. Результат validation и проверяемый файл сохранить как release evidence.

## Status messages

Проверить четыре результата:

- share завершён: файл передан выбранному приложению;
- share отменён: календарь не изменён;
- download fallback: показано точное имя загруженного файла и ручной следующий шаг;
- hard failure: показана инструкция открыть LexiGo в Safari и повторить.

Статус «файл создан» до успешного запуска действия запрещён.

## Release blockers

Релиз блокируется, если:

- PWA открывает пустую/error page;
- share вызывается после асинхронной операции и теряет user activation;
- отмена share запускает download fallback;
- файл имеет неверный MIME или имя;
- отсутствует `VTIMEZONE` при non-UTC `TZID`;
- локальное время меняется после DST transition;
- теряются custom weekdays или `VALARM`;
- download/navigation запускаются более одного раза;
- UI сообщает об успехе до результата системного действия;
- повторный click создаёт несколько share sheets или downloads.

Playwright и unit tests не заменяют импорт в реальный Apple Calendar. Физические проверки iOS/iPadOS/macOS и внешний validator остаются обязательной частью release evidence.
