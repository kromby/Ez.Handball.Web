# Gameweek Status UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/gameweeks` calendar page and a current-gameweek strip on `/squad` that consume the new gameweek lifecycle endpoints, enriched with real fixtures from the rounds endpoint.

**Architecture:** Read-only. Gameweek endpoints own lifecycle (number, deadline, status); the existing rounds endpoint owns rich fixtures (club names, logos, scores), joined on the shared round label. A single status→label helper drives all pills; sectioning keys off the current gameweek. A live countdown hook ticks every second.

**Tech Stack:** React + TypeScript, React Query (`@tanstack/react-query`), react-router-dom, react-i18next, vitest + @testing-library/react.

> **DO NOT START until the gameweek API (`GET /api/gameweeks`, `GET /api/gameweeks/current`) is deployed.** Spec: `docs/superpowers/specs/2026-06-13-web-gameweek-status-ui-design.md`.

---

## Environment notes (read before running tests)

- A stray `.worktrees/player-retired-badge` directory pollutes an unscoped vitest run. **Always run tests scoped to `src`:**

  ```bash
  npx vitest run --root src
  ```

  Run a single file with: `npx vitest run --root src GameweeksPage`

- Type-check with: `npx tsc --noEmit`
- Backend JSON is camelCase. Verified response shapes:
  - `GET /api/gameweeks` → `Gameweek[]`
  - `GET /api/gameweeks/current` → `{ current: Gameweek | null, lastSettled: Gameweek | null }`
  - `GET /api/tournaments/{id}/rounds` → `RoundListing` (note `RoundTeam` uses `name` + `logoSrc`, not `clubName`)

---

## File Structure

**Create:**
- `src/components/gameweek/useCountdown.ts` — live countdown hook + pure `formatCountdown`.
- `src/components/gameweek/useCountdown.test.ts`
- `src/components/gameweek/gameweekLabels.ts` — status→label key, sectioning, round-by-label join helpers.
- `src/components/gameweek/gameweekLabels.test.ts`
- `src/components/gameweek/datetime.ts` — `formatKickoff` / `formatDeadline`.
- `src/components/gameweek/GameweekStatusPill.tsx`
- `src/components/gameweek/FixtureRow.tsx`
- `src/components/gameweek/fixtureRow.test.tsx` — covers pill + fixture row.
- `src/components/gameweek/CurrentGameweekStrip.tsx`
- `src/components/gameweek/CurrentGameweekStrip.test.tsx`
- `src/components/gameweek/GameweekHeroCard.tsx`
- `src/components/gameweek/GameweekListRow.tsx`
- `src/components/gameweek/gameweekCards.test.tsx` — covers hero + list row.
- `src/pages/GameweeksPage.tsx`
- `src/pages/GameweeksPage.test.tsx`

**Modify:**
- `src/api/types.ts` — gameweek + rounds types.
- `src/api/endpoints.ts` — `getGameweeks`, `getCurrentGameweek`, `getRounds`.
- `src/api/endpoints.test.ts` — endpoint path assertions.
- `src/query/hooks.ts` — `useGameweeks`, `useCurrentGameweek`, `useRounds`.
- `src/i18n/locales/en.json`, `src/i18n/locales/is.json` — `gameweek.*` keys.
- `src/components/Nav.tsx` — public "Gameweeks" link.
- `src/App.tsx` — public `/gameweeks` route.
- `src/pages/SquadPage.tsx` — mount the strip.
- `src/styles/app.css` — `.gw-*` styles.

---

## Task 1: API types + endpoint functions

**Files:**
- Modify: `src/api/types.ts`
- Modify: `src/api/endpoints.ts`
- Test: `src/api/endpoints.test.ts`

- [ ] **Step 1: Add types**

Append to `src/api/types.ts`:

```ts
export type GameweekStatus = "Open" | "DeadlineLocked" | "InPlay" | "Settled";

export interface GameweekMatch {
  matchId: string;
  date: string; // ISO timestamp
  isFinal: boolean;
  homeTeamId: string;
  awayTeamId: string;
}

export interface Gameweek {
  number: number;
  roundLabel: string;
  tournamentId: string;
  deadline: string; // ISO timestamp
  status: GameweekStatus;
  matches: GameweekMatch[];
}

export interface CurrentGameweek {
  current: Gameweek | null;
  lastSettled: Gameweek | null;
}

export interface RoundTeam {
  teamId: string;
  clubId: string;
  name: string | null;
  logoSrc: string | null;
  score: number | null;
}

export interface RoundMatch {
  matchId: string;
  played: boolean;
  date: string; // ISO timestamp
  venue: string | null;
  home: RoundTeam;
  away: RoundTeam;
}

export interface RoundGroup {
  round: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  matches: RoundMatch[];
}

export interface RoundListing {
  tournamentId: string;
  tournamentName: string | null;
  season: string;
  rounds: RoundGroup[];
}
```

- [ ] **Step 2: Add the failing endpoint tests**

In `src/api/endpoints.test.ts`, add `getGameweeks, getCurrentGameweek, getRounds` to the import list from `"./endpoints"`, then append:

```ts
test("getGameweeks hits the gameweeks path", async () => {
  const spy = spyGet();
  await getGameweeks();
  expect(spy).toHaveBeenCalledWith("/api/gameweeks");
});

test("getGameweeks appends version when given", async () => {
  const spy = spyGet();
  await getGameweeks(2);
  expect(spy).toHaveBeenCalledWith("/api/gameweeks?version=2");
});

test("getCurrentGameweek hits the current path", async () => {
  const spy = spyGet();
  await getCurrentGameweek();
  expect(spy).toHaveBeenCalledWith("/api/gameweeks/current");
});

test("getRounds encodes the tournament id", async () => {
  const spy = spyGet();
  await getRounds("84/44");
  expect(spy).toHaveBeenCalledWith("/api/tournaments/84%2F44/rounds");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run --root src api/endpoints`
Expected: FAIL — `getGameweeks`/`getCurrentGameweek`/`getRounds` not exported.

- [ ] **Step 4: Implement the endpoints**

