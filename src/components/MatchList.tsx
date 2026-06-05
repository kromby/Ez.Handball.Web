import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export interface MatchSummary {
  matchId: string;
  season: string;
  tournamentName: string | null;
  /** Caller-supplied context column (e.g. "Valur · 7 goals" on a player page). */
  context: string;
}

export function MatchList({ matches }: { matches: MatchSummary[] }) {
  const { t } = useTranslation();
  if (matches.length === 0) {
    return <p className="status">{t("player.noMatches")}</p>;
  }
  return (
    <table className="stats-table match-list">
      <thead>
        <tr>
          <th className="num">{t("match.season")}</th>
          <th>{t("match.tournament")}</th>
          <th>{t("player.detail")}</th>
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
              <Link to={`/matches/${encodeURIComponent(m.matchId)}`}>{t("player.view")}</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
