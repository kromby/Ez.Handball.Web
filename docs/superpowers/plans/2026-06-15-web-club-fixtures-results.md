# Club Fixtures & Results Section (Web#43) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a club-perspective fixtures & results section (Upcoming above Results above the existing roster) to the `/clubs/:id` page.

**Architecture:** Two `?status=`-filtered React Query hooks feed two `Panel` sections rendered above the roster. A reusable `ClubMatchRow` card displays opponent logo/name, H/A badge, score-or-kickoff, a win/draw/loss color accent on played rows, and a competition·round·date meta line. Pure helpers (`matchOutcome`, `formatMatchDate`) are unit-tested in isolation.

**Tech Stack:** React 18, TypeScript, React Query (`@tanstack/react-query`), react-router-dom, react-i18next, Vitest + Testing Library.

> **Test command note:** A stray `.worktrees/player-retired-badge` directory pollutes an unscoped `vitest run`. Always scope test runs with `--root src` and a filename filter, e.g. `npx vitest run --root src clubMatch`.

---

### Task 1: API types, endpoint, and hook

**Files:**
- Modify: `src/api/types.ts` (add `ClubMatch`, `ClubMatchListing` near the existing `ClubRoster` block, ~line 217)
- Modify: `src/api/endpoints.ts` (add `getClubMatches` after `getClubRoster`, ~line 86; add `ClubMatchListing` to the type import at the top, ~line 3)
- Modify: `src/query/hooks.ts` (add `useClubMatches` after `useClubRoster`, ~line 75)
- Test: `src/api/endpoints.test.ts`

- [ ] **Step 1: Write the failing endpoint tests**

Add to `src/api/endpoints.test.ts`. First add `getClubMatches` to the import list on line 2 (extend the existing `from "./endpoints"` import), then append these tests:

```ts
test("getClubMatches hits the club matches path without status", async () => {
  const spy = spyGet();
  await getClubMatches("c1");
  expect(spy).toHaveBeenCalledWith("/api/clubs/c1/matches");
});

test("getClubMatches appends the status query when given", async () => {
  const spy = spyGet();
  await getClubMatches("c1", "played");
  expect(spy).toHaveBeenCalledWith("/api/clubs/c1/matches?status=played");
});

test("getClubMatches encodes the club id", async () => {
  const spy = spyGet();
  await getClubMatches("a/b", "upcoming");
  expect(spy).toHaveBeenCalledWith("/api/clubs/a%2Fb/matches?status=upcoming");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --root src endpoints`
Expected: FAIL — `getClubMatches is not a function` / not exported.

- [ ] **Step 3: Add the types**

In `src/api/types.ts`, immediately after the `ClubRoster` interface (the block ending `players: ClubRosterPlayer[];\n}` around line 221):

