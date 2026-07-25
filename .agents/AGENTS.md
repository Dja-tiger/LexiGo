# Указания для агентов и разработчиков LexiGo

Этот файл является точкой входа в единый нормативный набор инструкций проекта. Перед любой write-операцией необходимо последовательно прочитать:

1. [`AGENTS.base.md`](./AGENTS.base.md) — полный базовый регламент production-разработки, pre-flight, тестирования и журнал ранее обнаруженных категорий ошибок;
2. [`AGENTS.progress-pr214.md`](./AGENTS.progress-pr214.md) — обязательные дополнения, подтверждённые при разработке PR #214;
3. [`AGENTS.progress-pr214-ci1732.md`](./AGENTS.progress-pr214-ci1732.md) — обязательное уточнение progressive disclosure, подтверждённое CI #1732.

Все три документа обязательны и применяются совместно. При расхождении более конкретное правило из дополнений PR #214 имеет приоритет для route islands, accessibility locators, reduced motion, direct-detail mocks, Linux visual artifacts, progressive disclosure и temporary workflow lifecycle.

Полная консолидированная версия этих документов формируется как артефакт `LexiGo-AGENTS.md`; модульное хранение в repository исключает потерю базового журнала при добавлении новых production-наблюдений.
