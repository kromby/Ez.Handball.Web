import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MiniLeague } from "../../api/types";
import { ApiError } from "../../api/client";
import { Panel } from "../Panel";
import { useGameweeks, useSetMiniLeagueStartRound } from "../../query/hooks";
import { StartRoundSelect, sortedRounds } from "./StartRoundSelect";

/** Lets the league's creator move the round standings count from. Renders nothing for anyone else. */
export function StartRoundPanel({ league }: { league: MiniLeague }) {
  const { t } = useTranslation();
  const gameweeks = useGameweeks();
  const save = useSetMiniLeagueStartRound(league.id);
  // Null until the creator picks a round, so the select follows the saved value after each save.
  const [picked, setPicked] = useState<string | null>(null);

  const rounds = sortedRounds(gameweeks.data);
  if (league.role !== "creator" || rounds.length === 0) return null;

  // A league saved before start rounds existed counts every round, i.e. from the first one.
  const saved = league.startRound ?? rounds[0].roundLabel;
  const value = picked ?? saved;
  const errorKey =
    save.error instanceof ApiError && save.error.code === "invalid_start_round" ? "leagues.startRoundInvalid" : "common.error";

  return (
    <Panel>
      <h2 className="label">{t("leagues.settings")}</h2>
      <StartRoundSelect
        id="leagueStartRoundSetting"
        rounds={rounds}
        value={value}
        onChange={(round) => {
          setPicked(round);
          save.reset();
        }}
        disabled={save.isPending}
      />
      {save.isError && <p className="error" role="alert">{t(errorKey)}</p>}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          className="btn btn--amber"
          disabled={save.isPending || value === saved}
          onClick={() => save.mutate(value, { onSuccess: () => setPicked(null) })}
        >
          {save.isPending ? t("leagues.saving") : t("leagues.save")}
        </button>
        {save.isSuccess && <span className="status" role="status">{t("leagues.startRoundSaved")}</span>}
      </div>
    </Panel>
  );
}
