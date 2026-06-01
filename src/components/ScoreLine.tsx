import type { MatchTeam } from "../api/types";

/** The match result as a bold scoreboard: big amber final scores, with the
    half-time line shown small underneath only when it wasn't 0–0. */
export function ScoreLine({ home, away }: { home: MatchTeam; away: MatchTeam }) {
  const showHalfTime = home.score.firstHalf !== 0 || away.score.firstHalf !== 0;
  return (
    <div className="scoreline">
      <div className="scoreline-scores">
        <span className="scoreline-score">{home.score.final}</span>
        <span className="scoreline-sep" aria-hidden="true">–</span>
        <span className="scoreline-score">{away.score.final}</span>
      </div>
      {showHalfTime && (
        <p className="scoreline-half">
          Half-time {home.score.firstHalf}–{away.score.firstHalf}
        </p>
      )}
    </div>
  );
}
