import { useTranslation } from "react-i18next";
import type { PlayerHistoryEntry, PlayerHistoryTotals } from "../api/types";
import { ClubLink } from "./ClubLink";

export function StatTable({
  entries,
  totals,
}: {
  entries: PlayerHistoryEntry[];
  totals: PlayerHistoryTotals | null;
}) {
  const { t } = useTranslation();
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>{t("leaderboard.club")}</th>
          <th>{t("match.tournament")}</th>
          <th className="num">{t("match.season")}</th>
          <th className="num">{t("leaderboard.games")}</th>
          <th className="num">{t("leaderboard.goals")}</th>
          <th className="num">{t("leaderboard.avgGoals")}</th>
          <th className="num">{t("match.yellow")}</th>
          <th className="num">{t("leaderboard.metricTwoMinSuspensions")}</th>
          <th className="num">{t("match.red")}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={`${e.season}-${e.tournamentId}-${e.clubId}`}>
            <td><ClubLink clubId={e.clubId} name={e.clubName} /></td>
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
              <strong>{t("player.total")}</strong>
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
