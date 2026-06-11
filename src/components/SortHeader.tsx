import type { PoolSort } from "../api/types";

export function SortHeader({
  label,
  sortKey,
  active,
  onSort,
}: {
  label: string;
  sortKey: PoolSort;
  active: PoolSort;
  onSort: (sort: PoolSort) => void;
}) {
  const on = active === sortKey;
  return (
    <button
      type="button"
      className={on ? "sort-header sort-header--on" : "sort-header"}
      aria-pressed={on}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {on && <span className="sort-caret" aria-hidden="true">▾</span>}
    </button>
  );
}
