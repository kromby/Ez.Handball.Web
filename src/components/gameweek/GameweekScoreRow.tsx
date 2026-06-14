import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MyGameweekScore } from "../../api/types";
import { PlayerScoreLine } from "./PlayerScoreLine";

export interface ResolvedPlayer {
  name: string;
  position: string | null;
}

export function GameweekScoreRow({
  score,
  number,
  nameOf,
  defaultOpen,
}: {
  score: MyGameweekScore;
  number: number;
  nameOf: (playerId: string) => ResolvedPlayer;
  defaultOpen: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  // Played players by points desc; DNP (did not play) sink to the bottom.
  const lines = [...score.breakdown].sort((a, b) => {
    if (a.played !== b.played) return a.played ? -1 : 1;
    return b.points - a.points;
  });

  return (
    <div className={`gwsc-row${open ? " gwsc-row--open" : ""}`}>
      <button type="button" className="gwsc-row-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="gwsc-gw">{t("gameweekScores.gw", { number })}</span>
        <span className="gwsc-round">{t("gameweek.roundLabel", { label: score.roundLabel })}</span>
        <span className="gwsc-total-pts">{score.points}</span>
        <span className="gwsc-chevron" aria-hidden="true">{open ? "▾" : "›"}</span>
      </button>
      {open && (
        <div className="gwsc-row-body">
          {lines.map((p) => {
            const resolved = nameOf(p.playerId);
            return (
              <PlayerScoreLine
                key={p.playerId}
                name={resolved.name}
                position={resolved.position}
                rawPoints={p.rawPoints}
                points={p.points}
                played={p.played}
                autoSubbedIn={p.autoSubbedIn}
                captainApplied={p.captainApplied}
                multiplier={p.multiplier}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
