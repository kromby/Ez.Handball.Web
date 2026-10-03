import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Squad } from "../../api/types";
import { useMyGameweeks } from "../../query/hooks";
import { GameweekScoreRow, type ResolvedPlayer } from "./GameweekScoreRow";

export function GameweekScores({ squad }: { squad: Squad | undefined }) {
  const { t } = useTranslation();
  const { data, isError } = useMyGameweeks();

  const nameOf = useMemo(() => {
    // The API resolves names for every scored player (even ones sold since); the current squad
    // is only a fallback for responses that predate that.
    const byId = new Map<string, { name?: string | null; position?: string | null }>(
      (squad?.players ?? []).map((player) => [player.playerId, player]),
    );
    for (const score of data?.gameweeks ?? []) {
      for (const entry of score.breakdown) {
        if (entry.name) byId.set(entry.playerId, entry);
      }
    }
    return (playerId: string): ResolvedPlayer => {
      const player = byId.get(playerId);
      return {
        name: player?.name ?? t("gameweekScores.unknownPlayer"),
        position: player?.position ?? null,
      };
    };
  }, [squad, data, t]);

  // Fail silently: the section is supplementary to the squad page.
  if (isError || !data) return null;

  const total = data.gameweeks.length;
  if (total === 0) {
    return (
      <section className="gwsc gwsc--empty">
        <h2 className="gwsc-heading">{t("gameweekScores.heading")}</h2>
        <p className="subtitle">{t("gameweekScores.empty")}</p>
      </section>
    );
  }

  // API order is ascending (oldest = GW 1). Number by original index, display newest first.
  const numbered = data.gameweeks.map((score, i) => ({ score, number: i + 1 }));
  const display = [...numbered].reverse();

  return (
    <section className="gwsc">
      <h2 className="gwsc-heading">{t("gameweekScores.heading")}</h2>
      <div className="gwsc-total">
        <span className="gwsc-total-label poslabel">{t("gameweekScores.runningTotal")}</span>
        <span className="gwsc-total-num">{data.runningTotal}</span>
        <span className="gwsc-total-sub">{t("gameweekScores.settledCount", { count: total })}</span>
      </div>
      <div className="gwsc-rows">
        {display.map(({ score, number }, idx) => (
          <GameweekScoreRow
            key={score.roundLabel}
            score={score}
            number={number}
            nameOf={nameOf}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </section>
  );
}
