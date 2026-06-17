# Club links from existing surfaces (Web#44)

## Goal

Make clubs navigable now that a club page exists (`/clubs/:id`, Web#42/#43, backed by Backend#8). Turn club names and logos that the app already renders into links to the club page, using the `clubId` already present in each response. No new endpoints.

## Design decisions

- **Shared `ClubLink` component + `clubPath` helper** — the route string is defined once; call sites stay clean; null-club handling lives in one place.
- **Logo + name are both clickable** where a logo is rendered (club match rows). Text-only surfaces link the name.
- **Graceful fallback** — when `clubId` is null/empty, render plain text (no link) so rows with no club identity still display.

## Shared primitives

### `clubPath(clubId: string): string`

Tiny helper, added to `src/api/endpoints.ts`. Returns `` `/clubs/${encodeURIComponent(clubId)}` ``. The club route string is defined here once and nowhere else.

### `ClubLink` — `src/components/ClubLink.tsx`

```tsx
interface ClubLinkProps {
  clubId: string | null | undefined;
  name?: string | null;        // text content when no children given
  fallback?: string;           // default "—"
  className?: string;          // extra class merged onto the link/wrapper
  children?: React.ReactNode;  // custom content (e.g. logo + name) — overrides name
}
```

Behavior:

- **Content** is `children` when provided, otherwise the `name` text (or
  `fallback` when name is null/empty). `children` lets a surface put a logo +
  name inside one link without `ClubLink` owning logo markup.
- **`clubId` is a non-empty string** → renders
  `<Link to={clubPath(clubId)} className={cx("club-link", className)}>{content}</Link>`.
  When a logo is among the children it stays decorative (`alt=""`); the link's
  accessible name comes from the visible name text.
- **`clubId` is null/empty** → renders `<span className={className}>{content}</span>`
  with no link.

Styling: a shared `.club-link` class lifted from the existing `.club-match-opp`
rule — `color: var(--ink); text-decoration: none;` with `:hover` underline. Logo
sizing stays on the surface's own logo class (kept inside the `children` markup),
so `ClubLink` does not own logo dimensions.

## Per-surface wiring

| Surface | File | Change | Click target |
|---|---|---|---|
| Leaderboard / market rows | `src/components/PlayerTable.tsx` | club `<td>` content → `<ClubLink clubId={row.clubId} name={row.clubName} />` | name |
| Player season history | `src/components/StatTable.tsx` | club `<td>` content → `<ClubLink clubId={e.clubId} name={e.clubName} />` | name |
| Match scoreboard | `src/components/ScoreLine.tsx` | each `.scoreline-club` span → `<ClubLink clubId={home/away.clubId} name={…} />` | name |
| Player detail header | `src/pages/PlayerPage.tsx` | pull `clubName` out of `headerBits`; render `<ClubLink>` first, then `· {rest.join(" · ")}` for the remaining bits | name |
| Club match row | `src/components/club/ClubMatchRow.tsx` | wrap the logo-or-placeholder + opponent name in one `<ClubLink clubId={match.opponentClubId} className="club-match-opp">…</ClubLink>` via `children`, replacing the current name-only inline `<Link>` | logo + name |

Notes:

- Logo + name only applies where a logo is actually rendered (`ClubMatchRow`).
  Text-only surfaces link the name only. `ClubLink` keeps the optional `logoUrl`
  prop for reuse.
- `PlayerPage` header currently joins all header bits into one string
  (`headerBits.join(" · ")`). The club must be rendered as a separate element,
  so the subtitle becomes: `<ClubLink …>` followed by the remaining bits joined
  with `·`. Bits other than club (age, birthday) are unchanged.
- `ClubMatchRow` already links the opponent; this just moves it onto the shared
  component so the route lives in one place.

## Out of scope

- The club page itself (Web#42, Web#43 — already shipped).
- **Player detail per-match stat list** (`PlayerStat`): carries only `teamId`,
  no `clubId`. Left as plain text — adding club identity to responses that lack
  `clubId` is explicitly out of scope.
- Any surface that does not already render a club identity.
- **Gameweek fixtures (`FixtureRow`)**: the whole row is already a `<Link>` to
  the match page. Nesting a club `<Link>` inside it would produce invalid nested
  anchors, so club links are not added there — the row keeps its match-shortcut
  behavior. (Clubs are still reachable via the match scoreboard, which uses
  `ClubLink`.)
- No new endpoints, no API/type changes (every linked surface already exposes
  `clubId`).

## Testing

`ClubLink` unit tests (`src/components/ClubLink.test.tsx`):

- renders a link to `/clubs/{id}` (encoded) when `clubId` is present;
- renders plain text with no link when `clubId` is null/empty;
- renders `children` when provided, otherwise the `name` text;
- falls back to `"—"` (or provided `fallback`) when `name` is null and no children.

Per-surface assertions (extend existing tests where present):

- `PlayerTable` / `StatTable`: club cell is a link to `/clubs/:id`.
- `ScoreLine`: home & away club names link to their clubs.
- `PlayerPage`: header club name links; other header bits still render.

Full suite green: `npx vitest run --root src`.

## Out-of-band gotchas

- Run vitest with `--root src` — a stray `.worktrees/...` tree can otherwise
  pollute an unscoped run.
