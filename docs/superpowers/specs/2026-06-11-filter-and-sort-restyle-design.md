# Filter & Sort Restyle — Player Hub (Leikmenn)

**Date:** 2026-06-11
**Status:** Approved design, ready for implementation plan
**Scope:** Web (`Ez.Handball.Web`) only — no backend, no API contract change

## Problem

The Player Hub filter bar renders four native `<select>` elements with no styling, so
browsers paint their default lavender/grey chrome. The sort-column header buttons carry a
`.sort-header` class that has **no matching CSS at all**, so they fall back to default browser
button chrome. Both clash with the app's warm paper/ink "sketchbook" theme (SketchBox
borders, `.chip` ink-pills, Spectral/Caveat fonts, amber accents).

Sorting is also duplicated: a "Raða eftir" (Sort by) dropdown and the clickable column
headers both change the sort, which adds clutter.

## Decisions

- **Reskin the four filters** (Season / Tímabil, Gender / Kyn, Position / Staða, Tournament /
  Mót) to the "inked pill" style.
- **Collapse sorting to one mechanism:** the clickable column headers. Remove the redundant
  "Raða eftir" dropdown.
- **Visual direction:** "Inked pills" — filters become rounded ink-bordered pills matching the
  existing `.chip` shape. (Chosen over a notebook-underline and a hand-drawn-box direction.)

## Design

### 1. Filter controls — `FilterSelect` → "inked pill"

Keep the **native `<select>`** for accessibility, mobile pickers, and zero custom-dropdown
code. Hide its default chrome and wrap it in a pill that mirrors `.chip`:

- Pill: `--paper-2` fill, `2px solid var(--ink)` border, `999px` radius.
- Inline contents: small uppercase muted label (e.g. "TÍMABIL") + selected value in `--ink`
  + an amber `▾` caret rendered in CSS. The native select's own caret is removed via
  `appearance: none`.
- The native `<select>` is stretched transparently over the whole pill so the entire pill is
  the click target.
- Hover: border deepens toward `--amber` / `--amber-deep`.
- Focus-visible: amber focus ring for keyboard users.
- `aria-label` on the select is preserved.

The label currently sits in a `.filter-select-label` span; it stays, restyled as the inline
uppercase eyebrow.

### 2. Sort headers — give `.sort-header` real styling

`SortHeader` already emits the right markup and `aria-pressed`; it only lacks CSS.

- Inactive: `--ink-2`, uppercase, bold, right-aligned within numeric columns. Hover → amber
  tint to signal it is clickable.
- Active: `--amber-deep` text + amber `▾` caret.
- Single-direction sort model is unchanged (no ascending/descending toggle) — `PoolSort` is a
  key only. The caret is an active indicator, not a direction indicator.
- The caret markup may move from the inline string (`{on ? " ▾" : ""}`) into a styled element
  so the active state is driven by the `--on` class rather than text content; visual outcome
  is the same.

### 3. Remove the redundant "Raða eftir" dropdown

In `PlayerHubPage`:

- Remove the fifth `FilterSelect` (the `sortBy` dropdown) and the now-unused `sortLabel` map.
- Keep `parseSort`, the `sort` URL param, and the default `Goals` sort intact, so deep links
  and column-header sorting keep working unchanged.
- The `VALID` set may keep all `PoolSort` keys so hand-edited / deep-linked URLs pointing at
  card or suspension sorts still resolve. Those keys simply become unreachable from the UI
  because no card/suspension column header exists — which matches today's behavior, where
  sorting by an unshown stat was already confusing.

## Files touched

| File | Change |
| --- | --- |
| `src/components/FilterSelect.tsx` | Markup for the inline label + caret wrapper |
| `src/components/SortHeader.tsx` | Caret moved to a styled element (class-driven active state) |
| `src/styles/app.css` | New `.filter-select` and `.sort-header` rules |
| `src/pages/PlayerHubPage.tsx` | Remove sort dropdown + unused `sortLabel` map |
| Component tests | Update `FilterSelect.test`, `SortHeader.test`, and any `PlayerHubPage` assertions touching the removed dropdown |

## Out of scope

- No segmented toggles or other interaction restructuring.
- No new table columns.
- No backend or API contract change.
- `FilterChips` and other pages are untouched (only `PlayerHubPage` uses `FilterSelect`).

## Success criteria

- The four filters render as ink-bordered pills consistent with `.chip`, with a working native
  dropdown and an amber caret.
- Column headers are visibly clickable, with a clear active (amber) state; no second sort
  control exists.
- Keyboard focus and screen-reader labels are preserved.
- Existing tests pass after updates; no behavior or contract regression.
