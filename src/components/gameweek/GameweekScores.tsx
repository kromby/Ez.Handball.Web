import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../api/endpoints";
import type { Squad } from "../../api/types";
import { GameweekScoreRow, type ResolvedPlayer } from "./GameweekScoreRow";

export function GameweekScores({ squad }: { squad: Squad | undefined }) {
  const { t } = useTranslation();
  // Component lives behind a ProtectedRoute — auth is guaranteed; no need to gate here.
  const { data, isError } = useQuery({
    queryKey: ["my-gameweeks"],
    queryFn: () => api.getMyGameweeks(),
  });

  const nameOf = useMemo(() => {
    const byId = new Map((squad?.players ?? []).map((p) => [p.playerId, p]));
    return (playerId: string): ResolvedPlayer => {
      const p = byId.get(playerId);
      return {
        name: p?.name ?? t("gameweekScores.unknownPlayer"),
        position: p?.position ?? null,
      };
    };
  }, [squad, t]);

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
