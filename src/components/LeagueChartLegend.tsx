import type { ManagerStanding } from "../api/types";

interface Props {
  entries: ManagerStanding[];
  myTeamId: string | undefined;
  colorByTeam: Map<string, string>;
}

/** One colour swatch per team, matching the colours the league charts draw with. */
export function LeagueChartLegend({ entries, myTeamId, colorByTeam }: Props) {
  return (
    <ul className="league-chart-legend">
      {entries.map((entry) => (
        <li key={entry.teamId} className={entry.teamId === myTeamId ? "league-chart-legend-mine" : undefined}>
          <span className="league-chart-swatch" style={{ background: colorByTeam.get(entry.teamId) }} />
          {entry.teamName}
        </li>
      ))}
    </ul>
  );
}
