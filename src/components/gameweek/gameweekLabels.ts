import type { Gameweek, GameweekStatus, RoundGroup, RoundListing } from "../../api/types";

export type GameweekLabelKey = "open" | "upcoming" | "locked" | "live" | "final";

/** Maps a backend status to the UI label key. A future (non-current) Open
 *  gameweek reads as "upcoming"; the current Open one reads as "open". */
export function gameweekLabelKey(status: GameweekStatus, current: boolean): GameweekLabelKey {
  switch (status) {
    case "Open":
      return current ? "open" : "upcoming";
    case "DeadlineLocked":
      return "locked";
    case "InPlay":
      return "live";
    case "Settled":
      return "final";
  }
}

export function isCurrent(gameweek: Gameweek, current: Gameweek | null): boolean {
  return current != null && gameweek.number === current.number;
}

export interface GameweekSections {
  hero: Gameweek | null;
  comingUp: Gameweek[];
  results: Gameweek[];
}

/** Hero = the current gameweek (or lastSettled when the season is over).
 *  Coming up = numbers above the hero (ascending); results = below (descending). */
export function sectionGameweeks(
  all: Gameweek[],
  current: Gameweek | null,
  lastSettled: Gameweek | null,
): GameweekSections {
  const hero = current ?? lastSettled;
  if (!hero) return { hero: null, comingUp: [], results: [] };
  const comingUp = all.filter((g) => g.number > hero.number).sort((a, b) => a.number - b.number);
  const results = all.filter((g) => g.number < hero.number).sort((a, b) => b.number - a.number);
  return { hero, comingUp, results };
}

export function roundByLabel(
  listing: RoundListing | undefined,
  roundLabel: string,
): RoundGroup | undefined {
  return listing?.rounds.find((r) => r.round === roundLabel);
}
