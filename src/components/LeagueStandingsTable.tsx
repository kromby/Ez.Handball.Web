import { useTranslation } from "react-i18next";
import type { Club, ManagerStanding, MiniLeagueMember } from "../api/types";
import { MemberCrest } from "./MemberCrest";

interface Props {
  entries: ManagerStanding[];
  members: MiniLeagueMember[];
  clubs: Club[];
  myTeamId: string | undefined;
}

export function LeagueStandingsTable({ entries, members, clubs, myTeamId }: Props) {
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
          <th className="num">{t("leagues.totalPoints")}</th>
          <th className="num">{t("leagues.avgPerRound")}</th>
          <th className="num">{t("leagues.lastRound")}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const favoriteClubId = memberByTeamId.get(entry.teamId)?.favoriteClubId;
          const club = favoriteClubId ? clubsById.get(favoriteClubId) : undefined;
          const isMine = entry.teamId === myTeamId;
          return (
            <tr key={entry.teamId} className={isMine ? "standings-row--mine" : undefined}>
              <td className="num">{entry.rank}</td>
              <td>
                <span className="standings-team">
                  <MemberCrest logoUrl={club?.logoUrl} clubName={club?.name} />
                  <span>{isMine ? t("leagues.you", { name: entry.teamName }) : entry.teamName}</span>
                </span>
              </td>
              <td className="num">{entry.roundsPlayed}</td>
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
