# Club Links From Existing Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn club names/logos that the app already renders into links to `/clubs/:id`, via one shared `ClubLink` component, so users can reach the club page (Web#42/#43).

**Architecture:** A tiny `clubPath(clubId)` route helper plus a `ClubLink` component that renders a `<Link>` when `clubId` is present and plain text otherwise. Each surface that already carries `clubId` (player table, player history, match scoreboard, player detail header, club match row) swaps its plain club text for `ClubLink`. No API or type changes — every linked surface already exposes `clubId`.

**Tech Stack:** React, react-router-dom (`Link`), TypeScript, Vitest + @testing-library/react, react-i18next.

**Conventions:**
- Run the suite scoped: `npx vitest run --root src` (a stray `.worktrees/...` tree pollutes an unscoped run).
- Component tests render through `renderWithProviders` (`src/test/renderWithQuery.tsx`), which already wraps in `MemoryRouter`. Tests that use bare `render()` and now render a `<Link>` must be wrapped in `MemoryRouter`.
- Commit after each task.

---

## File Structure

- Create: `src/lib/clubPath.ts` — the single source of the `/clubs/:id` route string.
- Create: `src/components/ClubLink.tsx` — shared link/plain-text club renderer.
- Create: `src/components/ClubLink.test.tsx` — unit tests for `ClubLink`.
- Modify: `src/components/club/ClubMatchRow.tsx` — refactor inline `<Link>` onto `ClubLink` (logo + name).
- Modify: `src/components/PlayerTable.tsx` — club cell becomes a `ClubLink`; add optional `clubId` to the row constraint.
- Modify: `src/components/StatTable.tsx` — club cell becomes a `ClubLink`.
- Modify: `src/components/ScoreLine.tsx` — home/away club names become `ClubLink`s.
- Modify: `src/pages/PlayerPage.tsx` — header club name becomes a `ClubLink`.
- Modify: `src/styles/app.css` — add the shared `.club-link` class.
- Modify tests: `StatTable.test.tsx`, `ScoreLine.test.tsx` (wrap in `MemoryRouter`), `PlayerTable.test.tsx`, `PlayerPage.test.tsx` (assert links).

---

## Task 1: `clubPath` route helper

**Files:**
- Create: `src/lib/clubPath.ts`
- Test: covered via `ClubLink.test.tsx` in Task 2 (helper is trivial; no separate test file).

- [ ] **Step 1: Create the helper**

```ts
// src/lib/clubPath.ts

/** The single source of truth for the club page route. */
export function clubPath(clubId: string): string {
  return `/clubs/${encodeURIComponent(clubId)}`;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/clubPath.ts
git commit -m "feat(web): add clubPath route helper (Web#44)"
```

---

## Task 2: `ClubLink` component

**Files:**
- Create: `src/components/ClubLink.tsx`
- Test: `src/components/ClubLink.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ClubLink.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { ClubLink } from "./ClubLink";

function renderLink(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

test("renders a link to the encoded club route when clubId is present", () => {
  renderLink(<ClubLink clubId="c 1" name="Valur" />);
  expect(screen.getByRole("link", { name: "Valur" })).toHaveAttribute("href", "/clubs/c%201");
});

test("renders plain text with no link when clubId is null", () => {
  renderLink(<ClubLink clubId={null} name="Valur" />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText("Valur")).toBeInTheDocument();
});

test("renders plain text with no link when clubId is empty", () => {
  renderLink(<ClubLink clubId="" name="Valur" />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test("renders children instead of name when provided", () => {
  renderLink(
    <ClubLink clubId="c1" name="ignored">
      <img alt="" src="/logo.png" />
      <span>Haukar</span>
    </ClubLink>,
  );
  expect(screen.getByRole("link", { name: "Haukar" })).toHaveAttribute("href", "/clubs/c1");
});

test("falls back to em dash when name is null and no children", () => {
  renderLink(<ClubLink clubId={null} name={null} />);
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("merges the extra className", () => {
  renderLink(<ClubLink clubId="c1" name="Valur" className="club-match-opp" />);
  const link = screen.getByRole("link", { name: "Valur" });
  expect(link).toHaveClass("club-link");
  expect(link).toHaveClass("club-match-opp");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src src/components/ClubLink.test.tsx`
Expected: FAIL — cannot resolve `./ClubLink`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/ClubLink.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { clubPath } from "../lib/clubPath";

interface ClubLinkProps {
  clubId: string | null | undefined;
  name?: string | null;
  fallback?: string;
  className?: string;
  children?: ReactNode;
}

