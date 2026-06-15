import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ClubMatch } from "../../api/types";
import { formatKickoff } from "../gameweek/datetime";
import { formatMatchDate, matchOutcome } from "./clubMatch";

export function ClubMatchRow({ match }: { match: ClubMatch }) {
  const { t } = useTranslation();
  const played =
    match.status === "played" && match.clubScore != null && match.opponentScore != null;
  const outcome = played ? matchOutcome(match.clubScore!, match.opponentScore!) : null;

  const meta = [
    match.tournamentName,
    t("club.roundLabel", { round: match.round }),
    played ? formatMatchDate(match.date) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="club-match">
      <div className="club-match-main">
        {match.opponentLogoUrl ? (
          <img className="club-match-logo" src={match.opponentLogoUrl} alt="" />
        ) : (
          <span className="club-match-logo club-match-logo--blank" aria-hidden="true" />
        )}
        <Link className="club-match-opp" to={`/clubs/${encodeURIComponent(match.opponentClubId)}`}>
          {match.opponentName ?? t("club.unknownOpponent")}
        </Link>
        <span className="club-match-ha">{match.isHome ? t("club.home") : t("club.away")}</span>
        {played ? (
          <span className={`club-match-score club-match-score--${outcome}`}>
            {`${match.clubScore}–${match.opponentScore}`}
          </span>
        ) : (
          <span className="club-match-time">{formatKickoff(match.date)}</span>
        )}
      </div>
      <div className="club-match-meta">{meta}</div>
    </div>
  );
}