```ts
export interface ClubMatch {
  matchId: string;
  tournamentId: string;
  tournamentName: string | null;
  round: string;
  date: string; // ISO timestamp
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

- [ ] **Step 4: Add the endpoint**

In `src/api/endpoints.ts`, add `ClubMatchListing` to the type import block at the top (alongside `Club, ClubDetail, ClubRoster`). Then after `getClubRoster` (~line 86):

```ts
export function getClubMatches(id: string, status?: "played" | "upcoming"): Promise<ClubMatchListing> {
  const qs = status ? `?status=${status}` : "";
  return apiGet<ClubMatchListing>(`/api/clubs/${encodeURIComponent(id)}/matches${qs}`);
}
```

- [ ] **Step 5: Add the hook**

In `src/query/hooks.ts`, after `useClubRoster`:

```ts
export function useClubMatches(id: string, status: "played" | "upcoming") {
  return useQuery({
    queryKey: ["club-matches", id, status],
    queryFn: () => api.getClubMatches(id, status),
    enabled: id.length > 0,
  });
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run --root src endpoints`
Expected: PASS (3 new tests green).

- [ ] **Step 7: Commit**

```bash
git add src/api/types.ts src/api/endpoints.ts src/query/hooks.ts src/api/endpoints.test.ts
git commit -m "feat: add club matches API type, endpoint, and hook (Web#43)"
```

---

### Task 2: i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json` (the `club` block, lines 77–83)
- Modify: `src/i18n/locales/is.json` (the `club` block, lines 77–83)

- [ ] **Step 1: Add English keys**

Replace the `club` block in `src/i18n/locales/en.json` with:

```json
  "club": {
    "notFound": "Club not found",
    "roster": "Roster",
    "emptyRoster": "No players on the current roster.",
    "colPosition": "Position",
    "colAge": "Age",
    "upcoming": "Upcoming",
    "results": "Results",
    "emptyUpcoming": "No upcoming matches.",
    "emptyResults": "No results yet.",
    "matchesError": "Couldn't load matches.",
    "home": "H",
    "away": "A",
    "roundLabel": "Round {{round}}",
    "unknownOpponent": "TBD"
  },
```

- [ ] **Step 2: Add Icelandic keys (draft — owner review pending)**

Replace the `club` block in `src/i18n/locales/is.json` with:

```json
  "club": {
    "notFound": "Félag fannst ekki",
    "roster": "Leikmannahópur",
    "emptyRoster": "Engir leikmenn í núverandi hópi.",
    "colPosition": "Staða",
    "colAge": "Aldur",
    "upcoming": "Framundan",
    "results": "Úrslit",
    "emptyUpcoming": "Engir leikir framundan.",
    "emptyResults": "Engin úrslit enn.",
    "matchesError": "Tókst ekki að sækja leiki.",
    "home": "H",
    "away": "Ú",
    "roundLabel": "Umferð {{round}}",
    "unknownOpponent": "Óþekkt"
  },
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "require('./src/i18n/locales/en.json'); require('./src/i18n/locales/is.json'); console.log('ok')"`
Expected: prints `ok` (no JSON parse error).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/is.json
git commit -m "i18n: add club fixtures & results copy (is/en) (Web#43)"
```

---

### Task 3: `matchOutcome` and `formatMatchDate` helpers

**Files:**
- Create: `src/components/club/clubMatch.ts`
- Test: `src/components/club/clubMatch.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/club/clubMatch.test.ts`:

```ts
import { expect, test } from "vitest";
import { formatMatchDate, matchOutcome } from "./clubMatch";

test("matchOutcome returns win when club outscores opponent", () => {
  expect(matchOutcome(28, 24)).toBe("win");
});

test("matchOutcome returns loss when club is outscored", () => {
  expect(matchOutcome(22, 25)).toBe("loss");
});

test("matchOutcome returns draw on equal scores", () => {
  expect(matchOutcome(25, 25)).toBe("draw");
});

test("formatMatchDate returns the raw string when unparseable", () => {
  expect(formatMatchDate("not-a-date")).toBe("not-a-date");
});

test("formatMatchDate formats a valid ISO date to day + short month", () => {
  // Asserts it transformed the input rather than echoing it back.
  const out = formatMatchDate("2026-03-14T17:00:00Z");
  expect(out).not.toBe("2026-03-14T17:00:00Z");
  expect(out.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --root src clubMatch`
Expected: FAIL — cannot resolve `./clubMatch`.

- [ ] **Step 3: Write the helpers**

Create `src/components/club/clubMatch.ts`:

```ts
export type MatchOutcome = "win" | "draw" | "loss";

/** Win/draw/loss from the club's perspective. */
export function matchOutcome(clubScore: number, opponentScore: number): MatchOutcome {
  if (clubScore > opponentScore) return "win";
  if (clubScore < opponentScore) return "loss";
  return "draw";
}

/** Day + short month, e.g. "14 Mar". Falls back to the raw ISO if unparseable. */
export function formatMatchDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run --root src clubMatch`
Expected: PASS (5 tests green).

- [ ] **Step 5: Commit**

```bash
git add src/components/club/clubMatch.ts src/components/club/clubMatch.test.ts
git commit -m "feat: add matchOutcome + formatMatchDate club helpers (Web#43)"
```

---

### Task 4: `ClubMatchRow` component

**Files:**
- Create: `src/components/club/ClubMatchRow.tsx`
- Test: `src/components/club/ClubMatchRow.test.tsx`

Depends on Task 1 (types), Task 2 (i18n keys), Task 3 (helpers).

- [ ] **Step 1: Write the failing tests**

Create `src/components/club/ClubMatchRow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { expect, test } from "vitest";
import type { ClubMatch } from "../../api/types";
import { i18n } from "../../i18n";
import { ClubMatchRow } from "./ClubMatchRow";

function base(overrides: Partial<ClubMatch> = {}): ClubMatch {
  return {
    matchId: "m1",
    tournamentId: "8444",
    tournamentName: "Olís deild karla",
    round: "12",
    date: "2026-03-14T17:00:00Z",
    venue: "Höllin",
    status: "played",
    isHome: true,
    opponentClubId: "c2",
    opponentName: "Haukar",
    opponentLogoUrl: "https://example.test/haukar.png",
    clubScore: 28,
    opponentScore: 24,
    ...overrides,
  };
}

function renderRow(match: ClubMatch) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ClubMatchRow match={match} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

test("played row shows the score, win accent, opponent link, and H badge", () => {
  renderRow(base());
  expect(screen.getByText("28–24")).toBeInTheDocument();
  expect(document.querySelector(".club-match-score--win")).not.toBeNull();
  expect(screen.getByRole("link", { name: "Haukar" })).toHaveAttribute("href", "/clubs/c2");
  expect(screen.getByText("H")).toBeInTheDocument();
});

test("loss is accented as loss and away shows A", () => {
  renderRow(base({ isHome: false, clubScore: 22, opponentScore: 25 }));
  expect(document.querySelector(".club-match-score--loss")).not.toBeNull();
  expect(screen.getByText("A")).toBeInTheDocument();
});

test("draw is accented as draw", () => {
  renderRow(base({ clubScore: 25, opponentScore: 25 }));
  expect(document.querySelector(".club-match-score--draw")).not.toBeNull();
});

test("upcoming row hides the score and shows a kickoff time instead", () => {
  renderRow(base({ status: "upcoming", clubScore: null, opponentScore: null }));
  expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  expect(document.querySelector(".club-match-time")).not.toBeNull();
});

test("falls back to a placeholder when the opponent name is null", () => {
  renderRow(base({ opponentName: null }));
  expect(screen.getByRole("link", { name: "TBD" })).toHaveAttribute("href", "/clubs/c2");
});

test("renders a blank logo placeholder when opponent logo is null", () => {
  renderRow(base({ opponentLogoUrl: null }));
  expect(document.querySelector(".club-match-logo--blank")).not.toBeNull();
  expect(document.querySelector("img.club-match-logo")).toBeNull();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --root src ClubMatchRow`
Expected: FAIL — cannot resolve `./ClubMatchRow`.

- [ ] **Step 3: Write the component**

Create `src/components/club/ClubMatchRow.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ClubMatch } from "../../api/types";
import { formatKickoff } from "../gameweek/datetime";
import { formatMatchDate, matchOutcome } from "./clubMatch";

export function ClubMatchRow({ match }: { match: ClubMatch }) {
  const { t } = useTranslation();
  const played =
    match.status === "played" && match.clubScore != null && match.opponentScore != null;
  const outcome = played ? matchOutcome(match.clubScore!, match.opponentScore!) : null;

  const meta = [
    match.tournamentName,
    t("club.roundLabel", { round: match.round }),
    played ? formatMatchDate(match.date) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="club-match">
      <div className="club-match-main">
        {match.opponentLogoUrl ? (
          <img className="club-match-logo" src={match.opponentLogoUrl} alt="" />
        ) : (
          <span className="club-match-logo club-match-logo--blank" aria-hidden="true" />
        )}
        <Link className="club-match-opp" to={`/clubs/${encodeURIComponent(match.opponentClubId)}`}>
          {match.opponentName ?? t("club.unknownOpponent")}
        </Link>
        <span className="club-match-ha">{match.isHome ? t("club.home") : t("club.away")}</span>
        {played ? (
          <span className={`club-match-score club-match-score--${outcome}`}>
            {`${match.clubScore}–${match.opponentScore}`}
          </span>
        ) : (
          <span className="club-match-time">{formatKickoff(match.date)}</span>
        )}
      </div>
      <div className="club-match-meta">{meta}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run --root src ClubMatchRow`
Expected: PASS (6 tests green).

- [ ] **Step 5: Commit**

```bash
git add src/components/club/ClubMatchRow.tsx src/components/club/ClubMatchRow.test.tsx
git commit -m "feat: add ClubMatchRow card with W/D/L accent (Web#43)"
```

---

### Task 5: Wire fixtures sections into `ClubPage`

**Files:**
- Modify: `src/pages/ClubPage.tsx`
- Test: `src/pages/ClubPage.test.tsx`

Depends on Tasks 1–4.

- [ ] **Step 1: Write the failing tests**

Append to `src/pages/ClubPage.test.tsx`. First extend the imports at the top to include a matches mock default and reuse the existing `setup()` helper (the existing `setup` only registers `/clubs/:id` and `/players/:playerId` — add a `/clubs/:id` opponent target is already covered by the same route). Add a shared helper near the top of the file, after the `setup` function:

```tsx
function mockClubAndRoster() {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });
}

const upcomingMatch = {
  matchId: "m-up", tournamentId: "8444", tournamentName: "Olís deild karla", round: "13",
  date: "2026-03-21T17:00:00Z", venue: "Höllin", status: "upcoming" as const, isHome: true,
  opponentClubId: "c2", opponentName: "Haukar", opponentLogoUrl: null,
  clubScore: null, opponentScore: null,
};
const playedMatch = {
  matchId: "m-pl", tournamentId: "8444", tournamentName: "Olís deild karla", round: "12",
  date: "2026-03-14T17:00:00Z", venue: "Höllin", status: "played" as const, isHome: false,
  opponentClubId: "c3", opponentName: "KA", opponentLogoUrl: null,
  clubScore: 30, opponentScore: 26,
};
```

Then add the tests:

```tsx
test("renders Upcoming above Results above Roster", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockImplementation((_, status) =>
    Promise.resolve({
      clubId: "c1", season: "2025-2026",
      matches: status === "upcoming" ? [upcomingMatch] : [playedMatch],
    }),
  );

  setup();

  const headings = await screen.findAllByRole("heading", { level: 2 });
  const titles = headings.map((h) => h.textContent);
  expect(titles).toEqual(["Upcoming", "Results", "Roster"]);
});

test("shows the played match score and links the opponent", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockImplementation((_, status) =>
    Promise.resolve({
      clubId: "c1", season: "2025-2026",
      matches: status === "played" ? [playedMatch] : [],
    }),
  );

  setup();

  expect(await screen.findByText("30–26")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "KA" })).toHaveAttribute("href", "/clubs/c3");
});

test("shows per-section empty states independently", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockImplementation((_, status) =>
    Promise.resolve({
      clubId: "c1", season: "2025-2026",
      matches: status === "upcoming" ? [upcomingMatch] : [],
    }),
  );

  setup();

  // Upcoming has a match (opponent link present); Results is empty.
  expect(await screen.findByRole("link", { name: "Haukar" })).toBeInTheDocument();
  expect(screen.getByText("No results yet.")).toBeInTheDocument();
});

