import { useTranslation } from "react-i18next";
import { ApiError } from "../../api/client";
import { useSettleAdminGameweeks } from "../../query/hooks";

type SettleErrorKey =
  | "admin.games.settleConfigMissing"
  | "admin.games.settleRuleSetMissing"
  | "admin.games.settleTournamentNotFound"
  | "admin.games.settleError";

function errorKey(error: unknown): SettleErrorKey {
  const code = error instanceof ApiError ? error.code : null;
  if (code === "gameweek_config_missing") return "admin.games.settleConfigMissing";
  if (code === "rule_set_missing") return "admin.games.settleRuleSetMissing";
  if (code === "tournament_not_found") return "admin.games.settleTournamentNotFound";
  return "admin.games.settleError";
}

/** Settles every complete gameweek for all fantasy teams — the backfill and the manual re-score. */
export function SettleGameweeksButton() {
  const { t } = useTranslation();
  const settle = useSettleAdminGameweeks();

  return (
    <div className="admin-sync">
      <button type="button" className="buy-btn" onClick={() => settle.mutate()} disabled={settle.isPending}>
        {settle.isPending ? t("admin.games.settling") : t("admin.games.settleNow")}
      </button>
      {settle.isSuccess && settle.data.rounds.length === 0 && (
        <p className="form-note" role="status">{t("admin.games.settleNothing")}</p>
      )}
      {settle.isSuccess && settle.data.rounds.length > 0 && (
        <ul className="form-note admin-settle-report" role="status">
          {settle.data.rounds.map((report) => (
            <li key={report.round}>
              {t("admin.games.settleResult", {
                round: report.round,
                settled: report.settled,
                teams: report.teamsConsidered,
                notReady: report.notReady,
                skipped: report.skipped,
              })}
            </li>
          ))}
        </ul>
      )}
      {settle.isError && <p className="form-error" role="alert">{t(errorKey(settle.error))}</p>}
    </div>
  );
}
