import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { RoundMatch, RoundTeam } from "../../api/types";
import { formatKickoff } from "./datetime";

function TeamSide({ team }: { team: RoundTeam }) {
  return (
    <span className="gw-fixture-team">
      {team.logoSrc ? (
        <img className="gw-fixture-logo" src={team.logoSrc} alt="" />
      ) : (
        <span className="gw-fixture-logo gw-fixture-logo--blank" aria-hidden="true" />
      )}
      <span className="gw-fixture-name">{team.name ?? team.teamId}</span>
    </span>
  );
}

export function FixtureRow({ match }: { match: RoundMatch }) {
  const { t } = useTranslation();
  const hasScore = match.played && match.home.score != null && match.away.score != null;
  return (
    <Link to={`/matches/${encodeURIComponent(match.matchId)}`} className="gw-fixture">
      <TeamSide team={match.home} />
      <span className="gw-fixture-vs">{t("gameweek.versus")}</span>
      <TeamSide team={match.away} />
      {hasScore ? (
        <span className="gw-fixture-score">{`${match.home.score}–${match.away.score}`}</span>
      ) : (
        <span className="gw-fixture-time">{formatKickoff(match.date)}</span>
      )}
    </Link>
  );
}
