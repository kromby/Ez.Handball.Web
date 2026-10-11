import type { ManagerStanding } from "../api/types";

/** One colour swatch per team, matching the colours the league charts draw with. */
export function LeagueChartLegend({ entries }: { entries: ManagerStanding[] }) {
  return (
    <ul className="league-chart-legend">
      {entries.map((entry) => (
        <li key={entry.teamId}>
          <span className="league-chart-swatch" style={{ background: entry.color }} />
          {entry.teamName}
        </li>
      ))}
    </ul>
  );
}
