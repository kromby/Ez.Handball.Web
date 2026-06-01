import { Link } from "react-router-dom";
import type { LeaderboardEntry, LeaderboardMetric } from "../api/types";

function metricValue(entry: LeaderboardEntry, metric: LeaderboardMetric): number {
  switch (metric) {
    case "goals":
      return entry.goals;
    case "games":
      return entry.games;
    case "yellowCards":
      return entry.yellowCards;
    case "twoMinuteSuspensions":
      return entry.twoMinuteSuspensions;
    case "redCards":
      return entry.redCards;
  }
}

export function LeaderboardTable({
  entries,
  metric,
}: {
  entries: LeaderboardEntry[];
  metric: LeaderboardMetric;
}) {
  if (entries.length === 0) {
    return <p className="status">No players found.</p>;
  }
  return (
    <table className="stats-table leaderboard">
      <thead>
        <tr>
          <th className="num">#</th>
          <th>Player</th>
          <th>Club</th>
          <th className="num">Games</th>
          <th className="num">Value</th>
          <th className="num">Avg goals</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.playerId}>
            <td className="num">
              <span className={e.rank <= 3 ? `rank-medal rank-${e.rank}` : ""}>{e.rank}</span>
            </td>
            <td>
              <Link to={`/players/${encodeURIComponent(e.playerId)}`}>{e.name ?? "Unknown player"}</Link>
            </td>
            <td>{e.clubName ?? "—"}</td>
            <td className="num">{e.games}</td>
            <td className="num">{metricValue(e, metric)}</td>
            <td className="num">{e.avgGoals.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
