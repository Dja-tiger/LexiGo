# Дополнение PR #214 — CI #1732

## 2026-07-25 — Route-level progressive disclosure повторно не был нормализован в desktop test

- **Симптом:** UI shard 1/2 в CI #1732 завершился timeout: reduced-motion test ожидал кнопку «Настроить календарь» после перехода на `/progress`, но control отсутствовал в accessibility tree.
- **Первопричина:** кнопка принадлежит закрытому `details.lx-route-reminder-entry`; тест искал вложенный control напрямую, не раскрывая owning `summary`.
- **Почему ошибка не была обнаружена раньше:** ранее правило было применено в compact iOS scenarios, но не было перенесено на desktop reduced-motion journey после замены canonical Progress presentation.
- **Профилактика:** перед каждым взаимодействием с control внутри `<details>` сначала локализовать owning disclosure, нажать его `summary`, подтвердить атрибут `open`, затем искать control внутри этого owner. Viewport или browser project не освобождает тест от нормализации progressive UI state.
- **Regression gate:** `frontend/e2e/route-focus-management.spec.ts` раскрывает `details.lx-route-reminder-entry`, подтверждает `open`, открывает dialog и проверяет reduced-motion contract; полный UI shard 1/2 проходит без retry.
- **Область действия:** route-level calendar reminder, desktop Chromium, compact Chromium/WebKit, reduced motion, dialog focus lifecycle и progressive `<details>`.
