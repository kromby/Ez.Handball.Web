# Gameweek Scores (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "My gameweek scores" section to `/squad` showing the manager's running total and a per-gameweek, per-player breakdown (points, auto-subs, captain multiplier) for settled gameweeks.

**Architecture:** New `getMyGameweeks` endpoint + `useMyGameweeks` react-query hook feed a `GameweekScores` section component mounted below the squad grid. Player names/positions are resolved by joining `breakdown[].playerId` against the already-loaded squad (passed in as a prop) with an "Unknown player" fallback — no extra requests. Presentational pieces (`GameweekScoreRow`, `PlayerScoreLine`) are pure props-driven components.

**Tech Stack:** React + TypeScript, @tanstack/react-query, react-i18next, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-06-14-gameweek-scores-web-design.md`

---

## File Structure

- `src/api/types.ts` — add `GameweekPlayerScore`, `MyGameweekScore`, `MyGameweeks` (modify).
- `src/api/endpoints.ts` — add `getMyGameweeks()` using `authedGet` (modify).
- `src/api/endpoints.test.ts` — add path test (modify).
- `src/query/hooks.ts` — add `useMyGameweeks()` (modify).
- `src/i18n/locales/en.json`, `src/i18n/locales/is.json` — add `gameweekScores.*` block (modify).
- `src/components/gameweek/PlayerScoreLine.tsx` — one player line (create).
- `src/components/gameweek/GameweekScoreRow.tsx` — one expandable settled-gameweek row (create).
- `src/components/gameweek/GameweekScores.tsx` — section: banner + rows; calls the hook (create).
- `src/components/gameweek/gameweekScores.test.tsx` — component tests (create).
- `src/pages/SquadPage.tsx` — mount the section (modify).
- `src/styles/app.css` — append `.gwsc-*` styles (modify).

---

## Task 1: API types + endpoint

**Files:**
- Modify: `src/api/types.ts` (append near the existing `Gameweek`/`CurrentGameweek` block, around line 343)
- Modify: `src/api/endpoints.ts` (add after `getCurrentGameweek`, around line 165)
- Test: `src/api/endpoints.test.ts`

- [ ] **Step 1: Write the failing endpoint test**

Add to `src/api/endpoints.test.ts` — import `getMyGameweeks` in the top import list (the one from `"./endpoints"`), then add this test after the `getCurrentGameweek` tests (around line 219):

```ts
test("getMyGameweeks calls the authed my-gameweeks endpoint", async () => {
  const spy = spyAuthedGet();
  await getMyGameweeks();
  expect(spy).toHaveBeenCalledWith("/api/users/me/gameweeks");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root . src/api/endpoints.test.ts`
Expected: FAIL — `getMyGameweeks is not exported` / `not a function`.

- [ ] **Step 3: Add the types**

In `src/api/types.ts`, after the `CurrentGameweek` interface (line 343):

```ts
export interface GameweekPlayerScore {
  playerId: string;
  rawPoints: number;
  points: number; // rawPoints * multiplier; 0 for a non-playing unsubbed starter
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
  gameweeks: MyGameweekScore[]; // ascending (oldest first), as returned by the API
}
```

- [ ] **Step 4: Add the endpoint**

In `src/api/endpoints.ts`, find the `MyGameweeks` import — add `MyGameweeks` to the existing type import from `"./types"`. Then add after `getCurrentGameweek` (around line 165):

```ts
export function getMyGameweeks(): Promise<MyGameweeks> {
  return authedGet<MyGameweeks>("/api/users/me/gameweeks");
}
```

Confirm `authedGet` is already imported in this file (it is — used by `getSquad`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run --root . src/api/endpoints.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/api/types.ts src/api/endpoints.ts src/api/endpoints.test.ts
git commit -m "feat: add getMyGameweeks endpoint + types (Web#37)"
```

---

## Task 2: react-query hook

**Files:**
- Modify: `src/query/hooks.ts` (add after `useSquad`, around line 180)

- [ ] **Step 1: Add the hook**

In `src/query/hooks.ts`, after `useSquad` (line 180). The file already imports `useQuery`, `api` (as `* as api`), and `useAuth` — follow the `useSquad` pattern exactly:

```ts
export function useMyGameweeks() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["my-gameweeks"],
    queryFn: () => api.getMyGameweeks(),
    enabled: status === "authenticated",
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/query/hooks.ts
git commit -m "feat: add useMyGameweeks hook (Web#37)"
```

---

## Task 3: i18n keys

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/is.json`

- [ ] **Step 1: Add the English block**

In `src/i18n/locales/en.json`, add a new top-level `"gameweekScores"` key (place it right after the existing `"gameweek"` block):

```json
"gameweekScores": {
  "heading": "My gameweek scores",
  "runningTotal": "Running total",
  "settledCount_one": "{{count}} gameweek settled",
  "settledCount_other": "{{count}} gameweeks settled",
  "gw": "GW {{number}}",
  "points": "pts",
  "raw": "{{points}} raw",
  "captainBadge": "C ×{{multiplier}}",
  "captainBadgeLabel": "Captain, {{multiplier}} times points",
  "subBadge": "↑ sub",
  "subBadgeLabel": "Auto-substituted in",
  "dnp": "DNP",
  "unknownPlayer": "Unknown player",
  "empty": "No gameweeks scored yet"
}
```

- [ ] **Step 2: Add the Icelandic block (draft — owner review pending)**

In `src/i18n/locales/is.json`, add the matching `"gameweekScores"` block after `"gameweek"`:

```json
"gameweekScores": {
  "heading": "Mín umferðastig",
  "runningTotal": "Heildarstig",
  "settledCount_one": "{{count}} umferð uppgerð",
  "settledCount_other": "{{count}} umferðir uppgerðar",
  "gw": "Umferð {{number}}",
  "points": "stig",
  "raw": "{{points}} grunnstig",
  "captainBadge": "F ×{{multiplier}}",
  "captainBadgeLabel": "Fyrirliði, {{multiplier}}-föld stig",
  "subBadge": "↑ inn á",
  "subBadgeLabel": "Sjálfvirk skipting inn á",
  "dnp": "Lék ekki",
  "unknownPlayer": "Óþekktur leikmaður",
  "empty": "Engar umferðir uppgerðar enn"
}
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "require('./src/i18n/locales/en.json');require('./src/i18n/locales/is.json');console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/is.json
git commit -m "feat: add gameweekScores i18n keys (Web#37)"
```

---

## Task 4: PlayerScoreLine component

A pure, props-driven line. The parent resolves name/position before passing them in.

**Files:**
- Create: `src/components/gameweek/PlayerScoreLine.tsx`
- Test: `src/components/gameweek/gameweekScores.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/gameweek/gameweekScores.test.tsx`:

```tsx
import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithProviders } from "../../test/renderWithQuery";
import { PlayerScoreLine } from "./PlayerScoreLine";

test("renders a captain line with multiplier badge and final points", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Aron Pálmarsson"
      position="GK"
      rawPoints={9}
      points={18}
      played
      autoSubbedIn={false}
      captainApplied
      multiplier={2}
    />,
  );
  expect(screen.getByText("Aron Pálmarsson")).toBeInTheDocument();
  expect(screen.getByText("C ×2")).toBeInTheDocument();
  expect(screen.getByText("18")).toBeInTheDocument();
});

