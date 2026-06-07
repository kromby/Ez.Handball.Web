import type { Money, Squad, SquadConstraints } from "../../api/types";

export interface BuyTarget {
  playerId: string;
  position: string | null;
  price: Money | null;
}

export type BuyReason = "squad_full" | "position_limit" | "insufficient_budget";

export interface BuyEvaluation {
  state: "owned" | "buyable" | "unavailable" | "blocked";
  reason?: BuyReason;
}

/** Pure mirror of the backend buy rules, in priority order. Server stays authoritative. */
export function evaluateBuy(target: BuyTarget, squad: Squad, constraints: SquadConstraints): BuyEvaluation {
  if (squad.players.some((p) => p.playerId === target.playerId)) return { state: "owned" };
  if (target.price == null || target.position == null) return { state: "unavailable" };
  if (squad.players.length >= constraints.maxSquadSize) return { state: "blocked", reason: "squad_full" };
  const limit = constraints.posLimits[target.position];
  if (limit != null && squad.players.filter((p) => p.position === target.position).length >= limit) {
    return { state: "blocked", reason: "position_limit" };
  }
  if (target.price.amount > squad.remainingBudget.amount) return { state: "blocked", reason: "insufficient_budget" };
  return { state: "buyable" };
}
