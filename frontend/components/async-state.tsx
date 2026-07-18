"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { ResourceStatus } from "../lib/account-resources";
import type { RequestProblem } from "../lib/request-failure";

type AsyncStateKind = "loading" | "empty" | "error" | "success";

type AsyncStatePanelProps = {
  label: string;
  kind: AsyncStateKind;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  children?: ReactNode;
  reference?: string;
  focusResult?: boolean;
};

export function AsyncStatePanel({
  label,
  kind,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
  children,
  reference = "",
  focusResult = kind === "error" || kind === "empty",
}: AsyncStatePanelProps) {
  const regionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!focusResult) return;
    regionRef.current?.focus({ preventScroll: false });
  }, [focusResult, kind, title, message, reference]);

  return (
    <section
      ref={regionRef}
      className={`lx-async-state ${kind}${kind === "error" ? " lx-error" : ""}${compact ? " compact" : ""}`}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      aria-label={label}
      tabIndex={focusResult ? -1 : undefined}
      data-async-state={kind}
    >
      <div className="lx-async-state-copy">
        <span>{kind === "loading" ? "ЗАГРУЗКА" : kind === "empty" ? "ПОКА ПУСТО" : kind === "error" ? "НЕ УДАЛОСЬ ЗАГРУЗИТЬ" : "ГОТОВО"}</span>
        <strong>{title}</strong>
        <p>{message}</p>
        {reference ? <small>Код запроса: {reference}</small> : null}
        {children}
      </div>
      {actionLabel && onAction ? (
        <button className="lx-button primary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
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
      reference={problem.correlationId}
    />
  );
}

export function AsyncSkeletonGrid({
  label,
  count = 6,
}: {
  label: string;
  count?: number;
}) {
  return (
    <section className="lx-async-skeleton" role="status" aria-live="polite" aria-label={label} aria-busy="true">
      <span className="lx-visually-hidden">{label}</span>
      <div>
        {Array.from({ length: count }, (_, index) => (
          <i key={index} aria-hidden="true"><b /><b /><b /></i>
        ))}
      </div>
    </section>
  );
}
