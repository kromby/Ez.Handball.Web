import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { GameweekApplyEcho } from "../../api/types";
import { useCurrentGameweek } from "../../query/hooks";
import { useToast } from "../Toast";

/**
 * Returns a callback that, given a buy/sell response's gameweek echo, toasts the
 * user IF the lock fired between page load and submit (the deferral edge). The
 * baseline is the current gameweek as of the last render — strictly before this
 * action — so the mutation's own gameweek-current invalidation can't race it.
 * Subscribing to useCurrentGameweek here guarantees the baseline is cached on
 * every buy surface, not just /squad. Detection keys off appliedToGameweek vs the
 * baseline; currentGameweekLocked is part of the contract but intentionally unread
 * (it's true only when no editable gameweek exists at all — too narrow to signal
 * the common deferral).
 */
export function useGameweekApplyNotice() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data } = useCurrentGameweek();

  return useCallback(
    (echo: GameweekApplyEcho) => {
      const baseline = data?.current?.number ?? null;
      const applied = echo.appliedToGameweek;

      if (applied != null && baseline != null && applied !== baseline) {
        toast.show(t("gameweek.applyDeferred", { locked: baseline, applied }));
        return;
      }
      if (applied == null && baseline != null) {
        toast.show(t("gameweek.applyLocked"));
      }
      // baseline null (no gameweek context) or applied === baseline (happy path) → silent.
    },
    [data, t, toast],
  );
}
