import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import type { MemberGameweek } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { FilterSelect } from "../components/FilterSelect";
import { MemberRound } from "../components/league/MemberRound";
import { ErrorView, Loading } from "../components/StateViews";
import { useLeagueMemberGameweeks, useMiniLeague } from "../query/hooks";

export default function LeagueMemberPage() {
  const { t } = useTranslation();
  const { id = "", userId = "" } = useParams();
  const { user } = useAuth();
  const league = useMiniLeague(id);
  const gameweeks = useLeagueMemberGameweeks(id, userId);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  if (gameweeks.isPending) return <Loading />;
  if (gameweeks.isError) return <ErrorView error={gameweeks.error} notFoundLabel={t("leagueMember.notFound")} />;

  const member = league.data?.members.find((candidate) => candidate.userId === userId);
  const teamName = member?.teamName ?? t("leagueMember.unnamedTeam");
  const rounds = gameweeks.data.gameweeks;
  // Newest locked round by default: it's the one people come to compare.
  const activeRound = rounds.find((round) => round.roundLabel === selectedRound) ?? rounds[rounds.length - 1];
  const roundOption = (round: MemberGameweek) => ({
    value: round.roundLabel,
    label: `${t("gameweekScores.gw", { number: round.number })} · ${t("gameweek.roundLabel", { label: round.roundLabel })}`,
  });

  return (
    <section className="stack">
      <Link to={`/leagues/${encodeURIComponent(id)}`} className="back-link">
        {t("leagueMember.back", { league: league.data?.name ?? t("leagues.title") })}
      </Link>
      <div className="page-head">
        <h1 className="title">{userId === user?.id ? t("leagues.you", { name: teamName }) : teamName}</h1>
        <p className="subtitle">{t("leagueMember.lockedOnlyNote")}</p>
      </div>

      {rounds.length === 0 ? (
        <p className="status">{t("leagueMember.empty")}</p>
      ) : (
        <section className="gwsc">
          <div className="gwsc-total">
            <span className="gwsc-total-label poslabel">{t("gameweekScores.runningTotal")}</span>
            <span className="gwsc-total-num">{gameweeks.data.runningTotal}</span>
            <span className="gwsc-total-sub">{t("leagueMember.lockedCount", { count: rounds.length })}</span>
          </div>
          <div className="member-round-picker">
            <FilterSelect
              label={t("leagueMember.roundPicker")}
              value={activeRound.roundLabel}
              options={[...rounds].reverse().map(roundOption)}
              onChange={setSelectedRound}
            />
          </div>
          <MemberRound round={activeRound} />
        </section>
      )}
    </section>
  );
}
