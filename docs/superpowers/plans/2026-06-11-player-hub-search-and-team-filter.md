# Player Hub: Search by Name + Filter by Team — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a debounced name-search text input and a team (club) dropdown to the player hub filter bar, both reflecting into the URL and composing with existing filters/sort/pagination.

**Architecture:** The API layer (`getPlayers`/`usePlayers`) gains two optional params (`name`, `clubId`). A new reusable `SearchInput` component owns a debounced text input. `PlayerHubPage` renders the search box first in its existing `.market-filters` row and a Team `FilterSelect` (fed by the already-cached `useClubs()`) after the Tournament dropdown — both routed through the page's existing `update()` helper so they reset pagination and sync the URL exactly like today's filters.

**Tech Stack:** React 18, TypeScript, react-router-dom (`useSearchParams`), @tanstack/react-query, react-i18next, Vitest + @testing-library/react + @testing-library/user-event.

**Spec:** `docs/superpowers/specs/2026-06-11-player-hub-search-and-team-filter-design.md`

**Dependency note:** Backend [Ez.Handball.Backend#83](https://github.com/kromby/Ez.Handball.Backend/issues/83) (`name`/`clubId` query params on `GET /api/players`) is OPEN. This plan wires the UI and params now; the API ignores unknown params until #83 ships, so the UI is harmless to merge ahead of it.

**Run all tests with:** `npm test` (alias for `vitest run`). Run a single file with `npx vitest run <path>`.

---

## File Structure

- **Modify** `src/api/endpoints.ts` — add `name`/`clubId` to `getPlayers`.
- **Modify** `src/api/endpoints.test.ts` — assert the new query params.
- **Create** `src/components/SearchInput.tsx` — debounced text input with clear button.
- **Create** `src/components/SearchInput.test.tsx` — unit tests for the input.
- **Modify** `src/query/hooks.ts` — add `name`/`clubId` to `usePlayers` params + query key.
- **Modify** `src/i18n/locales/en.json` and `src/i18n/locales/is.json` — 4 new `playerHub` keys.
- **Modify** `src/pages/PlayerHubPage.tsx` — wire search box + team dropdown.
- **Modify** `src/pages/PlayerHubPage.test.tsx` — mock `getClubs`, test name/team/compose/reset.

---

## Task 1: API layer — `getPlayers` accepts `name` and `clubId`

**Files:**
- Modify: `src/api/endpoints.ts:94-113`
- Test: `src/api/endpoints.test.ts`

- [ ] **Step 1: Write the failing tests**

Add these two tests to `src/api/endpoints.test.ts` (after the existing `getPlayers omits empty params` test near line 130). They reuse the file's existing `spyGet()` helper (which spies on `client.apiGet`) and read the URL via `spy.mock.calls[0][0]`, exactly like the existing `getPlayers` tests:

```ts
test("getPlayers includes name and clubId filters", async () => {
  const spy = spyGet();
  await getPlayers({ name: "berg ström", clubId: "385", sort: "Goals" });
  const url = spy.mock.calls[0][0] as string;
  expect(url).toContain("/api/players?");
  expect(url).toContain("name=berg+str%C3%B6m");
  expect(url).toContain("clubId=385");
});

test("getPlayers omits name and clubId when absent", async () => {
  const spy = spyGet();
  await getPlayers({ sort: "Goals" });
  const url = spy.mock.calls[0][0] as string;
  expect(url).not.toContain("name=");
  expect(url).not.toContain("clubId=");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/api/endpoints.test.ts`
Expected: FAIL — `name=...` / `clubId=...` not present in the URL.

- [ ] **Step 3: Add the params to `getPlayers`**

In `src/api/endpoints.ts`, edit `getPlayers` (lines 94-113) to add the two params and append them. Final function:

```ts
export function getPlayers(params: {
  season?: string;
  tournamentId?: string;
  gender?: string;
  position?: string;
  name?: string;
  clubId?: string;
  sort?: PoolSort;
  offset?: number;
  limit?: number;
}): Promise<PlayerPool> {
  const sp = new URLSearchParams();
  if (params.season) sp.set("season", params.season);
  if (params.tournamentId) sp.set("tournamentId", params.tournamentId);
  if (params.gender) sp.set("gender", params.gender);
  if (params.position) sp.set("position", params.position);
  if (params.name) sp.set("name", params.name);
  if (params.clubId) sp.set("clubId", params.clubId);
  if (params.sort) sp.set("sort", params.sort);
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiGet<PlayerPool>(`/api/players${qs ? `?${qs}` : ""}`);
}
```

(`URLSearchParams.set` URL-encodes values automatically — spaces become `+`, `ö` becomes `%C3%B6`.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/api/endpoints.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/endpoints.ts src/api/endpoints.test.ts
git commit -m "feat(api): getPlayers accepts name and clubId filters (Web#29)"
```

---

## Task 2: `SearchInput` component

A controlled text input with instant local state, a ~300ms debounce that fires `onSearch`, and an inline clear (✕) button. Re-syncs to `initialValue` when it changes (back-nav / shared URLs).

**Files:**
- Create: `src/components/SearchInput.tsx`
- Test: `src/components/SearchInput.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/SearchInput.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SearchInput } from "./SearchInput";

afterEach(() => vi.restoreAllMocks());

test("fires onSearch once after the user stops typing", async () => {
  const onSearch = vi.fn();
  render(<SearchInput initialValue="" placeholder="Search" clearLabel="Clear" onSearch={onSearch} />);
  await userEvent.type(screen.getByPlaceholderText("Search"), "berg");
  await waitFor(() => expect(onSearch).toHaveBeenCalledWith("berg"));
  // Debounced: the final call carries the full term, not one call per keystroke.
  expect(onSearch).toHaveBeenLastCalledWith("berg");
});

test("clear button empties the input and fires onSearch with empty string", async () => {
  const onSearch = vi.fn();
  render(<SearchInput initialValue="berg" placeholder="Search" clearLabel="Clear search" onSearch={onSearch} />);
  const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
  expect(input.value).toBe("berg");
  await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(input.value).toBe("");
  await waitFor(() => expect(onSearch).toHaveBeenCalledWith(""));
});

test("seeds the input from initialValue and re-syncs when it changes", () => {
  const { rerender } = render(
    <SearchInput initialValue="abc" placeholder="Search" clearLabel="Clear" onSearch={vi.fn()} />,
  );
  expect((screen.getByPlaceholderText("Search") as HTMLInputElement).value).toBe("abc");
  rerender(<SearchInput initialValue="xyz" placeholder="Search" clearLabel="Clear" onSearch={vi.fn()} />);
  expect((screen.getByPlaceholderText("Search") as HTMLInputElement).value).toBe("xyz");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/SearchInput.test.tsx`
Expected: FAIL — `Cannot find module './SearchInput'`.

- [ ] **Step 3: Implement `SearchInput`**

Create `src/components/SearchInput.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export function SearchInput({
  initialValue,
  placeholder,
  clearLabel,
  onSearch,
}: {
  initialValue: string;
  placeholder: string;
  clearLabel: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Re-seed local state when the external value changes (back-nav, shared URL).
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function commit(next: string) {
    setValue(next);
  }

  // Debounce the outgoing search whenever the typed value changes.
  useEffect(() => {
    if (value === initialValue) return; // no-op on the seed pass
    const id = setTimeout(() => onSearchRef.current(value), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value, initialValue]);

  function clear() {
    setValue("");
    onSearchRef.current("");
  }

  return (
    <div className="search-input">
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value)}
      />
      {value !== "" && (
        <button type="button" className="search-input-clear" aria-label={clearLabel} onClick={clear}>
          ✕
        </button>
      )}
    </div>
  );
}
```

Notes for the implementer:
- `onSearchRef` keeps the debounce effect from re-firing just because the parent passed a new `onSearch` identity each render.
- The `if (value === initialValue) return;` guard stops the seed/re-sync pass from firing a redundant search.
- The clear button fires `onSearch("")` immediately (no debounce), matching the spec.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/SearchInput.test.tsx`
Expected: PASS (all 3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchInput.tsx src/components/SearchInput.test.tsx
git commit -m "feat(web): add debounced SearchInput component (Web#29)"
```

---

## Task 3: i18n keys for search + team filter

**Files:**
- Modify: `src/i18n/locales/en.json:196-223` (the `playerHub` block)
- Modify: `src/i18n/locales/is.json:196-...` (the `playerHub` block)

- [ ] **Step 1: Add keys to `en.json`**

In the `playerHub` object in `src/i18n/locales/en.json`, add these four keys (place them after `"allTournaments"`):

```json
    "searchName": "Search players",
    "filterTeam": "Team",
    "allTeams": "All teams",
    "clearSearch": "Clear search",
```

Ensure the preceding line keeps its trailing comma and JSON stays valid.

- [ ] **Step 2: Add keys to `is.json`**

In the `playerHub` object in `src/i18n/locales/is.json`, add the matching keys (Icelandic; flagged for owner review per the project i18n note):

```json
    "searchName": "Leita að leikmönnum",
    "filterTeam": "Lið",
    "allTeams": "Öll lið",
    "clearSearch": "Hreinsa leit",
```

- [ ] **Step 3: Verify JSON parses**

Run: `node -e "require('./src/i18n/locales/en.json'); require('./src/i18n/locales/is.json'); console.log('ok')"`
Expected: prints `ok` (no JSON parse error).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/is.json
git commit -m "i18n(web): add search + team filter keys (Web#29)"
```

---

## Task 4: Wire `usePlayers`, search box, and team dropdown into the hub

**Files:**
- Modify: `src/query/hooks.ts:176-191` (`usePlayers`)
- Modify: `src/pages/PlayerHubPage.tsx`
- Test: `src/pages/PlayerHubPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

First update the `mock()` helper in `src/pages/PlayerHubPage.test.tsx` so `useClubs` (newly used by the page) is stubbed. Add this line inside `mock()`, before the `return`:

```ts
  vi.spyOn(api, "getClubs").mockResolvedValue([
    { clubId: "1", name: "Catalunya", logoUrl: null },
    { clubId: "385", name: "Akureyri", logoUrl: null },
  ]);
```

Then add these tests to the end of `src/pages/PlayerHubPage.test.tsx`:

```ts
test("typing a name re-queries getPlayers with the name filter", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  await userEvent.type(screen.getByRole("searchbox", { name: /Search players/i }), "berg");
  await waitFor(() => expect(spy.mock.calls.some(([p]) => p.name === "berg")).toBe(true));
});

test("selecting a team re-queries getPlayers with that clubId", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Team/i }), "385");
  await waitFor(() => expect(spy.mock.calls.some(([p]) => p.clubId === "385")).toBe(true));
});