test("renders an auto-sub badge", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Gísli Kristjánsson"
      position="CB"
      rawPoints={8}
      points={8}
      played
      autoSubbedIn
      captainApplied={false}
      multiplier={1}
    />,
  );
  expect(screen.getByText("↑ sub")).toBeInTheDocument();
});

test("renders a DNP starter dimmed with zero points", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Bjarki Már Elísson"
      position="RB"
      rawPoints={0}
      points={0}
      played={false}
      autoSubbedIn={false}
      captainApplied={false}
      multiplier={1}
    />,
  );
  expect(screen.getByText("DNP")).toBeInTheDocument();
  expect(screen.getByText("Bjarki Már Elísson").closest(".gwsc-line")).toHaveClass("gwsc-line--dnp");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root . src/components/gameweek/gameweekScores.test.tsx`
Expected: FAIL — cannot find module `./PlayerScoreLine`.

- [ ] **Step 3: Implement PlayerScoreLine**

Create `src/components/gameweek/PlayerScoreLine.tsx`:

```tsx
import { useTranslation } from "react-i18next";

export interface PlayerScoreLineProps {
  name: string;
  position: string | null;
  rawPoints: number;
  points: number;
  played: boolean;
  autoSubbedIn: boolean;
  captainApplied: boolean;
  multiplier: number;
}

