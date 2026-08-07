# Issue #74 — authoritative browser-zoom collection

## Scope

Это обязательное правило для Playwright acceptance-тестов, которые доказывают browser-owned zoom, reflow, touch/focus geometry или другие UX-инварианты внутри явно allow-listed suite.

## Подтверждённая категория ошибки

В Issue #74 три production-grade standalone теста — Home, Learn и Active Lesson — существовали в `frontend/e2e`, были merge-ready по содержанию и пережили зелёные PR/main workflows, но фактически не исполнялись authoritative Visual regression job. Причина: `frontend/playwright.visual.config.ts` использует явный `testMatch`, а новые `*-browser-zoom.spec.ts` не были добавлены в этот collection boundary.

Следствие: наличие test source, зелёный workflow и даже успешный stage/public smoke сами по себе не доказывают acceptance criterion, если целевой тест не был собран effective Playwright config.

После включения dormant owners authoritative CI дополнительно подтвердил три класса stale test contracts:

- нельзя выводить ожидаемый responsive breakpoint только из номинального `viewport / zoom`: сначала нужно проверить фактического CSS owner, specificity и точную media-query boundary. Для routed Home при 1440px и browser zoom 2 effective width находится на 720px, тогда как canonical one-column override начинается только с `max-width: 719px`;
- для ARIA radio groups с roving `tabindex` keyboard-focus acceptance должен целиться в текущий checked/tabbable radio. Произвольный `.first()` может иметь `tabindex="-1"` и не обязан получать фокус при Tab/Shift+Tab;
- geometry assertions должны быть совместимы с уже доказанной layout model. Если computed grid подтверждён как двухколоночный, нельзя одновременно требовать вертикальный stacking тех же соседних panels. Для same-row grid проверяйте containment, отсутствие overlap и согласованное top alignment.

## Обязательные правила

1. При добавлении standalone Playwright acceptance owner сначала определите фактический authoritative command и его effective config.
2. Если config использует explicit `testMatch`/allow-list, новый owner обязан быть добавлен туда в том же atomic slice.
3. Добавьте fail-closed source/unit contract, который связывает обязательный test owner с authoritative collection boundary. Простого комментария или PR checklist недостаточно.
4. Для browser zoom нельзя подменять доказательство `font-size`, CSS transform, device scale factor или уменьшением viewport. Нужен browser-owned zoom и независимая телеметрия, например Chromium extension/API плюс CDP/DOM measurements.
5. Перед completion найдите в authoritative CI evidence точное имя/owner целевого теста. Green job без collection evidence считается недостаточным.
6. Если новый collected test впервые падает, сначала классифицируйте точный failure. Не ослабляйте assertion и не обновляйте visual baseline автоматически. Runtime/CSS scope расширяется только после воспроизведённого product defect.
7. Если acceptance можно разместить внутри уже authoritative collected owner без потери разделения ответственности, это предпочтительнее нового standalone файла. Phrases true-browser-zoom в Issue #74 размещён внутри `phrases-visual.spec.ts` именно для устранения повторного collection gap.
8. Content-addressed visual baselines нельзя обновлять из-за добавления browser-zoom telemetry. Их изменение требует отдельного осознанного visual change с Figma/CI evidence.
9. Responsive assertion обязан следовать effective computed owner: перед жёстким ожиданием числа columns/rows сверяйте specificity, точную media-query boundary и фактический CSS pixel width после browser-owned zoom. Reflow acceptance нельзя подменять предположением о breakpoint.
10. Для composite widgets с roving `tabindex` проверяйте keyboard-visible focus на элементе, который реально находится в tab sequence (`checked`, `selected` или иной canonical active owner), а не на произвольном DOM-первом элементе.
11. После подтверждения layout topology проверяйте только совместимую geometry: для двухколоночного same-row layout — horizontal containment, no-overlap и top alignment; для stacked layout — vertical order. Не смешивайте взаимоисключающие topology assertions в одном acceptance state.

## Минимальная проверка перед Ready

- authoritative config содержит все обязательные standalone owners;
- fail-closed unit/source contract проходит;
- authoritative CI log показывает выполнение целевых browser-zoom тестов, а не только общий green status;
- browser-owned zoom factor подтверждён независимыми browser/CDP и DOM measurements;
- runtime errors отсутствуют;
- horizontal overflow, clipping/overlap и focus-visible проверены в zoomed state;
- responsive expectations привязаны к effective CSS owner и точной breakpoint boundary;
- geometry assertions соответствуют подтверждённой layout topology;
- roving-tabindex controls проверяются на реально tabbable active owner;
- существующие content-addressed baselines не изменены без отдельного design approval;
- review/thread audit чистый.

## Rollback / recovery

Если collection repair раскрывает ранее скрытый layout defect, не откатывайте сам collection boundary ради зелёного CI. Зафиксируйте defect в `current/PROGRESS.md`, расширьте allowed paths только на фактического runtime/CSS owner и исправьте product behavior под тем же acceptance test. Collection boundary откатывается только если доказано, что сам owner неверно классифицирован или не относится к authoritative suite.
