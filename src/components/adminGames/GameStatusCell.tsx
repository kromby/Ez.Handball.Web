import { useTranslation } from "react-i18next";
import type { AdminGameStatus } from "../../api/types";
import { useSetMatchFinalOverride } from "../../query/hooks";
import { StatusBadge } from "../StatusBadge";

/** A game's hsi.is status, plus the admin "mark final" override for a played game hsi.is never
 *  finalised (Backend#147) — without it, that game's whole round can't be scored. */
export function GameStatusCell({ game }: { game: AdminGameStatus }) {
  const { t } = useTranslation();
  const override = useSetMatchFinalOverride();
  // Only an ingested game whose throw-off has passed can have been played but left non-final.
  const stuck = !game.finalOverride && game.status !== "played" && game.ingested && new Date(game.date).getTime() < Date.now();

  if (game.status === "played") {
    return <StatusBadge on onLabel={t("admin.games.statusPlayed")} offLabel={t("admin.games.statusUpcoming")} />;
  }

  if (!game.finalOverride && !stuck) {
    return <StatusBadge on={false} onLabel={t("admin.games.statusPlayed")} offLabel={t("admin.games.statusUpcoming")} />;
  }

  return (
    <div className="admin-hbstatz-cell">
      <StatusBadge
        on={game.finalOverride}
        onLabel={t("admin.games.statusFinalOverride")}
        offLabel={t("admin.games.statusNotFinal", { code: game.hsiStatus || "—" })}
      />
      <button
        type="button"
        className="admin-sync-inline-btn"
        onClick={() => override.mutate({ matchId: game.matchId, finalOverride: !game.finalOverride })}
        disabled={override.isPending}
        title={game.finalOverride ? undefined : t("admin.games.markFinalHint")}
      >
        {game.finalOverride ? t("admin.games.undoFinal") : t("admin.games.markFinal")}
      </button>
      {override.isError && <span className="form-error" role="alert">{t("admin.games.finalOverrideError")}</span>}
    </div>
  );
}
