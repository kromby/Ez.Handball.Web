# Club page: shell + metadata + roster (`/clubs/:id`)

**Issue:** Web#42 · **Depends on:** Backend#8 (PR #91, merged to `main`) — `GET /api/clubs/{clubId}` and `GET /api/clubs/{clubId}/roster`.

## Goal

A public club page at `/clubs/:id` showing club identity (name + logo) and the current roster, with each roster player linking to the existing player detail page.

## Backend contracts (already shipped)

`GET /api/clubs/{clubId}` → `200`:

```json
{ "clubId": "...", "name": "Valur", "logoUrl": "https://…", "venue": null, "foundedYear": null }
```

`venue` and `foundedYear` are **always-null placeholders** (no data source yet).

`GET /api/clubs/{clubId}/roster` → `200`:

```json
{
  "clubId": "...",
  "season": "2025-2026",
  "players": [
    { "playerId": "...", "name": "Jón Jónsson", "jerseyNumber": "7", "position": "Skytta", "age": 24 }
  ]
}
```

Players arrive **pre-ordered** (jersey numeric asc, blank last, then name) — preserve server order. `jerseyNumber` and `age` are nullable; `position` is always present but may be a placeholder (`"Leikmaður"`). `season` is informational.

Both endpoints return `404 { "error": "club_not_found" }` for an unknown club. An existing club with no current players returns `200` with an empty `players` array.

## Architecture

Follows the existing read-page pattern (`PlayerPage`): a page component drives layout, react-query hooks own fetching, the API layer owns transport + types, and shared `StateViews` handle loading/error/not-found.

### Route

Add a **public** route in `App.tsx`, next to `/players/:playerId` (outside `ProtectedRoute`):

```tsx
<Route path="/clubs/:id" element={<ClubPage />} />
```

### API layer — `src/api/types.ts`

New types, kept distinct from the existing list-only `Club` type (used by `useClubs`) so the list contract stays clean:

```ts
export interface ClubDetail {
  clubId: string;
  name: string;
  logoUrl: string | null;
  venue: string | null;
  foundedYear: number | null;
}

export interface ClubRosterPlayer {
  playerId: string;
  name: string;
  jerseyNumber: string | null;
  position: string;
  age: number | null;
}

export interface ClubRoster {
  clubId: string;
  season: string | null;
  players: ClubRosterPlayer[];
}
```

### API layer — `src/api/endpoints.ts`

```ts
export function getClub(id: string): Promise<ClubDetail> {
  return apiGet<ClubDetail>(`/api/clubs/${encodeURIComponent(id)}`);
}

export function getClubRoster(id: string): Promise<ClubRoster> {
  return apiGet<ClubRoster>(`/api/clubs/${encodeURIComponent(id)}/roster`);
}
```

### Query hooks — `src/query/hooks.ts`

```ts
export function useClub(id: string) {
  return useQuery({ queryKey: ["club", id], queryFn: () => api.getClub(id), enabled: id.length > 0 });
}

export function useClubRoster(id: string) {
  return useQuery({ queryKey: ["club-roster", id], queryFn: () => api.getClubRoster(id), enabled: id.length > 0 });
}
```

### Page — `src/pages/ClubPage.tsx`

Structure mirrors `PlayerPage` (`section.stack`):

- `const { id = "" } = useParams();` → `useClub(id)` drives the shell.
  - `isPending` → `<Loading />`.
  - `isError` → `<ErrorView error={...} notFoundLabel={t("club.notFound")} />` (handles 404 via shared logic).
- **Header** (`div.page-head`):
  - Club logo `<img>` rendered only when `logoUrl` is non-null (no broken-image fallback).
  - Club name as `h1.title`.
  - `venue` / `foundedYear` rendered as `subtitle` bits **only when non-null** (filtered like `PlayerPage` `headerBits`). Currently always null → nothing rendered, wiring ready for when data arrives.
- **Roster** `<Panel>` with `h2.section-title` = `t("club.roster")`:
  - `useClubRoster(id)`: `isPending` → `<Loading />`; `isError` → `<ErrorView notFoundLabel={t("club.notFound")} />`; `players.length === 0` → empty state (`p.status` = `t("club.emptyRoster")`); else `<RosterTable players={...} />`.

A small local `RosterTable` sub-component (inside `ClubPage.tsx`, single consumer) renders `table.stats-table`:

| Column | Source | Notes |
|---|---|---|
| `#` | `jerseyNumber` | literal `#` header; blank jersey → empty cell |
| Name | `name` | `<Link to={/players/:playerId}>`; header reuses `t("leaderboard.player")` |
| Position | `position` | header `t("club.colPosition")`; placeholder text passes through as-is |
| Age | `age` | header `t("club.colAge")`; null → `—` |

Rows render in server order (no client re-sort).

### i18n — `src/i18n/index.ts` (is + en)

New `club` keys: `notFound`, `roster` (section title), `emptyRoster`, `colPosition`, `colAge`. Name column reuses existing `leaderboard.player`; jersey uses a literal `#`. Icelandic copy is a draft pending owner review (consistent with prior Web work).

## Error & empty handling

- Unknown club (metadata 404) → whole-page not-found state.
- Club exists, no current players → roster empty state (page shell + header still render).
- Roster request error → roster-section `ErrorView` (page header unaffected).

## Testing (`vitest`, `PlayerPage.test` style)

- Header renders club name; logo rendered only when `logoUrl` present.
- Roster rows render in server order, each name links to `/players/:playerId`.
- Empty roster → empty state.
- 404 club → not-found state.
- Null `venue`/`foundedYear` → not rendered.

## Out of scope (deferred)

- Fixtures & results section — Web#43. This page does **not** call `GET /api/clubs/{clubId}/matches`.
- Linking *into* club pages from other surfaces (leaderboard, player page, etc.) — Web#44.