test("shows an error state for a failed matches section", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockRejectedValue(new ApiError(500, "boom", "server error"));

  setup();

  // common.error copy from the shared ErrorView (non-404 path).
  expect(await screen.findAllByText("Something went wrong. Please try again.")).not.toHaveLength(0);
});
```

> Note: the four pre-existing tests in this file mock `getClub`/`getClubRoster` but not `getClubMatches`. Because the test `QueryClient` sets `retry: false` and the page early-returns on the club query before the matches sections render, the unmocked calls fail once and are harmlessly swallowed — the existing tests keep passing. No change to them is required; only add the matches mock if you see act/fetch warnings you want to silence.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --root src ClubPage`
Expected: FAIL — only one `<h2>` ("Roster") exists; no matches sections rendered.

- [ ] **Step 3: Rewrite `ClubPage.tsx`**

Replace the full contents of `src/pages/ClubPage.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import type { ClubRosterPlayer } from "../api/types";
import { ClubMatchRow } from "../components/club/ClubMatchRow";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useClub, useClubMatches, useClubRoster } from "../query/hooks";

type ClubMatchesQuery = ReturnType<typeof useClubMatches>;

function MatchSection({
  title,
  emptyLabel,
  query,
}: {
  title: string;
  emptyLabel: string;
  query: ClubMatchesQuery;
}) {
  const { t } = useTranslation();
  return (
    <Panel>
      <h2 className="section-title">{title}</h2>
      {query.isPending && <Loading />}
      {query.isError && <ErrorView error={query.error} notFoundLabel={t("club.matchesError")} />}
      {query.data &&
        (query.data.matches.length === 0 ? (
          <p className="status">{emptyLabel}</p>
        ) : (
          query.data.matches.map((m) => <ClubMatchRow key={m.matchId} match={m} />)
        ))}
    </Panel>
  );
}

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
  const upcoming = useClubMatches(id, "upcoming");
  const played = useClubMatches(id, "played");

  if (club.isPending) return <Loading />;
  if (club.isError) return <ErrorView error={club.error} notFoundLabel={t("club.notFound")} />;

  const detail = club.data;
  const headerBits = [detail.venue, detail.foundedYear != null ? String(detail.foundedYear) : null].filter(Boolean);

  return (
    <section className="stack">
      <div className="page-head">
        <div className="title-row">
          {detail.logoUrl && <img className="club-logo" src={detail.logoUrl} alt="" />}
          <h1 className="title">{detail.name}</h1>
        </div>
        {headerBits.length > 0 && <p className="subtitle">{headerBits.join(" · ")}</p>}
      </div>

      <MatchSection title={t("club.upcoming")} emptyLabel={t("club.emptyUpcoming")} query={upcoming} />
      <MatchSection title={t("club.results")} emptyLabel={t("club.emptyResults")} query={played} />

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

Run: `npx vitest run --root src ClubPage`
Expected: PASS (existing 4 tests + 4 new). If the existing "renders not-found" test now also needs the matches mock, note the page guards on `club` before the sections render, so `getClubMatches` need not be mocked for the 404 path — but if the test runner warns about an unmocked call, add `vi.spyOn(api, "getClubMatches").mockResolvedValue({ clubId: "c1", season: null, matches: [] })` to that test.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ClubPage.tsx src/pages/ClubPage.test.tsx
git commit -m "feat: render club fixtures & results above roster (Web#43)"
```

