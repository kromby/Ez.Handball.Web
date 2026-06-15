# Club Page Shell + Metadata + Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public club page at `/clubs/:id` showing club name + logo and the current roster, with each roster player linking to the existing player detail page.

**Architecture:** Follows the existing read-page pattern (`PlayerPage`): a page component owns layout, react-query hooks own fetching, the API layer (`endpoints.ts` + `types.ts`) owns transport + types, and shared `StateViews` handle loading/error/not-found. Two backend endpoints (Backend#8, already on `main`) supply data: `GET /api/clubs/{id}` (metadata) and `GET /api/clubs/{id}/roster`.

**Tech Stack:** React + TypeScript, react-router-dom, @tanstack/react-query, react-i18next, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-15-club-page-shell-roster-design.md`
**Branch:** `feat/web42-club-page`

---

## File Structure

- `src/api/types.ts` — add `ClubDetail`, `ClubRosterPlayer`, `ClubRoster` interfaces (modify).
- `src/api/endpoints.ts` — add `getClub`, `getClubRoster` (modify).
- `src/query/hooks.ts` — add `useClub`, `useClubRoster` (modify).
- `src/i18n/locales/en.json` + `is.json` — add `club` copy block (modify).
- `src/pages/ClubPage.tsx` — new page + local `RosterTable` sub-component (create).
- `src/pages/ClubPage.test.tsx` — page tests (create).
- `src/App.tsx` — register `/clubs/:id` route (modify).

---

## Task 1: API types, endpoint functions, and query hooks

**Files:**
- Modify: `src/api/types.ts`
- Modify: `src/api/endpoints.ts`
- Modify: `src/query/hooks.ts`

This is plumbing the page tests in Task 3 depend on (they `vi.spyOn(api, "getClub")`). No standalone test; verified by typecheck/build here and exercised by Task 3.

- [ ] **Step 1: Add the types**

In `src/api/types.ts`, after the existing `Club` interface (the `{ clubId; name; logoUrl }` block near line 195), add:

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

- [ ] **Step 2: Add the endpoint functions**

In `src/api/endpoints.ts`, add `ClubDetail` and `ClubRoster` to the type import block from `./types`. Then add these functions next to the existing `getClubs`:

```ts
export function getClub(id: string): Promise<ClubDetail> {
  return apiGet<ClubDetail>(`/api/clubs/${encodeURIComponent(id)}`);
}

export function getClubRoster(id: string): Promise<ClubRoster> {
  return apiGet<ClubRoster>(`/api/clubs/${encodeURIComponent(id)}/roster`);
}
```

- [ ] **Step 3: Add the query hooks**

In `src/query/hooks.ts`, add next to the existing `useClubs`:

```ts
export function useClub(id: string) {
  return useQuery({
    queryKey: ["club", id],
    queryFn: () => api.getClub(id),
    enabled: id.length > 0,
  });
}

export function useClubRoster(id: string) {
  return useQuery({
    queryKey: ["club-roster", id],
    queryFn: () => api.getClubRoster(id),
    enabled: id.length > 0,
  });
}
```

- [ ] **Step 4: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/api/types.ts src/api/endpoints.ts src/query/hooks.ts
git commit -m "feat: add club detail + roster API types, endpoints, hooks (Web#42)"
```

---

## Task 2: i18n copy

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/is.json`

- [ ] **Step 1: Add the English `club` block**

In `src/i18n/locales/en.json`, add a top-level `"club"` key (place it right after the `"player"` block for readability). Mind the trailing comma on the preceding `}`:

```json
  "club": {
    "notFound": "Club not found",
    "roster": "Roster",
    "emptyRoster": "No players on the current roster.",
    "colPosition": "Position",
    "colAge": "Age"
  },
```

- [ ] **Step 2: Add the Icelandic `club` block**

In `src/i18n/locales/is.json`, add the parallel block (Icelandic copy is a draft pending owner review):

```json
  "club": {
    "notFound": "Félag fannst ekki",
    "roster": "Leikmannahópur",
    "emptyRoster": "Engir leikmenn í núverandi hópi.",
    "colPosition": "Staða",
    "colAge": "Aldur"
  },
```

- [ ] **Step 3: Verify both JSON files parse**

Run: `node -e "require('./src/i18n/locales/en.json'); require('./src/i18n/locales/is.json'); console.log('ok')"`
Expected: prints `ok` (no JSON syntax error).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/is.json
git commit -m "i18n: add club page copy (is/en) (Web#42)"
```

---

## Task 3: ClubPage component (TDD)

**Files:**
- Test: `src/pages/ClubPage.test.tsx`
- Create: `src/pages/ClubPage.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/ClubPage.test.tsx`:

