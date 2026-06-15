export type MatchOutcome = "win" | "draw" | "loss";

/** Win/draw/loss from the club's perspective. */
export function matchOutcome(clubScore: number, opponentScore: number): MatchOutcome {
  if (clubScore > opponentScore) return "win";
  if (clubScore < opponentScore) return "loss";
  return "draw";
}

/** Day + short month, e.g. "14 Mar". Falls back to the raw ISO if unparseable. */
export function formatMatchDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}
