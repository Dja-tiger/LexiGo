# Дополнение production-safe delivery — Issue #19 completion

## 2026-07-25 — Модель acceptance criterion нельзя считать завершённой без всех downstream consumers

- **Симптом:** ветка `agent/issue-19-weekly-evidence-completion` содержала только новый Go type `WeakPartsOfSpeech`, тогда как SQL aggregation, API orchestration, frontend validator, presentation, actionable due queue и tests отсутствовали.
- **Первопричина:** изменение data model было выполнено раньше contract matrix и не сопровождалось repository-wide consumer audit.
- **Почему ошибка не была обнаружена раньше:** предыдущий gap-анализ опирался на широкую формулировку «слабые темы» и не сопоставил отдельное требование Issue #19 о частях речи с фактическими response fields и UI actions.
- **Профилактика:** для каждого нового API field до первого write перечислять producer, serializer, runtime validator, normalization fallback, presentation, user action, mocks, unit/integration/E2E и OpenAPI impact. Изолированный type-only commit не считать функциональным прогрессом.
- **Regression gate:** `backend/integration/weekly_part_of_speech_test.go`, `frontend/lib/progress-evidence.test.ts`, `frontend/e2e/progress-evidence.spec.ts`.
- **Область действия:** progress analytics, API contract additions, server-owned recommendations и cross-layer feature slices.
