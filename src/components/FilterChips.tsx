import { SketchBox } from "./SketchBox";

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterChips({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="filter-chips" role="group" aria-label={label}>
      <span className="filter-chips-label">{label}</span>
      {options.map((o) => {
        const on = o.value === selected;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            className={on ? "metric-tab active" : "metric-tab"}
            onClick={() => onSelect(o.value)}
          >
            <SketchBox tone={on ? "ink" : "paper"} radius={999} pad="4px 10px">
              <span>{o.label}</span>
            </SketchBox>
          </button>
        );
      })}
    </div>
  );
}