---

### Task 6: Styling

**Files:**
- Modify: `src/styles/app.css` (append a `club-match` block near the existing `.gw-fixture` rules, ~line 1424)

No test — visual only. Mirrors the existing `.gw-fixture` idiom and uses the established `--good` / `--bad` / `--ink` tokens.

- [ ] **Step 1: Append the styles**

Add to the end of `src/styles/app.css`:

```css
/* ---------- Club page: fixtures & results rows ---------- */
.club-match {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.club-match:last-child { border-bottom: none; }
.club-match-main { display: flex; align-items: center; gap: 8px; }
.club-match-logo { width: 24px; height: 24px; border-radius: 50%; object-fit: contain; }
.club-match-logo--blank { background: #e3d7b8; border: 1px solid var(--line-2); }
.club-match-opp { font-weight: 600; color: var(--ink); text-decoration: none; }
.club-match-opp:hover { text-decoration: underline; }
.club-match-ha {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .06em;
  color: var(--ink-3);
  border: 1px solid var(--line-2);
  border-radius: 6px;
  padding: 1px 5px;
}
.club-match-score {
  margin-left: auto;
  font-family: "Spectral", Georgia, serif;
  font-weight: 800;
}
.club-match-score--win { color: var(--good); }
.club-match-score--loss { color: var(--bad); }
.club-match-score--draw { color: var(--ink-2); }
.club-match-time { margin-left: auto; color: var(--ink-3); font-size: 13px; }
.club-match-meta { font-size: 12px; color: var(--ink-2); }
```

