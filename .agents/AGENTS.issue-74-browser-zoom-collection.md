# Issue #74 — authoritative browser-zoom collection

## Scope

Это обязательное правило для Playwright acceptance-тестов, которые доказывают browser-owned zoom, reflow, touch/focus geometry или другие UX-инварианты внутри явно allow-listed suite.

## Подтверждённая категория ошибки

В Issue #74 три production-grade standalone теста — Home, Learn и Active Lesson — существовали в `frontend/e2e`, были merge-ready по содержанию и пережили зелёные PR/main workflows, но фактически не исполнялись authoritative Visual regression job. Причина: `frontend/playwright.visual.config.ts` использует явный `testMatch`, а новые `*-browser-zoom.spec.ts` не были добавлены в этот collection boundary.

Следствие: наличие test source, зелёный workflow и даже успешный stage/public smoke сами по себе не доказывают acceptance criterion, если целевой тест не был собран effective Playwright config.

## Обязательные правила

1. При добавлении standalone Playwright acceptance owner сначала определите фактический authoritative command и его effective config.
2. Если config использует explicit `testMatch`/allow-list, новый owner обязан быть добавлен туда в том же atomic slice.
3. Добавьте fail-closed source/unit contract, который связывает обязательный test owner с authoritative collection boundary. Простого комментария или PR checklist недостаточно.
4. Для browser zoom нельзя подменять доказательство `font-size`, CSS transform, device scale factor или уменьшением viewport. Нужен browser-owned zoom и независимая телеметрия, например Chromium extension/API плюс CDP/DOM measurements.
5. Перед completion найдите в authoritative CI evidence точное имя/owner целевого теста. Green job без collection evidence считается недостаточным.
6. Если новый collected test впервые падает, сначала классифицируйте точный failure. Не ослабляйте assertion и не обновляйте visual baseline автоматически. Runtime/CSS scope расширяется только после воспроизведённого product defect.
7. Если acceptance можно разместить внутри уже authoritative collected owner без потери разделения ответственности, это предпочтительнее нового standalone файла. Phrases true-browser-zoom в Issue #74 размещён внутри `phrases-visual.spec.ts` именно для устранения повторного collection gap.
8. Content-addressed visual baselines нельзя обновлять из-за добавления browser-zoom telemetry. Их изменение требует отдельного осознанного visual change с Figma/CI evidence.

## Минимальная проверка перед Ready

- authoritative config содержит все обязательные standalone owners;
- fail-closed unit/source contract проходит;
- authoritative CI log показывает выполнение целевых browser-zoom тестов, а не только общий green status;
- browser-owned zoom factor подтверждён независимыми browser/CDP и DOM measurements;
- runtime errors отсутствуют;
- horizontal overflow, clipping/overlap и focus-visible проверены в zoomed state;
- существующие content-addressed baselines не изменены без отдельного design approval;
- review/thread audit чистый.

## Rollback / recovery

Если collection repair раскрывает ранее скрытый layout defect, не откатывайте сам collection boundary ради зелёного CI. Зафиксируйте defect в `current/PROGRESS.md`, расширьте allowed paths только на фактического runtime/CSS owner и исправьте product behavior под тем же acceptance test. Collection boundary откатывается только если доказано, что сам owner неверно классифицирован или не относится к authoritative suite.
