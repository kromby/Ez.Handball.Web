import { Link } from "react-router-dom";

export interface MatchSummary {
  matchId: string;
  season: string;
  tournamentName: string | null;
  /** Caller-supplied context column (e.g. "Valur · 7 goals" on a player page). */
  context: string;
}

export function MatchList({ matches }: { matches: MatchSummary[] }) {
  if (matches.length === 0) {
    return <p className="status">No matches.</p>;
  }
  return (
    <table className="stats-table match-list">
      <thead>
        <tr>
          <th className="num">Season</th>
          <th>Tournament</th>
          <th>Detail</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {matches.map((m) => (
          <tr key={m.matchId}>
            <td className="num">{m.season}</td>
            <td>{m.tournamentName ?? "—"}</td>
            <td>{m.context}</td>
            <td>
              <Link to={`/matches/${encodeURIComponent(m.matchId)}`}>View</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
