import { useTranslation } from "react-i18next";
import { useTriggerAdminHbStatzSync } from "../../query/hooks";

// Compact inline trigger for a single game — shown next to the HBStatz badge only while it's
// off, so it naturally disappears once a sync succeeds and the games list refetches.
export function HbStatzGameSyncAction({ tournamentId, matchId }: { tournamentId: string; matchId: string }) {
  const { t } = useTranslation();
  const sync = useTriggerAdminHbStatzSync();

  return (
    <button
      type="button"
      className="admin-sync-inline-btn"
      onClick={() => sync.mutate({ tournamentId, matchId })}
      disabled={sync.isPending}
      title={sync.isError ? t("admin.games.syncUnreachable") : undefined}
    >
      {sync.isPending
        ? t("admin.games.hbStatzSyncing")
        : sync.isError
          ? t("admin.games.hbStatzSyncRetry")
          : t("admin.games.hbStatzSyncGame")}
    </button>
  );
}
