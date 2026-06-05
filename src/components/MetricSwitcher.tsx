import { useTranslation } from "react-i18next";
import type { LeaderboardMetric } from "../api/types";

type MetricLabelKey =
  | "leaderboard.metricGoals"
  | "leaderboard.metricGames"
  | "leaderboard.metricYellowCards"
  | "leaderboard.metricTwoMinSuspensions"
  | "leaderboard.metricRedCards";

export const METRICS: { value: LeaderboardMetric; labelKey: MetricLabelKey }[] = [
  { value: "goals", labelKey: "leaderboard.metricGoals" },
  { value: "games", labelKey: "leaderboard.metricGames" },
  { value: "yellowCards", labelKey: "leaderboard.metricYellowCards" },
  { value: "twoMinuteSuspensions", labelKey: "leaderboard.metricTwoMinSuspensions" },
  { value: "redCards", labelKey: "leaderboard.metricRedCards" },
];

export function MetricSwitcher({
  value,
  onChange,
}: {
  value: LeaderboardMetric;
  onChange: (m: LeaderboardMetric) => void;
}) {
  const { t } = useTranslation();
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
          {t(m.labelKey)}
        </button>
      ))}
    </div>
  );
}
