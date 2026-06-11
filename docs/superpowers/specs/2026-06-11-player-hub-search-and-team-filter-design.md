# Player hub: search by name + filter by team (Web #29)

## Summary

Add two independent controls to the player hub filter bar:

- **Name search** — a debounced text input that filters the table by player name, driving the `name` query param.
- **Team filter** — a club dropdown alongside the existing Season / Gender / Position / Tournament dropdowns, driving the `clubId` query param.

Both are public (work logged-out), reflect into the URL so views are shareable and back-navigable, compose with all existing filters / sort / pagination, and reset the pagination offset when changed.

Per the player-hub merge design decision, these are **two separate controls**, not one combined box.

## Dependency

Requires backend [Ez.Handball.Backend#83](https://github.com/kromby/Ez.Handball.Backend/issues/83): server-side `name` (case-insensitive substring) and `clubId` (exact match) filters on `GET /api/players`, applied before sort + pagination so `total` / `offset` / `limit` stay correct. That issue is **OPEN** — this design is implemented and wired now; the filters become live when the backend ships. Until then the params are simply ignored by the API.

## Existing infrastructure (already in place)

- `getClubs()` / `useClubs()` return `Club[]` (`{ clubId, name, logoUrl }`), cached `staleTime: Infinity`.
- `getPlayers()` / `usePlayers()` build the `/api/players` request and key the query cache.
- `PlayerHubPage` has an `update(next)` helper that merges param changes into the URL, deletes params set to `""`/`undefined`, and is already used by every existing `FilterSelect`.

## Components & changes

### 1. API layer

**`src/api/endpoints.ts` — `getPlayers`:** add optional `name?: string` and `clubId?: string` params. Append to the existing `URLSearchParams` only when truthy; `name` is URL-encoded via `URLSearchParams.set` (which encodes automatically).

**`src/query/hooks.ts` — `usePlayers`:** add `name` and `clubId` to the param object and include both in the `queryKey` (e.g. `name ?? null`, `clubId ?? null`) so the cache keys off them.

### 2. New `SearchInput` component (`src/components/SearchInput.tsx`)

A small, reusable, independently testable controlled text input:

- Holds **local state** for the typed value so typing feels instant.
- Debounces ~300ms; after idle, fires `onSearch(value)`.
- Renders an inline **clear (✕)** button that empties the input and fires `onSearch("")` immediately.
- Accepts `initialValue` and re-syncs local state when it changes, so back-navigation and shared URLs populate the box.

Proposed props:

```ts
interface SearchInputProps {
  initialValue: string;
  placeholder: string;
  clearLabel: string;       // aria-label for the ✕ button
  onSearch: (value: string) => void;
}
```

### 3. `PlayerHubPage` wiring (`src/pages/PlayerHubPage.tsx`)

- Read `name` and `clubId` from search params alongside the existing reads.
- Add `useClubs()`.
- Pass `name` and `clubId` into `usePlayers({ ... })`.
- Render `<SearchInput>` as the **first** control in `.market-filters`:
  - `initialValue={name ?? ""}`, `onSearch={(v) => update({ name: v, offset: undefined })}`.
- Add a **Team** `<FilterSelect>` after the Tournament dropdown:
  - options: `[{ value: "", label: t("playerHub.allTeams") }, ...clubs sorted alphabetically by name → { value: clubId, label: name }]`
  - `onChange={(v) => update({ clubId: v, offset: undefined })}`.

Both route through the existing `update()` helper, so each change resets pagination and empty values delete the param — identical to today's filter behaviour.

## Data flow

```
type → SearchInput local state (instant)
     → 300ms debounce
     → onSearch(value)
     → update({ name: value, offset: undefined })
     → URL `name` param
     → usePlayers queryKey change
     → fetch GET /api/players?...&name=...
     → table re-renders
```

The team dropdown is synchronous (no debounce): `onChange → update({ clubId, offset: undefined })`. `useClubs()` is cached indefinitely, so the dropdown adds no extra round-trips.

## i18n

New keys in both `is` and `en` locale files:

| Key | Purpose |
| --- | --- |
| `playerHub.searchName` | Name search placeholder / label |
| `playerHub.filterTeam` | Team dropdown label |
| `playerHub.allTeams` | "All teams" option |
| `playerHub.clearSearch` | aria-label for the ✕ clear button |

Icelandic copy is flagged for owner review, per the project's standing i18n note.

## Testing

- **`SearchInput.test.tsx`**
  - Typing fires `onSearch` once after the debounce (not per keystroke).
  - Clear (✕) button empties the input and fires `onSearch("")` immediately.
  - `initialValue` seeds the input; changing it re-syncs local state.
- **`PlayerHubPage.test.tsx`** (additions)
  - Typing a name updates the `name` URL param and the `usePlayers` request.
  - Selecting a team sets the `clubId` param and the request.
  - Name + team + an existing filter compose in a single request.
  - Changing the name or team resets `offset`.
  - Clearing the name restores the unfiltered request.
- **`endpoints.test.ts`** (additions)
  - `getPlayers` emits `name` (URL-encoded) and `clubId` query params.
  - Omits both when absent.

## Out of scope

- Combined search/filter box (explicitly rejected by the issue).
- Client-side filtering or fuzzy/typeahead suggestions.
- Season-scoping the club list (the clubs endpoint is global; exact `clubId` match is sufficient).
