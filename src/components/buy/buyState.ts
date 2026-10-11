import type { Money, Squad, SquadConstraints } from "../../api/types";
import { eligiblePositions, solvePositions } from "./positionAssignment";

export interface BuyTarget {
  playerId: string;
  position: string | null;
  positionSecondary?: string | null;
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
  if (exceedsPositionLimits(target, target.position, squad, constraints)) {
    return { state: "blocked", reason: "position_limit" };
  }
  if (target.price.amount > squad.remainingBudget.amount) return { state: "blocked", reason: "insufficient_budget" };
  return { state: "buyable" };
}

/**
 * Backend#108: the buy fits if some assignment of every player (squad + candidate) to their
 * primary or secondary stays within the caps. A squad already over a cap can't be arranged at all,
 * so — like the backend — fall back to counting primaries; caps only ever gate new buys.
 */
function exceedsPositionLimits(target: BuyTarget, position: string, squad: Squad, constraints: SquadConstraints): boolean {
  const owned = squad.players.map((player) => eligiblePositions(player.position, player.positionSecondary));
  if (!solvePositions(owned, constraints.posLimits)) {
    const limit = constraints.posLimits[position];
    return limit != null && squad.players.filter((player) => player.position === position).length >= limit;
  }
  return !solvePositions([...owned, eligiblePositions(position, target.positionSecondary)], constraints.posLimits);
}
