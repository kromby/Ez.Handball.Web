import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { PlayerStat } from "../api/types";
import { useClubs } from "../query/hooks";
import { ClubLink } from "./ClubLink";

function formatMatchDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// HBStatz fields are null until HBStatz reports the match — show a dash, not a misleading 0.
const countOrDash = (value: number | null) => (value == null ? "—" : value);

/** One row per game a player played: who they faced and what they did in it. */
export function PlayerMatchTable({ stats }: { stats: PlayerStat[] }) {
  const { t } = useTranslation();
  const clubs = useClubs();
  const clubLogos = useMemo(() => new Map((clubs.data ?? []).map((c) => [c.clubId, c.logoUrl])), [clubs.data]);

  if (stats.length === 0) return <p className="status">{t("player.noMatches")}</p>;

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>{t("player.date")}</th>
          <th>{t("player.opponent")}</th>
          <th className="num">{t("playerHub.goals")}</th>
          <th className="num">{t("playerHub.assists")}</th>
          <th className="num">{t("playerHub.saves")}</th>
          <th className="num">{t("playerHub.rating")}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {stats.map((stat) => {
          const logoUrl = stat.opponentClubId ? clubLogos.get(stat.opponentClubId) : null;
          return (
            <tr key={stat.matchId}>
              <td>{formatMatchDate(stat.date)}</td>
              <td>
                <ClubLink clubId={stat.opponentClubId} className="club-inline">
                  {logoUrl && <img className="club-logo-sm" src={logoUrl} alt="" />}
                  {stat.opponentClubName ?? "—"}
                </ClubLink>
              </td>
              <td className="num">{stat.goals}</td>
              <td className="num">{countOrDash(stat.hbStatzAssists)}</td>
              <td className="num">{countOrDash(stat.hbStatzSaves)}</td>
              <td className="num">{stat.points != null ? stat.points.toFixed(0) : "—"}</td>
              <td>
                <Link to={`/matches/${encodeURIComponent(stat.matchId)}`}>{t("player.view")}</Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
