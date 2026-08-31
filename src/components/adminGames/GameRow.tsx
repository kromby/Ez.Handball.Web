import { useTranslation } from "react-i18next";
import type { AdminGameStatus } from "../../api/types";
import { StatusBadge } from "../StatusBadge";
import { formatDateTime } from "./formatDateTime";
import { HbStatzGameSyncAction } from "./HbStatzGameSyncAction";

export function GameRow({ tournamentId, game }: { tournamentId: string; game: AdminGameStatus }) {
  const { t } = useTranslation();
  return (
    <tr>
      <td>{formatDateTime(game.date)}</td>
      <td>{game.homeTeamName}</td>
      <td>{game.awayTeamName}</td>
      <td>{game.venue ?? "—"}</td>
      <td>
        <StatusBadge
          on={game.status === "played"}
          onLabel={t("admin.games.statusPlayed")}
          offLabel={t("admin.games.statusUpcoming")}
        />
      </td>
      <td>
        <StatusBadge on={game.ingested} onLabel={t("admin.tournaments.on")} offLabel={t("admin.tournaments.off")} />
      </td>
      <td>
        <div className="admin-hbstatz-cell">
          <StatusBadge on={game.hbStatzIngested} onLabel={t("admin.tournaments.on")} offLabel={t("admin.tournaments.off")} />
          {!game.hbStatzIngested && game.status === "played" && (
            <HbStatzGameSyncAction tournamentId={tournamentId} matchId={game.matchId} />
          )}
        </div>
      </td>
    </tr>
  );
}
