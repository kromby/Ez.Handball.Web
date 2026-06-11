# Player "Retired" badge (Web) — design

**Date:** 2026-06-11
**Scope:** Web (`Ez.Handball.Web`) only. The backend already returns `retired` on `GET /api/players/{id}` (merged) and excludes retired players from the pool/leaderboard server-side.

## Problem

The backend now exposes a `retired` boolean on the player-detail response, but the Web `Player` type doesn't declare it, so it's silently dropped. A retired player's detail page is still reachable by direct link, season history, or shortlist, and it currently:

1. gives no indication the player has retired, and
2. shows a working **Buy** button for unowned players — letting a user buy someone who's been removed from the market everywhere else.

## Behaviour

On the player-detail page (`PlayerPage`):

- When the player is retired, show a small **"Retired" badge** next to the name.
- Suppress the **Buy** button for retired players the user doesn't own (the badge explains the absence). A retired player the user *already owns* still shows the **Sell** button — owners must be able to offload a player who retired mid-season.

No other surface changes: pool/leaderboard already exclude retired players server-side. Owned-retired indicators on `/squad` and `/lineup` are explicitly out of scope (they'd need a separate backend change to expose `retired` on the squad read).

## Design

### 1. Type + data

Add `retired?: boolean` to the `Player` interface (`src/api/types.ts`). Optional and defaulting-falsy so the page behaves correctly even if the field is absent. `usePlayer` already returns the raw `Player`; no hook change.

### 2. PlayerPage rendering (`src/pages/PlayerPage.tsx`)

- In the `title-row`, after the player name, render `{p.retired && <span className="retired-badge">{t("player.retired")}</span>}`.
- Replace the current buy/sell ternary with three-way logic:
  - `owned` → `<SellButton ... />` (unchanged)
  - `!owned && p.retired` → render nothing
  - `!owned && !p.retired` → `<BuyButton ... />` (unchanged)

### 3. Badge style (`src/styles/app.css`)

Add a `.retired-badge` class mirroring the existing `.token-badge` pill: `--ink` background, light text, small uppercase, rounded. Inline `<span>`; the translated label is its own accessible text content.

### 4. i18n

Add a `player.retired` key:
- `en.json`: `"Retired"`
- `is.json`: Icelandic placeholder (`"Hætt(ur)"`), flagged for owner review — consistent with how Icelandic copy is treated on this project.

## Testing

Extend the `PlayerPage` test (`src/pages/PlayerPage.test.tsx`, or create it if absent, following the project's vitest + Testing Library patterns):

- Badge renders when `retired: true`.
- Badge absent when `retired` is `false`/`undefined`.
- Buy button suppressed when `retired && !owned`.
- Buy button present when `!retired && !owned`.
- Sell button present when `owned` (retired or not).

## Out of scope

- Owned-retired indicators on `/squad` and `/lineup` (needs a backend change to expose `retired` on the squad read).
- Any backend change to block buying a retired player server-side (the Web suppression is the agreed scope; the backend guard can be a separate follow-up if desired).