/** Renders a club identity as a link to its club page when a clubId is known,
    and as plain text otherwise. Pass `children` (e.g. a logo + name) to make a
    richer link target; otherwise `name` (or `fallback`) is shown. */
export function ClubLink({ clubId, name, fallback = "—", className, children }: ClubLinkProps) {
  const content = children ?? (name && name.length > 0 ? name : fallback);
  if (clubId && clubId.length > 0) {
    const cls = ["club-link", className].filter(Boolean).join(" ");
    return (
      <Link to={clubPath(clubId)} className={cls}>
        {content}
      </Link>
    );
  }
  return <span className={className}>{content}</span>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root src src/components/ClubLink.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Add the shared `.club-link` style**

Add these two rules to `src/styles/app.css` immediately above the existing `.club-match-opp` rule (search for `.club-match-opp { font-weight: 600;`):

```css
.club-link { color: var(--ink); text-decoration: none; }
.club-link:hover { text-decoration: underline; }
```

(Leave `.club-match-opp` as-is; it adds `font-weight: 600` on top of `.club-link`.)

- [ ] **Step 6: Commit**

```bash
git add src/components/ClubLink.tsx src/components/ClubLink.test.tsx src/styles/app.css
git commit -m "feat(web): add shared ClubLink component (Web#44)"
```

---

## Task 3: Refactor `ClubMatchRow` onto `ClubLink`

**Files:**
- Modify: `src/components/club/ClubMatchRow.tsx`
- Test: `src/components/club/ClubMatchRow.test.tsx` (existing — should still pass unchanged)

- [ ] **Step 1: Run the existing test to establish the baseline**

Run: `npx vitest run --root src src/components/club/ClubMatchRow.test.tsx`
Expected: PASS. (It already asserts `getByRole("link", { name: "Haukar" })` has href `/clubs/c2`.)

- [ ] **Step 2: Refactor the markup**

In `src/components/club/ClubMatchRow.tsx`:

Add the import near the top (after the existing `react-router-dom` import):

```tsx
import { ClubLink } from "../ClubLink";
```

Remove the now-unused `Link` import:

```tsx
import { Link } from "react-router-dom";
```

Replace the logo + opponent-link block (the `{match.opponentLogoUrl ? ... }` image block followed by the `<Link className="club-match-opp" ...>` element) with a single `ClubLink` that wraps both the logo-or-placeholder and the name:

```tsx
        <ClubLink clubId={match.opponentClubId} className="club-match-opp">
          {match.opponentLogoUrl ? (
            <img className="club-match-logo" src={match.opponentLogoUrl} alt="" />
          ) : (
            <span className="club-match-logo club-match-logo--blank" aria-hidden="true" />
          )}
          <span>{match.opponentName ?? t("club.unknownOpponent")}</span>
        </ClubLink>
```

(The `.club-match-ha` badge, score, and time elements that follow stay exactly as they are.)

- [ ] **Step 3: Run the existing test to verify it still passes**

Run: `npx vitest run --root src src/components/club/ClubMatchRow.test.tsx`
Expected: PASS. The opponent link still resolves to `/clubs/c2`; its accessible name is still "Haukar" (logo is `alt=""`, so it contributes nothing to the name).

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (no remaining references to the removed `Link` import).

- [ ] **Step 5: Commit**

```bash
git add src/components/club/ClubMatchRow.tsx
git commit -m "refactor(web): route ClubMatchRow opponent link through ClubLink (Web#44)"
```

---

## Task 4: Club links in `PlayerTable`

**Files:**
- Modify: `src/components/PlayerTable.tsx`
- Test: `src/components/PlayerTable.test.tsx`

`PlayerTable` is generic over `T extends PlayerRow`. Add an optional `clubId` to the `PlayerRow` constraint so the club cell can link. Its real callers (`PlayerHubTable` with `PoolEntry`, `ShortlistPage` with `ShortlistItem`) already carry `clubId`, so links appear automatically; `ShortlistItem.clubId` is nullable and degrades to plain text.

- [ ] **Step 1: Update the failing test**

In `src/components/PlayerTable.test.tsx`, add `clubId` to the local `Row` interface and the fixtures, and add a link assertion. Replace the `Row` interface and `rows` constant:

```tsx
interface Row { playerId: string; name: string | null; clubId: string | null; clubName: string | null; position: string | null; }

const rows: Row[] = [
  { playerId: "p1", name: "Aron", clubId: "c1", clubName: "Stjarnan", position: "VS" },
  { playerId: "p2", name: null, clubId: null, clubName: null, position: null },
];
```

Then extend the first test to assert the club link:

```tsx
test("renders a row per entry with player link, club link, and after-columns", () => {
  renderWithProviders(<PlayerTable<Row> rows={rows} after={after} />);
  expect(screen.getByRole("link", { name: "Aron" })).toHaveAttribute("href", "/players/p1");
  expect(screen.getByRole("link", { name: "Stjarnan" })).toHaveAttribute("href", "/clubs/c1");
  expect(screen.getByText("VS")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src src/components/PlayerTable.test.tsx`
Expected: FAIL — no link named "Stjarnan" (club is still plain text).

- [ ] **Step 3: Implement**

In `src/components/PlayerTable.tsx`:

Add the import (after the `StarToggle` import):

```tsx
import { ClubLink } from "./ClubLink";
```

Add `clubId` to the `PlayerRow` interface:

```tsx
interface PlayerRow {
  playerId: string;
  name: string | null;
  clubId?: string | null;
  clubName: string | null;
}
```

Replace the club cell:

```tsx
            <td>{row.clubName ?? "—"}</td>
```

with:

```tsx
            <td><ClubLink clubId={row.clubId} name={row.clubName} /></td>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root src src/components/PlayerTable.test.tsx`
Expected: PASS (the null-club row still shows "—" with no link; the "falls back to placeholders" test still passes).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`PoolEntry` and `ShortlistItem` both satisfy the optional `clubId`.)