```tsx
import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import ClubPage from "./ClubPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ApiError } from "../api/client";

afterEach(() => vi.restoreAllMocks());

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/clubs/:id" element={<ClubPage />} />
      <Route path="/players/:playerId" element={<div>player page</div>} />
    </Routes>,
    { initialEntries: ["/clubs/c1"] },
  );
}

test("renders club name and roster rows in server order with player links", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1",
    name: "Valur",
    logoUrl: "https://example.test/valur.png",
    venue: null,
    foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1",
    season: "2025-2026",
    players: [
      { playerId: "p7", name: "Jón Jónsson", jerseyNumber: "7", position: "Skytta", age: 24 },
      { playerId: "p9", name: "Geir Geirsson", jerseyNumber: null, position: "Leikmaður", age: null },
    ],
  });

  setup();

  expect(await screen.findByRole("heading", { name: "Valur" })).toBeInTheDocument();

  const rows = await screen.findAllByRole("row");
  // rows[0] is the header row; data rows preserve server order.
  const first = within(rows[1]);
  expect(first.getByRole("link", { name: "Jón Jónsson" })).toHaveAttribute("href", "/players/p7");
  expect(first.getByText("7")).toBeInTheDocument();
  expect(first.getByText("Skytta")).toBeInTheDocument();
  expect(first.getByText("24")).toBeInTheDocument();

  const second = within(rows[2]);
  expect(second.getByRole("link", { name: "Geir Geirsson" })).toHaveAttribute("href", "/players/p9");
  // null age renders an em dash.
  expect(second.getByText("—")).toBeInTheDocument();
});

test("renders an empty state when the club has no players", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });

  setup();

  expect(await screen.findByText("No players on the current roster.")).toBeInTheDocument();
});

test("renders a not-found state when the club is unknown (404)", async () => {
  vi.spyOn(api, "getClub").mockRejectedValue(new ApiError(404, "club_not_found", "not found"));
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: null, players: [],
  });

  setup();

  expect(await screen.findByText("Club not found")).toBeInTheDocument();
});

test("does not render venue or founded year while they are null", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });

  setup();

  await screen.findByRole("heading", { name: "Valur" });
  // No logo img is rendered when logoUrl is null.
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --root src src/pages/ClubPage.test.tsx`
Expected: FAIL — `Cannot find module './ClubPage'` (component does not exist yet).

- [ ] **Step 3: Write the ClubPage component**

Create `src/pages/ClubPage.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import type { ClubRosterPlayer } from "../api/types";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useClub, useClubRoster } from "../query/hooks";

function RosterTable({ players }: { players: ClubRosterPlayer[] }) {
  const { t } = useTranslation();
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th className="num">#</th>
          <th>{t("leaderboard.player")}</th>
          <th>{t("club.colPosition")}</th>
          <th className="num">{t("club.colAge")}</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr key={player.playerId}>
            <td className="num">{player.jerseyNumber ?? ""}</td>
            <td>
              <Link to={`/players/${encodeURIComponent(player.playerId)}`}>{player.name}</Link>
            </td>
            <td>{player.position}</td>
            <td className="num">{player.age ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ClubPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const club = useClub(id);
  const roster = useClubRoster(id);

  if (club.isPending) return <Loading />;
  if (club.isError) return <ErrorView error={club.error} notFoundLabel={t("club.notFound")} />;

  const c = club.data;
  const headerBits = [c.venue, c.foundedYear != null ? String(c.foundedYear) : null].filter(Boolean);

  return (
    <section className="stack">
      <div className="page-head">
        <div className="title-row">
          {c.logoUrl && <img className="club-logo" src={c.logoUrl} alt="" />}
          <h1 className="title">{c.name}</h1>
        </div>
        {headerBits.length > 0 && <p className="subtitle">{headerBits.join(" · ")}</p>}
      </div>

      <Panel>
        <h2 className="section-title">{t("club.roster")}</h2>
        {roster.isPending && <Loading />}
        {roster.isError && <ErrorView error={roster.error} notFoundLabel={t("club.notFound")} />}
        {roster.data &&
          (roster.data.players.length === 0 ? (
            <p className="status">{t("club.emptyRoster")}</p>
          ) : (
            <RosterTable players={roster.data.players} />
          ))}
      </Panel>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run --root src src/pages/ClubPage.test.tsx`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ClubPage.tsx src/pages/ClubPage.test.tsx
git commit -m "feat: add club page with header + roster table (Web#42)"
```

---

## Task 4: Register the route

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import and register the public route**

In `src/App.tsx`, add the import alongside the other page imports:

```tsx
import ClubPage from "./pages/ClubPage";
```

Then add the route inside the public `<Routes>` block, next to the `/players/:playerId` route (it must stay **outside** the `<ProtectedRoute>` element so club pages are public):

```tsx
<Route path="/clubs/:id" element={<ClubPage />} />
```

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run --root src`
Expected: PASS — all suites green, including the 4 new ClubPage tests.

> Note: run vitest with `--root src`. A stray `.worktrees/player-retired-badge` checkout has historically broken unscoped runs.

- [ ] **Step 3: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register /clubs/:id route (Web#42)"
```

---

## Self-Review Notes

- **Spec coverage:** route (Task 4) · `getClub`/`getClubRoster` + types (Task 1) · query hooks (Task 1) · header with name+logo and null-guarded venue/foundedYear (Task 3) · roster table preserving server order with player links (Task 3) · 404 + empty states (Task 3) · i18n is/en (Task 2) · tests (Task 3, Task 4 full run). All covered.
- **Out of scope (not implemented here):** fixtures/results (Web#43), linking into club pages (Web#44).
- **Type consistency:** `ClubDetail`/`ClubRoster`/`ClubRosterPlayer` defined in Task 1 are the exact types consumed in Tasks 1 (hooks) and 3 (page). `useClub`/`useClubRoster` names are consistent across hooks and page.
