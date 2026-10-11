/**
 * Mirror of the backend's `PositionAssignment` (Backend#108): a player may fill their primary or
 * secondary position but counts against only one. A squad fits its caps if *some* assignment of
 * players to an eligible position each stays within every cap. Squads are ≤15 players with ≤2
 * options each, so plain backtracking is instant.
 */

/** Primary first; a blank or duplicate secondary is dropped. No primary → no position known. */
export function eligiblePositions(position: string | null, positionSecondary: string | null | undefined): string[] {
  if (!position) return [];
  if (!positionSecondary?.trim() || positionSecondary === position) return [position];
  return [position, positionSecondary];
}

/** Whether every player can take one eligible position within `caps`. Uncapped positions never block. */
export function solvePositions(players: string[][], caps: Record<string, number>): boolean {
  const counts: Record<string, number> = {};

  const assignFrom = (index: number): boolean => {
    if (index === players.length) return true;
    const eligible = players[index];
    if (eligible.length === 0) return assignFrom(index + 1);

    for (const position of eligible) {
      const count = counts[position] ?? 0;
      const cap = caps[position];
      if (cap != null && count >= cap) continue;
      counts[position] = count + 1;
      if (assignFrom(index + 1)) return true;
      counts[position] = count;
    }
    return false;
  };

  return assignFrom(0);
}
