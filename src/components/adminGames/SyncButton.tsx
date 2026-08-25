import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/client";
import { useTriggerAdminSync } from "../../query/hooks";

export function SyncButton() {
  const { t } = useTranslation();
  const sync = useTriggerAdminSync();

  return (
    <div className="admin-sync">
      <button type="button" className="buy-btn" onClick={() => sync.mutate()} disabled={sync.isPending}>
        {sync.isPending ? t("admin.games.syncing") : t("admin.games.syncNow")}
      </button>
      {sync.isSuccess && (
        <p className="form-note" role="status">
          {sync.data.failed.length > 0
            ? t("admin.games.syncResultWithFailures", { synced: sync.data.synced, failed: sync.data.failed.length })
            : t("admin.games.syncResult", { synced: sync.data.synced })}
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
