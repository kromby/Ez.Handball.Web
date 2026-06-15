# Club fixtures & results section (Web#43)

**Issue:** [Web#43](https://github.com/kromby/Ez.Handball.Web/issues/43)
**Depends on:** Backend#8 endpoint `GET /api/clubs/{clubId}/matches` (PR Backend#91, merged); Web#42 club page shell (PR Web#45, merged).

## Goal

Show a club's current-season fixtures and results on `/clubs/:id`, framed from the
club's perspective, on top of the existing club page (header + roster).

## Decisions

- **Match layout:** card-style rows with opponent logo (like the gameweeks calendar), not a dense table.
- **Page order:** fixtures become the page focus — they sit **above** the roster.
- **Inner order:** **Upcoming** first (soonest first), then **Results** (newest first).
- **Fetch strategy:** **two calls**, one per `?status=`. Each section gets the server's
  guaranteed ordering and its own loading/error/empty state.
- **W/D/L marker:** played rows show a win/draw/loss accent derived from the score.

## API layer

`src/api/types.ts`:

```ts
export interface ClubMatch {
  matchId: string;
  tournamentId: string;
  tournamentName: string | null;
  round: string;
  date: string;            // ISO timestamp
  venue: string | null;
  status: "played" | "upcoming";
  isHome: boolean;
  opponentClubId: string;
  opponentName: string | null;
  opponentLogoUrl: string | null;
  clubScore: number | null;
  opponentScore: number | null;
}

export interface ClubMatchListing {
  clubId: string;
  season: string | null;
  matches: ClubMatch[];
}
```

`src/api/endpoints.ts`:

```ts
export function getClubMatches(id: string, status?: "played" | "upcoming"): Promise<ClubMatchListing> {
  const qs = status ? `?status=${status}` : "";
  return apiGet<ClubMatchListing>(`/api/clubs/${encodeURIComponent(id)}/matches${qs}`);
}
```

The `status` param is optional in the signature (matches the backend contract), but the
page always passes a value so each section gets server-ordered results.

## Query hooks

`src/query/hooks.ts`, mirroring `useClubRoster`:

```ts
export function useClubMatches(id: string, status: "played" | "upcoming") {
  return useQuery({
    queryKey: ["clubMatches", id, status],
    queryFn: () => api.getClubMatches(id, status),
    enabled: !!id,
  });
}
```

Distinct query keys per status keep the two sections independently cached.

## `ClubMatchRow` component

New `src/components/club/ClubMatchRow.tsx` — a card-style row. Own component (not reused
from `GameweekListRow`): the data shape and club-perspective framing differ.

- **Line 1:** opponent logo (decorative, `alt=""`, like the club header) + opponent name
  linking to `/clubs/:opponentClubId`; an **H/A** badge; right-aligned **score**
  (`clubScore–opponentScore`) for played rows, or **kickoff** (weekday + 24h via the
  existing `formatKickoff`) for upcoming rows.
- **W/D/L accent** (played only): a tiny pure helper `matchOutcome(clubScore, opponentScore)`
  returns `"win" | "draw" | "loss"`; the row renders a small marker using the existing
  color vocabulary (green / neutral / red).
- **Line 2 (meta):** `tournamentName · round · date`. Played rows show a calendar date
  (e.g. "14 Mar") via a new `formatMatchDate` helper added next to `formatKickoff`
  (the existing helper only gives weekday + time).
- Opponent name falls back gracefully when `null` (show "—" or a generic label key).

## `ClubPage` integration

Fixtures move above the roster. New structure:

```
page-head            (existing: logo + name + venue/foundedYear)
Panel — Upcoming     → useClubMatches(id, "upcoming")
Panel — Results      → useClubMatches(id, "played")
Panel — Roster       (existing, moves to bottom)
```

Each fixtures `Panel`: `section-title`, then `Loading` / `ErrorView` / empty-state / a list
of `ClubMatchRow`. Empty states are **per section** ("No upcoming matches." / "No results
yet.") so one populated section still renders while the other is empty.

The page already guards `club.isPending` / `club.isError` (404 → not-found) before rendering
the body, so an unknown club still 404s cleanly and the fixtures sections only render once
the club resolves.

## i18n keys (is/en)

Extend the existing `club` namespace:

```
club.upcoming        "Upcoming"             / "Framundan"
club.results         "Results"              / "Úrslit"
club.emptyUpcoming   "No upcoming matches." / "Engir leikir framundan."
club.emptyResults    "No results yet."      / "Engin úrslit enn."
club.home            "H"                    / "H"
club.away            "A"                    / "Ú"
club.matchesError    "Couldn't load matches." / "Tókst ekki að sækja leiki."
```

Icelandic copy is a draft pending owner review (consistent with prior i18n PRs).

## Testing

- `matchOutcome` — unit tests for win / draw / loss.
- `formatMatchDate` — unit test including the unparseable-ISO fallback.
- `ClubMatchRow` — score vs kickoff by status; W/D/L marker on played rows; opponent link
  target; null-opponent fallback; decorative logo.
- `ClubPage` — section order (Upcoming above Results above Roster); per-section
  loading / empty / error; populated one section + empty other.

## Out of scope

- Stat-leaders block (not provided by the backend; deferred).
- Match-detail navigation beyond what already exists.
- Web#44 (linking *to* club pages from other surfaces).
