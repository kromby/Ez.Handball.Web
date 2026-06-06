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
            onClick={() => onSelect(o.value)}
            style={{ all: "unset", cursor: "pointer" }}
          >
            <SketchBox tone={on ? "ink" : "paper"} radius={999} pad="6px 14px">
              <span style={{ fontWeight: 700, fontSize: 14, color: on ? "var(--paper-2)" : "var(--ink-2)" }}>
                {o.label}
              </span>
            </SketchBox>
          </button>
        );
      })}
    </div>
  );
}
