# Web task: relabel "Salary" → "Price" on the player page

## Context

Backend #78 has two parts: it adds a `rating` field to `GET /api/players/{id}`,
and it renames the fantasy "salary" vocabulary to "price" — because in the fantasy
game a player has a **price**, not a salary. The API contract is unchanged: the
player-detail response still returns `price: { amount, currency }`, now joined by
`rating: number | null`.

The Web player page (`src/pages/PlayerPage.tsx`) **already reads and renders
`p.rating`** — it was wired in PR Web#24 and shows `—` until the backend sends the
field. Once #78 deploys, `rating` populates automatically. **No code change is
needed for the rating to start working.**

The one thing left out of step is the label: the price value is currently shown
under a label keyed `player.salary` ("Salary" / "Laun"). That's the salary
vocabulary we're erasing. Relabel it to "Price" / "Verð".

## Make these changes

1. **`src/i18n/locales/en.json`** — rename the key `player.salary` (`"Salary"`) to
   `player.price` with value `"Price"`.
2. **`src/i18n/locales/is.json`** — rename the same key to `player.price` with the
   Icelandic value `"Verð"`. (Confirm the term with the product owner — the app's
   Icelandic copy is owner-reviewed.)
3. **`src/pages/PlayerPage.tsx`** (~line 73) — change `t("player.salary")` to
   `t("player.price")`.
4. **`src/pages/PlayerPage.test.tsx`** — update the test description "shows the
   fantasy rating and salary…" to say "price" (cosmetic; the assertions already
   check the price value and don't need to change).

## Out of scope / do NOT do

- Do **not** call `GET /api/players/{id}/salary` — that endpoint is **removed** in
  #78. The page already gets `price` from player-detail; keep it that way.
- No change to the `rating` rendering — it already works once the backend ships.
- No change to `Money`/`price` types or `formatMoney` — the price shape is
  unchanged.

## Verify

- Player page renders the fantasy strip with the label "Price" (en) / "Verð" (is)
  and the price value beneath it, plus the rating.
- `npm test` / the existing PlayerPage tests pass.
- `grep -ri "salary"` over `src/` returns nothing (label fully renamed).