In `src/api/endpoints.ts`, add the new types to the existing `import type { ... } from "./types"` block (`CurrentGameweek`, `Gameweek`, `RoundListing`), then append:

```ts
export function getGameweeks(version?: number): Promise<Gameweek[]> {
  const qs = version != null ? `?version=${version}` : "";
  return apiGet<Gameweek[]>(`/api/gameweeks${qs}`);
}

export function getCurrentGameweek(version?: number): Promise<CurrentGameweek> {
  const qs = version != null ? `?version=${version}` : "";
  return apiGet<CurrentGameweek>(`/api/gameweeks/current${qs}`);
}

export function getRounds(tournamentId: string): Promise<RoundListing> {
  return apiGet<RoundListing>(`/api/tournaments/${encodeURIComponent(tournamentId)}/rounds`);
}
```

- [ ] **Step 5: Run tests + type-check**

Run: `npx vitest run --root src api/endpoints` → Expected: PASS
Run: `npx tsc --noEmit` → Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/api/types.ts src/api/endpoints.ts src/api/endpoints.test.ts
git commit -m "feat: add gameweek + rounds api types and endpoints (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/is.json`

- [ ] **Step 1: Add the English `gameweek` group**

Add a top-level `"gameweek"` object to `src/i18n/locales/en.json` (place it after `"squad"`):

```json
"gameweek": {
  "navLink": "Gameweeks",
  "pageEyebrow": "the season, week by week",
  "pageTitle": "Gameweeks",
  "seasonChip": "Season {{season}}",
  "roundOf": "Round {{current}} of {{total}}",
  "heroTitle": "Gameweek {{number}}",
  "roundLabel": "Umferð {{label}}",
  "locksInEyebrow": "locks in",
  "locksIn": "Locks in {{countdown}}",
  "locked": "Locked",
  "deadlineAt": "deadline {{time}}",
  "matchWeekend": "Match weekend",
  "matchCount_one": "{{count}} match · first throw {{time}}",
  "matchCount_other": "{{count}} matches · first throw {{time}}",
  "editSquadCta": "Edit your squad",
  "setYourSeven": "set your seven before it locks",
  "comingUp": "Coming up",
  "results": "Results",
  "noFixtures": "Fixtures to be confirmed",
  "notConfigured": "Gameweeks aren't set up yet",
  "notConfiguredBody": "The gameweek calendar will appear here once the season is configured.",
  "empty": "No gameweeks yet.",
  "versus": "vs",
  "status": {
    "open": "Open",
    "upcoming": "Upcoming",
    "locked": "Locked",
    "live": "Live",
    "final": "Final"
  }
}
```

- [ ] **Step 2: Add the Icelandic `gameweek` group**

Add the matching object to `src/i18n/locales/is.json` (owner-review flagged in the spec):

```json
"gameweek": {
  "navLink": "Umferðir",
  "pageEyebrow": "tímabilið, umferð fyrir umferð",
  "pageTitle": "Umferðir",
  "seasonChip": "Tímabil {{season}}",
  "roundOf": "Umferð {{current}} af {{total}}",
  "heroTitle": "Umferð {{number}}",
  "roundLabel": "Umferð {{label}}",
  "locksInEyebrow": "læsist eftir",
  "locksIn": "Læsist eftir {{countdown}}",
  "locked": "Læst",
  "deadlineAt": "lokafrestur {{time}}",
  "matchWeekend": "Leikhelgi",
  "matchCount_one": "{{count}} leikur · fyrsti útkast {{time}}",
  "matchCount_other": "{{count}} leikir · fyrsti útkast {{time}}",
  "editSquadCta": "Breyta liðinu",
  "setYourSeven": "veldu sjömenningana áður en það læsist",
  "comingUp": "Framundan",
  "results": "Úrslit",
  "noFixtures": "Leikir staðfestast síðar",
  "notConfigured": "Umferðir eru ekki tilbúnar enn",
  "notConfiguredBody": "Umferðadagatalið birtist hér þegar tímabilið hefur verið stillt.",
  "empty": "Engar umferðir enn.",
  "versus": "—",
  "status": {
    "open": "Opin",
    "upcoming": "Framundan",
    "locked": "Læst",
    "live": "Í gangi",
    "final": "Lokið"
  }
}
```

- [ ] **Step 3: Verify JSON parses + type-check**

Run: `node -e "require('./src/i18n/locales/en.json'); require('./src/i18n/locales/is.json'); console.log('ok')"`
Expected: `ok`
Run: `npx tsc --noEmit` → Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/is.json
git commit -m "feat: add gameweek i18n keys (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `useCountdown` hook

**Files:**
- Create: `src/components/gameweek/useCountdown.ts`
- Test: `src/components/gameweek/useCountdown.test.ts`

- [ ] **Step 1: Write the failing test**

`src/components/gameweek/useCountdown.test.ts`:

```ts
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { formatCountdown, useCountdown } from "./useCountdown";

test("formatCountdown shows days/hours/minutes when >= 1 day", () => {
  const ms = (2 * 86400 + 3 * 3600 + 14 * 60 + 9) * 1000;
  expect(formatCountdown(ms)).toEqual({ locked: false, label: "2d 03h 14m" });
});

test("formatCountdown shows hours/minutes/seconds when < 1 day", () => {
  const ms = (3 * 3600 + 14 * 60 + 9) * 1000;
  expect(formatCountdown(ms)).toEqual({ locked: false, label: "03h 14m 09s" });
});

test("formatCountdown reports locked at or past zero", () => {
  expect(formatCountdown(0)).toEqual({ locked: true, label: "" });
  expect(formatCountdown(-5000)).toEqual({ locked: true, label: "" });
});

test("useCountdown ticks toward the deadline", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-13T00:00:00Z"));
  const deadline = "2026-06-13T00:00:10Z";
  const { result } = renderHook(() => useCountdown(deadline));
  expect(result.current.label).toBe("00h 00m 10s");
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(result.current.label).toBe("00h 00m 07s");
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src useCountdown`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

`src/components/gameweek/useCountdown.ts`:

