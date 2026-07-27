"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { ResourceStatus } from "../lib/account-resources";
import { consumeLessonResumeIntent } from "../lib/lesson-resume-intent";
import type { RequestProblem } from "../lib/request-failure";

type AsyncStateKind = "loading" | "empty" | "error" | "success";
type AsyncSkeletonVariant = "catalog" | "home";

type AsyncStatePanelProps = {
  label: string;
  kind: AsyncStateKind;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
  children?: ReactNode;
  reference?: string;
  focusResult?: boolean;
};

function stateEyebrow(kind: AsyncStateKind): string {
  if (kind === "loading") return "ЗАГРУЗКА";
  if (kind === "empty") return "НИЧЕГО НЕ НАЙДЕНО";
  if (kind === "error") return "НЕ УДАЛОСЬ ЗАГРУЗИТЬ";
  return "ГОТОВО";
}

function stateIcon(kind: AsyncStateKind): string {
  if (kind === "loading") return "…";
  if (kind === "empty") return "⌕";
  if (kind === "error") return "!";
  return "✓";
}

export function AsyncStatePanel({
  label,
  kind,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  children,
  reference = "",
  focusResult = kind === "error" || kind === "empty",
}: AsyncStatePanelProps) {
  const regionRef = useRef<HTMLElement>(null);
  const resumeIntentConsumedRef = useRef(false);
  const primaryActionRef = useRef(onAction);
  primaryActionRef.current = onAction;

  useEffect(() => {
    if (!focusResult) return;
    regionRef.current?.focus({ preventScroll: false });
  }, [focusResult, kind, title, message, reference]);

  useEffect(() => {
    if (resumeIntentConsumedRef.current || actionLabel !== "Продолжить урок" || !primaryActionRef.current) return;
    if (!consumeLessonResumeIntent(window.location, window.history)) return;

    resumeIntentConsumedRef.current = true;
    const frame = window.requestAnimationFrame(() => primaryActionRef.current?.());
    return () => window.cancelAnimationFrame(frame);
  }, [actionLabel]);

  const hasActions = Boolean((actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction));

  return (
    <section
      ref={regionRef}
      className={`lx-async-state ${kind}${kind === "error" ? " lx-error" : ""}${compact ? " compact" : ""}`}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      aria-busy={kind === "loading" ? true : undefined}
      aria-label={label}
      tabIndex={focusResult ? -1 : undefined}
      data-async-state={kind}
    >
      <span className="lx-async-state-icon" aria-hidden="true">{stateIcon(kind)}</span>
      <div className="lx-async-state-copy">
        <span>{stateEyebrow(kind)}</span>
        <strong>{title}</strong>
        <p>{message}</p>
        {reference ? <small>Код запроса: {reference}</small> : null}
        {children}
      </div>
      {hasActions ? (
        <div className="lx-async-state-actions">
          {actionLabel && onAction ? (
            <button className="lx-button primary" type="button" onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <button className="lx-button ghost" type="button" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function AsyncResourceNotice({
  label,
  status,
  onRetry,
}: {
  label: string;
  status: ResourceStatus;
  onRetry: () => void;
}) {
  if (status.phase !== "error" || !status.problem) return null;
  const problem: RequestProblem = status.problem;
  return (
    <AsyncStatePanel
      label={`${label}: ошибка загрузки`}
      kind="error"
      title={problem.title}
      message={problem.message}
      actionLabel={problem.retryable ? "Повторить" : undefined}
      onAction={problem.retryable ? onRetry : undefined}
      compact
      reference={problem.correlationId || problem.code}
    />
  );
}

export function AsyncSkeletonGrid({
  label,
  count = 6,
  variant = "catalog",
}: {
  label: string;
  count?: number;
  variant?: AsyncSkeletonVariant;
}) {
  return (
    <section
      className={`lx-async-skeleton lx-async-skeleton--${variant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      aria-busy="true"
      data-skeleton-variant={variant}
    >
      <span className="lx-visually-hidden">{label}</span>
      <div>
        {Array.from({ length: count }, (_, index) => (
          <i key={index} aria-hidden="true"><b /><b /><b /></i>
        ))}
      </div>
    </section>
  );
}
