import type { LeaderboardMetric } from "../api/types";

export const METRICS: { value: LeaderboardMetric; label: string }[] = [
  { value: "goals", label: "Goals" },
  { value: "games", label: "Games" },
  { value: "yellowCards", label: "Yellow cards" },
  { value: "twoMinuteSuspensions", label: "2-min" },
  { value: "redCards", label: "Red cards" },
];

export function MetricSwitcher({
  value,
  onChange,
}: {
  value: LeaderboardMetric;
  onChange: (m: LeaderboardMetric) => void;
}) {
  return (
    <div className="metric-switcher" role="tablist" aria-label="Ranking metric">
      {METRICS.map((m) => (
        <button
          key={m.value}
          type="button"
          role="tab"
          aria-selected={m.value === value}
          className={m.value === value ? "metric-tab active" : "metric-tab"}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
