import { useTranslation } from "react-i18next";
import { ClubLink } from "../ClubLink";
import type { ClubMatch } from "../../api/types";
import { formatKickoff } from "../gameweek/datetime";
import { formatMatchDate, matchOutcome } from "./clubMatch";

export function ClubMatchRow({ match }: { match: ClubMatch }) {
  const { t } = useTranslation();
  // A non-null `scores` means the match is played with a real result; it doubles as
  // the played/upcoming switch and narrows the score types without non-null assertions.
  const scores =
    match.status === "played" && match.clubScore != null && match.opponentScore != null
      ? { club: match.clubScore, opponent: match.opponentScore }
      : null;
  const outcome = scores ? matchOutcome(scores.club, scores.opponent) : null;

  const meta = [
    match.tournamentName,
    t("club.roundLabel", { round: match.round }),
    scores ? formatMatchDate(match.date) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="club-match">
      <div className="club-match-main">
        <ClubLink clubId={match.opponentClubId} className="club-match-opp">
          {match.opponentLogoUrl ? (
            <img className="club-match-logo" src={match.opponentLogoUrl} alt="" />
          ) : (
            <span className="club-match-logo club-match-logo--blank" aria-hidden="true" />
          )}
          <span>{match.opponentName ?? t("club.unknownOpponent")}</span>
        </ClubLink>
        <span className="club-match-ha">{match.isHome ? t("club.home") : t("club.away")}</span>
        {scores ? (
          <span className={`club-match-score club-match-score--${outcome}`}>
            {`${scores.club}–${scores.opponent}`}
          </span>
        ) : (
          <span className="club-match-time">{formatKickoff(match.date)}</span>
        )}
      </div>
      <div className="club-match-meta">{meta}</div>
    </div>
  );
}