- [ ] **Step 2: Verify the build/typecheck still passes**

Run: `npm run build`
Expected: build succeeds (TypeScript + Vite), no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/app.css
git commit -m "style: club fixtures & results rows (Web#43)"
```

---

### Task 7: Full verification

- [ ] **Step 1: Run the full scoped test suite**

Run: `npx vitest run --root src`
Expected: all tests PASS (no regressions; new club-matches, ClubMatchRow, clubMatch, and ClubPage tests green).

- [ ] **Step 2: Typecheck/build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Manual smoke (optional)**

Run `npm run dev`, open a club page (`/clubs/<id>`), confirm: Upcoming section on top (kickoff times, no scores), Results below (scores with green/grey/red accents, newest first), roster at the bottom; opponent names link to their club pages; empty sections show their copy.

---

## Notes for the implementer

- The page issues two `getClubMatches` calls (`"upcoming"` and `"played"`); each section owns its loading/error/empty state. This is the deliberate choice over a single unfiltered fetch, so the server's per-status ordering is preserved without client-side sorting.
- `ClubMatchRow` reuses `formatKickoff` from `src/components/gameweek/datetime.ts` for upcoming kickoff times; played dates use the new `formatMatchDate`.
- Icelandic strings are drafts pending owner review, consistent with prior i18n PRs (`home`/`away` abbreviations especially).
