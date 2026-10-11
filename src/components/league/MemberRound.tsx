import { useTranslation } from "react-i18next";
import type { MemberGameweek } from "../../api/types";
import { byBreakdownOrder } from "../gameweek/breakdownOrder";
import { PlayerScoreLine } from "../gameweek/PlayerScoreLine";
import { MemberLineup } from "./MemberLineup";

/** One locked round: the points breakdown once settled, otherwise the lineup frozen at the deadline. */
export function MemberRound({ round }: { round: MemberGameweek }) {
  const { t } = useTranslation();

  if (!round.settled) {
    return (
      <div className="gwsc-row gwsc-row--open">
        <div className="gwsc-row-head">
          <span className="gwsc-gw">{t("gameweekScores.gw", { number: round.number })}</span>
          <span className="gwsc-round">{t("leagueMember.awaitingResults")}</span>
        </div>
        <div className="gwsc-row-body">
          <MemberLineup lineup={round.lineup} />
        </div>
      </div>
    );
  }

  return (
    <div className="gwsc-row gwsc-row--open">
      <div className="gwsc-row-head">
        <span className="gwsc-gw">{t("gameweekScores.gw", { number: round.number })}</span>
        <span className="gwsc-round">{t("gameweek.roundLabel", { label: round.roundLabel })}</span>
        <span className="gwsc-total-pts">{t("leagueMember.points", { points: round.points })}</span>
      </div>
      <div className="gwsc-row-body">
        {byBreakdownOrder(round.breakdown).map((line) => (
          <PlayerScoreLine
            key={line.playerId}
            name={line.name ?? t("gameweekScores.unknownPlayer")}
            position={line.position ?? null}
            rawPoints={line.rawPoints}
            points={line.points}
            played={line.played}
            autoSubbedIn={line.autoSubbedIn}
            captainApplied={line.captainApplied}
            multiplier={line.multiplier}
          />
        ))}
      </div>
    </div>
  );
}
