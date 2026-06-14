# Per-Gameweek Score + Breakdown + Running Total (Web) — Design Spec

**Issue:** [Web#37](https://github.com/kromby/Ez.Handball.Web/issues/37) — Per-gameweek score + breakdown + running total
**Backend:** [Backend#60](https://github.com/kromby/Ez.Handball.Backend/issues/60) gameweek engine (merged). Endpoint `GET /api/users/me/gameweeks` is live.
**Date:** 2026-06-14
**Mode:** Fantasy-only (authed)

## Goal

Show a fantasy manager their gameweek scoring once rounds settle: a **running total** plus a per-gameweek **breakdown** (per-player points, who was auto-subbed in, which player got the captain multiplier). Distinguishing live/upcoming gameweeks is out of scope here — the existing current-gameweek strip (Web#36) already handles that.

## Backend contract (fixed)

`GET /api/users/me/gameweeks` — authed, fantasy-only. Returns only **settled** gameweeks (a score row exists only once a round settles), ordered **ascending** (oldest first):

```jsonc
{
  "runningTotal": 312,
  "gameweeks": [
    {
      "roundLabel": "15. umferð",
      "points": 58,
      "captainPlayerId": "abc",       // effective captain (vice if chosen captain didn't play); may be null
      "breakdown": [
        {
          "playerId": "abc",
          "rawPoints": 9,
          "points": 18,               // rawPoints * multiplier; 0 for a non-playing unsubbed starter
          "played": true,
          "autoSubbedIn": false,
          "captainApplied": true,
          "multiplier": 2.0
        }
      ]
    }
  ]
}
```

The breakdown carries **only `playerId`** — no names or positions. The client resolves those.

## Decisions (resolved during brainstorming)

1. **Placement:** a new section on `/squad`, mounted **below** the squad grid. The pitch stays the hero; scores are history you scroll to. `/squad` is already behind `ProtectedRoute`, and its already-loaded squad data gives us player names + positions for free.
2. **Scope:** **settled results only** + running total. The live/upcoming current-gameweek strip (Web#36) already sits at the top of `/squad`, so this section does not merge the calendar or render "not-yet-settled" placeholders. Single data source: `getMyGameweeks`.
3. **Breakdown layout:** **compact line-per-player** (one line: position · name · raw→final points + badges). Closest to the existing expandable `gw-row` pattern on the calendar page.
4. **Name resolution:** join `breakdown[].playerId` against the loaded squad. A player sold since a past gameweek won't be in the current squad → fall back to a neutral label ("Unknown player"). No per-player fetches — keeps it lean; the common case (stable squad) is fully named.

## Data layer

### Types (`src/api/types.ts`)

```ts
export interface GameweekPlayerScore {
  playerId: string;
  rawPoints: number;
  points: number;        // rawPoints * multiplier; 0 for a non-playing unsubbed starter
  played: boolean;
  autoSubbedIn: boolean;
  captainApplied: boolean;
  multiplier: number;
}

export interface MyGameweekScore {
  roundLabel: string;
  points: number;
  captainPlayerId: string | null;
  breakdown: GameweekPlayerScore[];
}

export interface MyGameweeks {
  runningTotal: number;
  gameweeks: MyGameweekScore[];
}
```

### Endpoint (`src/api/endpoints.ts`)

```ts
export function getMyGameweeks(): Promise<MyGameweeks> {
  return apiGet<MyGameweeks>("/api/users/me/gameweeks");
}
```

### Hook (`src/query/hooks.ts`)

`useMyGameweeks()` — react-query wrapper mirroring the existing authed hooks (e.g. `useSquad`). Query key `["my-gameweeks"]`.

## Component structure

```
src/components/gameweek/
  GameweekScores.tsx        // section: running-total banner + list of rows; calls useMyGameweeks()
  GameweekScoreRow.tsx      // one expandable settled-gameweek row (reuses gw-row open/chevron pattern)
  PlayerScoreLine.tsx       // one player line: pos · name · raw→final pts + badges
```

`SquadPage.tsx` mounts one line after the `squad-grid` div:

```tsx
<GameweekScores squad={squad.data} />
```

`squad.data` is passed down so name/position resolution needs **no extra request** — `GameweekScores` calls `useMyGameweeks()` itself and joins each `breakdown[].playerId` against the squad's players. Players not found fall back to "Unknown player" with no position.

## Rendering

### Running-total banner

A `SketchBox`/bordered banner at the top of the section: label "Running total", the `runningTotal` number large, and a subtle "{n} gameweeks settled" caption. Hidden when there are no settled gameweeks.

### Gameweek rows

One expandable row per settled gameweek (reusing the existing `gw-row` collapse/chevron interaction):

- **Header:** `GW {n}` · round label · total points (bold).
- **Numbering:** the endpoint gives `roundLabel` but no number. Derive `GW {n}` from position in the **season-ordered** list (oldest = GW 1), consistent with how the calendar page labels gameweeks.
- **Display order:** newest gameweek first. The endpoint returns ascending, so reverse on the client; deriving the number from the original ascending index keeps GW numbers stable regardless of display order.
- **Default expand state:** the most recent gameweek expanded, the rest collapsed.

### Player line (Option A)

`position · name · {raw}→{final} pts`, with badges:

- **`C ×{multiplier}`** when `captainApplied` — amber (the existing captain accent). Multiplier comes straight from the field, so the factor is real.
- **`↑ sub`** when `autoSubbedIn` — green.
- **DNP:** a non-playing unsubbed starter (`played: false`, `points: 0`) renders dimmed / struck-through with "DNP".

**Sort within a row:** `points` descending; DNP players last.

> The compact layout deliberately does **not** claim which starter a sub replaced — the backend doesn't expose that mapping, so we show the sub badge without an "in for X" inference.

## States

- **Loading:** lightweight inline treatment (the squad above has already loaded); reuse `<Loading/>` if simpler.
- **No settled gameweeks** (`gameweeks: []`): a quiet empty note — "No gameweeks scored yet." The running-total banner is hidden.
- **Error / fantasy-not-configured:** fail silently — hide the section rather than break the squad page (it is supplementary). 401 cannot occur behind `ProtectedRoute`.

## i18n

All copy via `react-i18next`, new keys under a `gameweekScores.*` namespace in both `is` and `en`. Icelandic copy drafted for owner review (matching the established project pattern). Keys cover: running-total label + caption, "GW {n}", DNP, sub/captain badge a11y labels, and the empty note.

## Testing

Vitest + Testing Library, mirroring `gameweekCards.test.tsx`:

- `getMyGameweeks` hits `/api/users/me/gameweeks` and types correctly (in `endpoints.test.ts`).
- Running total renders; correct number of rows; newest-first order with stable derived GW numbers.
- Breakdown: captain badge shows `C ×2`; auto-sub badge renders; DNP player dimmed and sorted last; points-descending order.
- Name resolution: a player in the squad is named; a missing/sold player falls back to "Unknown player".
- Empty state (no settled gameweeks) shows the note and hides the running-total banner.

## Out of scope

- Calendar / current-gameweek status display — Web#36 (merged), the strip already on `/squad`.
- Lock-aware mutation UX (`appliedToGameweek` / `currentGameweekLocked` echo) — separate issue.
- Merging the full-season calendar to show not-yet-settled gameweeks — explicitly dropped (settled-only).
- Per-player fetches to name sold players — deferred; neutral fallback instead.

## Dependencies

- Backend#60 `GET /api/users/me/gameweeks` — live on main.
- Reuses the squad data already loaded on `/squad` (`useSquad`) and the `gw-row` expand pattern from Web#36.