export function PlayerScoreLine({
  name,
  position,
  rawPoints,
  points,
  played,
  autoSubbedIn,
  captainApplied,
  multiplier,
}: PlayerScoreLineProps) {
  const { t } = useTranslation();
  return (
    <div className={`gwsc-line${played ? "" : " gwsc-line--dnp"}`}>
      <span className="gwsc-pos poslabel">{position ?? ""}</span>
      <span className="gwsc-name">
        {name}
        {captainApplied && (
          <span className="gwsc-badge gwsc-badge--cap" aria-label={t("gameweekScores.captainBadgeLabel", { multiplier })}>
            {t("gameweekScores.captainBadge", { multiplier })}
          </span>
        )}
        {autoSubbedIn && (
          <span className="gwsc-badge gwsc-badge--sub" aria-label={t("gameweekScores.subBadgeLabel")}>
            {t("gameweekScores.subBadge")}
          </span>
        )}
      </span>
      <span className="gwsc-raw">{played ? t("gameweekScores.raw", { points: rawPoints }) : t("gameweekScores.dnp")}</span>
      <span className="gwsc-final">{points}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root . src/components/gameweek/gameweekScores.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/gameweek/PlayerScoreLine.tsx src/components/gameweek/gameweekScores.test.tsx
git commit -m "feat: add PlayerScoreLine component (Web#37)"
```

---

## Task 5: GameweekScoreRow component

One expandable settled-gameweek row. Pure props: it receives the score, its derived GW number, a name resolver, and whether to start open. It owns sorting and name resolution display.

**Files:**
- Create: `src/components/gameweek/GameweekScoreRow.tsx`
- Test: `src/components/gameweek/gameweekScores.test.tsx` (append)

- [ ] **Step 1: Write the failing test**

Append to `src/components/gameweek/gameweekScores.test.tsx`. Add these imports at the top (merge with existing import lines):

```tsx
import { fireEvent } from "@testing-library/react";
import type { MyGameweekScore } from "../../api/types";
import { GameweekScoreRow } from "./GameweekScoreRow";
```

Add a fixture + tests:

```tsx
const sampleScore: MyGameweekScore = {
  roundLabel: "15. umferð",
  points: 58,
  captainPlayerId: "p1",
  breakdown: [
    { playerId: "p1", rawPoints: 9, points: 18, played: true, autoSubbedIn: false, captainApplied: true, multiplier: 2 },
    { playerId: "p2", rawPoints: 11, points: 11, played: true, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
    { playerId: "p3", rawPoints: 0, points: 0, played: false, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
    { playerId: "p4", rawPoints: 8, points: 8, played: true, autoSubbedIn: true, captainApplied: false, multiplier: 1 },
  ],
};

const nameOf = (id: string) =>
  ({
    p1: { name: "Aron", position: "GK" },
    p2: { name: "Ómar", position: "LW" },
    p4: { name: "Gísli", position: "CB" },
  })[id] ?? { name: "Unknown player", position: null };

test("row header shows GW number, round label and total points", () => {
  renderWithProviders(<GameweekScoreRow score={sampleScore} number={6} nameOf={nameOf} defaultOpen />);
  expect(screen.getByText("GW 6")).toBeInTheDocument();
  expect(screen.getByText("Umferð 15. umferð")).toBeInTheDocument();
  expect(screen.getByText("58")).toBeInTheDocument();
});

test("breakdown sorts by points desc with DNP last and resolves names", () => {
  renderWithProviders(<GameweekScoreRow score={sampleScore} number={6} nameOf={nameOf} defaultOpen />);
  const names = screen.getAllByTestId("gwsc-line-name").map((n) => n.textContent);
  // Aron 18 (captain), Ómar 11, Gísli 8 (sub), then DNP p3 (Unknown) last.
  expect(names[0]).toContain("Aron");
  expect(names[1]).toContain("Ómar");
  expect(names[2]).toContain("Gísli");
  expect(names[3]).toContain("Unknown player");
});

test("row is collapsible", () => {
  renderWithProviders(<GameweekScoreRow score={sampleScore} number={6} nameOf={nameOf} defaultOpen={false} />);
  expect(screen.queryByText("Aron")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByText("Aron")).toBeInTheDocument();
});
```

Note: this requires `PlayerScoreLine` to tag its name span with `data-testid="gwsc-line-name"`. Update `PlayerScoreLine.tsx` from Task 4 — change the name span opening tag to:

```tsx
      <span className="gwsc-name" data-testid="gwsc-line-name">
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root . src/components/gameweek/gameweekScores.test.tsx`
Expected: FAIL — cannot find module `./GameweekScoreRow`.

- [ ] **Step 3: Implement GameweekScoreRow**

Create `src/components/gameweek/GameweekScoreRow.tsx`:

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MyGameweekScore } from "../../api/types";
import { PlayerScoreLine } from "./PlayerScoreLine";

export interface ResolvedPlayer {
  name: string;
  position: string | null;
}

export function GameweekScoreRow({
  score,
  number,
  nameOf,
  defaultOpen,
}: {
  score: MyGameweekScore;
  number: number;
  nameOf: (playerId: string) => ResolvedPlayer;
  defaultOpen: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  // Played players by points desc; DNP (did not play) sink to the bottom.
  const lines = [...score.breakdown].sort((a, b) => {
    if (a.played !== b.played) return a.played ? -1 : 1;
    return b.points - a.points;
  });

  return (
    <div className={`gwsc-row${open ? " gwsc-row--open" : ""}`}>
      <button type="button" className="gwsc-row-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="gwsc-gw">{t("gameweekScores.gw", { number })}</span>
        <span className="gwsc-round">{t("gameweek.roundLabel", { label: score.roundLabel })}</span>
        <span className="gwsc-total-pts">{score.points}</span>
        <span className="gwsc-chevron" aria-hidden="true">{open ? "▾" : "›"}</span>
      </button>
      {open && (
        <div className="gwsc-row-body">
          {lines.map((p) => {
            const resolved = nameOf(p.playerId);
            return (
              <PlayerScoreLine
                key={p.playerId}
                name={resolved.name}
                position={resolved.position}
                rawPoints={p.rawPoints}
                points={p.points}
                played={p.played}
                autoSubbedIn={p.autoSubbedIn}
                captainApplied={p.captainApplied}
                multiplier={p.multiplier}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root . src/components/gameweek/gameweekScores.test.tsx`
Expected: PASS (all PlayerScoreLine + GameweekScoreRow tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/gameweek/GameweekScoreRow.tsx src/components/gameweek/PlayerScoreLine.tsx src/components/gameweek/gameweekScores.test.tsx
git commit -m "feat: add GameweekScoreRow component (Web#37)"
```

---

## Task 6: GameweekScores section component

Calls `useMyGameweeks()`, builds the name resolver from the passed-in squad, derives GW numbers (ascending index + 1), renders newest-first with the most recent open.

**Files:**
- Create: `src/components/gameweek/GameweekScores.tsx`
- Test: `src/components/gameweek/gameweekScores.test.tsx` (append)

- [ ] **Step 1: Write the failing test**

Append to `src/components/gameweek/gameweekScores.test.tsx`. Add imports (merge with existing):

```tsx
import { afterEach, vi } from "vitest";
import * as api from "../../api/endpoints";
import type { MyGameweeks, Squad } from "../../api/types";
import { GameweekScores } from "./GameweekScores";

afterEach(() => vi.restoreAllMocks());
```

Add fixtures + tests:

```tsx
const squadFixture = {
  flavor: "fantasy",
  players: [
    { playerId: "p1", name: "Aron", clubId: null, clubName: null, position: "GK", gender: null, price: null, pricePaid: 0, rating: 0 },
    { playerId: "p2", name: "Ómar", clubId: null, clubName: null, position: "LW", gender: null, price: null, pricePaid: 0, rating: 0 },
  ],
  budgetUsed: 0,
  remainingBudget: 0,
  squadValue: 0,
} as unknown as Squad;

const twoGameweeks: MyGameweeks = {
  runningTotal: 105,
  gameweeks: [
    { roundLabel: "14. umferð", points: 47, captainPlayerId: "p1", breakdown: [
      { playerId: "p1", rawPoints: 5, points: 10, played: true, autoSubbedIn: false, captainApplied: true, multiplier: 2 },
    ] },
    { roundLabel: "15. umferð", points: 58, captainPlayerId: "p2", breakdown: [
      { playerId: "p2", rawPoints: 11, points: 11, played: true, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
    ] },
  ],
};

test("shows running total, settled count and newest gameweek first", async () => {
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue(twoGameweeks);
  renderWithProviders(<GameweekScores squad={squadFixture} />);
  expect(await screen.findByText("105")).toBeInTheDocument();
  expect(screen.getByText("2 gameweeks settled")).toBeInTheDocument();
  // Newest first: GW2 (15. umferð) renders before GW1 (14. umferð).
  const heads = screen.getAllByText(/^GW \d+$/).map((n) => n.textContent);
  expect(heads).toEqual(["GW 2", "GW 1"]);
});

test("resolves a player missing from the squad to the fallback label", async () => {
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue({
    runningTotal: 10,
    gameweeks: [
      { roundLabel: "1. umferð", points: 10, captainPlayerId: null, breakdown: [
        { playerId: "sold", rawPoints: 10, points: 10, played: true, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
      ] },
    ],
  });
  renderWithProviders(<GameweekScores squad={squadFixture} />);
  expect(await screen.findByText("Unknown player")).toBeInTheDocument();
});

test("renders the empty note and no running total when nothing is settled", async () => {
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue({ runningTotal: 0, gameweeks: [] });
  renderWithProviders(<GameweekScores squad={squadFixture} />);
  expect(await screen.findByText("No gameweeks scored yet")).toBeInTheDocument();
  expect(screen.queryByText("Running total")).not.toBeInTheDocument();
});

test("renders nothing on error (section is supplementary)", async () => {
  vi.spyOn(api, "getMyGameweeks").mockRejectedValue(new Error("boom"));
  const { container } = renderWithProviders(<GameweekScores squad={squadFixture} />);
  await waitFor(() => expect(api.getMyGameweeks).toHaveBeenCalled());
  expect(container.querySelector(".gwsc")).toBeNull();
});
```

Add `waitFor` to the `@testing-library/react` import.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root . src/components/gameweek/gameweekScores.test.tsx`
Expected: FAIL — cannot find module `./GameweekScores`.

- [ ] **Step 3: Implement GameweekScores**

Create `src/components/gameweek/GameweekScores.tsx`:

```tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Squad } from "../../api/types";
import { useMyGameweeks } from "../../query/hooks";
import { GameweekScoreRow, type ResolvedPlayer } from "./GameweekScoreRow";

export function GameweekScores({ squad }: { squad: Squad | undefined }) {
  const { t } = useTranslation();
  const { data, isError } = useMyGameweeks();

  const nameOf = useMemo(() => {
    const byId = new Map((squad?.players ?? []).map((p) => [p.playerId, p]));
    return (playerId: string): ResolvedPlayer => {
      const p = byId.get(playerId);
      return {
        name: p?.name ?? t("gameweekScores.unknownPlayer"),
        position: p?.position ?? null,
      };
    };
  }, [squad, t]);

  // Fail silently: the section is supplementary to the squad page.
  if (isError || !data) return null;

  const total = data.gameweeks.length;
  if (total === 0) {
    return (
      <section className="gwsc gwsc--empty">
        <h2 className="gwsc-heading">{t("gameweekScores.heading")}</h2>
        <p className="subtitle">{t("gameweekScores.empty")}</p>
      </section>
    );
  }

  // API order is ascending (oldest = GW 1). Number by original index, display newest first.
  const numbered = data.gameweeks.map((score, i) => ({ score, number: i + 1 }));
  const display = [...numbered].reverse();

  return (
    <section className="gwsc">
      <div className="gwsc-total">
        <span className="gwsc-total-label poslabel">{t("gameweekScores.runningTotal")}</span>
        <span className="gwsc-total-num">{data.runningTotal}</span>
        <span className="gwsc-total-sub">{t("gameweekScores.settledCount", { count: total })}</span>
      </div>
      <div className="gwsc-rows">
        {display.map(({ score, number }, idx) => (
          <GameweekScoreRow
            key={score.roundLabel}
            score={score}
            number={number}
            nameOf={nameOf}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root . src/components/gameweek/gameweekScores.test.tsx`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/gameweek/GameweekScores.tsx src/components/gameweek/gameweekScores.test.tsx
git commit -m "feat: add GameweekScores section component (Web#37)"
```

---

## Task 7: Mount on SquadPage

**Files:**
- Modify: `src/pages/SquadPage.tsx`

- [ ] **Step 1: Add the import**

In `src/pages/SquadPage.tsx`, after the `CurrentGameweekStrip` import (line 7):

```tsx
import { GameweekScores } from "../components/gameweek/GameweekScores";
```

- [ ] **Step 2: Mount the section below the squad grid**

In `src/pages/SquadPage.tsx`, change the closing of the `squad-grid` block (lines 68-75) so the section renders after it, still inside the page `<section>`:

```tsx
      <div className="squad-grid">
        <SquadCourt players={players} selectedId={activeId} onSelect={setSelectedId} />

        <div className="squad-rail">
          <SelectedPlayerPanel player={selected} />
        </div>
      </div>

      <GameweekScores squad={squad.data} />
    </section>
  );
}
```

(`squad.data` is the resolved `useSquad()` query data already in scope — confirm the variable name is `squad` at the top of the component; it is.)

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/SquadPage.tsx
git commit -m "feat: mount gameweek scores on squad page (Web#37)"
```

---

## Task 8: Styles

Append sketchbook-consistent styles. Reuse the warm-paper palette and hand-drawn feel of the existing `.gw-row` block (around `src/styles/app.css:1351`).

**Files:**
- Modify: `src/styles/app.css` (append at end of file)

- [ ] **Step 1: Append the styles**

Add to the end of `src/styles/app.css`:

```css
/* Gameweek scores (Web#37) — settled results on /squad */
.gwsc { margin-top: 28px; }
.gwsc-heading { font-size: 18px; margin: 0 0 12px; }

.gwsc-total {
  display: flex; align-items: baseline; gap: 14px;
  border: 2px solid var(--ink, #2b2b2b); border-radius: 14px;
  background: #fffaf0; padding: 14px 18px; margin-bottom: 16px;
  box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.12);
}
.gwsc-total-num { font-size: 38px; font-weight: 800; line-height: 1; }
.gwsc-total-sub { margin-left: auto; font-size: 13px; opacity: 0.6; }

.gwsc-rows { display: flex; flex-direction: column; gap: 10px; }

.gwsc-row {
  border: 2px solid var(--ink, #2b2b2b); border-radius: 12px;
  background: #fff; overflow: hidden; box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.1);
}
.gwsc-row-head {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 11px 16px; background: #fdf6e7; border: 0; cursor: pointer;
  font: inherit; text-align: left;
}
.gwsc-gw { font-weight: 800; }
.gwsc-round { font-size: 13px; opacity: 0.6; }
.gwsc-total-pts { margin-left: auto; font-weight: 800; font-size: 20px; }
.gwsc-chevron { opacity: 0.5; }

.gwsc-row-body { padding: 6px 16px 12px; }

.gwsc-line {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 2px; border-bottom: 1px dashed #ddd;
}
.gwsc-line:last-child { border-bottom: none; }
.gwsc-line--dnp { opacity: 0.45; }
.gwsc-line--dnp .gwsc-name { text-decoration: line-through; }
.gwsc-pos { width: 34px; }
.gwsc-name { flex: 1; display: flex; align-items: center; gap: 8px; }
.gwsc-raw { font-size: 12px; opacity: 0.5; min-width: 60px; text-align: right; }
.gwsc-final { font-weight: 800; min-width: 38px; text-align: right; }

.gwsc-badge {
  font-size: 10px; font-weight: 700; padding: 1px 6px;
  border-radius: 20px; border: 1.5px solid;
}
.gwsc-badge--cap { color: #b8860b; border-color: #b8860b; background: #fff7e0; }
.gwsc-badge--sub { color: #2e7d32; border-color: #2e7d32; background: #e9f6ea; }
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: build succeeds (CSS is valid, no TS errors).

- [ ] **Step 3: Commit**

```bash
git add src/styles/app.css
git commit -m "style: add gameweek scores styles (Web#37)"
```

---

## Task 9: Full verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run --root src`
Expected: all tests pass (existing + new gameweekScores tests). Note: use `--root src` to avoid the stray `.worktrees/` pollution noted in project memory.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: clean.

- [ ] **Step 3: Manual smoke (optional)**

Run: `npm run dev`, log in as a fantasy manager with settled gameweeks, open `/squad`, scroll below the pitch. Verify: running total banner, newest gameweek expanded, captain `C ×2` badge, sub `↑ sub` badge, DNP players dimmed at the bottom. A manager with no settled gameweeks sees the "No gameweeks scored yet" note.

- [ ] **Step 4: Final commit (if anything outstanding)**

```bash
git status
# commit any stragglers
```

---

## Self-Review Notes

- **Spec coverage:** running total (Task 6), per-player breakdown + auto-sub + captain (Tasks 4-6), settled-only single source (Task 1/6), placement on `/squad` (Task 7), compact line layout (Task 4), name resolution with fallback (Task 6), empty/error states (Task 6), i18n is/en (Task 3), tests (Tasks 1, 4-6). All covered.
- **Type consistency:** `MyGameweeks`/`MyGameweekScore`/`GameweekPlayerScore` defined in Task 1 and consumed unchanged in Tasks 5-6. `ResolvedPlayer` defined in Task 5, imported by Task 6. `nameOf` signature `(playerId: string) => ResolvedPlayer` consistent across Tasks 5-6.
- **Settled-count key:** `settledCount_one`/`settledCount_other` are the react-i18next plural forms; called as `t("gameweekScores.settledCount", { count })` in Task 6.
