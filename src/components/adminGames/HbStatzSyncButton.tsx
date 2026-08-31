import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/client";
import { useTriggerAdminHbStatzSync } from "../../query/hooks";

export function HbStatzSyncButton({ tournamentId, round }: { tournamentId?: string; round?: string }) {
  const { t } = useTranslation();
  const sync = useTriggerAdminHbStatzSync();

  return (
    <div className="admin-sync">
      <button
        type="button"
        className="buy-btn"
        onClick={() => sync.mutate({ tournamentId, round })}
        disabled={sync.isPending}
      >
        {sync.isPending
          ? t("admin.games.hbStatzSyncing")
          : round
            ? t("admin.games.hbStatzSyncRound", { round })
            : t("admin.games.hbStatzSyncNow")}
      </button>
      {sync.isSuccess && (
        <p className="form-note" role="status">
          {sync.data.unmatched.length > 0 || sync.data.failed.length > 0
            ? t("admin.games.hbStatzSyncResultWithIssues", {
                checked: sync.data.matchesChecked,
                synced: sync.data.matchesSynced,
                unmatched: sync.data.unmatched.length,
                failed: sync.data.failed.length,
              })
            : t("admin.games.hbStatzSyncResult", {
                checked: sync.data.matchesChecked,
                synced: sync.data.matchesSynced,
              })}
        </p>
      )}
      {sync.isError && (
        <p className="form-error" role="alert">
          {sync.error instanceof ApiError && sync.error.code === "ingestion_unreachable"
            ? t("admin.games.syncUnreachable")
            : t("admin.games.syncError")}
        </p>
      )}
    </div>
  );
}
