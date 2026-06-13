# Gameweek Status UI — Design Spec

**Issue:** [Web#36](https://github.com/kromby/Ez.Handball.Web/issues/36) — Gameweek status UI: consume calendar + current endpoints
**Backend:** [Backend#60](https://github.com/kromby/Ez.Handball.Backend/issues/60) (gameweek engine — built, not yet deployed)
**Date:** 2026-06-13
**Mode:** Fantasy-only, read-only

> Implementation waits until the gameweek API is deployed. The endpoint shapes below are read from the backend implementation on branch `feat/issue-60-gameweek-engine`.

## Goal

Surface the gameweek lifecycle to the manager: a current-gameweek strip on `/squad` and a full season calendar at `/gameweeks`. Read-only consumption of the new public gameweek endpoints, enriched with real fixtures from the existing rounds endpoint.

## Scope

- New public route `/gameweeks` with nav link: header, current-gameweek **hero**, **COMING UP**, and **RESULTS** sections.
- A compact **current-gameweek strip** pinned atop `/squad`.
- Live deadline countdown.
- Add `getGameweeks` / `getCurrentGameweek` (and `getRounds`) to `src/api/endpoints.ts` with types.

### Out of scope

- Per-gameweek **points** numbers and per-player breakdown → Web#37 (the RESULTS rows reserve the pts slot but render only the FINAL pill for now).
- Lock-aware buy/sell/lineup mutation UX → Web#38.
- Squad-header chrome (SQUAD VALUE / FREE TRANSFERS / PROJ POINTS pills) — only the round strip is this issue's contribution to `/squad`.

## Backend contract (as built)

### `GET /api/gameweeks` (public)
Optional `?version=` (config version; defaults to active). Defaults to the configured fantasy tournament + current season server-side — **no `tournamentId`/`season` params** (the issue text predates the implementation). Returns an array:

```jsonc
[{
  "number": 18,            // 1-based ordinal of the round in sorted order
  "roundLabel": "18",      // HSÍ round label = stable gwKey
  "tournamentId": "8444",
  "deadline": "2026-06-20T16:00:00+00:00",
  "status": "Open",        // Open | DeadlineLocked | InPlay | Settled
  "matches": [{ "matchId": "103414", "date": "...", "isFinal": false,
                "homeTeamId": "385-karlar", "awayTeamId": "392-karlar" }]
}]
```

Errors: `400 { error: "gameweek_config_missing" }`, `404 { error: "tournament_not_found" }`.

### `GET /api/gameweeks/current` (public)
Optional `?version=`. Returns `{ current, lastSettled }`, each either `null` or a gameweek object identical to the array element above. `current` = earliest gameweek whose deadline has **not** passed (null when the season is over). Same error shapes.

### `GET /api/tournaments/{tournamentId}/rounds` (public, already on main)
Fixtures grouped by the **same round label**, with club names, logos, scores, played flag, kickoff time. Joined on round label to render fixtures. `tournamentId` is read from any gameweek's `tournamentId` (all gameweeks share the configured tournament).

### Not consumed by this issue
`GET /api/users/me/gameweeks` (authed pts + breakdown) → Web#37. `POST /api/gameweeks/settle` → server/ingestion only.

## Architecture

### Data flow (Approach B — gameweek lifecycle + rounds-fixtures join)

The gameweek endpoints own the **lifecycle** (number, deadline, status); their `matches[]` carry only synthetic team IDs. The rounds endpoint owns the **rich fixtures** (names, logos, scores). Joining the two on round label gives status + real fixtures without fragile synthetic-ID parsing and without fattening the gameweek response (which the backend deliberately keeps lean).

- `/gameweeks` page: `getGameweeks()` + `getCurrentGameweek()` + `getRounds(tournamentId)`, joined on round label.
- `/squad` strip: `getCurrentGameweek()` only (count + earliest throw come from `current.matches`; no fixture names needed there).

### Status → display-label mapping (single helper)

| Backend `status` | Extra condition | UI label |
|---|---|---|
| `Open` | is the current gameweek | OPEN |
| `Open` | any other (future) gameweek | UPCOMING |
| `DeadlineLocked` | — | LOCKED |
| `InPlay` | — | LIVE |
| `Settled` | — | FINAL |

Every future gameweek is `Open` server-side (now < deadline); "current" is distinguished only via `/api/gameweeks/current`. The pill map is the single source of label truth and handles every section uniformly.

### Sectioning

Relative to `current.number`:
- `number == current.number` → **hero** card.
- `number > current.number` → **COMING UP**.
- `number < current.number` → **RESULTS**.

A postponed match can leave a past gameweek `InPlay` while a later one is current → it lands in RESULTS with a LIVE pill (handled by the pill map, no special case). If `current` is null (season over), the hero falls back to `lastSettled`; if that is also null, the page shows only RESULTS / an empty state.

### Components (`src/components/gameweek/`, pages in `src/pages/`)

- **`useCountdown(deadline)`** — hook returning the remaining interval, ticking every second with interval cleanup. Format adapts: `Dd HHh MMm` at ≥1 day, switching to `HHh MMm SSs` under a day; renders a terminal "Locked" state once the deadline passes.
- **`GameweekStatusPill`** — renders the label-map output with the four-status colour scheme (Open=amber, Live=green, Locked=grey, Final/Upcoming=muted).
- **`FixtureRow`** — `logo · name  vs  logo · name`, with kickoff time when unplayed or the real match score when played, sourced from the rounds join. Links to the existing `/matches/:matchId` page.
- **`CurrentGameweekStrip`** (mounted atop `/squad`) — Round N · "Match weekend" · `N matches · first throw {time}` · status pill · live countdown · `deadline {time}`. Derives match count + earliest throw from `current.matches`.
- **`GameweekHeroCard`** — current gameweek: title (`Gameweek {number}` + `Umferð {roundLabel}`), status pill, live countdown, fixtures (rounds join), and an "Edit your squad" CTA → `/squad`.
- **`GameweekListRow`** — collapsed COMING UP / RESULTS row; chevron **expands inline (accordion)** to reveal that round's fixtures (kickoff times for upcoming, scores for results).
- **`GameweekHeader`** — "Gameweeks" title + "Season {label} · Round {current.number} of {total}" chip (`total` = gameweek array length; `label` from the rounds response `RoundListing.season`).
- **`GameweeksPage`** (`/gameweeks`, public) — orchestrates the three queries, renders header + hero + sections, handles loading/empty/error.

### Routing & query

- Add `/gameweeks` as a **public** route in `App.tsx` (outside `ProtectedRoute`) plus a nav link in `Nav`.
- React Query hooks in `src/query/hooks.ts` mirroring existing patterns (`useGameweeks`, `useCurrentGameweek`, `useRounds(tournamentId)`); `useRounds` enabled only once a `tournamentId` is known.

### `src/api/endpoints.ts` additions (+ `types.ts`)

```ts
getCurrentGameweek(version?: number): Promise<CurrentGameweek>   // { current, lastSettled }
getGameweeks(version?: number): Promise<Gameweek[]>
getRounds(tournamentId: string): Promise<RoundListing>
```

with `Gameweek`, `GameweekStatus`, `GameweekMatch`, `CurrentGameweek`, `RoundListing`, `RoundGroup`, `RoundMatch` types. All via the public `apiGet` (no auth).

## States

- **Loading** — skeletons for hero + list rows; the squad strip shows a quiet placeholder.
- **Config missing / tournament not found** (`400 gameweek_config_missing` / `404 tournament_not_found`) — friendly "gameweeks aren't set up yet" empty state. Expected in environments where the gameweek config isn't seeded, so this must degrade gracefully rather than error.
- **Empty calendar** — empty state.
- **Logged out** — `/gameweeks` is public and renders fully (no pts anyway); the "Edit your squad" CTA links to `/squad` (which gates via `ProtectedRoute` → login).

## i18n

New `gameweek.*` keys added to both `is` and `en` resources (react-i18next, existing convention). "Match weekend" and the `Umferð {roundLabel}` secondary label are flavor copy. Icelandic strings flagged for owner review, consistent with prior i18n work.

## Testing (vitest, existing patterns)

- `useCountdown`: format thresholds (≥1 day vs under a day), tick, and the past-deadline "Locked" terminal state.
- Status→label mapping: current-vs-future `Open` split; `DeadlineLocked`→LOCKED; `InPlay`→LIVE; `Settled`→FINAL.
- Rounds join: fixture enrichment by round label; a gameweek with no matching round group renders gracefully (no names/scores, no crash).
- Sectioning: hero/coming-up/results partition relative to `current`; `InPlay` past gameweek appears in RESULTS as LIVE; `current == null` falls back to `lastSettled`.
- Page states: config-missing and not-found empty states; empty calendar; logged-out render without pts.

## Dependencies

- Backend#60 endpoints (`GET /api/gameweeks`, `GET /api/gameweeks/current`) — **deployed before implementation starts**.
- `GET /api/tournaments/{id}/rounds` (Backend#10, merged to main) for fixture enrichment.

## Follow-ups (separate Web issues)

- **Web#37** — per-gameweek points + per-player breakdown + running total (consumes `GET /api/users/me/gameweeks`); fills the RESULTS pts slot reserved here.
- **Web#38** — lock-aware buy/sell/lineup UX using the `{ appliedToGameweek, currentGameweekLocked }` mutation echo.
