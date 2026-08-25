import { useTranslation } from "react-i18next";
import type { AdminRoundGames } from "../../api/types";
import { GameRow } from "./GameRow";
import { HbStatzSyncButton } from "./HbStatzSyncButton";

export function RoundSection({ tournamentId, round }: { tournamentId: string; round: AdminRoundGames }) {
  const { t } = useTranslation();
  return (
    <div className="admin-round">
      <div className="admin-round-head">
        <h3 className="admin-round-title">{t("admin.games.round", { round: round.round })}</h3>
        <HbStatzSyncButton tournamentId={tournamentId} round={round.round} />
      </div>
      <table className="stats-table">
        <thead>
          <tr>
            <th>{t("admin.games.date")}</th>
            <th>{t("admin.games.home")}</th>
            <th>{t("admin.games.away")}</th>
            <th>{t("admin.games.venue")}</th>
            <th>{t("admin.games.status")}</th>
            <th>{t("admin.games.ingested")}</th>
            <th>{t("admin.games.hbStatzIngested")}</th>
          </tr>
        </thead>
        <tbody>
          {round.games.map((g) => (
            <GameRow key={g.matchId} tournamentId={tournamentId} game={g} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
