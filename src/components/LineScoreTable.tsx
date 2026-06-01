import type { MatchTeam } from "../api/types";

export function LineScoreTable({ home, away }: { home: MatchTeam; away: MatchTeam }) {
  const row = (team: MatchTeam) => (
    <tr>
      <td>{team.clubName ?? "—"}</td>
      <td className="num">{team.score.firstHalf}</td>
      <td className="num">{team.score.secondHalf}</td>
      <td className="num">
        <strong>{team.score.final}</strong>
      </td>
    </tr>
  );
  return (
    <table className="stats-table line-score">
      <thead>
        <tr>
          <th>Team</th>
          <th className="num">1st</th>
          <th className="num">2nd</th>
          <th className="num">Final</th>
        </tr>
      </thead>
      <tbody>
        {row(home)}
        {row(away)}
      </tbody>
    </table>
  );
}