```ts
import { useEffect, useState } from "react";

export interface Countdown {
  locked: boolean;
  label: string;
}

const pad = (n: number): string => String(n).padStart(2, "0");

/** Pure formatter — `label` is "Dd HHh MMm" at >= 1 day, else "HHh MMm SSs". */
export function formatCountdown(msRemaining: number): Countdown {
  if (msRemaining <= 0) return { locked: true, label: "" };
  const total = Math.floor(msRemaining / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const label =
    days >= 1
      ? `${days}d ${pad(hours)}h ${pad(minutes)}m`
      : `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  return { locked: false, label };
}

/** Live countdown to an ISO deadline; re-renders every second. */
export function useCountdown(deadlineIso: string): Countdown {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return formatCountdown(new Date(deadlineIso).getTime() - now);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root src useCountdown` → Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/gameweek/useCountdown.ts src/components/gameweek/useCountdown.test.ts
git commit -m "feat: add gameweek countdown hook (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Label + sectioning helpers

**Files:**
- Create: `src/components/gameweek/gameweekLabels.ts`
- Create: `src/components/gameweek/datetime.ts`
- Test: `src/components/gameweek/gameweekLabels.test.ts`

- [ ] **Step 1: Write the failing test**

`src/components/gameweek/gameweekLabels.test.ts`:

```ts
import { expect, test } from "vitest";
import type { Gameweek } from "../../api/types";
import {
  gameweekLabelKey,
  isCurrent,
  roundByLabel,
  sectionGameweeks,
} from "./gameweekLabels";

function gw(number: number, status: Gameweek["status"]): Gameweek {
  return {
    number,
    roundLabel: String(number),
    tournamentId: "8444",
    deadline: "2026-06-20T16:00:00Z",
    status,
    matches: [],
  };
}

test("Open maps to open when current, upcoming otherwise", () => {
  expect(gameweekLabelKey("Open", true)).toBe("open");
  expect(gameweekLabelKey("Open", false)).toBe("upcoming");
});

test("non-open statuses map directly regardless of current", () => {
  expect(gameweekLabelKey("DeadlineLocked", true)).toBe("locked");
  expect(gameweekLabelKey("InPlay", false)).toBe("live");
  expect(gameweekLabelKey("Settled", false)).toBe("final");
});

test("sectionGameweeks splits around the current gameweek", () => {
  const all = [gw(5, "Settled"), gw(6, "InPlay"), gw(7, "Open"), gw(8, "Open")];
  const s = sectionGameweeks(all, gw(7, "Open"), gw(5, "Settled"));
  expect(s.hero?.number).toBe(7);
  expect(s.comingUp.map((g) => g.number)).toEqual([8]);
  expect(s.results.map((g) => g.number)).toEqual([6, 5]);
});

test("a past InPlay gameweek lands in results", () => {
  const all = [gw(6, "InPlay"), gw(7, "Open")];
  const s = sectionGameweeks(all, gw(7, "Open"), null);
  expect(s.results.map((g) => g.number)).toEqual([6]);
});

test("falls back to lastSettled hero when current is null", () => {
  const all = [gw(5, "Settled"), gw(6, "Settled")];
  const s = sectionGameweeks(all, null, gw(6, "Settled"));
  expect(s.hero?.number).toBe(6);
  expect(s.results.map((g) => g.number)).toEqual([5]);
});

test("empty when no current and no lastSettled", () => {
  const s = sectionGameweeks([gw(1, "Open")], null, null);
  expect(s.hero).toBeNull();
  expect(s.comingUp).toEqual([]);
  expect(s.results).toEqual([]);
});

test("isCurrent is true only for the current gameweek number", () => {
  expect(isCurrent(gw(7, "Open"), gw(7, "Open"))).toBe(true);
  expect(isCurrent(gw(6, "InPlay"), gw(7, "Open"))).toBe(false);
  expect(isCurrent(gw(7, "Open"), null)).toBe(false);
});

test("roundByLabel finds the matching round group", () => {
  const listing = {
    tournamentId: "8444",
    tournamentName: "Olís",
    season: "2025-26",
    rounds: [
      { round: "7", startDate: "2026-06-20", endDate: "2026-06-21", matches: [] },
    ],
  };
  expect(roundByLabel(listing, "7")?.round).toBe("7");
  expect(roundByLabel(listing, "9")).toBeUndefined();
  expect(roundByLabel(undefined, "7")).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src gameweekLabels`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

`src/components/gameweek/gameweekLabels.ts`:

```ts
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
```

- [ ] **Step 4: Implement the datetime helpers** (used by later tasks)

`src/components/gameweek/datetime.ts`:

```ts
/** Weekday + 24h time, e.g. "Sat 17:00". Falls back to the raw ISO if unparseable. */
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Weekday + 24h time for a deadline, e.g. "Sat 18:00". */
export function formatDeadline(iso: string): string {
  return formatKickoff(iso);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run --root src gameweekLabels` → Expected: PASS
Run: `npx tsc --noEmit` → Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/gameweek/gameweekLabels.ts src/components/gameweek/gameweekLabels.test.ts src/components/gameweek/datetime.ts
git commit -m "feat: add gameweek label + sectioning helpers (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Status pill + fixture row components

**Files:**
- Create: `src/components/gameweek/GameweekStatusPill.tsx`
- Create: `src/components/gameweek/FixtureRow.tsx`
- Test: `src/components/gameweek/fixtureRow.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/gameweek/fixtureRow.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { RoundMatch } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { FixtureRow } from "./FixtureRow";
import { GameweekStatusPill } from "./GameweekStatusPill";

function team(name: string, score: number | null) {
  return { teamId: name, clubId: name, name, logoSrc: null, score };
}

const played: RoundMatch = {
  matchId: "m1",
  played: true,
  date: "2026-06-20T16:00:00Z",
  venue: null,
  home: team("Valur", 28),
  away: team("Afturelding", 24),
};

const upcoming: RoundMatch = {
  matchId: "m2",
  played: false,
  date: "2026-06-20T16:00:00Z",
  venue: null,
  home: team("Haukar", null),
  away: team("FH", null),
};

test("status pill renders the mapped label", () => {
  renderWithProviders(<GameweekStatusPill labelKey="open" />);
  expect(screen.getByText("Open")).toBeInTheDocument();
});

test("played fixture shows both names and the score", () => {
  renderWithProviders(<FixtureRow match={played} />);
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByText("Afturelding")).toBeInTheDocument();
  expect(screen.getByText("28–24")).toBeInTheDocument();
});

test("upcoming fixture shows the kickoff time, no score", () => {
  renderWithProviders(<FixtureRow match={upcoming} />);
  expect(screen.getByText("Haukar")).toBeInTheDocument();
  expect(screen.queryByText(/–/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src fixtureRow`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `GameweekStatusPill`**

`src/components/gameweek/GameweekStatusPill.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import type { GameweekLabelKey } from "./gameweekLabels";

export function GameweekStatusPill({ labelKey }: { labelKey: GameweekLabelKey }) {
  const { t } = useTranslation();
  return (
    <span className={`gw-pill gw-pill--${labelKey}`}>
      {t(`gameweek.status.${labelKey}`)}
    </span>
  );
}
```

- [ ] **Step 4: Implement `FixtureRow`**

`src/components/gameweek/FixtureRow.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { RoundMatch, RoundTeam } from "../../api/types";
import { formatKickoff } from "./datetime";

function TeamSide({ team }: { team: RoundTeam }) {
  return (
    <span className="gw-fixture-team">
      {team.logoSrc ? (
        <img className="gw-fixture-logo" src={team.logoSrc} alt="" />
      ) : (
        <span className="gw-fixture-logo gw-fixture-logo--blank" aria-hidden="true" />
      )}
      <span className="gw-fixture-name">{team.name ?? team.teamId}</span>
    </span>
  );
}

export function FixtureRow({ match }: { match: RoundMatch }) {
  const { t } = useTranslation();
  const hasScore = match.played && match.home.score != null && match.away.score != null;
  return (
    <Link to={`/matches/${encodeURIComponent(match.matchId)}`} className="gw-fixture">
      <TeamSide team={match.home} />
      <span className="gw-fixture-vs">{t("gameweek.versus")}</span>
      <TeamSide team={match.away} />
      {hasScore ? (
        <span className="gw-fixture-score">{`${match.home.score}–${match.away.score}`}</span>
      ) : (
        <span className="gw-fixture-time">{formatKickoff(match.date)}</span>
      )}
    </Link>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run --root src fixtureRow` → Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/gameweek/GameweekStatusPill.tsx src/components/gameweek/FixtureRow.tsx src/components/gameweek/fixtureRow.test.tsx
git commit -m "feat: add gameweek status pill + fixture row (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Current-gameweek strip + `useCurrentGameweek` hook

**Files:**
- Modify: `src/query/hooks.ts`
- Create: `src/components/gameweek/CurrentGameweekStrip.tsx`
- Test: `src/components/gameweek/CurrentGameweekStrip.test.tsx`

- [ ] **Step 1: Add the `useCurrentGameweek` hook**

In `src/query/hooks.ts`, add after `useGenders` (the public-read hooks region):

```ts
export function useCurrentGameweek() {
  return useQuery({
    queryKey: ["gameweek-current"],
    queryFn: () => api.getCurrentGameweek(),
  });
}
```

- [ ] **Step 2: Write the failing test**

`src/components/gameweek/CurrentGameweekStrip.test.tsx`:

```tsx
import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import type { CurrentGameweek } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { CurrentGameweekStrip } from "./CurrentGameweekStrip";

afterEach(() => vi.restoreAllMocks());

function current(): CurrentGameweek {
  return {
    current: {
      number: 18,
      roundLabel: "18",
      tournamentId: "8444",
      deadline: "2099-06-20T18:00:00Z",
      status: "Open",
      matches: [
        { matchId: "a", date: "2099-06-20T18:00:00Z", isFinal: false, homeTeamId: "1-karlar", awayTeamId: "2-karlar" },
        { matchId: "b", date: "2099-06-21T14:00:00Z", isFinal: false, homeTeamId: "3-karlar", awayTeamId: "4-karlar" },
      ],
    },
    lastSettled: null,
  };
}

test("renders round label, status, match count and a countdown", async () => {
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue(current());
  renderWithProviders(<CurrentGameweekStrip />);
  expect(await screen.findByText("Umferð 18")).toBeInTheDocument();
  expect(screen.getByText("Open")).toBeInTheDocument();
  expect(screen.getByText(/2 matches/)).toBeInTheDocument();
});

test("renders nothing when there is no current gameweek", async () => {
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({ current: null, lastSettled: null });
  const { container } = renderWithProviders(<CurrentGameweekStrip />);
  await waitFor(() => expect(api.getCurrentGameweek).toHaveBeenCalled());
  expect(container.querySelector(".gw-strip")).toBeNull();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run --root src CurrentGameweekStrip`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the strip**

`src/components/gameweek/CurrentGameweekStrip.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { useCurrentGameweek } from "../../query/hooks";
import { formatDeadline, formatKickoff } from "./datetime";
import { gameweekLabelKey } from "./gameweekLabels";
import { GameweekStatusPill } from "./GameweekStatusPill";
import { useCountdown } from "./useCountdown";

function earliestThrow(dates: string[]): string {
  return [...dates].sort()[0] ?? "";
}

export function CurrentGameweekStrip() {
  const { t } = useTranslation();
  const { data } = useCurrentGameweek();
  const gw = data?.current ?? null;
  const countdown = useCountdown(gw?.deadline ?? "");

  if (!gw) return null;

  const firstThrow = earliestThrow(gw.matches.map((m) => m.date));

  return (
    <div className="gw-strip">
      <div className="gw-strip-round">
        <span className="gw-strip-round-label">{t("gameweek.roundLabel", { label: gw.roundLabel })}</span>
        <span className="gw-strip-round-num">{gw.number}</span>
      </div>
      <div className="gw-strip-body">
        <div className="gw-strip-title">{t("gameweek.matchWeekend")}</div>
        <div className="gw-strip-meta">
          {t("gameweek.matchCount", { count: gw.matches.length, time: formatKickoff(firstThrow) })}
        </div>
        <GameweekStatusPill labelKey={gameweekLabelKey(gw.status, true)} />
      </div>
      <div className="gw-strip-deadline">
        <div className="gw-strip-eyebrow">{t("gameweek.locksInEyebrow")}</div>
        <div className="gw-countdown">{countdown.locked ? t("gameweek.locked") : countdown.label}</div>
        <div className="gw-strip-deadline-at">{t("gameweek.deadlineAt", { time: formatDeadline(gw.deadline) })}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test + type-check**

Run: `npx vitest run --root src CurrentGameweekStrip` → Expected: PASS
Run: `npx tsc --noEmit` → Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/query/hooks.ts src/components/gameweek/CurrentGameweekStrip.tsx src/components/gameweek/CurrentGameweekStrip.test.tsx
git commit -m "feat: add current-gameweek strip + hook (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Mount the strip on the squad page

**Files:**
- Modify: `src/pages/SquadPage.tsx`
- Test: `src/pages/SquadPage.test.tsx`

- [ ] **Step 1: Add a failing assertion to the squad page test**

Open `src/pages/SquadPage.test.tsx`. The existing tests mock `getSquad`/`getSquadConstraints`. Add a mock for the current gameweek and an assertion. At the top, add the import:

```tsx
import type { CurrentGameweek } from "../api/types";
```

In each `setup()`/render path the test already mocks the squad endpoints; add this alongside those mocks (use the existing `vi.spyOn(api, ...)` style already in the file):

```tsx
vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({
  current: {
    number: 18, roundLabel: "18", tournamentId: "8444",
    deadline: "2099-06-20T18:00:00Z", status: "Open",
    matches: [{ matchId: "a", date: "2099-06-20T18:00:00Z", isFinal: false, homeTeamId: "1-karlar", awayTeamId: "2-karlar" }],
  },
  lastSettled: null,
} satisfies CurrentGameweek);
```

Then add one new test:

```tsx
test("shows the current-gameweek strip", async () => {
  // ...existing squad + constraints mocks for the happy path...
  setup();
  expect(await screen.findByText("Umferð 18")).toBeInTheDocument();
});
```

> Note: mirror whatever mock-setup helper the existing happy-path test uses; the key addition is the `getCurrentGameweek` spy and the `Umferð 18` assertion.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src SquadPage`
Expected: FAIL — "Umferð 18" not found (strip not mounted).

- [ ] **Step 3: Mount the strip**

In `src/pages/SquadPage.tsx`, add the import near the other component imports:

```tsx
import { CurrentGameweekStrip } from "../components/gameweek/CurrentGameweekStrip";
```

Then render it at the top of the returned section, right after `<BallDefs />`:

```tsx
    <section className="stack squad-page">
      <BallDefs />

      <CurrentGameweekStrip />

      <div className="squad-head">
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --root src SquadPage` → Expected: PASS (existing tests still green — the strip renders null when no current gameweek mock is present, so untouched tests are unaffected; confirm by running the whole file).

- [ ] **Step 5: Commit**

```bash
git add src/pages/SquadPage.tsx src/pages/SquadPage.test.tsx
git commit -m "feat: mount current-gameweek strip on squad page (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Hero card + list row components

**Files:**
- Create: `src/components/gameweek/GameweekHeroCard.tsx`
- Create: `src/components/gameweek/GameweekListRow.tsx`
- Test: `src/components/gameweek/gameweekCards.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/gameweek/gameweekCards.test.tsx`:

```tsx
import { fireEvent, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { Gameweek, RoundGroup } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { GameweekHeroCard } from "./GameweekHeroCard";
import { GameweekListRow } from "./GameweekListRow";

function gw(number: number, status: Gameweek["status"]): Gameweek {
  return {
    number, roundLabel: String(number), tournamentId: "8444",
    deadline: "2099-06-20T18:00:00Z", status, matches: [],
  };
}

const round: RoundGroup = {
  round: "18",
  startDate: "2026-06-20",
  endDate: "2026-06-21",
  matches: [
    {
      matchId: "m1", played: false, date: "2026-06-20T16:00:00Z", venue: null,
      home: { teamId: "h", clubId: "h", name: "Valur", logoSrc: null, score: null },
      away: { teamId: "a", clubId: "a", name: "Haukar", logoSrc: null, score: null },
    },
  ],
};

test("hero shows title, OPEN pill, countdown and fixtures", () => {
  renderWithProviders(<GameweekHeroCard gameweek={gw(18, "Open")} current={gw(18, "Open")} round={round} />);
  expect(screen.getByText("Gameweek 18")).toBeInTheDocument();
  expect(screen.getByText("Open")).toBeInTheDocument();
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByText(/Locks in/)).toBeInTheDocument();
});

test("list row is collapsed, then expands fixtures on click", () => {
  renderWithProviders(
    <GameweekListRow gameweek={gw(19, "Open")} current={gw(18, "Open")} round={round} />,
  );
  expect(screen.getByText("Upcoming")).toBeInTheDocument();
  expect(screen.queryByText("Valur")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByText("Valur")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src gameweekCards`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `GameweekHeroCard`**

`src/components/gameweek/GameweekHeroCard.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Gameweek, RoundGroup } from "../../api/types";
import { FixtureRow } from "./FixtureRow";
import { gameweekLabelKey, isCurrent } from "./gameweekLabels";
import { GameweekStatusPill } from "./GameweekStatusPill";
import { useCountdown } from "./useCountdown";

export function GameweekHeroCard({
  gameweek,
  current,
  round,
}: {
  gameweek: Gameweek;
  current: Gameweek | null;
  round: RoundGroup | undefined;
}) {
  const { t } = useTranslation();
  const countdown = useCountdown(gameweek.deadline);
  const currentNow = isCurrent(gameweek, current);

  return (
    <section className="gw-hero">
      <header className="gw-hero-head">
        <h2 className="gw-hero-title">{t("gameweek.heroTitle", { number: gameweek.number })}</h2>
        <span className="gw-hero-round">{t("gameweek.roundLabel", { label: gameweek.roundLabel })}</span>
        <GameweekStatusPill labelKey={gameweekLabelKey(gameweek.status, currentNow)} />
      </header>

      <div className="gw-countdown gw-hero-countdown">
        {countdown.locked ? t("gameweek.locked") : t("gameweek.locksIn", { countdown: countdown.label })}
      </div>

      <div className="gw-hero-fixtures">
        {round && round.matches.length > 0 ? (
          round.matches.map((m) => <FixtureRow key={m.matchId} match={m} />)
        ) : (
          <p className="gw-empty-note">{t("gameweek.noFixtures")}</p>
        )}
      </div>

      <footer className="gw-hero-foot">
        <Link to="/squad" className="gw-hero-scribble">
          {t("gameweek.setYourSeven")} →
        </Link>
        <Link to="/squad" className="gw-cta-button">
          {t("gameweek.editSquadCta")}
        </Link>
      </footer>
    </section>
  );
}
```

- [ ] **Step 4: Implement `GameweekListRow`**

`src/components/gameweek/GameweekListRow.tsx`:

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Gameweek, RoundGroup } from "../../api/types";
import { FixtureRow } from "./FixtureRow";
import { gameweekLabelKey, isCurrent } from "./gameweekLabels";
import { GameweekStatusPill } from "./GameweekStatusPill";

export function GameweekListRow({
  gameweek,
  current,
  round,
}: {
  gameweek: Gameweek;
  current: Gameweek | null;
  round: RoundGroup | undefined;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const labelKey = gameweekLabelKey(gameweek.status, isCurrent(gameweek, current));

  return (
    <div className={`gw-row${open ? " gw-row--open" : ""}`}>
      <button type="button" className="gw-row-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="gw-row-title">{t("gameweek.heroTitle", { number: gameweek.number })}</span>
        <span className="gw-row-round">{t("gameweek.roundLabel", { label: gameweek.roundLabel })}</span>
        <GameweekStatusPill labelKey={labelKey} />
        <span className="gw-row-chevron" aria-hidden="true">{open ? "▾" : "›"}</span>
      </button>
      {open && (
        <div className="gw-row-fixtures">
          {round && round.matches.length > 0 ? (
            round.matches.map((m) => <FixtureRow key={m.matchId} match={m} />)
          ) : (
            <p className="gw-empty-note">{t("gameweek.noFixtures")}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test + type-check**

Run: `npx vitest run --root src gameweekCards` → Expected: PASS
Run: `npx tsc --noEmit` → Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/gameweek/GameweekHeroCard.tsx src/components/gameweek/GameweekListRow.tsx src/components/gameweek/gameweekCards.test.tsx
git commit -m "feat: add gameweek hero card + list row (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Gameweeks page + remaining hooks

**Files:**
- Modify: `src/query/hooks.ts`
- Create: `src/pages/GameweeksPage.tsx`
- Test: `src/pages/GameweeksPage.test.tsx`

- [ ] **Step 1: Add the `useGameweeks` and `useRounds` hooks**

In `src/query/hooks.ts`, add next to `useCurrentGameweek`:

```ts
export function useGameweeks() {
  return useQuery({
    queryKey: ["gameweeks"],
    queryFn: () => api.getGameweeks(),
  });
}

export function useRounds(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["rounds", tournamentId ?? null],
    queryFn: () => api.getRounds(tournamentId as string),
    enabled: Boolean(tournamentId),
    staleTime: Infinity,
  });
}
```

- [ ] **Step 2: Write the failing test**

`src/pages/GameweeksPage.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { CurrentGameweek, Gameweek, RoundListing } from "../api/types";
import { ApiError } from "../api/client";
import { renderWithProviders } from "../test/renderWithQuery";
import GameweeksPage from "./GameweeksPage";

afterEach(() => vi.restoreAllMocks());

function gw(number: number, status: Gameweek["status"]): Gameweek {
  return {
    number, roundLabel: String(number), tournamentId: "8444",
    deadline: "2099-06-20T18:00:00Z", status, matches: [],
  };
}

function rounds(): RoundListing {
  return {
    tournamentId: "8444", tournamentName: "Olís", season: "2025-26",
    rounds: [
      {
        round: "18", startDate: "2026-06-20", endDate: "2026-06-21",
        matches: [{
          matchId: "m1", played: false, date: "2026-06-20T16:00:00Z", venue: null,
          home: { teamId: "h", clubId: "h", name: "Valur", logoSrc: null, score: null },
          away: { teamId: "a", clubId: "a", name: "Haukar", logoSrc: null, score: null },
        }],
      },
    ],
  };
}

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/gameweeks" element={<GameweeksPage />} />
    </Routes>,
    { initialEntries: ["/gameweeks"] },
  );
}

test("renders header, hero with fixtures, and the section labels", async () => {
  vi.spyOn(api, "getGameweeks").mockResolvedValue([gw(17, "Settled"), gw(18, "Open"), gw(19, "Open")]);
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({ current: gw(18, "Open"), lastSettled: gw(17, "Settled") } satisfies CurrentGameweek);
  vi.spyOn(api, "getRounds").mockResolvedValue(rounds());

  setup();

  expect(await screen.findByText("Gameweek 18")).toBeInTheDocument();
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByText("Round 18 of 3")).toBeInTheDocument();
  expect(screen.getByText("Coming up")).toBeInTheDocument();
  expect(screen.getByText("Results")).toBeInTheDocument();
});

test("shows the not-configured empty state on gameweek_config_missing", async () => {
  vi.spyOn(api, "getGameweeks").mockRejectedValue(new ApiError(400, "gameweek_config_missing", "bad"));
  vi.spyOn(api, "getCurrentGameweek").mockRejectedValue(new ApiError(400, "gameweek_config_missing", "bad"));

  setup();

  expect(await screen.findByText("Gameweeks aren't set up yet")).toBeInTheDocument();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run --root src GameweeksPage`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the page**

`src/pages/GameweeksPage.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import type { Gameweek } from "../api/types";
import { GameweekHeroCard } from "../components/gameweek/GameweekHeroCard";
import { GameweekListRow } from "../components/gameweek/GameweekListRow";
import { roundByLabel, sectionGameweeks } from "../components/gameweek/gameweekLabels";
import { Loading } from "../components/StateViews";
import { useCurrentGameweek, useGameweeks, useRounds } from "../query/hooks";

function isConfigError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "gameweek_config_missing" || error.code === "tournament_not_found")
  );
}

function NotConfigured() {
  const { t } = useTranslation();
  return (
    <section className="gw-empty">
      <h2 className="title">{t("gameweek.notConfigured")}</h2>
      <p className="subtitle">{t("gameweek.notConfiguredBody")}</p>
    </section>
  );
}

export default function GameweeksPage() {
  const { t } = useTranslation();
  const gameweeks = useGameweeks();
  const currentQ = useCurrentGameweek();

  const all: Gameweek[] = gameweeks.data ?? [];
  const tournamentId = all[0]?.tournamentId ?? currentQ.data?.current?.tournamentId;
  const rounds = useRounds(tournamentId);

  if (gameweeks.isPending || currentQ.isPending) return <Loading />;
  if (isConfigError(gameweeks.error) || isConfigError(currentQ.error)) return <NotConfigured />;
  if (gameweeks.isError || currentQ.isError) return <NotConfigured />;

  const current = currentQ.data?.current ?? null;
  const lastSettled = currentQ.data?.lastSettled ?? null;
  const { hero, comingUp, results } = sectionGameweeks(all, current, lastSettled);

  if (!hero) {
    return (
      <section className="stack gw-page">
        <p className="subtitle">{t("gameweek.empty")}</p>
      </section>
    );
  }

  const season = rounds.data?.season ?? "";

  return (
    <section className="stack gw-page">
      <header className="gw-page-head">
        <div className="scribble gw-page-eyebrow">{t("gameweek.pageEyebrow")}</div>
        <h1 className="title">{t("gameweek.pageTitle")}</h1>
        <div className="gw-season-chip">
          <span className="poslabel">{t("gameweek.seasonChip", { season })}</span>
          <span className="gw-season-round">{t("gameweek.roundOf", { current: hero.number, total: all.length })}</span>
        </div>
      </header>

      <GameweekHeroCard gameweek={hero} current={current} round={roundByLabel(rounds.data, hero.roundLabel)} />

      {comingUp.length > 0 && (
        <div className="gw-section">
          <div className="label gw-section-label">{t("gameweek.comingUp")}</div>
          {comingUp.map((g) => (
            <GameweekListRow key={g.number} gameweek={g} current={current} round={roundByLabel(rounds.data, g.roundLabel)} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="gw-section">
          <div className="label gw-section-label">{t("gameweek.results")}</div>
          {results.map((g) => (
            <GameweekListRow key={g.number} gameweek={g} current={current} round={roundByLabel(rounds.data, g.roundLabel)} />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Run test + type-check**

Run: `npx vitest run --root src GameweeksPage` → Expected: PASS
Run: `npx tsc --noEmit` → Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/query/hooks.ts src/pages/GameweeksPage.tsx src/pages/GameweeksPage.test.tsx
git commit -m "feat: add gameweeks calendar page (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Route + nav link

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Nav.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `src/App.test.tsx` (mock the three gameweek endpoints so the page resolves). First add imports at the top if not present:

```tsx
import * as api from "./api/endpoints";
```

Then add:

```tsx
test("navigates to the public gameweeks page", async () => {
  vi.spyOn(api, "getGameweeks").mockResolvedValue([
    { number: 18, roundLabel: "18", tournamentId: "8444", deadline: "2099-06-20T18:00:00Z", status: "Open", matches: [] },
  ]);
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({
    current: { number: 18, roundLabel: "18", tournamentId: "8444", deadline: "2099-06-20T18:00:00Z", status: "Open", matches: [] },
    lastSettled: null,
  });
  vi.spyOn(api, "getRounds").mockResolvedValue({ tournamentId: "8444", tournamentName: null, season: "2025-26", rounds: [] });

  renderWithProviders(<App />, { initialEntries: ["/gameweeks"] });

  expect(await screen.findByText("Gameweek 18")).toBeInTheDocument();
});
```

> Match the existing `App.test.tsx` render helper and imports (it already renders `<App />` via `renderWithProviders`); add `afterEach(() => vi.restoreAllMocks())` if the file doesn't already have it.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src App`
Expected: FAIL — `/gameweeks` route renders nothing.

- [ ] **Step 3: Add the public route**

In `src/App.tsx`, add the import with the other page imports:

```tsx
import GameweeksPage from "./pages/GameweeksPage";
```

Add the route inside the public block (alongside `/players`, before the `<Route element={<ProtectedRoute />}>` block):

```tsx
          <Route path="/gameweeks" element={<GameweeksPage />} />
```

- [ ] **Step 4: Add the nav link**

In `src/components/Nav.tsx`, add a Gameweeks link to **both** branches of `AuthArea` so it is reachable logged-in and logged-out. In the authenticated branch, after the `/squad` link:

```tsx
        <Link to="/gameweeks" className="nav-link">{t("gameweek.navLink")}</Link>
```

In the anonymous branch, before the login link:

```tsx
      <Link to="/gameweeks" className="nav-link">{t("gameweek.navLink")}</Link>
```

- [ ] **Step 5: Run tests + type-check**

Run: `npx vitest run --root src App` → Expected: PASS
Run: `npx tsc --noEmit` → Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/Nav.tsx src/App.test.tsx
git commit -m "feat: add /gameweeks route + nav link (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Styles

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Append the gameweek styles**

Append to `src/styles/app.css` (uses the existing CSS variables `--paper-2`, `--line-2`, `--amber`, `--amber-deep`, `--good`, `--ink`, `--ink-2`, `--ink-3`):

```css
/* ---- Gameweek UI (Web#36) ---- */
.gw-strip,
.gw-hero,
.gw-row {
  background: var(--paper-2);
  border: 1.5px solid var(--line-2);
  border-radius: 14px;
  box-shadow: var(--shadow);
}

.gw-strip {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
}
.gw-strip-round { text-align: center; min-width: 64px; }
.gw-strip-round-label { display: block; font-family: "Caveat", cursive; color: var(--ink-2); font-size: 16px; }
.gw-strip-round-num { font-family: "Spectral", Georgia, serif; font-weight: 800; font-size: 30px; line-height: 1; }
.gw-strip-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.gw-strip-title { font-family: "Spectral", Georgia, serif; font-weight: 700; font-size: 17px; }
.gw-strip-meta { color: var(--ink-2); font-size: 13px; }
.gw-strip-deadline { text-align: right; }
.gw-strip-eyebrow,
.gw-strip-deadline-at { font-family: "Caveat", cursive; color: var(--ink-2); font-size: 15px; }

.gw-countdown { font-family: "Spectral", Georgia, serif; font-weight: 800; font-size: 22px; color: var(--amber-deep); }
.gw-hero-countdown { font-size: 24px; margin: 10px 0; }

/* status pills */
.gw-pill {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1.5px solid var(--line-2);
  color: var(--ink-2);
  background: var(--paper-3);
  width: fit-content;
}
.gw-pill--open { color: #7a5018; background: #f6dcb0; border-color: var(--amber); }
.gw-pill--live { color: #3c5a2c; background: #dde7cf; border-color: var(--good); }
.gw-pill--locked { color: #4a4030; background: #e9e0c6; }
.gw-pill--upcoming,
.gw-pill--final { color: var(--ink-2); }

/* hero */
.gw-hero { padding: 18px 20px; }
.gw-hero-head { display: flex; align-items: baseline; gap: 12px; }
.gw-hero-title { font-family: "Spectral", Georgia, serif; font-weight: 800; font-size: 26px; margin: 0; }
.gw-hero-round { font-family: "Caveat", cursive; color: var(--ink-2); font-size: 20px; }
.gw-hero-head .gw-pill { margin-left: auto; }
.gw-hero-fixtures { border-top: 1px dashed var(--line-2); padding-top: 8px; }
.gw-hero-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.gw-hero-scribble { font-family: "Caveat", cursive; color: var(--amber-deep); font-size: 17px; text-decoration: none; }
.gw-cta-button {
  background: var(--amber); color: #fff8ee; border: none; border-radius: 10px;
  padding: 9px 16px; font-weight: 700; text-decoration: none;
  box-shadow: 0 2px 0 #00000022, 0 8px 18px -10px #28241d88;
}

/* fixtures */
.gw-fixture {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; font-size: 14px; color: var(--ink);
  text-decoration: none; border-bottom: 1px dashed var(--line);
}
.gw-fixture:last-child { border-bottom: none; }
.gw-fixture-team { display: inline-flex; align-items: center; gap: 6px; }
.gw-fixture-logo { width: 22px; height: 22px; border-radius: 50%; object-fit: contain; }
.gw-fixture-logo--blank { background: #e3d7b8; border: 1px solid var(--line-2); }
.gw-fixture-vs { color: var(--ink-3); font-size: 12px; }
.gw-fixture-score { margin-left: auto; font-family: "Spectral", Georgia, serif; font-weight: 700; }
.gw-fixture-time { margin-left: auto; color: var(--ink-3); font-size: 13px; }

/* list rows + sections */
.gw-section { margin-top: 22px; }
.gw-section-label { margin-bottom: 8px; }
.gw-row { margin-bottom: 10px; }
.gw-row-head {
  width: 100%; display: flex; align-items: center; gap: 10px;
  background: none; border: none; cursor: pointer; padding: 12px 14px;
  font: inherit; color: inherit; text-align: left;
}
.gw-row-title { font-family: "Spectral", Georgia, serif; font-weight: 700; }
.gw-row-round { font-family: "Caveat", cursive; color: var(--ink-2); font-size: 16px; }
.gw-row-chevron { margin-left: auto; color: var(--ink-3); }
.gw-row-fixtures { padding: 0 14px 12px; }
.gw-empty-note { color: var(--ink-3); font-size: 13px; }

/* header + empty */
.gw-page-head { margin-bottom: 8px; }
.gw-page-eyebrow { font-family: "Caveat", cursive; color: var(--amber-deep); font-size: 18px; }
.gw-season-chip {
  display: inline-flex; gap: 8px; align-items: baseline;
  border: 1.5px solid var(--line-2); border-radius: 12px; padding: 8px 14px; background: var(--paper-2);
}
.gw-season-round { font-family: "Spectral", Georgia, serif; font-weight: 700; }
.gw-empty { text-align: center; padding: 40px 0; }
```

- [ ] **Step 2: Verify the build compiles styles + full test suite is green**

Run: `npx vitest run --root src` → Expected: all PASS
Run: `npm run build` → Expected: builds without CSS/TS errors

- [ ] **Step 3: Commit**

```bash
git add src/styles/app.css
git commit -m "feat: style gameweek strip, hero and calendar (Web#36)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Run the full scoped suite: `npx vitest run --root src` → all green.
- [ ] Type-check: `npx tsc --noEmit` → clean.
- [ ] Build: `npm run build` → succeeds.
- [ ] Manual smoke (once the API is deployed): visit `/gameweeks` (logged out → calendar renders, no pts), and `/squad` (strip shows current round + live countdown). Confirm the not-configured empty state by pointing at an environment without the gameweek config seeded.

---

## Spec coverage check

- Public `/gameweeks` route + nav link → Tasks 9, 10.
- Current-gameweek hero (status, live countdown, fixtures, CTA) → Tasks 5, 8, 9.
- Current-gameweek strip on `/squad` → Tasks 6, 7.
- COMING UP / RESULTS sectioning with status pills → Tasks 4, 8, 9.
- Status→label mapping (OPEN/UPCOMING/LOCKED/LIVE/FINAL) → Task 4.
- Approach B rounds-join for fixtures (names/logos/scores) → Tasks 1, 4, 5, 9.
- Live ticking countdown → Task 3.
- Endpoints + types added to `src/api/endpoints.ts` → Task 1.
- Loading / config-missing / not-found / empty states → Task 9.
- i18n keys (is/en) → Task 2.
- No pts numbers (deferred to #37) → RESULTS rows render FINAL pills only; no scores endpoint consumed. Confirmed across Tasks 8–9.
