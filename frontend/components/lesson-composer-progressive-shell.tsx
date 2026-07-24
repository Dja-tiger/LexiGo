import type { ReactNode } from "react";

type LessonComposerProgressiveShellProps = {
  expanded: boolean;
  sourceLabel: string;
  modeLabel: string;
  sizeLabel: string;
  dueCount: number | undefined;
  newCount: number | undefined;
  estimatedMinutes: string;
  previewPending: boolean;
  startDisabled: boolean;
  startLabel: string;
  busy: boolean;
  onToggle: () => void;
  onStart: () => void;
  children: ReactNode;
};

export function LessonComposerProgressiveShell({
  expanded,
  sourceLabel,
  modeLabel,
  sizeLabel,
  dueCount,
  newCount,
  estimatedMinutes,
  previewPending,
  startDisabled,
  startLabel,
  busy,
  onToggle,
  onStart,
  children,
}: LessonComposerProgressiveShellProps) {
  const summary = `${sourceLabel} · ${modeLabel} · ${sizeLabel}`;
  const compositionReady = !previewPending && dueCount !== undefined && newCount !== undefined;

  return (
    <section
      className="lx-progressive-lesson-composer"
      data-mobile-expanded={expanded ? "true" : "false"}
      aria-label="Настройка следующего урока"
    >
      <article className="lx-recommended-lesson" aria-label="Рекомендуемый урок">
        <span className="lx-recommended-lesson__eyebrow">РЕКОМЕНДОВАННЫЙ УРОК</span>
        <h2>Закрепите важное за 12–15 минут</h2>
        <p>Тренер собрал материал с учётом очереди повторения и текущего уровня сложности.</p>

        <div className="lx-recommended-lesson__chips" aria-label={`Текущие параметры: ${summary}`}>
          <span>{sourceLabel}</span>
          <span>{modeLabel}</span>
          <span>{sizeLabel}</span>
        </div>

        <div className="lx-recommended-lesson__metrics" aria-live="polite">
          <div>
            <strong className="weak">{compositionReady ? dueCount : "—"}</strong>
            <span>К повторению</span>
          </div>
          <div>
            <strong className="retained">{compositionReady ? newCount : "—"}</strong>
            <span>Новые</span>
          </div>
          <div>
            <strong className="milestone">{previewPending ? "…" : estimatedMinutes}</strong>
            <span>Время</span>
          </div>
        </div>

        <button
          className="lx-button primary large lx-recommended-lesson__start"
          type="button"
          disabled={startDisabled}
          data-journey-intent="lesson_start"
          onClick={onStart}
        >
          {busy ? "Формируем…" : startLabel}
        </button>

        <button
          className="lx-recommended-lesson__toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="lesson-composer-settings"
          onClick={onToggle}
        >
          <span>Настроить урок</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </article>

      <aside className="lx-recommended-lesson-reason" aria-label="Почему выбран этот урок">
        <strong>ПОЧЕМУ ЭТОТ УРОК</strong>
        <p>Сначала возвращаем материал, который начинает забываться, затем безопасно добавляем новые элементы.</p>
      </aside>

      <div id="lesson-composer-settings" className="lx-manual-lesson-composer">
        <button
          className="lx-manual-lesson-composer__summary"
          type="button"
          aria-expanded={expanded}
          aria-controls="lesson-composer-controls"
          onClick={onToggle}
        >
          <span>
            <strong>Ручная настройка</strong>
            <small>{summary}</small>
          </span>
          <span aria-hidden="true">⌃</span>
        </button>
        <div id="lesson-composer-controls">{children}</div>
      </div>
    </section>
  );
}
