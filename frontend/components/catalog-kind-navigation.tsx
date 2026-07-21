type CatalogKind = "words" | "phrases";

type CatalogKindNavigationProps = {
  active: CatalogKind;
  onSelect: (kind: CatalogKind) => void;
};

export function CatalogKindNavigation({ active, onSelect }: CatalogKindNavigationProps) {
  return (
    <nav className="lx-catalog-kind-navigation" aria-label="Тип каталога">
      <span>Материалы</span>
      <div>
        <button
          type="button"
          aria-current={active === "words" ? "page" : undefined}
          className={active === "words" ? "active" : undefined}
          onClick={() => active !== "words" && onSelect("words")}
        >
          Слова и термины
        </button>
        <button
          type="button"
          aria-current={active === "phrases" ? "page" : undefined}
          className={active === "phrases" ? "active" : undefined}
          onClick={() => active !== "phrases" && onSelect("phrases")}
        >
          Рабочие фразы
        </button>
      </div>
    </nav>
  );
}
