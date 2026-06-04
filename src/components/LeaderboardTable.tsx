import type { LeaderboardEntry, LeaderboardMetric } from "../api/types";
import { PlayerTable, type PlayerColumn } from "./PlayerTable";

function metricValue(entry: LeaderboardEntry, metric: LeaderboardMetric): number {
  switch (metric) {
    case "goals": return entry.goals;
    case "games": return entry.games;
    case "yellowCards": return entry.yellowCards;
    case "twoMinuteSuspensions": return entry.twoMinuteSuspensions;
    case "redCards": return entry.redCards;
  }
}

export function LeaderboardTable({
  entries,
  metric,
}: {
  entries: LeaderboardEntry[];
  metric: LeaderboardMetric;
}) {
  const before: PlayerColumn<LeaderboardEntry>[] = [
    {
      key: "rank",
      header: "#",
      align: "right",
      render: (e) => <span className={e.rank <= 3 ? `rank-medal rank-${e.rank}` : ""}>{e.rank}</span>,
    },
  ];
  const after: PlayerColumn<LeaderboardEntry>[] = [
    { key: "games", header: "Games", align: "right", render: (e) => e.games },
    { key: "value", header: "Value", align: "right", render: (e) => metricValue(e, metric) },
    { key: "avg", header: "Avg goals", align: "right", render: (e) => e.avgGoals.toFixed(2) },
  ];
  return <PlayerTable<LeaderboardEntry> rows={entries} before={before} after={after} />;
}