- [ ] **Step 6: Commit**

```bash
git add src/components/PlayerTable.tsx src/components/PlayerTable.test.tsx
git commit -m "feat(web): link club cell in PlayerTable (Web#44)"
```

---

## Task 5: Club links in `StatTable`

**Files:**
- Modify: `src/components/StatTable.tsx`
- Test: `src/components/StatTable.test.tsx`

`StatTable.test.tsx` currently renders with a bare `render()`. Once the club cell is a `<Link>`, it needs a `MemoryRouter`.

- [ ] **Step 1: Update the test (wrap in router + assert link)**

In `src/components/StatTable.test.tsx`:

Add the import:

```tsx
import { MemoryRouter } from "react-router-dom";
```

Replace the existing render call (`render(<StatTable entries={[entry]} totals={totals} />);`) with a router-wrapped render, and add the link assertion. The fixture `entry` already has `clubId: "c1"` and `clubName: "Valur"`. The full test body becomes:

```tsx
test("renders a club link, season, and totals row", () => {
  render(
    <MemoryRouter>
      <StatTable entries={[entry]} totals={totals} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Valur" })).toHaveAttribute("href", "/clubs/c1");
});
```

(Keep any other existing assertions in that test, moving them below the link assertion; they continue to work because `Valur`/season/totals still render.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src src/components/StatTable.test.tsx`
Expected: FAIL — no link named "Valur".

- [ ] **Step 3: Implement**

In `src/components/StatTable.tsx`:

Add the import at the top:

```tsx
import { ClubLink } from "./ClubLink";
```

Replace the club cell:

```tsx
            <td>{e.clubName ?? "—"}</td>
```

with:

```tsx
            <td><ClubLink clubId={e.clubId} name={e.clubName} /></td>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root src src/components/StatTable.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatTable.tsx src/components/StatTable.test.tsx
git commit -m "feat(web): link club cell in StatTable (Web#44)"
```

---

## Task 6: Club links in `ScoreLine`

**Files:**
- Modify: `src/components/ScoreLine.tsx`
- Test: `src/components/ScoreLine.test.tsx`

`ScoreLine.test.tsx` uses bare `render()`. The fixture `team(...)` sets `clubId` equal to the name, so links resolve to `/clubs/{name}`.

- [ ] **Step 1: Update the test (wrap in router + assert links)**

In `src/components/ScoreLine.test.tsx`:

Add the import:

```tsx
import { MemoryRouter } from "react-router-dom";
```

Add a small wrapper helper after the `team` factory:

```tsx
function renderScore(home: MatchTeam, away: MatchTeam) {
  return render(
    <MemoryRouter>
      <ScoreLine home={home} away={away} />
    </MemoryRouter>,
  );
}
```

Update the three existing `render(<ScoreLine .../>)` calls to use `renderScore(...)`. Then extend the first test to assert the links:

```tsx
test("renders both clubs as links and their final scores", () => {
  renderScore(team("Valur", 14, 13, 27), team("Haukar", 12, 13, 25));
  expect(screen.getByRole("link", { name: "Valur" })).toHaveAttribute("href", "/clubs/Valur");
  expect(screen.getByRole("link", { name: "Haukar" })).toHaveAttribute("href", "/clubs/Haukar");
  expect(screen.getByText("27")).toBeInTheDocument();
  expect(screen.getByText("25")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src src/components/ScoreLine.test.tsx`
Expected: FAIL — no link named "Valur".

- [ ] **Step 3: Implement**

In `src/components/ScoreLine.tsx`:

Add the import (after the `MatchTeam` type import):

```tsx
import { ClubLink } from "./ClubLink";
```

Replace the two club spans:

```tsx
        <span className="scoreline-club">{home.clubName ?? "—"}</span>
        <span className="scoreline-club">{away.clubName ?? "—"}</span>
```

with:

```tsx
        <span className="scoreline-club"><ClubLink clubId={home.clubId} name={home.clubName} /></span>
        <span className="scoreline-club"><ClubLink clubId={away.clubId} name={away.clubName} /></span>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root src src/components/ScoreLine.test.tsx`
Expected: PASS (half-time tests unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreLine.tsx src/components/ScoreLine.test.tsx
git commit -m "feat(web): link club names in ScoreLine (Web#44)"
```

---

## Task 7: Club link in the `PlayerPage` header

**Files:**
- Modify: `src/pages/PlayerPage.tsx`
- Test: `src/pages/PlayerPage.test.tsx`

The header currently joins all bits into one string: `headerBits.join(" · ")`. Pull the club out so it can be a link, keeping age/birthday joined after it. When `clubName` is null, render no club (matching today's behavior, where null `clubName` is filtered out of the join).

- [ ] **Step 1: Update the test (assert the header club link)**

In `src/pages/PlayerPage.test.tsx`, the profile fixture already has `clubId: "c1", clubName: "Valur"`. Add an assertion inside the existing "renders profile, history, and the player's match list" test, after the existing `waitFor`:

```tsx
  expect(screen.getAllByRole("link", { name: "Valur" })[0]).toHaveAttribute("href", "/clubs/c1");
```

(There may be more than one "Valur" link — the header and the history table — so assert on the first; both point at `/clubs/c1`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --root src src/pages/PlayerPage.test.tsx`
Expected: FAIL — no link named "Valur" yet (header club is plain text inside the joined subtitle).

- [ ] **Step 3: Implement**

In `src/pages/PlayerPage.tsx`:

Add the import (near the other component imports):

```tsx
import { ClubLink } from "../components/ClubLink";
```

Replace the `headerBits` definition:

```tsx
  const headerBits = [p.clubName, p.age != null ? t("player.age", { age: p.age }) : null, formatBirthday(p.dateOfBirth)].filter(
    Boolean,
  );
```

with a club-free meta list:

```tsx
  const metaBits = [p.age != null ? t("player.age", { age: p.age }) : null, formatBirthday(p.dateOfBirth)].filter(
    Boolean,
  );
  const metaText = metaBits.join(" · ");
```

Replace the subtitle:

```tsx
        <p className="subtitle">{headerBits.join(" · ")}</p>
```

with:

```tsx
        <p className="subtitle">
          {p.clubName ? <ClubLink clubId={p.clubId} name={p.clubName} /> : null}
          {p.clubName && metaText ? " · " : null}
          {metaText}
        </p>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --root src src/pages/PlayerPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PlayerPage.tsx src/pages/PlayerPage.test.tsx
git commit -m "feat(web): link club in PlayerPage header (Web#44)"
```

---

## Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run --root src`
Expected: all tests PASS (green). Note the previous baseline was 306 green; this adds `ClubLink` tests plus the per-surface link assertions.

- [ ] **Step 3: Lint (if configured)**

Run: `npm run lint`
Expected: PASS, or skip if no `lint` script exists.

- [ ] **Step 4: Final confirmation**

Confirm the diff touches only the files listed in this plan and that every surface (`PlayerTable`, `StatTable`, `ScoreLine`, `PlayerPage` header, `ClubMatchRow`) renders club links, while `FixtureRow` and the player per-match stat list are unchanged (out of scope).

---

## Out of scope (do not implement)

- **Gameweek fixtures (`FixtureRow`)** — the whole row is already a `<Link>` to the match; nesting a club link would create invalid nested anchors. Left unchanged.
- **Player per-match stat list** — `PlayerStat` has only `teamId`, no `clubId`. Left as plain text.
- The club page itself (Web#42/#43, already shipped) and any new endpoints/types.
