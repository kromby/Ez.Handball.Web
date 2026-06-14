import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { formatMoney } from "../api/money";
import type { Money } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { useBuyPlayer, useSquad, useSquadConstraints } from "../query/hooks";
import { evaluateBuy, type BuyReason } from "./buy/buyState";
import { useGameweekApplyNotice } from "./gameweek/useGameweekApplyNotice";
import { useToast } from "./Toast";

const REASON_KEY = {
  squad_full: "buy.reasonSquadFull",
  position_limit: "buy.reasonPositionLimit",
  insufficient_budget: "buy.reasonInsufficientBudget",
} as const satisfies Record<BuyReason, string>;

export interface BuyButtonPlayer {
  playerId: string;
  name: string | null;
  position: string | null;
  price: Money | null;
}

/** Maps a buy failure (server) to a localized message key. Return type is the
 * inferred union of literal i18n keys so it satisfies the typed `t()`. */
function errorKey(err: unknown) {
  if (err instanceof ApiError) {
    if (err.violations && err.violations.length > 0) {
      const first = err.violations[0].code as BuyReason;
      if (REASON_KEY[first]) return REASON_KEY[first];
    }
    if (err.code === "no_team") return "buy.errorNoTeam";
    if (err.code === "duplicate_player") return "buy.reasonOwned";
    if (err.code === "player_not_found") return "buy.errorNotFound";
  }
  return "common.error";
}

export function BuyButton({ player }: { player: BuyButtonPlayer }) {
  const { t } = useTranslation();
  const { status } = useAuth();
  const toast = useToast();
  const squad = useSquad();
  const constraints = useSquadConstraints("fantasy", { enabled: status === "authenticated" });
  const buy = useBuyPlayer();
  const notify = useGameweekApplyNotice();

  // Hooks above run unconditionally; bail after they're called. Gating the
  // constraints query on auth keeps anonymous pages from firing a stray fetch.
  if (status !== "authenticated" || !squad.data || !constraints.data) return null;

  const ev = evaluateBuy(
    { playerId: player.playerId, position: player.position, price: player.price },
    squad.data,
    constraints.data,
  );
  const playerName = player.name ?? t("match.unknownPlayer");

  if (ev.state === "owned") {
    return (
      <button type="button" className="buy-btn buy-owned" disabled aria-label={t("buy.inSquad", { name: playerName })}>
        ✓ {t("buy.inSquadShort")}
      </button>
    );
  }

  if (ev.state === "unavailable") {
    return (
      <button type="button" className="buy-btn" disabled title={t("buy.reasonUnavailable")} aria-label={t("buy.reasonUnavailable")}>
        {t("buy.buy")}
      </button>
    );
  }

  if (ev.state === "blocked") {
    // evaluateBuy always sets a reason for "blocked"; fall back defensively rather than assert.
    const reason = t(ev.reason ? REASON_KEY[ev.reason] : "buy.reasonUnavailable");
    return (
      <button type="button" className="buy-btn" disabled title={reason} aria-label={`${t("buy.buy")} — ${reason}`}>
        {t("buy.buy")}
      </button>
    );
  }

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    buy.mutate(player.playerId, {
      onSuccess: (result) => notify(result.gameweek),
      onError: (err) => toast.show(t(errorKey(err))),
    });
  };

  return (
    <button
      type="button"
      className="buy-btn buy-btn--on"
      disabled={buy.isPending}
      aria-label={t("buy.buyName", { name: playerName })}
      onClick={onClick}
    >
      {buy.isPending ? "…" : t("buy.buyWithPrice", { price: formatMoney(player.price) })}
    </button>
  );
}
