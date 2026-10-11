import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Club, ManagerStanding, MiniLeagueMember } from "../api/types";
import { MemberCrest } from "./MemberCrest";

interface Props {
  leagueId: string;
  entries: ManagerStanding[];
  members: MiniLeagueMember[];
  clubs: Club[];
  myTeamId: string | undefined;
}

export function LeagueStandingsTable({ leagueId, entries, members, clubs, myTeamId }: Props) {
  const { t } = useTranslation();
  const memberByTeamId = new Map(members.map((member) => [member.teamId, member]));
  const clubsById = new Map(clubs.map((club) => [club.clubId, club]));

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th className="num">{t("leagues.rank")}</th>
          <th>{t("leagues.team")}</th>
          <th className="num">{t("leagues.roundsPlayed")}</th>
          <th className="num standings-col--won">{t("leagues.roundsWon")}</th>
          <th className="num">{t("leagues.totalPoints")}</th>
          <th className="num">{t("leagues.avgPerRound")}</th>
          <th className="num">{t("leagues.lastRound")}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const member = memberByTeamId.get(entry.teamId);
          const favoriteClubId = member?.favoriteClubId;
          const club = favoriteClubId ? clubsById.get(favoriteClubId) : undefined;
          const isMine = entry.teamId === myTeamId;
          const label = isMine ? t("leagues.you", { name: entry.teamName }) : entry.teamName;
          return (
            <tr key={entry.teamId} className={isMine ? "standings-row--mine" : undefined}>
              <td className="num">{entry.rank}</td>
              <td>
                <span className="standings-team">
                  <MemberCrest logoUrl={club?.logoUrl} clubName={club?.name} />
                  {entry.wonLatestRound && (
                    <span className="standings-crown" role="img" aria-label={t("leagues.lastRoundWinner")} title={t("leagues.lastRoundWinner")}>
                      👑
                    </span>
                  )}
                  {member ? (
                    <Link
                      className="standings-team-link"
                      to={`/leagues/${encodeURIComponent(leagueId)}/members/${encodeURIComponent(member.userId)}`}
                    >
                      {label}
                    </Link>
                  ) : (
                    <span>{label}</span>
                  )}
                </span>
              </td>
              <td className="num">{entry.roundsPlayed}</td>
              <td className="num standings-col--won">{entry.roundsWon}</td>
              <td className="num">{entry.totalPoints}</td>
              <td className="num">{entry.averagePoints.toFixed(1)}</td>
              <td className="num">{entry.roundPoints}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
