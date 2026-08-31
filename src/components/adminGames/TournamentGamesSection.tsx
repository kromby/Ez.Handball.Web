import { useTranslation } from "react-i18next";
import type { AdminTournamentGames } from "../../api/types";
import { HbStatzSyncButton } from "./HbStatzSyncButton";
import { RoundSection } from "./RoundSection";
import { SyncButton } from "./SyncButton";
import { formatDateTime } from "./formatDateTime";

export function TournamentGamesSection({ tournament }: { tournament: AdminTournamentGames }) {
  const { t } = useTranslation();
  return (
    <section className="admin-tournament stack">
      <header className="admin-tournament-head">
        <h2 className="subtitle">{tournament.competitionName}</h2>
        <div className="admin-tournament-actions">
          <span className="admin-tournament-sync">
            {tournament.lastSyncedAt
              ? t("admin.games.lastSynced", { time: formatDateTime(tournament.lastSyncedAt) })
              : t("admin.games.neverSynced")}
          </span>
          <SyncButton />
          <HbStatzSyncButton tournamentId={tournament.tournamentId} />
        </div>
      </header>
      {tournament.rounds.length === 0 ? (
        <p className="status">{t("admin.games.noGames")}</p>
      ) : (
        tournament.rounds.map((round) => (
          <RoundSection key={round.round} tournamentId={tournament.tournamentId} round={round} />
        ))
      )}
    </section>
  );
}
