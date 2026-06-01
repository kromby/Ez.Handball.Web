import type { PlayerHistoryEntry, PlayerHistoryTotals } from "../api/types";

export function StatTable({
  entries,
  totals,
}: {
  entries: PlayerHistoryEntry[];
  totals: PlayerHistoryTotals | null;
}) {
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>Club</th>
          <th>Tournament</th>
          <th className="num">Season</th>
          <th className="num">Games</th>
          <th className="num">Goals</th>
          <th className="num">Avg goals</th>
          <th className="num">Yellow</th>
          <th className="num">2-min</th>
          <th className="num">Red</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={`${e.season}-${e.tournamentId}-${e.clubId}`}>
            <td>{e.clubName ?? "—"}</td>
            <td>{e.tournamentName ?? "—"}</td>
            <td className="num">{e.season}</td>
            <td className="num">{e.games}</td>
            <td className="num">{e.totalGoals}</td>
            <td className="num">{e.avgGoals.toFixed(2)}</td>
            <td className="num">{e.totalYellowCards}</td>
            <td className="num">{e.totalTwoMinuteSuspensions}</td>
            <td className="num">{e.totalRedCards}</td>
          </tr>
        ))}
      </tbody>
      {totals && (
        <tfoot>
          <tr>
            <td />
            <td>
              <strong>Total</strong>
            </td>
            <td className="num" />
            <td className="num">{totals.games}</td>
            <td className="num">{totals.totalGoals}</td>
            <td className="num">{totals.avgGoals.toFixed(2)}</td>
            <td className="num">{totals.totalYellowCards}</td>
            <td className="num">{totals.totalTwoMinuteSuspensions}</td>
            <td className="num">{totals.totalRedCards}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}