test("name seeds from the URL and composes with an existing filter", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, {
    initialEntries: ["/players?name=berg&position=CB"],
  });
  await screen.findByText("Bergström");
  await waitFor(() =>
    expect(spy.mock.calls.some(([p]) => p.name === "berg" && p.position === "CB")).toBe(true),
  );
  expect((screen.getByRole("searchbox", { name: /Search players/i }) as HTMLInputElement).value).toBe("berg");
});

test("changing the team resets the pagination offset", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, {
    initialEntries: ["/players?offset=50"],
  });
  await screen.findByText("Bergström");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Team/i }), "385");
  await waitFor(() =>
    expect(spy.mock.calls.some(([p]) => p.clubId === "385" && (p.offset ?? 0) === 0)).toBe(true),
  );
});
```

Add `waitFor` to the imports at the top of the file:

```ts
import { screen, waitFor } from "@testing-library/react";
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/pages/PlayerHubPage.test.tsx`
Expected: FAIL — no `searchbox`/`Team` controls, and `getPlayers` is never called with `name`/`clubId`.

- [ ] **Step 3: Add `name`/`clubId` to `usePlayers`**

In `src/query/hooks.ts`, edit `usePlayers` (lines 176-191) to thread the two params through and into the query key:

```ts
export function usePlayers(params: {
  season?: string;
  tournamentId?: string;
  gender?: string;
  position?: string;
  name?: string;
  clubId?: string;
  sort?: PoolSort;
  offset?: number;
  limit?: number;
}, options: { enabled?: boolean } = {}) {
  const { season, tournamentId, gender, position, name, clubId, sort, offset, limit } = params;
  return useQuery({
    queryKey: ["players", season ?? null, tournamentId ?? null, gender ?? null, position ?? null, name ?? null, clubId ?? null, sort ?? "Goals", offset ?? 0, limit ?? 50],
    queryFn: () => api.getPlayers(params),
    enabled: options.enabled ?? true,
  });
}
```

- [ ] **Step 4: Wire the page — read params, fetch clubs, render controls**

In `src/pages/PlayerHubPage.tsx`:

(a) Add `useClubs` to the hooks import (line 11-13 block):

```ts
import {
  useClubs, useGenders, usePlayers, useSeasons, useShortlist, useSquad, useSquadConstraints, useTournaments,
} from "../query/hooks";
```

(b) Add the `SearchInput` import near the `FilterSelect` import (line 5):

```ts
import { SearchInput } from "../components/SearchInput";
```

(c) Read the two new params alongside the existing reads (after line 33, `tournamentId`):

```ts
  const name = params.get("name") ?? undefined;
  const clubId = params.get("clubId") ?? undefined;
