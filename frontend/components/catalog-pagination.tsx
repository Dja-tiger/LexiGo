import type { FormEvent } from "react";

import { catalogRangeText, type CatalogPageInfo } from "../lib/catalog-page";

export function CatalogSearchForm({
  value,
  onChange,
  onSubmit,
  onClear,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  label: string;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="lx-catalog-search" role="search" aria-label={label} onSubmit={submit}>
      <label>
        <span className="lx-visually-hidden">{label}</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Найти слово, фразу или перевод"
          maxLength={120}
        />
      </label>
      <button className="lx-button primary" type="submit">Найти</button>
      {value ? <button className="lx-button ghost" type="button" onClick={onClear}>Сбросить</button> : null}
    </form>
  );
}

export function CatalogPagination({
  info,
  busy,
  onPageChange,
  label = "Навигация по страницам каталога",
}: {
  info: CatalogPageInfo;
  busy: boolean;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  return (
    <div className="lx-catalog-pagination-shell">
      <p role="status" aria-live="polite" aria-atomic="true">
        {busy ? "Загружаем страницу каталога…" : catalogRangeText(info)}
      </p>
      {info.totalPages > 1 ? (
        <nav className="lx-catalog-pagination" aria-label={label}>
          <button className="lx-button ghost" type="button" disabled={busy || !info.hasPrevious} onClick={() => onPageChange(info.page - 1)}>
            ← Предыдущая
          </button>
          <span aria-current="page">Страница {info.page.toLocaleString("ru-RU")} из {info.totalPages.toLocaleString("ru-RU")}</span>
          <button className="lx-button ghost" type="button" disabled={busy || !info.hasNext} onClick={() => onPageChange(info.page + 1)}>
            Следующая →
          </button>
        </nav>
      ) : null}
    </div>
  );
}
