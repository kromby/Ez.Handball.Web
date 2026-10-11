import type { GameweekPlayerScore } from "../../api/types";

/** Played players by points desc; DNP (did not play) sink to the bottom. */
export function byBreakdownOrder(breakdown: GameweekPlayerScore[]): GameweekPlayerScore[] {
  return [...breakdown].sort((first, second) => {
    if (first.played !== second.played) return first.played ? -1 : 1;
    return second.points - first.points;
  });
}