```

(d) Add the clubs query near the other queries (after line 41, `useTournaments`):

```ts
  const clubs = useClubs();
```

(e) Pass the params into `usePlayers` (the call at lines 47-50):

```ts
  const players = usePlayers(
    { season, tournamentId, gender, position, name, clubId, sort, offset, limit: LIMIT },
    { enabled: ready },
  );
```

(f) Render `<SearchInput>` as the **first** child of `.market-filters` (immediately after the opening `<div className="market-filters">` at line 89):

```tsx
        <SearchInput
          initialValue={name ?? ""}
          placeholder={t("playerHub.searchName")}
          clearLabel={t("playerHub.clearSearch")}
          onSearch={(v) => update({ name: v, offset: undefined })}
        />
```

(g) Add the Team dropdown immediately **after** the Tournament `FilterSelect` (after its closing `/>` at line 113), before the Sort dropdown:

```tsx
        <FilterSelect
          label={t("playerHub.filterTeam")}
          value={clubId ?? ""}
          options={[
            { value: "", label: t("playerHub.allTeams") },
            ...[...(clubs.data ?? [])]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => ({ value: c.clubId, label: c.name })),
          ]}
          onChange={(v) => update({ clubId: v, offset: undefined })}
        />
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/pages/PlayerHubPage.test.tsx`
Expected: PASS (existing tests + 4 new ones).

- [ ] **Step 6: Commit**

```bash
git add src/query/hooks.ts src/pages/PlayerHubPage.tsx src/pages/PlayerHubPage.test.tsx
git commit -m "feat(web): name search + team filter in player hub (Web#29)"
```

---

## Task 5: Full suite + lint green

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: PASS — no regressions across the suite.

- [ ] **Step 2: Lint / typecheck**

Run: `npm run lint` (if present) and `npx tsc --noEmit`
Expected: clean. Fix any type or lint errors surfaced by the new code.

- [ ] **Step 3: Optional manual check**

Run `npm run dev`, open the player hub, type a name (table narrows after the pause), pick a team, confirm both reflect into the URL and a browser back restores the prior state. Note: actual narrowing requires backend #83 deployed; against current prod the params are accepted but ignored.

---

## Self-Review notes

- **Spec coverage:** name search (Task 2 + 4) ✓; team filter (Task 4) ✓; URL reflection via `update()` ✓; offset reset on change (Task 4 tests) ✓; public/logged-out — no auth gate added ✓; debounced live behaviour (Task 2) ✓; inline placement first-in-bar + team after tournament (Task 4) ✓; i18n keys (Task 3) ✓; API params + encoding (Task 1) ✓; tests for each filter alone, composed, and reset (Tasks 1/2/4) ✓.
- **Type consistency:** `SearchInput` prop names (`initialValue`, `placeholder`, `clearLabel`, `onSearch`) identical across Tasks 2 and 4. `getPlayers`/`usePlayers` param names (`name`, `clubId`) identical across Tasks 1 and 4. `Club` fields (`clubId`, `name`) match the existing `Club` type.
- **No placeholders:** every code step shows complete code; no TBDs.
