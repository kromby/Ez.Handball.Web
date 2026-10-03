import type { Gameweek, GameweekStatus, RoundGroup, RoundListing } from "../../api/types";

export type GameweekLabelKey = "open" | "upcoming" | "locked" | "live" | "final";

/** Maps a backend status to the UI label key. A future (non-current) Open
 *  gameweek reads as "upcoming"; the current Open one reads as "open". */
export function gameweekLabelKey(status: GameweekStatus, current: boolean): GameweekLabelKey {
  if (status === "Open") return current ? "open" : "upcoming";
  if (status === "DeadlineLocked") return "locked";
  if (status === "InPlay") return "live";
  return "final"; // Settled
}

export function isCurrent(gameweek: Gameweek, current: Gameweek | null): boolean {
  return current != null && gameweek.number === current.number;
}

export interface GameweekSections {
  hero: Gameweek | null;
  live: Gameweek[];
  comingUp: Gameweek[];
  results: Gameweek[];
}

/** True while a gameweek has matches and not all of them are final. */
export function isOngoing(gameweek: Gameweek): boolean {
  return gameweek.matches.some((m) => !m.isFinal);
}

/** The round label only adds information when it isn't just the gameweek number again. */
export function showRoundLabel(gameweek: Gameweek): boolean {
  return gameweek.roundLabel !== String(gameweek.number);
}

/** Hero = the current gameweek (or lastSettled when the season is over).
 *  Live = earlier gameweeks still being played (ascending). Coming up = numbers above the
 *  hero (ascending); results = the remaining earlier ones (descending). */
export function sectionGameweeks(
  all: Gameweek[],
  current: Gameweek | null,
  lastSettled: Gameweek | null,
): GameweekSections {
  const hero = current ?? lastSettled;
  if (!hero) return { hero: null, live: [], comingUp: [], results: [] };
  const earlier = all.filter((g) => g.number < hero.number);
  const live = earlier.filter(isOngoing).sort((a, b) => a.number - b.number);
  const comingUp = all.filter((g) => g.number > hero.number).sort((a, b) => a.number - b.number);
  const results = earlier.filter((g) => !isOngoing(g)).sort((a, b) => b.number - a.number);
  return { hero, live, comingUp, results };
}

export function roundByLabel(
  listing: RoundListing | undefined,
  roundLabel: string,
): RoundGroup | undefined {
  return listing?.rounds.find((r) => r.round === roundLabel);
}
