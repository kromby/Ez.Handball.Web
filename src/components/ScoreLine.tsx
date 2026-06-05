import { useTranslation } from "react-i18next";
import type { MatchTeam } from "../api/types";

/** The match result as a bold scoreboard: big amber final scores, with the
    half-time line shown small underneath only when it wasn't 0–0. */
export function ScoreLine({ home, away }: { home: MatchTeam; away: MatchTeam }) {
  const { t } = useTranslation();
  const showHalfTime = home.score.firstHalf !== 0 || away.score.firstHalf !== 0;
  return (
    <div className="scoreline">
      <div className="scoreline-clubs">
        <span className="scoreline-club">{home.clubName ?? "—"}</span>
        <span className="scoreline-club">{away.clubName ?? "—"}</span>
      </div>
      <div className="scoreline-scores">
        <span className="scoreline-score">{home.score.final}</span>
        <span className="scoreline-sep" aria-hidden="true">–</span>
        <span className="scoreline-score">{away.score.final}</span>
      </div>
      {showHalfTime && (
        <p className="scoreline-half">
          {t("match.halfTime")} {home.score.firstHalf}–{away.score.firstHalf}
        </p>
      )}
    </div>
  );
}
